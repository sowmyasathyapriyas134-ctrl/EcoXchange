import { Link } from "react-router-dom";
import { ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ServerErrorPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <ServerCrash className="h-12 w-12 text-destructive" />
      <h1 className="text-4xl font-bold">500</h1>
      <p className="text-muted-foreground">Something went wrong on our end. Please try again later.</p>
      <Button onClick={() => window.location.reload()}>Retry</Button>
      <Button asChild variant="outline">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
