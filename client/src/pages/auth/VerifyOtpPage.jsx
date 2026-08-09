import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "@/api/auth.api";
import { parseApiError } from "@/api/axios";
import { useAuthStore } from "@/store/auth.store";
import { connectSocket } from "@/lib/socket";
import { homePathForUser } from "@/utils/role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Legacy OTP verify page — kept for the /verify-otp route.
 * The new LoginPage handles OTP inline. This page is reachable via
 * navigate("/verify-otp") for any code that still pushes to it.
 */
export default function VerifyOtpPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const isAdminFlow = search.get("admin") === "1";
  const pendingPhone = useAuthStore((s) => s.pendingPhone);
  const setSession = useAuthStore((s) => s.setSession);

  const verify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    if (!pendingPhone) {
      toast.error("Phone number missing. Go back to login.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.verifyOtp({ phoneNumber: pendingPhone, otp });
      if (!data.success || !data.token) {
        toast.error(data.message || "Verification failed");
        return;
      }

      const user = data.data;
      if (isAdminFlow && user?.role !== "admin") {
        toast.error("Unauthorized. Only admins can log in here.");
        useAuthStore.getState().logout();
        return;
      }

      setSession({
        token: data.token,
        user,
        modelName: data.modelName ?? "User",
      });
      connectSocket();
      toast.success("Signed in successfully!");

      if (isAdminFlow || user?.role === "admin") {
        navigate("/admin-sowmya/dashboard", { replace: true });
      } else {
        navigate(homePathForUser(user), { replace: true });
      }
    } catch (err) {
      toast.error(parseApiError(err));
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
              className="text-lg tracking-widest text-center"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying…" : "Verify & Continue"}
          </Button>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
            Change phone number
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
