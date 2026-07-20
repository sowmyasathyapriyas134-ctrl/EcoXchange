import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { recyclerApi } from "@/api/recycler.api";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import toast from "react-hot-toast";
import { Settings, Shield, Map, Save } from "lucide-react";

export default function SettingsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["recycler", "profile"],
    queryFn: async () => {
      const res = await recyclerApi.getProfile();
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (profileData) => recyclerApi.updateProfile(profileData),
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      refetch();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    },
  });

  const [form, setForm] = useState({ companyName: "", phone: "", address: "" });

  // Initialize form once data is loaded
  useState(() => {
    if (data?.data) {
      setForm({
        companyName: data.data.companyName || data.data.name || "",
        phone: data.data.phone || "",
        address: data.data.address || "",
      });
    }
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const profile = data?.data ?? {};

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Profile"
        description="Update your recycling facility parameters, contact info, and operational zones"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-2 backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <Settings className="h-4 w-4" /> Profile Information
            </CardTitle>
            <CardDescription>Configure name, contact info, and base details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    required
                    value={form.companyName || profile.name || ""}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email (Read-only)</Label>
                  <Input readOnly disabled value={profile.email || ""} />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Base Address</Label>
                  <Input
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={updateMutation.isPending} className="bg-emerald-600 text-white flex items-center gap-1">
                  <Save className="h-4 w-4" /> {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Configurations Card */}
        <div className="space-y-6 md:col-span-1">
          <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                <Map className="h-4 w-4" /> Operating Zones
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="text-muted-foreground">Your facility is currently authorized for collection services in:</p>
              <ul className="list-disc pl-4 space-y-1 font-medium">
                <li>Zone A - North Metropolitan</li>
                <li>Zone B - Industrial Belt</li>
                <li>Zone D - South Corridor</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Credentials & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-semibold capitalize">{profile.role || "recycler"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verification Status:</span>
                <span className="font-semibold text-emerald-600">Active / Verified</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
