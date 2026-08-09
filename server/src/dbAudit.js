const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const { User } = require("./models/User");
const { Supervisor } = require("./models/Supervisor");
const { DeliveryAgent } = require("./models/DeliveryAgent");
const { Recycler } = require("./models/Recycler");
const { Admin } = require("./models/Admin");
const { Wallet } = require("./models/Wallet");
const { UserToolkit } = require("./models/UserToolkit");
const { UserQRCode } = require("./models/UserQRCode");

async function runAudit() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Database Integrity Audit.\n");

  const models = [
    { model: User, name: "User", roleField: "role" },
    { model: Supervisor, name: "Supervisor", roleField: "supervisor" },
    { model: DeliveryAgent, name: "DeliveryAgent", roleField: "delivery_agent" },
    { model: Recycler, name: "Recycler", roleField: "recycler" },
    { model: Admin, name: "Admin", roleField: "admin" },
  ];

  let missingWalletsCreated = 0;
  let activeWalletsCount = 0;

  console.log("--- Checking Wallets for all registered users across collections ---");
  for (const item of models) {
    const docs = await item.model.find({});
    console.log(`Checking ${docs.length} documents in ${item.name}...`);
    for (const doc of docs) {
      const wallet = await Wallet.findOne({ ownerId: doc._id, ownerModel: item.name });
      if (!wallet) {
        console.log(`[ALERT] Missing wallet for ${item.name} ID ${doc._id} (${doc.email || doc.name || doc.companyName}). Creating...`);
        await Wallet.create({
          ownerId: doc._id,
          ownerModel: item.name,
          availableBalance: 0,
          pendingBalance: 0,
          lifetimeEarnings: 0,
          lifetimeWithdrawals: 0,
        });
        missingWalletsCreated++;
      } else {
        activeWalletsCount++;
      }
    }
  }
  console.log(`Wallet check completed. Active Wallets: ${activeWalletsCount}, New Wallets Created: ${missingWalletsCreated}\n`);

  console.log("--- Checking for orphan wallets ---");
  const wallets = await Wallet.find({});
  let orphanWalletsCount = 0;
  for (const wallet of wallets) {
    const modelObj = models.find(m => m.name === wallet.ownerModel);
    if (!modelObj) {
      console.log(`[ALERT] Wallet ${wallet._id} has invalid ownerModel: ${wallet.ownerModel}. Removing...`);
      await Wallet.deleteOne({ _id: wallet._id });
      orphanWalletsCount++;
      continue;
    }
    const ownerExists = await modelObj.model.findById(wallet.ownerId);
    if (!ownerExists) {
      console.log(`[ALERT] Wallet ${wallet._id} is an orphan (ownerId ${wallet.ownerId} not found in ${wallet.ownerModel}). Removing...`);
      await Wallet.deleteOne({ _id: wallet._id });
      orphanWalletsCount++;
    }
  }
  console.log(`Orphan wallets cleanup completed. Orphans removed: ${orphanWalletsCount}\n`);

  console.log("--- Checking for orphan toolkits ---");
  const toolkits = await UserToolkit.find({});
  let orphanToolkitsCount = 0;
  for (const tk of toolkits) {
    const userExists = await User.findById(tk.userId);
    if (!userExists) {
      console.log(`[ALERT] UserToolkit ${tk._id} is an orphan (userId ${tk.userId} not found in User). Removing...`);
      await UserToolkit.deleteOne({ _id: tk._id });
      orphanToolkitsCount++;
    }
  }
  console.log(`Orphan toolkits cleanup completed. Orphans removed: ${orphanToolkitsCount}\n`);

  console.log("--- Checking for orphan QR codes ---");
  const qrcodes = await UserQRCode.find({});
  let orphanQrsCount = 0;
  for (const qr of qrcodes) {
    const userExists = await User.findById(qr.userId);
    if (!userExists) {
      console.log(`[ALERT] UserQRCode ${qr._id} is an orphan (userId ${qr.userId} not found in User). Removing...`);
      await UserQRCode.deleteOne({ _id: qr._id });
      orphanQrsCount++;
    }
  }
  console.log(`Orphan QR codes cleanup completed. Orphans removed: ${orphanQrsCount}\n`);

  console.log("🎉 DATABASE INTEGRITY AUDIT COMPLETE.");
  process.exit(0);
}

runAudit().catch(err => {
  console.error("Audit failed:", err);
  process.exit(1);
});
