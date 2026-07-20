import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";
import { useFirebaseLogin } from "@/hooks/queries/useAuth";
import { homePathForUser } from "@/utils/role";
import NotFoundPage from "@/pages/NotFoundPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const isAdminFlow = search.get("admin") === "1";
  const pendingPhone = useAuthStore((s) => s.pendingPhone);
  const loginMutation = useFirebaseLogin();
  const [denied, setDenied] = useState(false);
  const demoAuth = import.meta.env.VITE_ENABLE_DEMO_AUTH === "true";

  if (denied) return <NotFoundPage />;

  const verify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      if (demoAuth) {
        if (!pendingPhone) {
          toast.error("Phone missing. Go back and try again.");
          return;
        }
        const res = await loginMutation.mutateAsync({ phone: pendingPhone });
        const role = res.data?.user?.role;
        if (!role) return;
        if (isAdminFlow) {
          if (role !== "admin") {
            useAuthStore.getState().logout();
            setDenied(true);
            return;
          }
          navigate("/admin-sowmya/dashboard", { replace: true });
        } else {
          navigate(homePathForUser(res.data?.user), { replace: true });
        }
        return;
      }

      const confirmation = window.confirmationResult;
      if (!confirmation) {
        toast.error("OTP session expired. Request a new code.");
        navigate("/login");
        return;
      }

      const credential = await confirmation.confirm(otp);
      const idToken = await credential.user.getIdToken();
      const res = await loginMutation.mutateAsync({ idToken });
      const role = res.data?.user?.role;
      if (!role) return;
      if (isAdminFlow) {
        if (role !== "admin") {
          useAuthStore.getState().logout();
          setDenied(true);
          return;
        }
        navigate("/admin-sowmya/dashboard", { replace: true });
      } else {
        navigate(homePathForUser(res.data?.user), { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter OTP</CardTitle>
        <CardDescription>
          Code sent to {pendingPhone ?? "your phone"}
          {demoAuth && " · Demo: any 6 digits with seeded accounts"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={verify}>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="otp">6-digit code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-lg tracking-widest"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading || loginMutation.isPending}>
            {loading || loginMutation.isPending ? "Verifying…" : "Verify & continue"}
          </Button>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
            Change phone number
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
