import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/api/auth.api";
import { parseApiError } from "@/api/axios";
import { homePathForUser, normalizePhone } from "@/utils/role";
import { connectSocket } from "@/lib/socket";
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

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("loginMethod") || "email"
  );
  
  // Email login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Phone OTP states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [search] = useSearchParams();
  const intent = search.get("intent");
  const isAdminFlow = search.get("admin") === "1";
  const navigate = useNavigate();
  
  const setSession = useAuthStore((s) => s.setSession);

  // Save active tab preference
  useEffect(() => {
    localStorage.setItem("loginMethod", activeTab);
  }, [activeTab]);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setEmailLoading(true);
    try {
      const data = await authApi.login({ email, password });
      if (!data.success || !data.token) {
        toast.error(data.message || "Login failed");
        return;
      }

      const user = data.data;
      if (isAdminFlow && user.role !== "admin") {
        toast.error("Unauthorized. Only admins can log in here.");
        return;
      }

      setSession({
        token: data.token,
        user,
        modelName: data.modelName ?? "User",
      });
      connectSocket();
      toast.success("Welcome back!");
      
      if (isAdminFlow || user.role === "admin") {
        navigate("/admin-sowmya/dashboard", { replace: true });
      } else {
        navigate(homePathForUser(user), { replace: true });
      }
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const normalized = normalizePhone(phone);
    if (normalized.replace(/\D/g, "").length < 12) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }

    setPhoneLoading(true);
    try {
      const data = await authApi.sendOtp({ phoneNumber: normalized });
      if (data.success) {
        setOtpSent(true);
        setResendTimer(60);
        toast.success("OTP sent to your registered phone number");
        // Demo OTP auto-fill if bypass is true
        if (data.otp) {
          toast.success(`Demo Mode OTP: ${data.otp}`);
          setOtp(data.otp);
        }
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    const normalized = normalizePhone(phone);
    setPhoneLoading(true);
    try {
      const data = await authApi.verifyOtp({ phoneNumber: normalized, otp });
      if (!data.success || !data.token) {
        toast.error(data.message || "Verification failed");
        return;
      }

      const user = data.data;
      if (isAdminFlow && user.role !== "admin") {
        toast.error("Unauthorized. Only admins can log in here.");
        return;
      }

      setSession({
        token: data.token,
        user,
        modelName: data.modelName ?? "User",
      });
      connectSocket();
      toast.success("Logged in successfully!");
      
      if (isAdminFlow || user.role === "admin") {
        navigate("/admin-sowmya/dashboard", { replace: true });
      } else {
        navigate(homePathForUser(user), { replace: true });
      }
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border border-slate-100">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
        <CardDescription className="text-center">
          {intent ? `Accessing as ${intent}` : "Choose your preferred login method"}
        </CardDescription>
      </CardHeader>
      
      {/* Premium custom Tab list */}
      <div className="px-6">
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => { setActiveTab("email"); setOtpSent(false); }}
            className={`py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === "email"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("otp")}
            className={`py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === "otp"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Phone OTP
          </button>
        </div>
      </div>

      <CardContent className="space-y-4 pt-4">
        {activeTab === "email" ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={emailLoading}>
              {emailLoading ? "Signing in..." : "Login"}
            </Button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  +91
                </span>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  disabled={otpSent}
                  className="rounded-l-none"
                  required
                />
              </div>
              {!otpSent && <p className="text-xs text-muted-foreground">Only registered Indian numbers</p>}
            </div>

            {otpSent && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-widest font-semibold"
                  required
                />
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-muted-foreground">
                    Code sent to +91 {phone}
                  </span>
                  {resendTimer > 0 ? (
                    <span className="text-muted-foreground font-medium">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-emerald-600 hover:underline font-semibold"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={phoneLoading}
            >
              {phoneLoading
                ? "Processing..."
                : otpSent
                ? "Verify & Login"
                : "Send OTP"}
            </Button>
            
            {otpSent && (
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(""); }}
                className="w-full text-xs text-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:underline mt-1"
              >
                Change phone number
              </button>
            )}
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800 py-4">
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">
            Register Account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
