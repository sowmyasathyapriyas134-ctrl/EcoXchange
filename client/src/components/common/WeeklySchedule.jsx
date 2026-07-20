import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklySchedule({ slots = [], className }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-7 gap-2", className)}>
      {DAYS.map((day, index) => {
        const daySlots = slots.filter((s) => s.day === index || s.day === day);
        return (
          <div key={day} className="rounded-lg border p-3 min-h-[120px]">
            <p className="text-sm font-medium mb-2">{day}</p>
            {daySlots.length === 0 ? (
              <p className="text-xs text-muted-foreground">No slots</p>
            ) : (
              <ul className="space-y-1">
                {daySlots.map((slot) => (
                  <li key={slot.id ?? `${slot.time}-${slot.label}`} className="text-xs rounded bg-muted px-2 py-1">
                    <span className="font-medium">{slot.time}</span>
                    {slot.label && <span className="text-muted-foreground"> · {slot.label}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
