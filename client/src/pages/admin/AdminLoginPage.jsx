import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { authApi } from "@/api/auth.api";
import { parseApiError } from "@/api/axios";
import { useAuthStore } from "@/store/auth.store";
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

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      navigate("/admin-sowmya/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login({ email, password });

      if (!data.success || !data.token) {
        toast.error(data.message || "Login failed");
        return;
      }

      const loggedUser = data.data;

      if (loggedUser?.role !== "admin") {
        toast.error("Unauthorized. This portal is for administrators only.");
        return;
      }

      setSession({
        token: data.token,
        user: loggedUser,
        modelName: data.modelName ?? "Admin",
      });
      connectSocket();
      toast.success("Welcome, Admin!");
      navigate("/admin-sowmya/dashboard", { replace: true });
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
        <title>Admin Login — EcoXchange</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold">System Access</CardTitle>
            <CardDescription className="text-slate-400">
              Authorized personnel only
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-slate-300">
                  Email Address
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@ecoxchange.in"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-slate-300">
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Sign In"}
              </Button>
              <Link
                to="/"
                className="text-xs text-slate-500 hover:text-slate-300 text-center"
              >
                ← Back to site
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}
