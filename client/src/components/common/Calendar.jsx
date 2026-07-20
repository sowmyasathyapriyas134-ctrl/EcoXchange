import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar({ value, onChange, events = [], className }) {
  const [view, setView] = useState(() => value ?? new Date());

  const { days, monthLabel } = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

    return {
      days: cells,
      monthLabel: view.toLocaleString("default", { month: "long", year: "numeric" }),
    };
  }, [view]);

  const eventDates = useMemo(
    () => new Set(events.map((e) => new Date(e.date).toDateString())),
    [events],
  );

  const prev = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  const next = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));

  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium">{monthLabel}</h3>
        <Button variant="ghost" size="icon" onClick={next}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const selected = value && day.toDateString() === value.toDateString();
          const hasEvent = eventDates.has(day.toDateString());
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onChange?.(day)}
              className={cn(
                "aspect-square rounded-md text-sm hover:bg-accent relative",
                selected && "bg-primary text-primary-foreground hover:bg-primary",
                hasEvent && !selected && "font-semibold text-primary",
              )}
            >
              {day.getDate()}
              {hasEvent && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
