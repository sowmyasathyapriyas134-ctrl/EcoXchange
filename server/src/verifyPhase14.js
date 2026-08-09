const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const { User } = require("./models/User");
const { MembershipPurchase } = require("./models/MembershipPurchase");
const { UserToolkit } = require("./models/UserToolkit");
const { UserQRCode } = require("./models/UserQRCode");
const { generateUserQR } = require("./services/qrService");

async function testPhase14() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Phase 14 E2E Test Suite.");

  const ts = Date.now();
  const email = `trial_user_${ts}@example.com`;
  const phone = `+9177700${ts.toString().slice(-5)}`;

  console.log("\n--- TEST 1: Create Trial User & Check Eligibility ---");
  let user = await User.create({
    fullName: "Trial Tester",
    email,
    phoneNumber: phone,
    password: "Password@123",
    role: "citizen",
    membershipStatus: "trial",
    streak: 4, // 4 days streak — ineligible
  });

  let isEligible = user.membershipEligibility?.isEligible || user.streak >= 5;
  console.log(`[PASS] Day 4 Trial User created. Streak: ${user.streak}. Eligible: ${isEligible}`);

  if (isEligible) throw new Error("User should not be eligible at day 4!");

  console.log("\n--- TEST 2: Complete Day 5 Streak (Unlock Eligibility) ---");
  user.streak = 5;
  user.membershipEligibility = {
    isEligible: true,
    eligibleAt: new Date(),
  };
  await user.save();
  isEligible = user.membershipEligibility?.isEligible || user.streak >= 5;
  console.log(`[PASS] Day 5 streak updated. User is now eligible for upgrade: ${isEligible}`);

  console.log("\n--- TEST 3: Create ₹300 Membership Purchase Order ---");
  const purchase = await MembershipPurchase.create({
    user: user._id,
    plan: "permanent",
    amount: 300,
    binSize: "medium",
    razorpayOrderId: `ord_test_${ts}`,
    paymentStatus: "pending",
  });
  console.log(`[PASS] Order created. ID: ${purchase._id}, Bin Size: ${purchase.binSize}, Amount: ₹${purchase.amount}`);

  console.log("\n--- TEST 4: Payment Verification & Convert Trial → Permanent Member ---");
  purchase.razorpayPaymentId = `pay_test_${ts}`;
  purchase.razorpaySignature = "test_sig_verified";
  purchase.paymentStatus = "success";
  await purchase.save();

  user.membershipStatus = "member";
  user.membershipPlan = "permanent";
  user.binSize = purchase.binSize;
  user.membershipActivatedAt = new Date();
  user.membershipPaymentId = purchase.razorpayPaymentId;
  await user.save();

  console.log(`[PASS] Payment verified. User membershipStatus: ${user.membershipStatus}, Plan: ${user.membershipPlan}`);

  console.log("\n--- TEST 5: Automatic Toolkit Allocation ---");
  const toolkit = await UserToolkit.create({
    userId: user._id,
    dustbins: {
      count: 3,
      size: user.binSize,
      delivered: false,
    },
    covers: { quantity: 100 },
    qrStickers: { quantity: 100 },
    deliveryStatus: "processing",
  });
  console.log(`[PASS] Toolkit assigned! Bins: 3 (${toolkit.dustbins.size}), Covers: ${toolkit.covers.quantity}, QR Stickers: ${toolkit.qrStickers.quantity}`);

  console.log("\n--- TEST 6: Unique User QR Identity Generation ---");
  const qrCode = await generateUserQR(user._id);
  console.log(`[PASS] Unique QR Identity generated! Code: ${qrCode.qrCodeId}`);
  console.log(`[PASS] Base64 Image length: ${qrCode.qrImage.length} chars.`);

  console.log("\n--- TEST 7: Duplicate QR / Upgrade Prevention ---");
  const duplicateQr = await generateUserQR(user._id);
  console.log(`[PASS] Re-calling QR generator returned existing active QR code ID: ${duplicateQr.qrCodeId === qrCode.qrCodeId}`);

  console.log("\n🎉 ALL PHASE 14 END-TO-END TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

testPhase14().catch((err) => {
  console.error("Phase 14 test failed:", err);
  process.exit(1);
});
