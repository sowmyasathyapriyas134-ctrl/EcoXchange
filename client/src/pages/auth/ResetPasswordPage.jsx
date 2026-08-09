import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "@/api/auth.api";
import { parseApiError } from "@/api/axios";
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

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isStrongPassword = (pass) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/.test(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token || !email) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!isStrongPassword(password)) {
      toast.error("Password must be 8+ chars and contain uppercase, lowercase, number, and special char.");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.resetPassword({
        email,
        token,
        newPassword: password,
      });

      if (data.success) {
        toast.success("Password reset successfully. You can now log in.");
        navigate("/login", { replace: true });
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border border-slate-100 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-destructive">Invalid Link</CardTitle>
          <CardDescription>
            This reset link is invalid or incomplete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please request a new link from the forgot password screen.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center py-4 border-t border-slate-100 dark:border-slate-800">
          <Link to="/forgot-password" className="text-sm text-emerald-600 font-semibold hover:underline">
            Go to Forgot Password
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border border-slate-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          Enter a secure new password for your account: {email}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground leading-tight">
              Must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 py-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={loading}
          >
            {loading ? "Updating password..." : "Save Password"}
          </Button>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-emerald-600 hover:underline">
            Cancel
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
