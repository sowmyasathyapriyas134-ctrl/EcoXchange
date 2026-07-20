import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile, useUpdateProfile } from "@/hooks/queries/useMember";

export default function ProfilePage() {
  const { data, isLoading, isError, refetch, isFetching } = useProfile();
  const update = useUpdateProfile();
  const profile = data?.data ?? data;
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState("");

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const initials = (profile?.name || profile?.fullName || "U").slice(0, 2).toUpperCase();

  const save = (e) => {
    e.preventDefault();
    update.mutate({
      fullName: fullName || profile?.fullName || profile?.name,
      address: address || profile?.address,
      avatar: avatar || profile?.avatar,
    });
  };

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Profile" description="Manage your personal information" />
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{profile?.fullName || profile?.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{profile?.phone}</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                defaultValue={profile?.fullName || profile?.name}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                defaultValue={profile?.address || ""}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                defaultValue={profile?.avatar || ""}
                onChange={(e) => setAvatar(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
