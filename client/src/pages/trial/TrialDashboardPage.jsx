import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { useTrialSchedule, useTrialProgress, useTrialSubmissions, useSubmitTrialPhoto, useCreateTrialSubmission } from "@/hooks/queries/useTrial";
import { Sparkles, Flame, Package, Lock, Award, Calendar, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function TrialDashboardPage() {
  const user = useAuthStore((s) => s.user);

  // Queries
  const { data: scheduleData } = useTrialSchedule();
  const { data: progressData } = useTrialProgress();
  const { data: submissionsData } = useTrialSubmissions();

  // Mutations
  const uploadPhoto = useSubmitTrialPhoto();
  const createSubmission = useCreateTrialSubmission();

  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const schedule = scheduleData?.data ?? {};
  const progress = progressData?.data ?? { currentStreak: 0, approvedSubmissions: 0 };
  const submissions = submissionsData?.data ?? [];

  const streak = progress.currentStreak ?? 0;
  const isEligibleForUpgrade = streak >= 5;

  const handleCapture = async (blob) => {
    setImageFile(blob);
  };

  const handleSubmitProof = async () => {
    if (!imageFile) {
      toast.error("Please capture a photo first");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("image", imageFile, "trial.jpg");
      
      const uploadRes = await uploadPhoto.mutateAsync(fd);
      if (uploadRes?.url) {
        await createSubmission.mutateAsync(uploadRes.url);
        setImageFile(null);
      } else {
        throw new Error("Upload response did not contain a URL");
      }
    } catch {
      toast.error("Failed to submit verification proof");
    } finally {
      setSubmitting(false);
    }
  };



  // Checklist for Onboarding
  const checklist = [
    { label: "Verify Phone via OTP", done: true },
    { label: "Verify House & Location", done: submissions.some(s => s.status === "approved") },
    { label: "First Waste Collection Upload", done: submissions.length > 0 },
    { label: "Complete 5 Daily Collections", done: streak >= 5 },
    { label: "Convert to Permanent Member", done: user?.membershipStatus === "member" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${user?.name || "Trial Member"}`}
        description="Trial Dashboard — complete 5 days of waste verification to unlock permanent status"
      />

      {/* Progress Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="EcoPoints Earned" value={String(user?.ecoPoints ?? 0)} icon={Sparkles} />
        <StatCard label="Daily Collections Verified" value={`${streak} / 5 Days`} icon={Flame} />
        <StatCard label="Pending Verifications" value={String(submissions.filter(s => s.status === "pending_verification").length)} icon={Package} />
        <StatCard label="Trial Status" value="Trial Account" icon={Award} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Onboarding Checklist & Trial Progress */}
        <div className="md:col-span-2 space-y-6">
          {/* Welcome Card & Verification Camera */}
          {!isEligibleForUpgrade ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="h-5 w-5 text-primary" /> Daily Waste Verification Upload
                </CardTitle>
                <CardDescription>
                  Today's Category: <span className="font-semibold text-primary capitalize">{schedule.wasteCategory || "Mixed Recycle"}</span>
                  <br />
                  Instructions: {schedule.instructions || "Segregate recyclable objects cleanly before uploading proof."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CameraCapture onCapture={handleCapture} />
                {imageFile && (
                  <div className="pt-2">
                    <Button onClick={handleSubmitProof} disabled={submitting} className="w-full">
                      {submitting ? "Uploading Proof..." : "Submit Photo for Daily Verification"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" /> Trial Completed Successfully!
                </CardTitle>
                <CardDescription className="text-emerald-700 dark:text-emerald-400">
                  Congratulations! You've verified waste collections for 5 days. Convert to a permanent membership now to receive your 3 Color-Coded Bins, 100 Covers, 100 QR Stickers, and Digital QR Identity!
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-base">
                  <Link to="/membership/upgrade">
                    Upgrade to Permanent Membership (₹300)
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Daily Checklist status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trial Onboarding Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className={item.done ? "text-muted-foreground line-through" : "font-medium"}>
                      {item.label}
                    </span>
                    <Badge variant={item.done ? "default" : "secondary"}>
                      {item.done ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent submissions timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification History</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No submissions uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div key={sub._id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Submission</p>
                        <p className="text-xs text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString()}</p>
                        {sub.remarks && <p className="text-xs italic text-red-500 mt-1">Note: {sub.remarks}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.imageUrl && (
                          <img src={sub.imageUrl} alt="Proof" className="h-10 w-10 object-cover rounded border" />
                        )}
                        <Badge
                          variant="outline"
                          className={
                            sub.status === "approved"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : sub.status === "rejected"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {sub.status === "pending_verification" ? "Pending Approval" : sub.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Locked Premium Features & Trial Rules */}
        <div className="space-y-6">
          {/* Calendar Day status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-1">
                <Calendar className="h-4.5 w-4.5 text-primary" /> Daily Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Day 1</span>
                <span className="font-semibold text-green-600">✓ Completed</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Day 2</span>
                <span className={streak >= 2 ? "font-semibold text-green-600" : "text-muted-foreground"}>
                  {streak >= 2 ? "✓ Verified" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Day 3</span>
                <span className={streak >= 3 ? "font-semibold text-green-600" : "text-muted-foreground"}>
                  {streak >= 3 ? "✓ Verified" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Day 4</span>
                <span className={streak >= 4 ? "font-semibold text-green-600" : "text-muted-foreground"}>
                  {streak >= 4 ? "✓ Verified" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-muted-foreground">Day 5</span>
                <span className={streak >= 5 ? "font-semibold text-green-600" : "text-muted-foreground"}>
                  {streak >= 5 ? "✓ Verified" : "Pending"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Locked Premium Cards */}
          <Card className="border-amber-200/50 bg-amber-50/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" /> Locked Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="border-b pb-2">
                <p className="font-semibold text-foreground flex items-center justify-between">
                  Cashback Withdrawals <Badge variant="outline" className="text-[9px]">Premium</Badge>
                </p>
                <p className="mt-0.5">Available after successful trial completion.</p>
              </div>
              <div className="border-b pb-2">
                <p className="font-semibold text-foreground flex items-center justify-between">
                  Product Sales (Sell Waste) <Badge variant="outline" className="text-[9px]">Premium</Badge>
                </p>
                <p className="mt-0.5">Trial users can only schedule collection pickups.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground flex items-center justify-between">
                  Eco-Rewards Claims <Badge variant="outline" className="text-[9px]">Premium</Badge>
                </p>
                <p className="mt-0.5">Earn EcoPoints, redeem vouchers after conversion.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
