import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/schedule", () => {
  it("returns the schedule for a valid scheduled date", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/schedule?date=2026-11-03&user=Mariel",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      date: "2026-11-03",
      slots: {
        "27": { primary: "Mariel", backup: "Marvs" },
        "28": null,
      },
    });
  });

  it("rejects a missing or invalid date", async () => {
    const missingDate = await GET(
      new Request("http://localhost/api/schedule?user=Mariel"),
    );
    const invalidDate = await GET(
      new Request(
        "http://localhost/api/schedule?date=2026-02-30&user=Mariel",
      ),
    );
    const missingUser = await GET(
      new Request("http://localhost/api/schedule?date=2026-11-03"),
    );
    const invalidUser = await GET(
      new Request(
        "http://localhost/api/schedule?date=2026-11-03&user=Unknown",
      ),
    );

    expect(missingDate.status).toBe(400);
    expect(invalidDate.status).toBe(400);
    expect(missingUser.status).toBe(400);
    expect(invalidUser.status).toBe(400);
  });

  it("returns only slots assigned to the requested user", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/schedule?date=2026-11-03&user=Marvs",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      date: "2026-11-03",
      slots: {
        "27": { primary: "Mariel", backup: "Marvs" },
        "28": null,
      },
    });
  });

  it("returns not found when the date has no schedule", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/schedule?date=2026-11-07&user=Mariel",
      ),
    );

    expect(response.status).toBe(404);
  });
});
