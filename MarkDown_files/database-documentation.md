# Database Documentation - EcoXchange

## MongoDB Overview

**Database**: MongoDB Atlas
**Connection**: Mongoose ODM with automatic schema validation
**Collections**: 29 MongoDB collections
**Data Model**: Document-oriented with references

---

## Data Models & Relationships

### USER ROLE MODELS

#### 1. User (Citizen/Member)

```javascript
{
  _id: ObjectId,
  fullName: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  phoneNumber: String (unique, required, indexed),
  firebaseUid: String (sparse, indexed),
  qrCodeData: String,
  address: String,
  avatar: String (Cloudinary URL),

  // Role & Status
  role: Enum ["citizen", "recycler", "supervisor", "admin"] (default: "citizen"),
  ecoPoints: Number (default: 0),
  streak: Number (default: 0),
  membershipStatus: Enum ["trial", "member"] (default: "trial"),

  // Verification
  isPhoneVerified: Boolean (default: false),
  isSuspended: Boolean (default: false),
  suspendedAt: Date,
  suspendedReason: String,

  // Membership
  membershipStartDate: Date,
  membershipEndDate: Date,
  membershipPlan: String,

  createdAt: Date (auto),
  updatedAt: Date (auto),
}
```

**Relationships**:

- Picks up: `Pickup` (one-to-many)
- Has: `Wallet` (one-to-one)
- Places: `Order` (one-to-many)
- Claims: `RewardRedemption` (one-to-many)
- Makes: `WasteSubmission` (one-to-many)
- Has: `Cart` (one-to-one)

---

#### 2. Recycler (Business Entity)

```javascript
{
  _id: ObjectId,
  companyName: String (required),
  contactPerson: String,
  email: String (unique, required),
  password: String (hashed, required),
  phone: String (indexed),
  firebaseUid: String (sparse, indexed),
  address: String,
  avatar: String,

  // Business Details
  role: String (default: "recycler"),
  licenseNumber: String,
  acceptedWasteTypes: [String],

  // Verification
  isVerified: Boolean (default: false),
  isSuspended: Boolean (default: false),
  suspendedAt: Date,
  suspendedReason: String,

  createdAt: Date,
  updatedAt: Date,
}
```

**Relationships**:

- Receives: `Shipment` (one-to-many)
- Creates: `Product` (one-to-many)
- Has: `Wallet` (one-to-one)
- Has: `RecyclerSchedule` (one-to-many)

---

#### 3. DeliveryAgent

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  phone: String (indexed),
  firebaseUid: String (sparse, indexed),
  address: String,
  avatar: String,

  // Employment
  role: String (default: "delivery_agent"),
  employeeId: String,
  vehicleType: String,
  vehicleNumber: String,

  // Location & Availability
  currentLocation: {
    lat: Number,
    lng: Number,
  },
  availabilityStatus: Enum ["available", "busy", "offline"] (default: "offline"),

  // Verification
  isVerified: Boolean (default: false),
  isSuspended: Boolean (default: false),
  suspendedAt: Date,
  suspendedReason: String,

  createdAt: Date,
  updatedAt: Date,
}
```

**Relationships**:

- Assigned: `Pickup` (one-to-many)
- Has: `Wallet` (one-to-one)
- Tracks: `LocationHistory` (one-to-many)

---

#### 4. Supervisor

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  phone: String (indexed),
  firebaseUid: String (sparse, indexed),
  address: String,

  role: String (default: "supervisor"),

  isVerified: Boolean (default: false),
  isSuspended: Boolean (default: false),

  createdAt: Date,
  updatedAt: Date,
}
```

**Relationships**:

- Verifies: `Pickup` (one-to-many)
- Approves: `Product` (one-to-many)
- Has: `Wallet` (one-to-one)

---

#### 5. Admin

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  phone: String (indexed),

  role: String (default: "admin"),
  permissions: [String] (e.g., ["manage_users", "view_analytics"]),

  createdAt: Date,
  updatedAt: Date,
}
```

---

### OPERATIONAL MODELS

#### 6. Pickup (Waste Submission)

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, required, indexed),
  userModel: String (default: "User"),

  assignedAgent: ObjectId (ref: DeliveryAgent),
  supervisor: ObjectId (ref: Supervisor),
  recycler: ObjectId (ref: Recycler),

  // Waste Details
  wasteType: Enum ["plastic", "paper", "metal", "glass", "organic", "ewaste"] (required),
  estimatedWeight: Number (required),
  actualWeight: Number (default: 0),

  // Location
  address: String (required),
  notes: String,
  destinationLat: Number (default: 12.9716),
  destinationLng: Number (default: 77.5946),

  // Workflow
  scheduledDate: Date (required),
  status: Enum [
    "pending", "approved", "rejected", "assigned",
    "accepted", "in_progress", "completed",
    "cancelled", "failed"
  ] (default: "pending"),

  statusHistory: [{
    status: String,
    changedBy: ObjectId (ref: DeliveryAgent),
    timestamp: Date (default: now),
    notes: String,
  }],

  // Verification
  verificationStatus: Enum ["pending", "verified", "rejected"] (default: "pending"),
  verifiedBy: ObjectId (ref: Supervisor),
  verifiedAt: Date,

  // Proofs
  qrScanned: Boolean (default: false),
  qrScannedAt: Date,
  memberImage: String (Cloudinary URL),
  completionImage: String (Cloudinary URL),

  // Eco Points
  ecoPointsAwarded: Number (default: 0),
  earnedPoints: Number (default: 0),

  rejectionReason: String,
  completionNotes: String,

  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes**: user, status, scheduledDate, createdAt

---

#### 7. Shipment (Waste Transportation)

```javascript
{
  _id: ObjectId,
  recycler: ObjectId (ref: Recycler, required, indexed),

  // Shipment Details
  fromHub: String (required),
  wasteType: String (required),
  weightKg: Number (required),

  // Status Tracking
  status: Enum [
    "Assigned", "Accepted", "Collected",
    "In Transit", "Delivered",
    "Receipt Confirmed", "Processing",
    "Completed", "Rejected", "Cancelled"
  ] (default: "Assigned", indexed),

  shipmentHistory: [{
    status: String,
    changedBy: ObjectId,
    remarks: String,
    timestamp: Date (default: now),
  }],

  createdAt: Date,
  updatedAt: Date,
}
```

---

#### 8. WasteSubmission (Lifecycle Tracking)

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required, indexed),

  proofImageUrls: [String] (Cloudinary URLs),
  notes: String,

  // Status Progression
  status: Enum [
    "submitted", "awaiting_pickup",
    "picked_up", "at_facility",
    "sent_to_recycler", "recycled",
    "approved", "rejected"
  ] (default: "submitted", indexed),

  statusHistory: [{
    status: String,
    at: Date (default: now),
    by: ObjectId,
    note: String,
  }],

  supervisorDecision: Enum ["pending", "approved", "rejected"] (default: "pending"),
  ecoPointsAwarded: Number (default: 0),

  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes**: userId, status, createdAt

---

### MARKETPLACE MODELS

#### 9. Product (Recycled Goods)

```javascript
{
  _id: ObjectId,
  recycler: ObjectId (ref: Recycler, required, indexed),

  // Product Details
  name: String (required),
  description: String,
  category: String,
  price: Number (required, min: 0),
  stock: Number (required, min: 0, default: 0),
  isActive: Boolean (default: true),

  // Manufacturing
  manufactureDate: Date (required),
  expiryDate: Date,

  // Materials & Sustainability
  materialsUsed: [{
    materialType: Enum ["plastic", "paper", "metal", "glass", "organic", "ewaste"],
    quantityKg: Number,
    sourcePickupIds: [ObjectId (ref: Pickup)],
  }],
  totalMaterialWeight: Number (default: 0),
  lifeSpan: String,
  sustainabilityScore: Number (default: 0),
  carbonSavedKg: Number (default: 0),

  // Media & Admin
  images: [String] (Cloudinary URLs),
  status: Enum ["draft", "active", "out_of_stock", "archived"] (default: "draft", indexed),
  isApprovedByAdmin: Boolean (default: false, indexed),

  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes**: recycler, status, isApprovedByAdmin

---

#### 10. Order (Marketplace Purchase)

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, required, indexed),

  // Items
  items: [{
    product: ObjectId (ref: Product, required),
    quantity: Number (required, min: 1),
    unitPrice: Number (required, min: 0),
  }],

  // Pricing
  subtotal: Number (default: 0),
  taxes: Number (default: 0),
  shipping: Number (default: 0),
  total: Number (required, min: 0),

  // Payment
  paymentStatus: Enum ["unpaid", "paid", "refunded"] (default: "unpaid"),
  razorpayOrderId: String (default: ""),
  razorpayPaymentId: String (default: ""),

  // Delivery
  deliveryStatus: Enum ["created", "processing", "shipped", "delivered"] (default: "created"),
  shippingAddress: String,

  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes**: user, paymentStatus, deliveryStatus

---

#### 11. Cart (Shopping Cart)

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, unique),

  items: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    addedAt: Date,
  }],

  createdAt: Date,
  updatedAt: Date,
}
```

---

### FINANCIAL MODELS

#### 12. Wallet (Financial Balance)

```javascript
{
  _id: ObjectId,
  ownerId: ObjectId (required, indexed),
  ownerModel: Enum ["User", "Recycler", "DeliveryAgent", "Admin", "Supervisor"] (required, indexed),

  // Balance Tracking
  availableBalance: Number (default: 0),
  pendingBalance: Number (default: 0),
  lifetimeEarnings: Number (default: 0),
  lifetimeWithdrawals: Number (default: 0),

  // Additional Balances
  cashbackBalance: Number (default: 0),
  rewardBalance: Number (default: 0),
  ecoPointsBalance: Number (default: 0),

  createdAt: Date,
  updatedAt: Date,
}

// Unique constraint: { ownerId, ownerModel }
```

**Indexes**: ownerId, ownerModel (compound unique index)

---

#### 13. Payment (Razorpay Record)

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, required, indexed),
  membershipPlan: ObjectId (ref: MembershipPlan, required),

  // Razorpay Details
  razorpayOrderId: String (required, unique, indexed),
  razorpayPaymentId: String,

  // Transaction
  amount: Number (required),
  currency: String (default: "INR"),
  status: Enum ["created", "paid", "failed"] (default: "created", indexed),
  paidAt: Date,

  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes**: razorpayOrderId (unique), user, status

---

#### 14. LedgerEntry (Financial Ledger)

```javascript
{
  _id: ObjectId,
  account: ObjectId,
  accountModel: String (ref: User/Recycler/Admin),

  transactionType: String (e.g., "eco_point_award", "wallet_debit"),
  amount: Number,
  ecoPoints: Number,

  description: String,
  relatedEntity: ObjectId,
  relatedModel: String,

  createdAt: Date,
  updatedAt: Date,
}
```

---

#### 15. WithdrawalRequest

```javascript
{
  _id: ObjectId,
  recycler: ObjectId (ref: Recycler),

  amount: Number (required),
  status: Enum ["pending", "approved", "processing", "completed", "rejected"],

  bankAccount: {
    accountNumber: String,
    ifscCode: String,
    holderName: String,
  },

  appliedAt: Date (default: now),
  approvedAt: Date,
  processedAt: Date,
  rejectionReason: String,

  createdAt: Date,
  updatedAt: Date,
}
```

---

#### 16. RecyclerPayment (Recycler Compensation)

```javascript
{
  _id: ObjectId,
  recycler: ObjectId (ref: Recycler),
  shipment: ObjectId (ref: Shipment),

  amount: Number,
  paymentStatus: Enum ["pending", "paid"],
  paidAt: Date,

  createdAt: Date,
  updatedAt: Date,
}
```

---

### REWARDS & MEMBERSHIP

#### 17. MembershipPlan

```javascript
{
  _id: ObjectId,
  name: Enum ["silver", "gold", "platinum"] (unique, required, indexed),
  price: Number (required, min: 0),
  durationDays: Number (required, min: 1),
  benefits: [String] (e.g., ["5x eco points", "exclusive products"]),
  isActive: Boolean (default: true, indexed),

  createdAt: Date,
  updatedAt: Date,
}
```

---

#### 18. Reward (Reward Catalog)

```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  pointsRequired: Number (required, min: 0),

  category: Enum ["coupon", "cashback", "gift", "donation"] (required),
  image: String (Cloudinary URL),

  isActive: Boolean (default: true, indexed),
  stock: Number (required, min: 0),

  createdAt: Date,
  updatedAt: Date,
}
```

---

#### 19. RewardRedemption

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  reward: ObjectId (ref: Reward),

  pointsSpent: Number,
  status: Enum ["pending", "completed", "cancelled"],

  redeemedAt: Date,
  claimedAt: Date,

  createdAt: Date,
  updatedAt: Date,
}
```

---

### TRIAL & SUBMISSIONS

#### 20. TrialSubmission

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),

  trialDay: Number (1-5),
  submissionType: String (e.g., "waste_photo", "eco_action"),
  description: String,
  proofImageUrl: String,

  status: Enum ["submitted", "approved", "rejected"],
  approvedAt: Date,

  createdAt: Date,
  updatedAt: Date,
}
```

---

#### 21. Proof (Photo Proof)

```javascript
{
  _id: ObjectId,
  deliveryAgent: ObjectId (ref: DeliveryAgent),
  pickup: ObjectId (ref: Pickup),

  imageUrl: String (Cloudinary URL),
  proofType: String (e.g., "before", "after"),

  latitude: Number,
  longitude: Number,
  capturedAt: Date,
  deviceInfo: String,

  createdAt: Date,
  updatedAt: Date,
}
```

---

### TRACKING & NOTIFICATIONS

#### 22. LocationHistory (GPS Tracking)

```javascript
{
  _id: ObjectId,
  agent: ObjectId (ref: DeliveryAgent),

  latitude: Number,
  longitude: Number,
  accuracy: Number,

  createdAt: Date,
}
```

---

#### 23. Notification

```javascript
{
  _id: ObjectId,
  recipient: ObjectId (ref: User),
  recipientModel: String,

  type: String (e.g., "pickup_assigned", "order_shipped"),
  title: String,
  message: String,

  isRead: Boolean (default: false),
  readAt: Date,

  relatedEntity: ObjectId,
  relatedModel: String,

  createdAt: Date,
}
```

---

### SYSTEM & AUDIT

#### 24. AuditLog

```javascript
{
  _id: ObjectId,
  action: String (required, indexed),
  user: ObjectId (ref: User),

  details: Mixed,
  ipAddress: String,

  createdAt: Date,
}
```

**Actions**: login_otp, register_user, create_pickup, verify_pickup, etc.

---

#### 25. Otp

```javascript
{
  _id: ObjectId,
  phoneNumber: String (required, indexed),
  otp: String (required),
  attempts: Number (default: 0, max: 3),

  createdAt: Date (TTL index: expire after 10 minutes),
}
```

---

#### 26. PlatformSettings

```javascript
{
  _id: ObjectId,
  key: String (unique),
  value: Mixed,

  updatedBy: ObjectId,
  updatedAt: Date,
}

// Examples:
// { key: "eco_point_multiplier", value: 1.5 }
// { key: "membership_discount", value: 0.2 }
```

---

#### 27. RecyclerSchedule

```javascript
{
  _id: ObjectId,
  recycler: ObjectId (ref: Recycler),

  dayOfWeek: Number (0-6),
  startTime: String (HH:mm),
  endTime: String (HH:mm),

  isActive: Boolean (default: true),

  createdAt: Date,
  updatedAt: Date,
}
```

---

#### 28. ProcessedWebhook

```javascript
{
  _id: ObjectId,
  webhookId: String (unique),
  source: String (e.g., "razorpay"),

  status: String (processed, failed),
  processedAt: Date,

  createdAt: Date,
}
```

---

#### 29. TransactionLedger

```javascript
{
  _id: ObjectId,
  account: ObjectId,
  accountModel: String,

  transactionType: String,
  amount: Number,
  balanceBefore: Number,
  balanceAfter: Number,

  reference: ObjectId,
  description: String,

  createdAt: Date,
}
```

---

## Data Ownership & Access Patterns

### User Data Isolation

- Users see only their own pickups, orders, wallets
- Supervisors see pickups assigned to their region
- Recyclers see only shipments assigned to them
- Admins see all data

### Financial Data Audit Trail

- Every wallet transaction recorded in LedgerEntry
- Withdrawal requests tracked separately
- Payment records tied to Razorpay orders

### Waste Tracking Lineage

- Pickup → Shipment → Product (with material traceability)
- Each material in product linked to source pickups
- Complete chain-of-custody for compliance

---

## Data Lifecycle

### User Account Lifecycle

```
NEW REGISTRATION
    ↓ (OTP verified, password set)
ACTIVE (trial)
    ↓ (5-day trial completes)
ACTIVE (member) [if payment made]
    ↓ (optional)
SUSPENDED [if violates terms]
```

### Pickup Lifecycle

```
PENDING → APPROVED → ASSIGNED → ACCEPTED → IN_PROGRESS
                ↓                                    ↓
           REJECTED                           COMPLETED
                                                    ↓
                                              VERIFIED ✓
```

### Trial Submission Lifecycle

```
SUBMITTED → APPROVED ✓
         ↓
      REJECTED ✗
```

---

## Data Validation Rules

### User Model

- **Phone**: E.164 format (+91XXXXXXXXXX for India)
- **Email**: Valid RFC 5322 format
- **Password**: Minimum 6 characters (hashed before storage)
- **EcoPoints**: Non-negative integer

### Pickup Model

- **EstimatedWeight**: Between 0.1 and 500 kg
- **ScheduledDate**: Must be future date
- **WasteType**: Only enum values allowed
- **Status**: Only valid state transitions allowed

### Payment Model

- **Amount**: Positive number, in INR
- **RazorpayOrderId**: Unique, verified with Razorpay

---

## Indexes for Performance

### Frequently Queried

```javascript
User: (email, phoneNumber, role, membershipStatus);
Pickup: (user, status, scheduledDate, createdAt);
Shipment: (recycler, status);
Payment: (razorpayOrderId, user, status);
Wallet: {
  (ownerId, ownerModel);
}
compound;
```

### Sorting & Filtering

```javascript
CreatedAt descending: Pickup, Order, Notification
Status queries: Pickup, Shipment, Payment
User lookups: User, Recycler, DeliveryAgent
```

---

## Soft Deletes & Data Archival

**Not Currently Implemented** - Could add:

- `deletedAt: Date` field to soft-delete records
- Audit trail preservation for deleted users
- Data export before permanent deletion

---

## Database Migrations Strategy

**Current State**: Schema defined in Mongoose models
**Migration Tool**: None (manual process)
**Future**: Consider Mongoose migration tool for schema changes

---

## Backup & Recovery

**MongoDB Atlas**: Automatic daily backups
**Retention**: 30-day backup window
**Recovery**: Point-in-time restore available

---

## Conclusion

The EcoXchange database is well-structured with clear relationships, comprehensive auditing, and strong data isolation for security. The 29-model structure supports complex waste management workflows while maintaining financial transaction integrity and compliance.
