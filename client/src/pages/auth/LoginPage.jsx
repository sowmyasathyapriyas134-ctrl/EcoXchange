import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import toast from "react-hot-toast";
import { firebaseAuth } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth.store";
import { normalizePhone } from "@/utils/role";
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
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [search] = useSearchParams();
  const intent = search.get("intent");
  const navigate = useNavigate();
  const setPendingPhone = useAuthStore((s) => s.setPendingPhone);
  const recaptchaRef = useRef(null);
  const demoAuth = import.meta.env.VITE_ENABLE_DEMO_AUTH === "true";

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
    if (normalized.replace(/\D/g, "").length < 12) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setPendingPhone(normalized);

    try {
      if (demoAuth) {
        navigate(`/verify-otp${intent ? `?intent=${intent}` : ""}`);
        return;
      }

      const verifier = window.recaptchaVerifier;
      if (!verifier) {
        toast.error("reCAPTCHA not ready. Refresh and try again.");
        return;
      }

      const result = await signInWithPhoneNumber(firebaseAuth, normalized, verifier);
      window.confirmationResult = result;
      navigate(`/verify-otp${intent ? `?intent=${intent}` : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in with phone</CardTitle>
        <CardDescription>
          We&apos;ll send a one-time code to verify your number.
          {intent ? ` Intended role: ${intent}.` : ""}
        </CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              inputMode="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
            <p className="text-xs text-muted-foreground">India (+91) numbers only</p>
          </div>
          {!demoAuth && <div ref={recaptchaRef} id="recaptcha-container" />}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send OTP"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
