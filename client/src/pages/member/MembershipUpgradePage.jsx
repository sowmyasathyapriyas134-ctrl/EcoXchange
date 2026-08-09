import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { membershipApi } from "@/api/membership.api";
import { parseApiError } from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ShieldCheck, Box, Award, ArrowRight } from "lucide-react";

export default function MembershipUpgradePage() {
  const navigate = useNavigate();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [selectedBinSize, setSelectedBinSize] = useState("medium");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    membershipApi.getStatus().then(({ data }) => {
      if (isMounted && data?.success) {
        setStatusData(data.data);
        if (data.data.membershipStatus === "member") {
          toast.success("You are already a Permanent Member!");
          navigate("/member/dashboard");
        }
      }
    }).catch((err) => {
      if (isMounted) toast.error(parseApiError(err));
    }).finally(() => {
      if (isMounted) setLoadingStatus(false);
    });

    return () => { isMounted = false; };
  }, [navigate]);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // Step 1: Create Order on Backend
      const orderRes = await membershipApi.createOrder(selectedBinSize);
      if (!orderRes.data.success) {
        toast.error(orderRes.data.message || "Order creation failed");
        setIsProcessing(false);
        return;
      }

      const { orderId, purchaseId, amount, currency, key } = orderRes.data.data;
      const getTimeStamp = () => Date.now();

      // Check if Razorpay SDK is available on window
      if (window.Razorpay) {
        const options = {
          key,
          amount,
          currency,
          name: "EcoXchange",
          description: "Permanent Membership Fee",
          order_id: orderId.startsWith("demo_") ? undefined : orderId,
          handler: async function (response) {
            await verifyPayment({
              purchaseId,
              razorpayOrderId: response.razorpay_order_id || orderId,
              razorpayPaymentId: response.razorpay_payment_id || `pay_${getTimeStamp()}`,
              razorpaySignature: response.razorpay_signature || "demo_sig",
            });
          },
          prefill: {
            name: statusData?.user?.fullName || "",
            email: statusData?.user?.email || "",
          },
          theme: { color: "#059669" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Demo mode fallback — directly verify payment
        toast.success("Demo Mode: Simulating ₹300 payment verification...");
        await verifyPayment({
          purchaseId,
          razorpayOrderId: orderId,
          razorpayPaymentId: `demo_pay_${getTimeStamp()}`,
          razorpaySignature: "demo_signature",
        });
      }
    } catch (err) {
      toast.error(parseApiError(err));
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (payload) => {
    try {
      const verifyRes = await membershipApi.verifyPayment(payload);
      if (verifyRes.data.success) {
        toast.success("🎉 Upgrade Complete! Welcome to Permanent Membership!");
        navigate("/member/dashboard");
      } else {
        toast.error(verifyRes.data.message || "Payment verification failed");
      }
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6 text-center">
        <div className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  const isEligible = statusData?.isEligible;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
            <Award className="h-3.5 w-3.5" /> Trial Milestone Completed
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Congratulations!
          </h1>
          <p className="text-emerald-100 max-w-xl text-sm md:text-base">
            Your 5-day EcoXchange trial is complete. You are now eligible to upgrade to a Permanent Member and receive your official Waste Management Toolkit!
          </p>
        </div>
      </div>

      {!isEligible && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 text-center text-sm text-amber-800 dark:text-amber-200">
            ⚠️ You have completed {statusData?.streak || 0}/5 days of your streak. Upgrade will be unlocked once you hit day 5!
          </CardContent>
        </Card>
      )}

      {/* Benefits Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-emerald-100 dark:border-emerald-950 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" /> Permanent Member Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Lifetime Access</strong> — No monthly recurring subscription fees</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Marketplace Unlocked</strong> — Buy & Sell recycled goods & earned points</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Eco Points Boost</strong> — Earn 1.5x points on every verified pickup</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Priority Pickups</strong> — Guaranteed agent assignment within 24 hours</span>
            </div>
          </CardContent>
        </Card>

        {/* Toolkit Package */}
        <Card className="border-emerald-100 dark:border-emerald-950 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Box className="h-5 w-5" /> Allocated Welcome Toolkit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>3 Color-Coded Bins</strong> — Wet, Dry, and E-Waste segregation</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>100 Dustbin Covers</strong> — Bio-degradable eco-friendly bags</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>100 Personalized QR Stickers</strong> — Printed with unique identity</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Unique Digital QR Identity</strong> — Instant agent scanning & verification</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bin Size Selection */}
      <Card className="shadow-md border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-xl">Step 1: Select Dustbin Size</CardTitle>
          <CardDescription>Choose the dustbin size best suited for your household or facility</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {[
            { id: "small", label: "Small (10 Liters)", desc: "Ideal for 1-2 person households" },
            { id: "medium", label: "Medium (25 Liters)", desc: "Most popular for average families (3-5 people)", popular: true },
            { id: "large", label: "Large (50 Liters)", desc: "Recommended for large families or commercial spaces" },
          ].map((bin) => (
            <div
              key={bin.id}
              onClick={() => setSelectedBinSize(bin.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                selectedBinSize === bin.id
                  ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              {bin.popular && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Recommended
                </span>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">{bin.label}</span>
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${selectedBinSize === bin.id ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`}>
                  {selectedBinSize === bin.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{bin.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Action */}
      <Card className="shadow-lg border-emerald-500/20 bg-gradient-to-b from-white to-emerald-50/20 dark:from-slate-900 dark:to-slate-900">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">One-Time Fee</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹300</span>
              <span className="text-xs text-muted-foreground">Includes 3 Bins + Covers + QR Stickers + Lifetime Access</span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 text-base font-bold shadow-lg shadow-emerald-600/20"
            disabled={!isEligible || isProcessing}
            onClick={handlePayment}
          >
            {isProcessing ? (
              "Processing Payment..."
            ) : (
              <span className="flex items-center gap-2">
                Pay ₹300 & Complete Upgrade <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
