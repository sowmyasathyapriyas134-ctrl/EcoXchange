/**
 * EcoXchange — Complete Demo Dataset Seed Script (Phase 18)
 * Password for all demo accounts: Permanent@123
 * Run: node src/seed-demo-data.js
 */
"use strict";
const mongoose = require("mongoose");
const dotenv   = require("dotenv");
const path     = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

const { User }               = require("./models/User");
const { Supervisor }         = require("./models/Supervisor");
const { DeliveryAgent }      = require("./models/DeliveryAgent");
const { Recycler }           = require("./models/Recycler");
const { Wallet }             = require("./models/Wallet");
const { UserToolkit }        = require("./models/UserToolkit");
const { UserQRCode }         = require("./models/UserQRCode");
const { Pickup }             = require("./models/Pickup");
const { Product }            = require("./models/Product");
const { Order }              = require("./models/Order");
const { Notification }       = require("./models/Notification");
const { TrialSubmission }    = require("./models/TrialSubmission");
const { MembershipPurchase } = require("./models/MembershipPurchase");
const { LedgerEntry }        = require("./models/LedgerEntry");
const { Proof }              = require("./models/Proof");
const { RecyclerPayment }    = require("./models/RecyclerPayment");
const { generateUserQR }     = require("./services/qrService");

const PASS       = "Permanent@123";
const AGENT_GPS  = [
  { lat: 12.9716, lng: 77.5946 },
  { lat: 12.9352, lng: 77.6245 },
  { lat: 12.9784, lng: 77.6408 },
  { lat: 12.9279, lng: 77.6271 },
  { lat: 12.9698, lng: 77.7500 },
];
const WASTE_TYPES = ["plastic","paper","metal","glass","organic","ewaste"];
const BIN_SIZES   = ["small","medium","medium","large","large"];

function daysAgo(n)        { return new Date(Date.now() - n * 86400000); }
function rnd(min, max)     { return Math.floor(Math.random()*(max-min+1))+min; }

async function upsertWallet(ownerId, ownerModel, opts) {
  opts = opts || {};
  return Wallet.findOneAndUpdate(
    { ownerId, ownerModel },
    { ownerId, ownerModel,
      availableBalance: opts.available || 0,
      pendingBalance:   opts.pending   || 0,
      lifetimeEarnings: opts.lifetime  || 0,
      cashbackBalance:  opts.cashback  || 0,
      rewardBalance:    opts.reward    || 0,
      ecoPointsBalance: opts.ecoPoints || 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

let seq = 1;
async function ledger(userId, userModel, type, amount, desc) {
  const txId = "TXN-SEED-" + Date.now() + "-" + (seq++);
  return LedgerEntry.findOneAndUpdate(
    { transactionId: txId },
    { transactionId: txId, userId, userModel, amount, type, description: desc || "", status: "posted" },
    { upsert: true, new: true }
  );
}

async function notify(rid, rm, title, msg, type) {
  try { return await Notification.create({ recipient: rid, recipientModel: rm, title, message: msg, type }); }
  catch(e) { /* ignore dup / validation errors */ }
}

function getCampaignModel() {
  if (mongoose.models.Campaign) return mongoose.models.Campaign;
  const s = new mongoose.Schema({
    title:       { type: String, required: true },
    description: { type: String, default: "" },
    type:        { type: String, enum: ["referral","ecopoints","pickup_challenge","seasonal","awareness"], required: true },
    startDate:   { type: Date,   required: true },
    endDate:     { type: Date,   required: true },
    isActive:    { type: Boolean, default: true },
    targetUsers: { type: String, enum: ["all","trial","member"], default: "all" },
    reward:      { rewardType: { type: String, default: "ecopoints" }, amount: { type: Number, default: 0 } },
    stats:       { enrolled: { type: Number, default: 0 }, completed: { type: Number, default: 0 } },
  }, { timestamps: true });
  return mongoose.model("Campaign", s);
}

function getCartModel() {
  if (mongoose.models.Cart) return mongoose.models.Cart;
  const s = new mongoose.Schema({
    user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, quantity: { type: Number, default: 1 }, unitPrice: { type: Number, default: 0 } }],
    total: { type: Number, default: 0 },
  }, { timestamps: true });
  return mongoose.model("Cart", s);
}

async function seedData() {
  console.log("=== EcoXchange Full Demo Seeding (Phase 18) ===");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected.\n");

  const Campaign = getCampaignModel();
  const Cart     = getCartModel();

  // ── 1. Supervisors
  console.log("1/11 Supervisors");
  const supervisors = [];
  for (let i = 1; i <= 3; i++) {
    let sup = await Supervisor.findOne({ email: "supervisor"+i+"@ecoxchange.app" });
    if (!sup) {
      sup = await Supervisor.create({
        name: "Supervisor "+i+" (Demo)",
        email: "supervisor"+i+"@ecoxchange.app",
        phone: "+91981000"+String(10+i)+"00",
        password: PASS,
        assignedZones: ["Zone "+i+" - Bangalore Metro"],
        isVerified: true,
      });
    } else {
      if (!sup.assignedZones || !sup.assignedZones.length) {
        sup.assignedZones = ["Zone "+i+" - Bangalore Metro"];
        await sup.save();
      }
    }
    supervisors.push(sup);
    await upsertWallet(sup._id, "Supervisor", { available: 2500*i, lifetime: 5000*i, cashback: 300*i });
    await ledger(sup._id, "Supervisor", "payout", 2500*i, "Demo payout Supervisor "+i);
    await notify(sup._id, "Supervisor", "Welcome to EcoXchange", "You are managing Zone "+i+".", "system_alert");
    await notify(sup._id, "Supervisor", "New Pickup Request",    "A new pickup in your zone.", "pickup_created");
    await notify(sup._id, "Supervisor", "Agent Status Update",   "An agent has come online.", "system_alert");
  }
  console.log("  OK "+supervisors.length+" Supervisors seeded.");

  // ── 2. Delivery Agents
  console.log("2/11 Delivery Agents");
  const agents = [];
  const agStatuses = ["busy","available","available","available","offline"];
  for (let i = 1; i <= 5; i++) {
    let ag = await DeliveryAgent.findOne({ email: "agent"+i+"@ecoxchange.app" });
    const aSup = supervisors[(i-1) % supervisors.length];
    if (!ag) {
      ag = await DeliveryAgent.create({
        name:  "Delivery Agent "+i,
        email: "agent"+i+"@ecoxchange.app",
        phone: "+91982000"+String(10+i)+"00",
        password: PASS,
        availabilityStatus: agStatuses[i-1],
        currentLocation:    AGENT_GPS[i-1],
        assignedSupervisor: aSup._id,
        createdBySupervisor: aSup._id,
        vehicleType:   i%2===0?"bike":"van",
        vehicleNumber: "KA0"+i+"AB"+(1000+i),
        isVerified: true,
      });
    } else {
      ag.currentLocation    = AGENT_GPS[i-1];
      ag.availabilityStatus = agStatuses[i-1];
      ag.assignedSupervisor = aSup._id;
      await ag.save();
    }
    agents.push(ag);
    await upsertWallet(ag._id, "DeliveryAgent", { available: 1200*i, lifetime: 3000*i, cashback: 150*i });
    await ledger(ag._id, "DeliveryAgent", "payout", 1200*i, "Demo payout Agent "+i);
    await notify(ag._id, "DeliveryAgent", "New Pickup Assignment", "You have a new pickup task.", "pickup_assigned");
    await notify(ag._id, "DeliveryAgent", "Shift Started", "Your shift has started.", "system_alert");
  }
  console.log("  OK "+agents.length+" Delivery Agents seeded.");

  // ── 3. Recyclers
  console.log("3/11 Recyclers");
  const recyclers = [];
  const recWaste = [["plastic","ewaste"],["paper","organic"],["metal","glass"]];
  for (let i = 1; i <= 3; i++) {
    let rec = await Recycler.findOne({ email: "recycler"+i+"@ecoxchange.app" });
    if (!rec) {
      rec = await Recycler.create({
        companyName:        "GreenRecycle Plant "+i,
        contactPerson:      "Recycler Manager "+i,
        email:              "recycler"+i+"@ecoxchange.app",
        phone:              "+91983000"+String(10+i)+"00",
        password:           PASS,
        address:            "Plot "+(i*12)+", Industrial Estate, Sector "+i+", Bangalore",
        acceptedWasteTypes: recWaste[i-1],
        licenseNumber:      "GPCB-BLR-00"+i,
        isVerified:         true,
      });
    }
    recyclers.push(rec);
    await upsertWallet(rec._id, "Recycler", { available: 15000*i, lifetime: 45000*i, cashback: 2000*i, reward: 500*i });
    await ledger(rec._id, "Recycler", "recycler_payment", 15000*i, "Demo recycler earnings plant "+i);
    await ledger(rec._id, "Recycler", "payout",           5000*i,  "Demo payout recycler "+i);
    await notify(rec._id, "Recycler", "Payment Received",      "Rs."+(15000*i)+" credited to wallet.", "payment_success");
    await notify(rec._id, "Recycler", "New Shipment Arriving", "Waste shipment incoming from Zone 1.", "shipment_assigned");
    await notify(rec._id, "Recycler", "Payout Released",       "Rs."+(5000*i)+" payout released.", "payout_released");
  }
  console.log("  OK "+recyclers.length+" Recyclers seeded.");

  // ── 4. Trial Members
  console.log("4/11 Trial Members");
  const trialUsers = [];
  for (let i = 1; i <= 5; i++) {
    let u = await User.findOne({ email: "trial"+i+"@ecoxchange.app" });
    if (!u) {
      u = await User.create({
        fullName:     "Trial Member "+i,
        email:        "trial"+i+"@ecoxchange.app",
        phoneNumber:  "+91984000"+String(10+i)+"00",
        password:     PASS,
        role:         "citizen",
        membershipStatus: "trial",
        streak:       i,
        ecoPoints:    50*i,
        address:      "#"+(i*101)+", Green Avenue, Block "+i+", Bangalore",
        membershipEligibility: { isEligible: i>=5, eligibleAt: i>=5?new Date():null },
      });
    } else {
      u.streak=i; u.ecoPoints=50*i;
      u.membershipEligibility={ isEligible: i>=5, eligibleAt: i>=5?new Date():null };
      await u.save();
    }
    trialUsers.push(u);
    await upsertWallet(u._id, "User", { available: 50*i, ecoPoints: 50*i });
    await TrialSubmission.deleteMany({ user: u._id });
    for (let day=1;day<=i;day++) {
      const isLast = day===i;
      await TrialSubmission.create({
        user:     u._id,
        imageUrl: "https://picsum.photos/seed/trial_"+i+"_"+day+"/400/300",
        status:   (isLast&&i<5)?"pending_verification":"approved",
        remarks:  (isLast&&i<5)?"Awaiting review":"Approved",
      });
    }
    await ledger(u._id, "User", "reward_credit", 50*i, "EcoPoints for "+i+"-day streak");
    await notify(u._id, "User", "Streak Updated!", "You are on a "+i+"-day streak!", "reward_earned");
    await notify(u._id, "User", "Daily Reminder",  "Submit your daily waste photo!", "system_alert");
  }
  console.log("  OK "+trialUsers.length+" Trial Members seeded.");

  // ── 5. Permanent Members
  console.log("5/11 Permanent Members");
  const permUsers = [];
  for (let i = 1; i <= 5; i++) {
    let u = await User.findOne({ email: "member"+i+"@ecoxchange.app" });
    if (!u) {
      u = await User.create({
        fullName:              "Permanent Member "+i,
        email:                 "member"+i+"@ecoxchange.app",
        phoneNumber:           "+91985000"+String(10+i)+"00",
        password:              PASS,
        role:                  "citizen",
        membershipStatus:      "member",
        membershipPlan:        "permanent",
        binSize:               BIN_SIZES[i-1],
        membershipActivatedAt: daysAgo(i*10),
        streak:                5+i*2,
        ecoPoints:             200*i,
        address:               "#"+(i*202)+", Eco Heights, Sector "+i+", Bangalore",
        membershipEligibility: { isEligible: true, eligibleAt: daysAgo(i*10+5) },
      });
    }
    permUsers.push(u);
    await upsertWallet(u._id, "User", { available: 350*i, lifetime: 1000*i, ecoPoints: 200*i, cashback: 80*i, reward: 50*i });
    await generateUserQR(u._id).catch(()=>{});
    await UserToolkit.findOneAndUpdate(
      { userId: u._id },
      { userId: u._id, dustbins: { count: 3, size: u.binSize||"medium", delivered: true }, covers: { quantity: 100 }, qrStickers: { quantity: 100 }, deliveryStatus: "delivered", issuedAt: daysAgo(i*10-2) },
      { upsert: true, new: true }
    );
    const existMP = await MembershipPurchase.findOne({ user: u._id });
    if (!existMP) {
      await MembershipPurchase.create({
        user: u._id, plan: "permanent", amount: 300,
        binSize: u.binSize||"medium",
        razorpayOrderId:   "order_demo_"+u._id,
        razorpayPaymentId: "pay_demo_"  +u._id,
        razorpaySignature: "sig_demo_"  +u._id,
        paymentStatus: "success",
      });
    }
    await ledger(u._id, "User", "membership_upgrade", 300,    "Membership upgrade - permanent");
    await ledger(u._id, "User", "cashback_credit",    30,     "Cashback on membership");
    await ledger(u._id, "User", "reward_credit",      50*i,   "EcoPoints reward cumulative");
    if (i===1) await ledger(u._id, "User", "referral_bonus", 100, "Referral bonus");
    await notify(u._id, "User", "Membership Activated!", "Your permanent membership is active.", "membership_upgraded");
    await notify(u._id, "User", "Payment Successful",    "Rs.300 payment received.", "payment_success");
    await notify(u._id, "User", "Toolkit Dispatched",    "Your 3-bin toolkit is on the way.", "shipment_assigned");
    await notify(u._id, "User", "QR Code Issued",        "Your EcoXchange QR code is ready.", "reward_earned");
  }
  console.log("  OK "+permUsers.length+" Permanent Members seeded.");

  // ── 6. Products
  console.log("6/11 Products (20)");
  const PRODS = [
    ["Upcycled Cotton Tote Bag",       299,  25,"Bags",          "paper"  ],
    ["Bamboo Toothbrush Set 4-Pack",   199,  50,"Personal Care", "organic"],
    ["Recycled Plastic Garden Planter",449,  30,"Home Garden",   "plastic"],
    ["Solar Powered LED Lamp",         899,  15,"Electronics",   "ewaste" ],
    ["Organic Compost Bin 10L",        599,  20,"Home Garden",   "plastic"],
    ["Eco-Friendly Cutlery Set",       349,  40,"Kitchen",       "metal"  ],
    ["Recycled Newspaper Pencils",     99,  100,"Stationery",    "paper"  ],
    ["Glass Water Bottle 1L",          499,  35,"Drinkware",     "glass"  ],
    ["Biodegradable Phone Case",       399,  22,"Accessories",   "organic"],
    ["Recycled Rubber Doormat",        649,  18,"Home Garden",   "plastic"],
    ["Metal Straws Set 8-Pack",        249,  60,"Kitchen",       "metal"  ],
    ["Repurposed Denim Journal",       329,  28,"Stationery",    "paper"  ],
    ["Seed Paper Gift Cards 10-Pack",  149,  75,"Gifts",         "paper"  ],
    ["Solar Charger 20000mAh",        1499,  10,"Electronics",   "ewaste" ],
    ["Recycled Plastic Watering Can",  379,  25,"Home Garden",   "plastic"],
    ["Organic Cotton Face Towels",     279,  45,"Personal Care", "organic"],
    ["Cork Yoga Mat",                 1299,  12,"Fitness",       "organic"],
    ["Recycled Glass Vase Set",        699,  20,"Decor",         "glass"  ],
    ["Upcycled Tire Plant Stand",      849,   8,"Home Garden",   "plastic"],
    ["Handmade Recycled Paper Lamp",   799,  14,"Decor",         "paper"  ],
  ];
  const seededProducts = [];
  for (let idx=0;idx<PRODS.length;idx++) {
    const [name,price,stock,cat,mat] = PRODS[idx];
    let p = await Product.findOne({ name });
    if (!p) {
      p = await Product.create({
        name, price, stock, category: cat,
        description: "Eco-friendly "+name+" from recycled "+mat+".",
        recycler: recyclers[idx%recyclers.length]._id,
        isApprovedByAdmin: true, status: "active", isActive: true,
        manufactureDate: daysAgo(30+idx*5),
        materialsUsed: [{ materialType: mat, quantityKg: 0.5+idx*0.1 }],
        sustainabilityScore: 60+idx, carbonSavedKg: 2+idx*0.5,
        images: ["https://picsum.photos/seed/prod_"+idx+"_"+price+"/400/400"],
      });
    }
    seededProducts.push(p);
  }
  console.log("  OK "+seededProducts.length+" Products seeded.");

  // ── 7. Pickups
  console.log("7/11 Pickups");
  const seededPickups = [];
  const ratePerKg = { plastic:15,paper:10,metal:25,glass:12,organic:8,ewaste:30 };
  for (let mi=0;mi<permUsers.length;mi++) {
    const user  = permUsers[mi];
    const agent = agents[mi%agents.length];
    const sup   = supervisors[mi%supervisors.length];
    const rec   = recyclers[mi%recyclers.length];
    const lat   = agent.currentLocation&&agent.currentLocation.lat?agent.currentLocation.lat:12.9716;
    const lng   = agent.currentLocation&&agent.currentLocation.lng?agent.currentLocation.lng:77.5946;
    const wt    = WASTE_TYPES[mi%WASTE_TYPES.length];
    const rate  = ratePerKg[wt]||10;
    const p1 = await Pickup.create({
      user: user._id, userModel: "User",
      assignedAgent: agent._id, supervisor: sup._id, recycler: rec._id,
      wasteType: wt, estimatedWeight: 5+mi, actualWeight: 5+mi,
      address: user.address||("#"+(mi+1)+", Eco Heights, Bangalore"),
      scheduledDate: daysAgo(5+mi), status: "completed",
      verificationStatus: "verified", verifiedBy: sup._id, verifiedAt: daysAgo(4+mi),
      qrScanned: true, qrScannedAt: daysAgo(4+mi),
      ecoPointsAwarded: (5+mi)*10, earnedPoints: (5+mi)*10,
      destinationLat: lat, destinationLng: lng,
      recyclingStatus: "processed", recycledWeight: 5+mi, processingDate: daysAgo(3+mi),
      completionImage: "https://picsum.photos/seed/proof_"+mi+"_1/400/300",
      statusHistory: [
        { status:"pending",     timestamp: daysAgo(6+mi), notes:"Submitted" },
        { status:"assigned",    timestamp: daysAgo(5+mi), notes:"Agent assigned" },
        { status:"in_progress", timestamp: daysAgo(4+mi), notes:"Started" },
        { status:"completed",   timestamp: daysAgo(4+mi), notes:"Completed" },
      ],
    });
    seededPickups.push(p1);
    await Proof.create({
      taskId: p1._id, deliveryAgent: agent._id,
      imageUrl: "https://picsum.photos/seed/proof_"+mi+"_c/400/300",
      publicId: "demo_proof_"+mi+"_"+Date.now(),
      deviceType: "mobile", latitude: lat, longitude: lng, status: "verified",
    });
    await RecyclerPayment.create({
      pickup: p1._id, member: user._id, recycler: rec._id,
      wasteType: wt, weight: 5+mi, ratePerKg: rate,
      totalAmount: (5+mi)*rate, status: "paid", paidAt: daysAgo(2+mi),
    });
    await ledger(user._id, "User", "reward_credit", (5+mi)*10, "EcoPoints pickup "+wt);
    if (mi<2) {
      const p2 = await Pickup.create({
        user: user._id, userModel: "User",
        assignedAgent: agent._id, supervisor: sup._id,
        wasteType: WASTE_TYPES[(mi+1)%WASTE_TYPES.length],
        estimatedWeight: 4+mi,
        address: user.address||("#"+(mi+1)+", Eco Heights, Bangalore"),
        scheduledDate: new Date(), status: "in_progress",
        verificationStatus: "pending",
        destinationLat: lat+0.001, destinationLng: lng+0.001,
        statusHistory: [
          {status:"pending",timestamp:daysAgo(1),notes:"Submitted"},
          {status:"assigned",timestamp:new Date(),notes:"Assigned"},
          {status:"in_progress",timestamp:new Date(),notes:"En route"},
        ],
      });
      seededPickups.push(p2);
    } else {
      const p3 = await Pickup.create({
        user: user._id, userModel: "User",
        wasteType: WASTE_TYPES[(mi+2)%WASTE_TYPES.length],
        estimatedWeight: 3+mi,
        address: user.address||("#"+(mi+1)+", Eco Heights, Bangalore"),
        scheduledDate: new Date(Date.now()+86400000),
        status: "pending", verificationStatus: "pending",
        destinationLat: lat, destinationLng: lng,
        statusHistory: [{status:"pending",timestamp:new Date(),notes:"Submitted"}],
      });
      seededPickups.push(p3);
    }
    await notify(user._id,  "User",          "Pickup Completed!", "Your "+wt+" pickup is done!", "pickup_completed");
    await notify(user._id,  "User",          "Pickup Scheduled",  "Next pickup scheduled.", "pickup_created");
    await notify(agent._id, "DeliveryAgent", "Pickup Completed",  "Completed "+wt+" pickup.", "pickup_completed");
    await notify(sup._id,   "Supervisor",    "Pickup Verified",   "Pickup verified in your zone.", "pickup_approved");
  }
  console.log("  OK "+seededPickups.length+" Pickups seeded.");

  // ── 8. Orders
  console.log("8/11 Orders");
  const seededOrders = [];
  const dstat = ["delivered","shipped","processing","delivered","delivered"];
  for (let i=0;i<permUsers.length;i++) {
    const user = permUsers[i];
    const pr1  = seededProducts[i%seededProducts.length];
    const pr2  = seededProducts[(i+3)%seededProducts.length];
    const sub  = pr1.price+pr2.price;
    const tax  = Math.round(sub*0.18);
    const ship = sub>1000?0:50;
    const tot  = sub+tax+ship;
    const ord  = await Order.create({
      user: user._id,
      items: [{product:pr1._id,quantity:1,unitPrice:pr1.price},{product:pr2._id,quantity:1,unitPrice:pr2.price}],
      subtotal: sub, taxes: tax, shipping: ship, total: tot,
      paymentStatus: "paid", deliveryStatus: dstat[i],
      razorpayOrderId:   "order_mkt_"+i+"_"+Date.now(),
      razorpayPaymentId: "pay_mkt_"+i+"_"+Date.now(),
      shippingAddress: user.address,
    });
    seededOrders.push(ord);
    await ledger(user._id,"User","marketplace_sale",tot,"Order #"+ord._id);
    await notify(user._id,"User","Order Placed!","Order for "+pr1.name+" placed.","payment_success");
    if(dstat[i]==="delivered") await notify(user._id,"User","Order Delivered","Your order has been delivered!","shipment_delivered");
  }
  {
    const u=permUsers[0]; const pr=seededProducts[10];
    const sub=pr.price*2; const tax=Math.round(sub*0.18); const tot=sub+tax;
    const ord=await Order.create({
      user:u._id, items:[{product:pr._id,quantity:2,unitPrice:pr.price}],
      subtotal:sub, taxes:tax, shipping:0, total:tot,
      paymentStatus:"paid", deliveryStatus:"delivered",
      razorpayOrderId:"order_mkt_m1b_"+Date.now(),
      razorpayPaymentId:"pay_mkt_m1b_"+Date.now(),
      shippingAddress:u.address,
    });
    seededOrders.push(ord);
    await ledger(u._id,"User","marketplace_sale",tot,"2nd order member1");
    await notify(u._id,"User","Order Delivered","2nd order delivered!","shipment_delivered");
  }
  console.log("  OK "+seededOrders.length+" Orders seeded.");

  // ── 9. Carts
  console.log("9/11 Carts");
  let cartCount=0;
  for (let i=3;i<=4;i++) {
    const u=permUsers[i];
    const pr1=seededProducts[rnd(0,9)];
    const pr2=seededProducts[rnd(10,19)];
    await Cart.findOneAndUpdate(
      { user: u._id },
      { user:u._id, items:[{product:pr1._id,quantity:1,unitPrice:pr1.price},{product:pr2._id,quantity:2,unitPrice:pr2.price}], total:pr1.price+pr2.price*2 },
      { upsert:true, new:true }
    );
    cartCount++;
  }
  console.log("  OK "+cartCount+" Carts seeded.");

  // ── 10. Campaigns
  console.log("10/11 Campaigns (5)");
  const CDATA = [
    { title:"Green Start Referral Drive",  type:"referral",         startDate:daysAgo(30), endDate:new Date(Date.now()+30*86400000), isActive:true,  targetUsers:"trial",  stats:{enrolled:48,  completed:17 } },
    { title:"Plastic-Free July Challenge", type:"pickup_challenge",  startDate:daysAgo(15), endDate:new Date(Date.now()+15*86400000), isActive:true,  targetUsers:"member", stats:{enrolled:123, completed:54 } },
    { title:"EcoPoints Bonus Week",        type:"ecopoints",        startDate:daysAgo(5),  endDate:new Date(Date.now()+2*86400000),  isActive:true,  targetUsers:"all",    stats:{enrolled:310, completed:200} },
    { title:"Monsoon Recycling Awareness", type:"awareness",        startDate:daysAgo(10), endDate:new Date(Date.now()+20*86400000), isActive:true,  targetUsers:"all",    stats:{enrolled:215, completed:180} },
    { title:"Independence Day Eco Pledge", type:"seasonal",         startDate:daysAgo(7),  endDate:new Date(Date.now()+7*86400000),  isActive:false, targetUsers:"member", stats:{enrolled:89,  completed:63 } },
  ];
  let campCount=0;
  for (const cd of CDATA) {
    let c = await Campaign.findOne({ title: cd.title });
    if (!c) c = await Campaign.create(cd);
    campCount++;
  }
  console.log("  OK "+campCount+" Campaigns seeded.");

  // ── 11. Analytics Ledger
  console.log("11/11 Analytics Ledger");
  const aUser = permUsers[0];
  for (let d=1;d<=7;d++) {
    const txId = "TXN-ANA-D"+d+"-"+Date.now()+"-"+(seq++);
    await LedgerEntry.findOneAndUpdate({transactionId:txId},{transactionId:txId,userId:aUser._id,userModel:"User",amount:rnd(50,300),type:"reward_credit",description:"Daily analytics Day "+d,status:"posted"},{upsert:true,new:true});
  }
  const aRec = recyclers[0];
  for (let m=1;m<=3;m++) {
    const txId = "TXN-ANA-M"+m+"-"+Date.now()+"-"+(seq++);
    await LedgerEntry.findOneAndUpdate({transactionId:txId},{transactionId:txId,userId:aRec._id,userModel:"Recycler",amount:15000*m,type:"recycler_payment",description:"Monthly analytics Month "+m,status:"posted"},{upsert:true,new:true});
  }
  console.log("  OK Analytics ledger seeded.");

  // ── VERIFICATION
  console.log("\nVerification...");
  const counts = {
    supervisors:  await Supervisor.countDocuments({ email: /supervisor\d@ecoxchange\.app/ }),
    agents:       await DeliveryAgent.countDocuments({ email: /agent\d@ecoxchange\.app/ }),
    recyclers:    await Recycler.countDocuments({ email: /recycler\d@ecoxchange\.app/ }),
    trial:        await User.countDocuments({ email: /trial\d@ecoxchange\.app/ }),
    perm:         await User.countDocuments({ email: /member\d@ecoxchange\.app/ }),
    wallets:      await Wallet.countDocuments(),
    toolkits:     await UserToolkit.countDocuments(),
    qrs:          await UserQRCode.countDocuments(),
    pickups:      await Pickup.countDocuments(),
    products:     await Product.countDocuments(),
    orders:       await Order.countDocuments(),
    carts:        await Cart.countDocuments(),
    notifs:       await Notification.countDocuments(),
    mps:          await MembershipPurchase.countDocuments({ paymentStatus:"success" }),
    ledger:       await LedgerEntry.countDocuments(),
    proofs:       await Proof.countDocuments(),
    recyclerPay:  await RecyclerPayment.countDocuments(),
    campaigns:    await Campaign.countDocuments(),
  };
  let ok = true;
  for (const u of permUsers) {
    const w=await Wallet.findOne({ownerId:u._id,ownerModel:"User"});
    const tk=await UserToolkit.findOne({userId:u._id});
    const qr=await UserQRCode.findOne({userId:u._id});
    const mp=await MembershipPurchase.findOne({user:u._id});
    if(!w||!tk||!qr||!mp){ console.error("  FAIL "+u.email+" w="+!!w+" tk="+!!tk+" qr="+!!qr+" mp="+!!mp); ok=false; }
  }
  for (const ag of agents) {
    const w=await Wallet.findOne({ownerId:ag._id,ownerModel:"DeliveryAgent"});
    if(!w||!ag.assignedSupervisor){ console.error("  FAIL agent "+ag.email); ok=false; }
  }
  const orph = await Pickup.find({ user: null });
  if(orph.length>0){ console.error("  FAIL orphan pickups: "+orph.length); ok=false; }
  if(ok) console.log("  All integrity checks passed.");

  // ── REPORT
  console.log("\n=== SEEDING COMPLETE ===");
  console.log("Supervisors:          "+counts.supervisors);
  console.log("Delivery Agents:      "+counts.agents);
  console.log("Recyclers:            "+counts.recyclers);
  console.log("Trial Members:        "+counts.trial);
  console.log("Permanent Members:    "+counts.perm);
  console.log("Wallets:              "+counts.wallets);
  console.log("Toolkits:             "+counts.toolkits);
  console.log("QR Codes:             "+counts.qrs);
  console.log("MembershipPurchases:  "+counts.mps);
  console.log("Pickups:              "+counts.pickups);
  console.log("Products:             "+counts.products);
  console.log("Orders:               "+counts.orders);
  console.log("Carts:                "+counts.carts);
  console.log("Proofs:               "+counts.proofs);
  console.log("RecyclerPayments:     "+counts.recyclerPay);
  console.log("Campaigns:            "+counts.campaigns);
  console.log("Notifications:        "+counts.notifs);
  console.log("Ledger Entries:       "+counts.ledger);
  console.log("\nDemo Credentials (Password: Permanent@123):");
  for(let i=1;i<=5;i++) console.log("  trial"+i+"@ecoxchange.app  (streak "+i+")");
  for(let i=1;i<=5;i++) console.log("  member"+i+"@ecoxchange.app (bin "+BIN_SIZES[i-1]+", ecoPoints "+(200*i)+")");
  for(let i=1;i<=3;i++) console.log("  supervisor"+i+"@ecoxchange.app (zone "+i+")");
  const sl=["Busy","Available","Available","Available","Offline"];
  for(let i=1;i<=5;i++) console.log("  agent"+i+"@ecoxchange.app ("+sl[i-1]+")");
  for(let i=1;i<=3;i++) console.log("  recycler"+i+"@ecoxchange.app (GreenRecycle Plant "+i+")");
  console.log("\nIntegrity: "+(ok?"PASSED":"FAILED"));
  process.exit(ok?0:1);
}

seedData().catch(function(err) {
  console.error("Seeding failed:", err.message||err);
  if(err.stack) console.error(err.stack);
  process.exit(1);
});
