import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const LABEL_MAP = {
  trial: "Trial",
  member: "Member",
  supervisor: "Supervisor",
  delivery: "Delivery",
  recycler: "Recycler",
  "admin-sowmya": "Admin",
};

export function Breadcrumbs({ className }) {
  const location = useLocation();

  const crumbs = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    if (!parts.length) return [];

    const items = [{ label: "Home", href: "/" }];
    let path = "";

    parts.forEach((part, index) => {
      path += `/${part}`;
      const label = LABEL_MAP[part] || part.replace(/-/g, " ");
      items.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: path,
        isLast: index === parts.length - 1,
      });
    });

    return items;
  }, [location.pathname]);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}>
      <Home className="h-3.5 w-3.5" />
      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
