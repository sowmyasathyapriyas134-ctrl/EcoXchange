import { Outlet, Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <Link to="/" className="mb-8 flex items-center gap-2 font-bold text-xl">
        <Leaf className="h-7 w-7 text-primary" />
        EcoXchange
      </Link>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
