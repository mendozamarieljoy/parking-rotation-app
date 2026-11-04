import { User, Slot, DaySchedule, SlotAssignment } from "./types";
import {
  getDaysInMonth,
  getDayName,
  getParkingDateKey,
  getParkingWeekday,
  isAvailable,
  isHoliday,
  isWeekend,
} from "./utils";
import { parkingConfig, usersList } from "./config";

const slots: readonly Slot[] = ["27", "28"];

export type UnavailableSlotsByDate = Partial<Record<string, Slot[]>>;

type AssignmentStats = { primary: number; backup: number };
type Candidate = {
  slots: Record<Slot, SlotAssignment>;
  primaryCount: number;
  backupCount: number;
  score: number;
};

function evaluateFairnessScore(stats: Record<User, AssignmentStats>): number {
  const fairness = parkingConfig.fairness;
  const userValues = usersList.map(
    (user) =>
      stats[user].primary * fairness.primaryWeight +
      stats[user].backup * fairness.backupWeight,
  );
  const primaryCounts = usersList.map((user) => stats[user].primary);
  const backupCounts = usersList.map((user) => stats[user].backup);

  return (
    (Math.max(...userValues) - Math.min(...userValues)) *
      fairness.compositeRangeWeight +
    (Math.max(...primaryCounts) - Math.min(...primaryCounts)) *
      fairness.primaryRangeWeight +
    (Math.max(...backupCounts) - Math.min(...backupCounts)) *
      fairness.backupRangeWeight
  );
}

function violatesAssignmentRule(
  slot: Slot,
  assignedUsers: (User | null)[],
  dateKey: string,
  weekday: number,
): boolean {
  return parkingConfig.scheduler.rules.some((rule) => {
    if (!rule.slots.includes(slot)) return false;
    if (rule.weekdays && !rule.weekdays.includes(weekday)) return false;

    if (rule.dates && !rule.dates.includes(dateKey)) return false;
    if (rule.afterDateExclusive && dateKey <= rule.afterDateExclusive) {
      return false;
    }

    const has = (user: string) => assignedUsers.includes(user as User);
    return (
      rule.forbiddenUsers?.some(has) === true ||
      rule.forbiddenPairs?.some(([first, second]) => has(first) && has(second)) ===
        true
    );
  });
}

function projectStats(
  currentStats: Record<User, AssignmentStats>,
  daySlots: Record<Slot, SlotAssignment>,
): Record<User, AssignmentStats> {
  const stats = usersList.reduce(
    (result, user) => {
      result[user] = { ...currentStats[user] };
      return result;
    },
    {} as Record<User, AssignmentStats>,
  );

  Object.values(daySlots).forEach((assignment) => {
    if (!assignment) return;
    if (assignment.primary) stats[assignment.primary].primary += 1;
    if (assignment.backup) stats[assignment.backup].backup += 1;
  });

  return stats;
}

function compareCandidates(left: Candidate, right: Candidate): number {
  if (left.primaryCount !== right.primaryCount) {
    return left.primaryCount - right.primaryCount;
  }
  if (left.backupCount !== right.backupCount) {
    return left.backupCount - right.backupCount;
  }
  return right.score - left.score;
}

function findBestAssignment(
  availableUsers: User[],
  activeSlots: Slot[],
  date: Date,
  currentStats: Record<User, AssignmentStats>,
  ignoreAssignmentRules: boolean,
): Candidate | null {
  let bestCandidate: Candidate | null = null;
  const daySlots: Record<Slot, SlotAssignment> = { 27: null, 28: null };
  const dateKey = getParkingDateKey(date);
  const weekday = getParkingWeekday(date);

  function considerCandidate() {
    const primaryCount = Object.values(daySlots).filter(
      (assignment) => assignment?.primary,
    ).length;
    if (primaryCount === 0) return;

    const backupCount = Object.values(daySlots).filter(
      (assignment) => assignment?.backup,
    ).length;
    const candidate: Candidate = {
      slots: { ...daySlots },
      primaryCount,
      backupCount,
      score: evaluateFairnessScore(projectStats(currentStats, daySlots)),
    };

    if (!bestCandidate || compareCandidates(candidate, bestCandidate) > 0) {
      bestCandidate = candidate;
    }
  }

  function assignSlot(slotIndex: number, remainingUsers: User[]) {
    if (slotIndex === activeSlots.length) {
      considerCandidate();
      return;
    }

    const slot = activeSlots[slotIndex];
    daySlots[slot] = null;
    assignSlot(slotIndex + 1, remainingUsers);

    for (const primary of remainingUsers) {
      const remainingAfterPrimary = remainingUsers.filter(
        (user) => user !== primary,
      );
      const primaryOnlyUsers: (User | null)[] = [primary, null];

      if (
        ignoreAssignmentRules ||
        !violatesAssignmentRule(slot, primaryOnlyUsers, dateKey, weekday)
      ) {
        daySlots[slot] = { primary, backup: null };
        assignSlot(slotIndex + 1, remainingAfterPrimary);
      }

      for (const backup of remainingAfterPrimary) {
        if (
          !ignoreAssignmentRules &&
          violatesAssignmentRule(slot, [primary, backup], dateKey, weekday)
        ) {
          continue;
        }

        daySlots[slot] = { primary, backup };
        assignSlot(
          slotIndex + 1,
          remainingAfterPrimary.filter((user) => user !== backup),
        );
      }
    }

    daySlots[slot] = null;
  }

  assignSlot(0, availableUsers);
  return bestCandidate;
}

function applyDateOverride(
  slotsForDay: Record<Slot, SlotAssignment>,
  dateKey: string,
): Record<Slot, SlotAssignment> {
  const override = parkingConfig.scheduler.dateOverrides.find(
    (candidate) => candidate.date === dateKey,
  );
  if (!override) return slotsForDay;

  const overriddenSlots = { ...slotsForDay };
  for (const slot of slots) {
    const assignment = override.assignments[slot];
    if (assignment) {
      overriddenSlots[slot] = assignment as SlotAssignment;
    }
  }
  return overriddenSlots;
}

export function generateSchedule(
  year: number,
  month: number,
  unavailableSlotsByDate: UnavailableSlotsByDate = {},
): DaySchedule[] {
  const userStats = usersList.reduce(
    (stats, user) => {
      stats[user] = { primary: 0, backup: 0 };
      return stats;
    },
    {} as Record<User, AssignmentStats>,
  );

  return getDaysInMonth(year, month)
    .filter((date) => !isWeekend(date) && !isHoliday(date))
    .map((date) => {
      const dateKey = getParkingDateKey(date);
      const unavailableSlots = unavailableSlotsByDate[dateKey] ?? [];
      const activeSlots = slots.filter((slot) => !unavailableSlots.includes(slot));
      const availableUsers = usersList.filter((user) => isAvailable(user, date));
      const strictCandidate = findBestAssignment(
        availableUsers,
        activeSlots,
        date,
        userStats,
        false,
      );
      const targetPrimaryCount = Math.min(activeSlots.length, availableUsers.length);
      const targetBackupCount = Math.min(
        activeSlots.length,
        Math.max(availableUsers.length - targetPrimaryCount, 0),
      );
      const needsRuleFallback =
        !strictCandidate ||
        strictCandidate.primaryCount < targetPrimaryCount ||
        strictCandidate.backupCount < targetBackupCount;
      const fallbackCandidate = needsRuleFallback
        ? findBestAssignment(availableUsers, activeSlots, date, userStats, true)
        : null;
      const bestCandidate =
        strictCandidate &&
        (!fallbackCandidate ||
          compareCandidates(strictCandidate, fallbackCandidate) >= 0)
          ? strictCandidate
          : fallbackCandidate;

      let daySlots = bestCandidate?.slots ?? { 27: null, 28: null };
      daySlots = applyDateOverride(daySlots, dateKey);
      unavailableSlots.forEach((slot) => {
        daySlots[slot] = null;
      });

      Object.values(daySlots).forEach((assignment) => {
        if (!assignment) return;
        if (assignment.primary) userStats[assignment.primary].primary += 1;
        if (assignment.backup) userStats[assignment.backup].backup += 1;
      });

      return {
        date: dateKey,
        day: getDayName(date),
        slots: daySlots,
        unavailableSlots: [...unavailableSlots],
      };
    });
}
