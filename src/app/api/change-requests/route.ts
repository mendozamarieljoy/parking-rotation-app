import { NextResponse } from "next/server";
import { createSign } from "node:crypto";
import { generateSchedule } from "@/lib/scheduler";

export const runtime = "nodejs";

type Assignment = { primary: string | null; backup: string | null };
type Config = {
  users: Record<
    string,
    {
      showInFilter: boolean;
      unavailableWeekdays: number[];
      unavailableDates: string[];
      removeUserAfterDate?: string;
      colors: { border: string; text: string };
    }
  >;
  holidays: { month: number; day: number; holidayName: string }[];
  scheduler: {
    rules: Array<{
      slots: string[];
      weekdays?: number[];
      forbiddenPairs?: string[][];
    }>;
    dateOverrides: Array<{
      date: string;
      assignments: Record<string, Assignment>;
    }>;
  };
};
type Data = Record<string, unknown>;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEX = /^#[0-9a-fA-F]{6}$/;

function required(data: Data, key: string) {
  const value = data[key];
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${key} is required.`);
  return value.trim();
}
function optional(data: Data, key: string) {
  const value = data[key];
  return typeof value === "string" ? value.trim() : "";
}
function validDate(data: Data, key: string, isRequired = true) {
  const value = isRequired ? required(data, key) : optional(data, key);
  if (!value && !isRequired) return value;
  if (!ISO_DATE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)))
    throw new Error(`${key} must be a valid date.`);
  return value;
}
function array(data: Data, key: string) {
  const value = data[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : ([] as string[]);
}
function user(config: Config, value: string) {
  if (!Object.hasOwn(config.users, value))
    throw new Error("Choose an existing user.");
}
function datesInRange(start: string, end: string) {
  const values: string[] = [];
  const day = new Date(`${start}T00:00:00Z`);
  const finalDay = new Date(`${end}T00:00:00Z`);
  if (day > finalDay)
    throw new Error("End date must be on or after start date.");
  while (day <= finalDay) {
    values.push(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() + 1);
    if (values.length > 366)
      throw new Error("A request may include at most 366 dates.");
  }
  return values;
}
function decoded(content: string) {
  return Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");
}

async function gh(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
  });
  const responseText = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(responseText);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "No error message returned.";
    throw new Error(
      `GitHub ${init?.method ?? "GET"} ${path} failed (${response.status}): ${message}`,
    );
  }
  return payload;
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}
async function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!appId || !installationId || !privateKey) return undefined;
  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const encodedPayload = base64url(
    JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${encodedHeader}.${encodedPayload}`);
  signer.end();
  const jwt = `${encodedHeader}.${encodedPayload}.${signer.sign(privateKey, "base64url")}`;
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!response.ok)
    throw new Error("Could not create a GitHub App installation token.");
  return ((await response.json()) as { token: string }).token;
}

function overrideFor(config: Config, date: string) {
  const existing = config.scheduler.dateOverrides.find(
    (item) => item.date === date,
  );
  if (existing) return existing;
  const parsed = new Date(`${date}T00:00:00`);
  const day = generateSchedule(parsed.getFullYear(), parsed.getMonth()).find(
    (item) => item.date === date,
  );
  if (!day) throw new Error(`${date} is not a schedulable weekday.`);
  const assignments: Record<string, Assignment> = {};
  for (const slot of ["27", "28"]) {
    const assignment = day.slots[slot as "27" | "28"];
    if (assignment) assignments[slot] = { ...assignment };
  }
  const next = { date, assignments };
  config.scheduler.dateOverrides.push(next);
  return next;
}
function swapPerson(assignment: Assignment, from: string, to: string) {
  if (assignment.primary === from) assignment.primary = to;
  else if (assignment.backup === from) assignment.backup = to;
  else return false;
  return true;
}

function apply(config: Config, kind: string, data: Data) {
  if (kind === "block-dates") {
    const name = required(data, "user");
    user(config, name);
    const start = validDate(data, "startDate");
    const end = validDate(data, "endDate", false) || start;
    const extra = optional(data, "dates")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (extra.some((item) => !ISO_DATE.test(item)))
      throw new Error("Additional dates must use YYYY-MM-DD.");
    const all = new Set([
      ...config.users[name].unavailableDates,
      ...datesInRange(start, end),
      ...extra,
    ]);
    config.users[name].unavailableDates = [...all].sort();
    return `Block ${name} on requested dates`;
  }
  if (kind === "holiday") {
    const value = validDate(data, "date");
    const parsed = new Date(`${value}T00:00:00Z`);
    if (
      config.holidays.some(
        (item) =>
          item.month === parsed.getUTCMonth() + 1 &&
          item.day === parsed.getUTCDate(),
      )
    )
      throw new Error("A holiday already exists on that month and day.");
    const name = required(data, "name");
    config.holidays.push({
      month: parsed.getUTCMonth() + 1,
      day: parsed.getUTCDate(),
      holidayName: name,
    });
    return `Add holiday: ${name}`;
  }
  if (kind === "add-user") {
    const name = required(data, "name");
    if (Object.hasOwn(config.users, name))
      throw new Error("That user already exists.");
    const border = required(data, "borderColor");
    const text = required(data, "textColor");
    if (!HEX.test(border) || !HEX.test(text))
      throw new Error("Colors must be six-digit hex values.");
    const weekdays = array(data, "weekdays").map(Number);
    if (weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))
      throw new Error("Invalid weekday.");
    config.users[name] = {
      showInFilter: true,
      unavailableWeekdays: [...new Set(weekdays)],
      unavailableDates: [],
      colors: { border, text },
    };
    return `Add user: ${name}`;
  }
  if (kind === "remove-user") {
    const name = required(data, "user");
    user(config, name);
    if (data.entirely === "on") {
      delete config.users[name];
      for (const override of config.scheduler.dateOverrides)
        for (const assignment of Object.values(override.assignments)) {
          if (assignment.primary === name) assignment.primary = null;
          if (assignment.backup === name) assignment.backup = null;
        }
      config.scheduler.rules = config.scheduler.rules
        .map((rule) => ({
          ...rule,
          forbiddenPairs: rule.forbiddenPairs?.filter(
            (pair) => !pair.includes(name),
          ),
        }))
        .filter(
          (rule) => !rule.forbiddenPairs || rule.forbiddenPairs.length > 0,
        );
      return `Remove user: ${name}`;
    }
    config.users[name].removeUserAfterDate = validDate(data, "removeAfterDate");
    return `Remove ${name} after selected date`;
  }
  if (kind === "scheduler-rule") {
    const slots = array(data, "slots");
    if (!slots.length || slots.some((slot) => !["27", "28"].includes(slot)))
      throw new Error("Select at least one slot.");
    const pair = array(data, "pairUsers");
    if (pair.length !== 2 || pair[0] === pair[1])
      throw new Error("Choose two different users.");
    pair.forEach((name) => user(config, name));
    const weekdays = array(data, "weekdays").map(Number);
    if (weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))
      throw new Error("Invalid weekday.");
    config.scheduler.rules.push({
      slots,
      ...(weekdays.length ? { weekdays } : {}),
      forbiddenPairs: [pair],
    });
    return `Add scheduler rule for ${pair.join(" and ")}`;
  }
  if (kind === "swap") {
    const fromDate = validDate(data, "fromDate");
    const toDate = validDate(data, "toDate");
    const fromUser = required(data, "fromUser");
    const toUser = required(data, "toUser");
    user(config, fromUser);
    user(config, toUser);
    if (fromDate === toDate || fromUser === toUser)
      throw new Error("Choose two different dates and users.");
    const from = overrideFor(config, fromDate);
    const to = overrideFor(config, toDate);
    const fromAssignment = Object.values(from.assignments).find(
      (assignment) =>
        assignment.primary === fromUser || assignment.backup === fromUser,
    );
    const toAssignment = Object.values(to.assignments).find(
      (assignment) =>
        assignment.primary === toUser || assignment.backup === toUser,
    );
    if (!fromAssignment || !toAssignment)
      throw new Error(
        "One selected user is not assigned on the selected date.",
      );
    swapPerson(fromAssignment, fromUser, toUser);
    swapPerson(toAssignment, toUser, fromUser);
    return `Swap ${fromUser} and ${toUser}`;
  }
  throw new Error("Unsupported request type.");
}

export async function POST(request: Request) {
  try {
    const token = await githubToken();
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    if (!token || !owner || !repo)
      return NextResponse.json(
        {
          error:
            "GitHub integration is not configured. Set GITHUB_OWNER, GITHUB_REPO, and GitHub App credentials.",
        },
        { status: 503 },
      );
    const body = (await request.json()) as { kind?: unknown; data?: unknown };
    if (
      typeof body.kind !== "string" ||
      !body.data ||
      typeof body.data !== "object"
    )
      throw new Error("Invalid request.");
    const file = (await gh(
      `/repos/${owner}/${repo}/contents/src/data/parking-config.json`,
      token,
    )) as { content: string; sha: string };
    const config = JSON.parse(decoded(file.content)) as Config;
    const title = apply(config, body.kind, body.data as Data);
    const repoInfo = (await gh(`/repos/${owner}/${repo}`, token)) as {
      default_branch: string;
    };
    const ref = (await gh(
      `/repos/${owner}/${repo}/git/ref/heads/${repoInfo.default_branch}`,
      token,
    )) as { object: { sha: string } };
    const branch = `parking-request/${Date.now()}`;
    await gh(`/repos/${owner}/${repo}/git/refs`, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: ref.object.sha,
      }),
    });
    await gh(
      `/repos/${owner}/${repo}/contents/src/data/parking-config.json`,
      token,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: title,
          content: Buffer.from(`${JSON.stringify(config, null, 2)}\n`).toString(
            "base64",
          ),
          sha: file.sha,
          branch,
        }),
      },
    );
    const pr = (await gh(`/repos/${owner}/${repo}/pulls`, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        head: branch,
        base: repoInfo.default_branch,
        body: "Submitted from the Parking Rotation System. Review this configuration change before merging.",
      }),
    })) as { html_url: string };
    return NextResponse.json({ url: pr.html_url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create pull request.",
      },
      { status: 400 },
    );
  }
}
