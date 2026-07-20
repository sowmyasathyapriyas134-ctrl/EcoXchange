import { Helmet } from "react-helmet-async";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { PageHeader } from "@/components/common/PageHeader";

export default function AdminTrialMembersPage() {
  return (
    <>
      <Helmet>
        <title>Manage Trial Members | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader 
          title="Trial Members" 
          description="View and manage users on trial memberships" 
        />
        <AdminUsersTable roleFilter="trial_member" emptyLabel="No trial members found." />
      </div>
    </>
  );
}
