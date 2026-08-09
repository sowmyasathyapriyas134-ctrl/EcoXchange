import { Helmet } from "react-helmet-async";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { PageHeader } from "@/components/common/PageHeader";
import { AddUserModal } from "@/components/admin/AddUserModal";

export default function AdminUsersPage() {
  return (
    <>
      <Helmet>
        <title>Manage Users | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader 
          title="All Users" 
          description="View and manage all registered users, staff, and partners" 
          actions={<AddUserModal />}
        />
        <AdminUsersTable roleFilter={null} emptyLabel="No users found in the system." />
      </div>
    </>
  );
}
