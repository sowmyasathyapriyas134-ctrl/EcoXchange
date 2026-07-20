import { Helmet } from "react-helmet-async";
import { PageHeader } from "@/components/common/PageHeader";
import { Shield } from "lucide-react";

export default function AdminRolesPage() {
  const roles = [
    { name: "Administrator", key: "admin", desc: "Full administrative controls, user management, staff creation, and reward catalogs management." },
    { name: "Supervisor", key: "supervisor", desc: "Oversees local waste pickups, verifies collections, and maps delivery routes." },
    { name: "Delivery Agent", key: "delivery_agent", desc: "Accepts pickup schedules, logs weights, and fulfills collection requests." },
    { name: "Recycler", key: "recycler", desc: "Processes collected waste batches, lists processed products on the marketplace." },
    { name: "Member", key: "member", desc: "Citizen with verified subscription. Can book pickups, earn EcoPoints, and order marketplace goods." },
    { name: "Trial Member", key: "trial_member", desc: "New citizen signups. Restricted features till upgrading to full subscription." },
  ];

  return (
    <>
      <Helmet>
        <title>Roles & Access | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="System Roles & Permissions"
          description="Definitions and security policies for platform roles"
        />

        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((r) => (
            <div key={r.key} className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                {r.name}
              </h3>
              <span className="text-xs font-mono text-muted-foreground block mb-3">Backend Key: {r.key}</span>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
