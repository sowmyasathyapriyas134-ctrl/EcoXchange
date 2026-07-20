import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import toast from "react-hot-toast";
import { firebaseAuth } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth.store";
import { normalizePhone } from "@/utils/role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const setPendingPhone = useAuthStore((s) => s.setPendingPhone);
  const recaptchaRef = useRef(null);
  const demoAuth = import.meta.env.VITE_ENABLE_DEMO_AUTH === "true";

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      navigate("/admin-sowmya/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (demoAuth || !recaptchaRef.current) return;
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, recaptchaRef.current, {
        size: "invisible",
      });
    }
  }, [demoAuth]);

  const submit = async (e) => {
    e.preventDefault();
    const normalized = normalizePhone(phone);
    setPendingPhone(normalized);
    setLoading(true);
    try {
      if (demoAuth) {
        navigate("/verify-otp?admin=1");
        return;
      }
      const verifier = window.recaptchaVerifier;
      if (!verifier) throw new Error("reCAPTCHA not ready");
      const result = await signInWithPhoneNumber(firebaseAuth, normalized, verifier);
      window.confirmationResult = result;
      navigate("/verify-otp?admin=1");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle>System access</CardTitle>
            <CardDescription className="text-slate-400">
              Authorized personnel only
            </CardDescription>
          </CardHeader>
          <form onSubmit={submit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-phone">Phone</Label>
                <Input
                  id="admin-phone"
                  className="bg-slate-800 border-slate-700"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
              {!demoAuth && <div ref={recaptchaRef} />}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={loading}>
                Continue
              </Button>
              <Link to="/" className="text-xs text-slate-500 hover:text-slate-300">
                ← Back to site
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}
