import { Helmet } from "react-helmet-async";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { PageHeader } from "@/components/common/PageHeader";

export default function AdminMembersPage() {
  return (
    <>
      <Helmet>
        <title>Manage Members | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader 
          title="Members" 
          description="View and manage verified system members" 
        />
        <AdminUsersTable roleFilter="member" emptyLabel="No permanent members found." />
      </div>
    </>
  );
}
