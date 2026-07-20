import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Calendar } from "@/components/common/Calendar";
import { WeeklySchedule } from "@/components/common/WeeklySchedule";
import { StatusChip } from "@/components/common/StatusChip";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAvailableSchedules, usePickups } from "@/hooks/queries/useMember";
import { CalendarCheck, PackageSearch, Clock, MapPin } from "lucide-react";

export default function CalendarPage() {
  const { data: schedData, isLoading: schedLoading, isError: schedError, refetch: schedRefetch } = useAvailableSchedules();
  const { data: pickupsData, isLoading: pickupsLoading } = usePickups();

  const [selected, setSelected] = useState(null);

  const schedules = useMemo(() => schedData?.data ?? [], [schedData]);
  const myPickups = useMemo(() => pickupsData?.data ?? [], [pickupsData]);

  // Build calendar events: one dot per scheduled pickup + available slots
  const events = useMemo(() => {
    const schedEvents = schedules.map((s) => ({ date: s.date, id: s._id, type: "slot" }));
    const pickupEvents = myPickups
      .filter((p) => p.scheduledDate)
      .map((p) => ({ date: p.scheduledDate, id: p._id, type: "pickup", status: p.status }));
    return [...schedEvents, ...pickupEvents];
  }, [schedules, myPickups]);

  // Available recycler slots on selected date
  const daySlots = useMemo(() => {
    if (!selected) return [];
    const key = selected.toDateString();
    return schedules
      .filter((s) => new Date(s.date).toDateString() === key)
      .map((s) => ({
        id: s._id,
        day: selected.getDay(),
        time: `${s.startTime || "09:00"}–${s.endTime || "11:00"}`,
        label: `${s.zone || "Zone"} · ${(s.maxCapacity ?? 10) - (s.bookedCapacity ?? 0)} slots left`,
      }));
  }, [schedules, selected]);

  // My pickups on selected date
  const dayPickups = useMemo(() => {
    if (!selected) return [];
    const key = selected.toDateString();
    return myPickups.filter((p) => p.scheduledDate && new Date(p.scheduledDate).toDateString() === key);
  }, [myPickups, selected]);

  if (schedLoading || pickupsLoading) return <DashboardSkeleton />;
  if (schedError) return <ApiError onRetry={schedRefetch} />;

  const upcomingPickups = myPickups
    .filter((p) => p.scheduledDate && new Date(p.scheduledDate) >= new Date() && !["completed", "cancelled", "rejected"].includes(p.status))
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collection Calendar"
        description="View available recycler slots and your scheduled pickups"
        actions={
          <Button asChild>
            <Link to="/member/pickups/new">Schedule Pickup</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Calendar value={selected} onChange={setSelected} events={events} />
        </div>

        {/* Day detail */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                {selected ? selected.toLocaleDateString("en-IN", { dateStyle: "long" }) : "Select a date"}
              </CardTitle>
              {selected && (
                <CardDescription>
                  {dayPickups.length > 0
                    ? `${dayPickups.length} pickup(s) scheduled`
                    : daySlots.length > 0
                      ? `${daySlots.length} collection slot(s) available`
                      : "No events on this date"}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!selected && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click a date on the calendar to view details
                </p>
              )}

              {/* My Pickups on this day */}
              {dayPickups.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Pickups</p>
                  {dayPickups.map((p) => (
                    <Link
                      key={p._id}
                      to={`/member/pickups/${p._id}`}
                      className="block border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="capitalize font-medium text-sm">{p.wasteType}</span>
                        <StatusChip status={p.status} />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {p.scheduledDate ? new Date(p.scheduledDate).toLocaleTimeString("en-IN", { timeStyle: "short" }) : "—"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{p.address}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Available recycler slots */}
              {daySlots.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Available Slots</p>
                  <WeeklySchedule slots={daySlots} />
                </div>
              )}

              {selected && dayPickups.length === 0 && daySlots.length === 0 && (
                <div className="text-center py-4 space-y-2">
                  <PackageSearch className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No pickups or slots on this date</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/member/pickups/new">Schedule for this date</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming pickups reminder */}
      {upcomingPickups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Upcoming Pickups
            </CardTitle>
            <CardDescription>Your next scheduled collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPickups.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium text-sm">{p.wasteType}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {p.estimatedWeight} kg
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.scheduledDate).toLocaleDateString("en-IN", { dateStyle: "full" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={p.status} />
                    <Button asChild size="sm" variant="ghost" className="h-7">
                      <Link to={`/member/pickups/${p._id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
