import { afterEach, describe, expect, it } from "vitest";
import { parkingConfig, usersList } from "./config";
import { generateSchedule } from "./scheduler";
import { isAvailable } from "./utils";

const initialConfig = structuredClone(parkingConfig);
const everyDay = [0, 1, 2, 3, 4, 5, 6];

function restoreConfig() {
  Object.assign(parkingConfig, structuredClone(initialConfig));
}

afterEach(restoreConfig);

describe("generateSchedule", () => {
  it("uses only the two active parking slots", () => {
    const schedule = generateSchedule(2026, 10);

    expect(schedule.length).toBeGreaterThan(0);
    expect(Object.keys(schedule[0].slots)).toEqual(["27", "28"]);
  });

  it("does not assign users on their configured unavailable dates", () => {
    parkingConfig.users.Mariel.unavailableDates = ["2026-11-05"];

    const day = generateSchedule(2026, 10).find(
      (scheduleDay) => scheduleDay.date === "2026-11-05",
    );

    expect(day).toBeDefined();
    expect(Object.values(day!.slots)).not.toContainEqual(
      expect.objectContaining({ primary: "Mariel" }),
    );
    expect(Object.values(day!.slots)).not.toContainEqual(
      expect.objectContaining({ backup: "Mariel" }),
    );
  });

  it("removes a user only after their configured cutoff date", () => {
    parkingConfig.users.Mariel.removeUserAfterDate = "2026-11-03";

    expect(isAvailable("Mariel", new Date(2026, 10, 3))).toBe(true);
    expect(isAvailable("Mariel", new Date(2026, 10, 4))).toBe(false);
  });

  it("keeps dates and creates a primary-only assignment for a lone eligible user", () => {
    usersList
      .filter((user) => user !== "Reubs")
      .forEach((user) => {
        parkingConfig.users[user].unavailableWeekdays = everyDay;
      });
    parkingConfig.users.Reubs.unavailableWeekdays = [];

    const schedule = generateSchedule(2026, 10);
    const day = schedule.find((scheduleDay) => scheduleDay.date === "2026-11-05");
    const assignments = Object.values(day!.slots).filter(
      (assignment) => assignment?.primary,
    );

    expect(day).toBeDefined();
    expect(assignments).toEqual([{ primary: "Reubs", backup: null }]);
  });

  it("retains a workday when no users are eligible", () => {
    usersList.forEach((user) => {
      parkingConfig.users[user].unavailableWeekdays = everyDay;
    });

    const day = generateSchedule(2026, 10).find(
      (scheduleDay) => scheduleDay.date === "2026-11-05",
    );

    expect(day).toBeDefined();
    expect(day!.slots).toEqual({ 27: null, 28: null });
  });

  it("relaxes forbidden-user rules when they prevent a usable slot", () => {
    parkingConfig.scheduler.rules = [
      {
        slots: ["27"],
        forbiddenUsers: [...usersList],
      },
    ];

    const day = generateSchedule(2026, 10).find(
      (scheduleDay) => scheduleDay.date === "2026-11-05",
    );

    expect(day).toBeDefined();
    expect(day!.slots["27"]?.primary).toBeTruthy();
  });

  it("preserves explicitly unavailable slots through regeneration input", () => {
    const day = generateSchedule(2026, 10, {
      "2026-11-03": ["27"],
    }).find((scheduleDay) => scheduleDay.date === "2026-11-03");

    expect(day?.unavailableSlots).toEqual(["27"]);
    expect(day?.slots["27"]).toBeNull();
  });

  it("applies configured date overrides after generating the day", () => {
    const day = generateSchedule(2026, 4).find(
      (scheduleDay) => scheduleDay.date === "2026-05-22",
    );

    expect(day?.slots).toEqual({
      27: { primary: "Mariel", backup: null },
      28: { primary: "Marvs", backup: null },
    });
  });

  it("applies the November parking-slot overrides", () => {
    const schedule = generateSchedule(2026, 10);

    expect(schedule.find((day) => day.date === "2026-11-03")?.slots).toEqual({
      27: { primary: "Mariel", backup: "Marvs" },
      28: { primary: "Raph", backup: "Lady" },
    });
    expect(schedule.find((day) => day.date === "2026-11-04")?.slots).toEqual({
      27: { primary: "Raph", backup: "Lady" },
      28: { primary: "Mariel", backup: "Marvs" },
    });
  });
});
