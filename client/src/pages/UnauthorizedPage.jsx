import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Unauthorized</h1>
      <p className="text-muted-foreground text-center max-w-md">
        You do not have permission to access this page with your current role.
      </p>
      <Button asChild>
        <Link to="/login">Sign in with a different account</Link>
      </Button>
    </div>
  );
}
