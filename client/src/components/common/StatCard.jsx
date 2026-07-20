import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, hint, icon: Icon, trend, className }) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(hint || trend) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend && <span className="text-emerald-600 dark:text-emerald-400">{trend} </span>}
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
