const { Wallet } = require("../models/Wallet");
const { WithdrawalRequest } = require("../models/WithdrawalRequest");
const { LedgerEntry } = require("../models/LedgerEntry");
const { getSetting } = require("../models/PlatformSettings");
const { ensureWallet } = require("../services/walletService");

const nanoid = () => `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const getMyWallet = async (req, res, next) => {
  try {
    const modelName = req.user.constructor.modelName;
    const w = await ensureWallet(req.user._id, modelName);
    return res.json({ success: true, message: "Wallet", data: w });
  } catch (e) {
    return next(e);
  }
};

const requestWithdrawal = async (req, res, next) => {
  try {
    const modelName = req.user.constructor.modelName;
    if (modelName === "User" && req.user.membershipStatus === "trial") {
      return res.status(403).json({ success: false, message: "Trial users cannot withdraw cash" });
    }
    const min = Number(await getSetting("minWithdrawalAmount", 100));
    const { amount, method, payoutDetails } = req.body || {};
    const amt = Number(amount);
    if (!amt || amt < min) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal ₹${min}` });
    }
    const wallet = await ensureWallet(req.user._id, modelName);
    if (wallet.availableBalance < amt) {
      return res.status(400).json({ success: false, message: "Insufficient available balance" });
    }

    const wr = await WithdrawalRequest.create({
      userId: req.user._id,
      userModel: modelName,
      amount: amt,
      method: method === "bank" ? "bank" : "upi",
      payoutDetails: payoutDetails || {},
      status: "pending",
    });

    await LedgerEntry.create({
      transactionId: nanoid(),
      userId: req.user._id,
      userModel: modelName,
      amount: -amt,
      type: "withdrawal_request",
      status: "pending",
      referenceId: String(wr._id),
      description: "Withdrawal requested",
    });

    wallet.availableBalance -= amt;
    wallet.pendingBalance += amt;
    await wallet.save();

    return res.status(201).json({ success: true, message: "Withdrawal submitted", data: wr });
  } catch (e) {
    return next(e);
  }
};

const listLedger = async (req, res, next) => {
  try {
    const modelName = req.user.constructor.modelName;
    const rows = await LedgerEntry.find({ userId: req.user._id, userModel: modelName })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ success: true, message: "Ledger", data: rows });
  } catch (e) {
    return next(e);
  }
};

module.exports = { getMyWallet, requestWithdrawal, listLedger };
