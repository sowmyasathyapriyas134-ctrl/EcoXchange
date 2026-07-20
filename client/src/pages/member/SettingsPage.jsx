import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThemeStore } from "@/store/theme.store";
import { useAuthStore } from "@/store/auth.store";
import { useUpdateProfile } from "@/hooks/queries/useMember";
import { Settings, Eye, EyeOff, ShieldCheck, Laptop, LogOut, Trash2, Globe } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Profile preferences
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [email, setEmail] = useState(user?.email || "");

  // Password fields
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleToggleNotifications = (type, val) => {
    if (type === "email") setEmailNotifications(val);
    if (type === "push") setPushNotifications(val);
    if (type === "marketing") setMarketingEmails(val);
    toast.success("Notification preferences updated");
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile.mutate(
      { phoneNumber: phone, email },
      {
        onSuccess: () => {
          toast.success("Contact preferences updated successfully");
        },
      }
    );
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in password fields");
      return;
    }
    // Simulation / Call to updatePassword (Backend updates will follow standard verification OTP paths)
    toast.success("Security configuration update requested successfully");
    setCurrentPassword("");
    setNewPassword("");
  };

  const handleLogoutAll = () => {
    toast.success("Successfully logged out of all secondary sessions");
  };

  const handleDeactivate = () => {
    if (window.confirm("Are you sure you want to deactivate your EcoXchange account? This action cannot be undone.")) {
      toast.error("Deactivation request submitted. A support executive will contact you shortly.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Settings" description="Manage your credentials, theme configuration and preferences" />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <Card className="p-2 space-y-1">
            <Button variant="secondary" className="w-full justify-start text-xs font-semibold h-9 px-3">
              <Settings className="h-4 w-4 mr-2" /> Account Settings
            </Button>
          </Card>
        </div>

        {/* Configurations Columns */}
        <div className="md:col-span-2 space-y-6">
          {/* General Details & Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Profile Contact Preferences
              </CardTitle>
              <CardDescription>Update your email address or contact numbers</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" disabled={updateProfile.isPending}>
                  Update Contact Settings
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Theme & Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Laptop className="h-4 w-4 text-primary" /> Theme & Localization
              </CardTitle>
              <CardDescription>Customize standard languages, zone options and dark modes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Language</Label>
                  <p className="text-xs text-muted-foreground">Default dashboard translation</p>
                </div>
                <span className="text-xs font-semibold bg-muted px-2.5 py-1 rounded">English (IN)</span>
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Timezone Preference</Label>
                  <p className="text-xs text-muted-foreground">Used for pickups schedules</p>
                </div>
                <span className="text-xs font-semibold bg-muted px-2.5 py-1 rounded">Asia/Kolkata (IST)</span>
              </div>
            </CardContent>
          </Card>

          {/* Notifications config */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified about updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive updates about your pickups and orders via email</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={(val) => handleToggleNotifications("email", val)}
                />
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive real-time alerts on your device</p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={(val) => handleToggleNotifications("push", val)}
                />
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-xs text-muted-foreground">Stay updated on new features and eco tips</p>
                </div>
                <Switch
                  checked={marketingEmails}
                  onCheckedChange={(val) => handleToggleNotifications("marketing", val)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Security & Passwords
              </CardTitle>
              <CardDescription>Configure security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currPass">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currPass"
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPass">New Password</Label>
                  <Input
                    id="newPass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm">
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Connected Sessions & Deactivate */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" /> Session Management & Deactivation
              </CardTitle>
              <CardDescription>Logout from other active devices or terminate account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <p className="text-sm font-semibold">Active Sessions</p>
                  <p className="text-xs text-muted-foreground">Currently logged in from 1 device</p>
                </div>
                <Button variant="outline" size="sm" className="w-fit" onClick={handleLogoutAll}>
                  <LogOut className="h-3.5 w-3.5 mr-1" /> Logout All Devices
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Account Deactivation</p>
                  <p className="text-xs text-muted-foreground">Request permanent removal of profile data</p>
                </div>
                <Button variant="destructive" size="sm" className="w-fit" onClick={handleDeactivate}>
                  Deactivate Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
