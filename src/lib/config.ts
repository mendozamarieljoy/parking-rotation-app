import rawParkingConfig from "../data/parking-config.json";

export type User = keyof typeof rawParkingConfig.users;

type UserColors = {
  border: string;
  text: string;
  background?: string;
};

type ParkingConfig = {
  timezone: string;
  users: Record<
    User,
    {
      showInFilter: boolean;
      unavailableWeekdays: number[];
      colors: UserColors;
    }
  >;
  ownerColors: UserColors;
  parkingFee: {
    baseHours: number;
    baseFee: number;
    extraFeePerHour: number;
  };
  costSimulation: {
    costPerSlot: number;
    outsideParkingCost: number;
    backupValueMultiplier: number;
  };
  benefitScore: { primaryWeight: number; backupWeight: number };
  swapGuidance: {
    maxPayParkingHours: number;
    suggestedSwapBufferMinutes: number;
    samplePayParkingArrivalTime: string;
  };
  fairness: {
    primaryWeight: number;
    backupWeight: number;
    slot332Penalty: number;
    compositeRangeWeight: number;
    primaryRangeWeight: number;
    backupRangeWeight: number;
    slot332RangeWeight: number;
  };
  scheduler: {
    rules: {
      slots: string[];
      weekdays?: number[];
      dates?: string[];
      afterDateExclusive?: string;
      forbiddenUsers?: string[];
      forbiddenPairs?: string[][];
    }[];
    dateOverrides: {
      date: string;
      assignments: Record<
        string,
        { primary: string | null; backup: string | null }
      >;
    }[];
  };
};

export const parkingConfig: ParkingConfig = rawParkingConfig;
export const usersList = Object.keys(parkingConfig.users) as User[];

export function getUserColors(user: string): UserColors {
  return Object.hasOwn(parkingConfig.users, user)
    ? parkingConfig.users[user as User].colors
    : parkingConfig.ownerColors;
}