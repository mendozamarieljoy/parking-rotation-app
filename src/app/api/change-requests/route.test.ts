import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/change-requests", () => {
  it("returns pull request type and current status", async () => {
    vi.stubEnv("GITHUB_TOKEN", "test-token");
    vi.stubEnv("GITHUB_OWNER", "parking-owner");
    vi.stubEnv("GITHUB_REPO", "parking-repo");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json([
          {
            number: 12,
            title: "Swap Mariel and Marvs",
            html_url: "https://github.com/parking-owner/parking-repo/pull/12",
            state: "open",
            draft: false,
            created_at: "2026-11-09T12:00:00Z",
            merged_at: null,
            body: "<!-- parking-request-kind: swap -->",
          },
          {
            number: 11,
            title: "Add holiday: Founders Day",
            html_url: "https://github.com/parking-owner/parking-repo/pull/11",
            state: "closed",
            draft: false,
            created_at: "2026-11-08T12:00:00Z",
            merged_at: "2026-11-08T13:00:00Z",
            body: "Submitted from the Parking Rotation System.",
          },
          {
            number: 10,
            title: "Unrelated repository change",
            html_url: "https://github.com/parking-owner/parking-repo/pull/10",
            state: "open",
            draft: false,
            created_at: "2026-11-07T12:00:00Z",
            merged_at: null,
            body: "A normal repository pull request.",
          },
        ]),
      ),
    );

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      requests: [
        { number: 12, type: "swap", status: "open" },
        { number: 11, type: "holiday", status: "merged" },
      ],
    });
  });

  it("reports missing GitHub configuration", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("GITHUB_OWNER", "");
    vi.stubEnv("GITHUB_REPO", "");

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("GitHub integration is not configured"),
    });
  });
});

describe("POST /api/change-requests swap", () => {
  const initialConfig = {
    users: {
      Alice: {
        showInFilter: true,
        unavailableWeekdays: [],
        unavailableDates: [],
        colors: { border: "#000000", text: "#000000" },
      },
      Bob: {
        showInFilter: true,
        unavailableWeekdays: [],
        unavailableDates: [],
        colors: { border: "#ffffff", text: "#ffffff" },
      },
    },
    holidays: [],
    scheduler: {
      rules: [],
      dateOverrides: [
        {
          date: "2026-11-10",
          assignments: { "27": { primary: "Alice", backup: null } },
        },
        {
          date: "2026-11-11",
          assignments: { "28": { primary: "Bob", backup: null } },
        },
      ],
    },
  };

  function stubGitHub(initialFile = initialConfig) {
    vi.stubEnv("GITHUB_TOKEN", "test-token");
    vi.stubEnv("GITHUB_OWNER", "parking-owner");
    vi.stubEnv("GITHUB_REPO", "parking-repo");

    const calls: Array<{
      path: string;
      method: string;
      body?: string;
    }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url,
        );
        const method = init?.method ?? "GET";
        const call: { path: string; method: string; body?: string } = {
          path: url.pathname,
          method,
        };
        if (typeof init?.body === "string") call.body = init.body;
        calls.push(call);

        if (url.pathname.endsWith("/contents/src/data/parking-config.json")) {
          if (method === "PUT") return Response.json({});
          return Response.json({
            content: Buffer.from(JSON.stringify(initialFile)).toString(
              "base64",
            ),
            sha: "config-sha",
          });
        }
        if (url.pathname === "/repos/parking-owner/parking-repo") {
          return Response.json({ default_branch: "main" });
        }
        if (url.pathname.endsWith("/git/ref/heads/main")) {
          return Response.json({ object: { sha: "main-sha" } });
        }
        if (url.pathname.endsWith("/git/refs")) return Response.json({});
        if (url.pathname.endsWith("/pulls")) {
          return Response.json({
            html_url: "https://github.com/parking-owner/parking-repo/pull/42",
          });
        }
        throw new Error(`Unexpected GitHub request: ${url.pathname}`);
      }),
    );
    return calls;
  }

  it("creates a pull request with both parking assignments swapped", async () => {
    const calls = stubGitHub();

    const response = await POST(
      new Request("http://localhost/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "swap",
          data: {
            fromDate: "2026-11-10",
            fromUser: "Alice",
            toDate: "2026-11-11",
            toUser: "Bob",
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://github.com/parking-owner/parking-repo/pull/42",
    });

    const configUpdate = calls.find(
      (call) =>
        call.path.endsWith("/contents/src/data/parking-config.json") &&
        call.method === "PUT",
    );
    expect(configUpdate?.body).toBeDefined();
    const updatePayload = JSON.parse(configUpdate!.body!);
    const updatedConfig = JSON.parse(
      Buffer.from(updatePayload.content, "base64").toString("utf8"),
    );
    expect(updatedConfig.scheduler.dateOverrides).toMatchObject([
      {
        date: "2026-11-10",
        assignments: { "27": { primary: "Bob", backup: null } },
      },
      {
        date: "2026-11-11",
        assignments: { "28": { primary: "Alice", backup: null } },
      },
    ]);

    const pullRequestCall = calls.find(
      (call) => call.path.endsWith("/pulls") && call.method === "POST",
    );
    expect(JSON.parse(pullRequestCall!.body!).body).toContain(
      "<!-- parking-request-kind: swap -->",
    );
  });

  it("rejects a swap when a selected user is no longer assigned", async () => {
    const calls = stubGitHub();

    const response = await POST(
      new Request("http://localhost/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "swap",
          data: {
            fromDate: "2026-11-10",
            fromUser: "Bob",
            toDate: "2026-11-11",
            toUser: "Alice",
          },
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "One selected user is not assigned on the selected date.",
    });
    expect(calls).toHaveLength(1);
  });
});
