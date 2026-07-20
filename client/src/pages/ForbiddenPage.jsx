import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <ShieldX className="h-12 w-12 text-destructive" />
      <h1 className="text-4xl font-bold">403</h1>
      <p className="text-muted-foreground">You don&apos;t have permission to access this resource.</p>
      <Button asChild variant="outline">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
