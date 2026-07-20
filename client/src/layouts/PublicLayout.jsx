import { Link, Outlet } from "react-router-dom";
import { Leaf } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Leaf className="h-6 w-6 text-primary" />
            EcoXchange
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/roles" className="text-muted-foreground hover:text-foreground px-2">
              Roles
            </Link>
            <ThemeToggle />
            <Link
              to="/login"
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EcoXchange — Sustainable waste management
      </footer>
    </div>
  );
}
