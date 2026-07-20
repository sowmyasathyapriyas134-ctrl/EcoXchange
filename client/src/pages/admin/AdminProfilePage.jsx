import { Helmet } from "react-helmet-async";
import { useAuthStore } from "@/store/auth.store";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function AdminProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <>
      <Helmet>
        <title>Admin Profile | EcoXchange</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          description="Your administrator account details"
        />

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Security identity and phone mapping</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-semibold">{user?.name || "Administrator"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-semibold">{user?.email || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-semibold">{user?.phone || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <p className="font-semibold capitalize">{user?.role || "Admin"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
