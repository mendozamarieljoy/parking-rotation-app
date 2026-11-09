import { getUserColors } from "@/lib/config";
import { useParkingStore } from "@/lib/store";
import { Slot } from "@/lib/types";

export default function ParkingSlot({
  slot,
  assignment,
  className,
}: {
  slot: Slot;
  assignment: { primary: string | null; backup: string | null } | null;
  className?: string;
}) {
  const { filteredUsers } = useParkingStore();
  const isAvailable = assignment && (assignment.primary || assignment.backup);
  const user = assignment?.primary || "Owner";
  const colors = getUserColors(user);

  const isFilteredOut =
    !!filteredUsers.length &&
    !filteredUsers.find((u) =>
      [assignment?.primary, assignment?.backup].includes(u),
    );

  if (!isAvailable) return <></>;

  return (
    <div
      className={`${isFilteredOut && "visibility-0 opacity-0"} border-t-3 w-full h-full flex flex-col overflow-hidden transition-all ${className}`}
      style={{
        borderColor: colors.border,
        color: colors.text,
        backgroundColor: colors.background,
      }}
    >
      <div
        className="text-lg lg:text-2xl font-sans font-black py-2 w-full text-center tracking-widest"
        style={{
          borderColor: colors.border,
          color: colors.text,
          backgroundColor: colors.background,
        }}
      >
        <span>{slot}</span>
      </div>

      <div
        className="flex-1 flex flex-col items-center justify-center py-4 border-dashed border-t-2 mx-2"
        style={{
          borderColor: colors.border,
          color: colors.text,
          backgroundColor: colors.background,
        }}
      >
        {isAvailable ? (
          <>
            <p className="font-source-sans text-sm font-bold text-slate-800 uppercase tracking-tight">
              {assignment.primary}
            </p>
            <p className="font-source-sans text-sm font-bold text-slate-600 uppercase tracking-wide">
              {assignment.backup}
            </p>
          </>
        ) : (
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-center px-2">
            Not available
          </p>
        )}
      </div>
    </div>
  );
}
