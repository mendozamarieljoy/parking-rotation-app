import { describe, expect, it } from "vitest";
import { POST } from "./route";

function search(date: unknown, user: unknown) {
  return POST(
    new Request("http://localhost/api/schedule/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, user }),
    }),
  );
}

function searchDate(date: unknown) {
  return POST(
    new Request("http://localhost/api/schedule/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    }),
  );
}

describe("POST /api/schedule/search", () => {
  it("returns users with assignments and their slots for a date", async () => {
    const response = await searchDate("2026-11-03");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { user: "Mariel", slots: ["27"] },
      { user: "Raph", slots: ["28"] },
      { user: "Lady", slots: ["28"] },
      { user: "Marvs", slots: ["27"] },
    ]);
  });

  it("returns the matching user's slot assignment", async () => {
    const response = await search("2026-11-03T00:00:00.000Z", "Marvs");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      date: "2026-11-03",
      slot: 27,
      assignment: { primary: "Mariel", backup: "Marvs" },
    });
  });

  it("returns null when the user has no assignment on the date", async () => {
    const response = await search("2026-11-03", "Reubs");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toBeNull();
  });

  it("returns null when the date has no schedule", async () => {
    const response = await search("2026-11-07", "Mariel");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toBeNull();
  });

  it("rejects malformed or invalid payloads", async () => {
    const invalidDate = await search("2026-02-30", "Mariel");
    const invalidUser = await search("2026-11-03", "Unknown");
    const missingDate = await POST(
      new Request("http://localhost/api/schedule/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: "Mariel" }),
      }),
    );
    const invalidJson = await POST(
      new Request("http://localhost/api/schedule/search", {
        method: "POST",
        body: "{",
      }),
    );

    expect(invalidDate.status).toBe(400);
    expect(invalidUser.status).toBe(400);
    expect(missingDate.status).toBe(400);
    expect(invalidJson.status).toBe(400);
  });
});
