import { create } from "zustand";
import {
  DaySchedule,
  UserStats,
  CostStats,
  Slot,
  DaySlots,
} from "./types";
import { generateSchedule, UnavailableSlotsByDate } from "./scheduler";
import { calculateFairnessScore, calculateBenefitScore } from "./utils";
import { parkingConfig, usersList } from "./config";

interface ParkingState {
  schedule: DaySchedule[];
  filteredSchedule: DaySchedule[];
  userStats: Record<string, UserStats>;
  costStats: Record<string, CostStats>;
  selectedYear: number;
  selectedMonth: number;
  filteredUsers: Array<string>;
  setDate: (year: number, month: number) => void;
  regenerateSchedule: () => void;
  toggleUnavailableSlot: (date: string, slot: Slot) => void;
  skipPrimary: (date: string, slot: Slot) => void;
  filterByUsers: (users: string[]) => void;
}

function calculateUserStats(
  schedule: DaySchedule[],
): Record<string, UserStats> {
  const stats: Record<string, { primary: number; backup: number }> = {};
  usersList.forEach((user) => {
    stats[user] = { primary: 0, backup: 0 };
  });

  schedule.forEach((day) => {
    Object.entries(day.slots).forEach(([slotKey, slot]) => {
      if (day.unavailableSlots.includes(slotKey as Slot)) {
        return;
      }
      if (slot?.primary) {
        stats[slot.primary].primary++;
      }
      if (slot?.backup) {
        stats[slot.backup].backup++;
      }
    });
  });

  const userStats: Record<string, UserStats> = {};
  usersList.forEach((user) => {
    const s = stats[user];
    userStats[user] = {
      primaryCount: s.primary,
      backupCount: s.backup,
      fairnessScore: calculateFairnessScore(s),
    };
  });

  return userStats;
}

function calculateCostStats(
  schedule: DaySchedule[],
  userStats: Record<string, UserStats>,
): Record<string, CostStats> {
  const totalSlots = schedule.length * 2;
  const costPerUser =
    (totalSlots * parkingConfig.costSimulation.costPerSlot) / usersList.length;

  const costStats: Record<string, CostStats> = {};
  usersList.forEach((user) => {
    const stats = userStats[user];
    const benefit = calculateBenefitScore(
      stats.primaryCount,
      stats.backupCount,
    );
    const estimatedCost = costPerUser;
    const savings =
      parkingConfig.costSimulation.outsideParkingCost *
        (stats.primaryCount +
          stats.backupCount *
            parkingConfig.costSimulation.backupValueMultiplier) -
      estimatedCost;
    costStats[user] = {
      estimatedCost,
      savings,
      benefitScore: benefit,
    };
  });

  return costStats;
}

const DEFAULT_YEAR = new Date().getFullYear();
const DEFAULT_MONTH = new Date().getMonth();

// Initialize stats
const initialSchedule = generateSchedule(DEFAULT_YEAR, DEFAULT_MONTH);
const initialUserStats = calculateUserStats(initialSchedule);
const initialCostStats = calculateCostStats(initialSchedule, initialUserStats);
const initialUsers: string[] = [];

function getUnavailableSlotsByDate(
  schedule: DaySchedule[],
): UnavailableSlotsByDate {
  return schedule.reduce<UnavailableSlotsByDate>((result, day) => {
    if (day.unavailableSlots.length > 0) {
      result[day.date] = [...day.unavailableSlots];
    }
    return result;
  }, {});
}

export const useParkingStore = create<ParkingState>((set, get) => ({
  selectedYear: DEFAULT_YEAR,
  selectedMonth: DEFAULT_MONTH,
  schedule: initialSchedule,
  filteredSchedule: initialSchedule,
  userStats: initialUserStats,
  costStats: initialCostStats,
  filteredUsers: initialUsers,
  setDate: (year, month) => {
    const newSchedule = generateSchedule(year, month);
    const newUserStats = calculateUserStats(newSchedule);
    const newCostStats = calculateCostStats(newSchedule, newUserStats);

    set({
      selectedYear: year,
      selectedMonth: month,
      schedule: newSchedule,
      userStats: newUserStats,
      costStats: newCostStats,
    });
  },
  regenerateSchedule: () => {
    const { selectedYear, selectedMonth, schedule } = get();

    const newSchedule = generateSchedule(
      selectedYear,
      selectedMonth,
      getUnavailableSlotsByDate(schedule),
    );
    const newUserStats = calculateUserStats(newSchedule);
    const newCostStats = calculateCostStats(newSchedule, newUserStats);

    set({
      schedule: newSchedule,
      userStats: newUserStats,
      costStats: newCostStats,
    });
  },
  toggleUnavailableSlot: (date: string, slot: Slot) => {
    const { schedule, selectedYear, selectedMonth } = get();
    const unavailableSlotsByDate = getUnavailableSlotsByDate(schedule);
    const unavailableSlots = unavailableSlotsByDate[date] ?? [];
    unavailableSlotsByDate[date] = unavailableSlots.includes(slot)
      ? unavailableSlots.filter((unavailableSlot) => unavailableSlot !== slot)
      : [...unavailableSlots, slot];

    const regenerated = generateSchedule(
      selectedYear,
      selectedMonth,
      unavailableSlotsByDate,
    );

    const newUserStats = calculateUserStats(regenerated);
    const newCostStats = calculateCostStats(regenerated, newUserStats);
    set({
      schedule: regenerated,
      userStats: newUserStats,
      costStats: newCostStats,
    });
  },
  skipPrimary: (date: string, slot: Slot) => {
    const { schedule } = get();

    // First, find the primary user for this slot
    const dayIndex = schedule.findIndex((d) => d.date === date);
    if (dayIndex === -1) return;

    const primaryUser =
      dayIndex >= 0 ? schedule[dayIndex].slots[slot]?.primary : null;
    const backupUser =
      dayIndex >= 0 ? schedule[dayIndex].slots[slot]?.backup : null;

    const newSchedule = JSON.parse(JSON.stringify(schedule));

    // Step 1: Swap primary and backup on the current day/slot
    newSchedule[dayIndex].slots[slot] = {
      primary: backupUser,
      backup: primaryUser,
    };

    // Step 2: Find another day where primaryUser is backup and make them primary
    let found = false;
    for (let i = 0; i < newSchedule.length; i++) {
      if (i === dayIndex) continue;
      const dayEntries = Object.entries(newSchedule[i].slots) as Array<
        [Slot, { primary: string | null; backup: string | null }]
      >;
      for (const [s, assignment] of dayEntries) {
        if (assignment.backup === primaryUser && !found) {
          // Swap: make primaryUser the primary here
          const currentPrimary = assignment.primary;
          if (!currentPrimary) continue;
          newSchedule[i].slots[s as Slot] = {
            primary: primaryUser,
            backup: currentPrimary,
          };
          // Update the original day's backup to currentPrimary
          newSchedule[dayIndex].slots[slot].backup = currentPrimary;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    const newUserStats = calculateUserStats(newSchedule);
    const newCostStats = calculateCostStats(newSchedule, newUserStats);
    set({
      schedule: newSchedule,
      userStats: newUserStats,
      costStats: newCostStats,
    });
  },
  filterByUsers: (users: Array<string>) => {
    const { schedule } = get();
    const filteredSchedule = [...schedule].map((daySchedule) => {
      const updatedSlots: DaySlots = {
        27: null,
        28: null,
      };
      const userInRotation = Object.entries(daySchedule.slots).find(
        ([slot, assignment]) => {
          if (
            assignment &&
            users.some(
              (u) => u === assignment.primary || u === assignment.backup,
            )
          ) {
            return {
              [slot]: assignment,
            };
          }
        },
      );

      if (userInRotation) {
        const [slotKey, assignment] = userInRotation;
        updatedSlots[slotKey as keyof DaySlots] = assignment;
      }

      return {
        ...daySchedule,
        slots: updatedSlots,
      };
    });

    set({
      schedule,
      filteredSchedule,
      filteredUsers: users,
    });
  },
}));
