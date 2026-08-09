# Backend Architecture - EcoXchange

## Overview

The EcoXchange backend is a Node.js/Express REST API that serves the frontend and handles all business logic, database operations, payment processing, and real-time notifications. It uses MongoDB via Mongoose for data persistence and Socket.IO for push notifications.

---

## Server Architecture

### Entry Point

**server.js** - Initializes HTTP server with Socket.IO:

```javascript
const http = require("http");
const { app } = require("./app");
const { initSocket } = require("./config/socket");

// 1. Connect to MongoDB
await connectDB();

// 2. Create HTTP server with Express app
const server = http.createServer(app);

// 3. Initialize Socket.IO on HTTP server
const io = initSocket(server);
app.set("io", io);

// 4. Start listening
server.listen(PORT);
```

### Express App Setup

**app.js** - Middleware stack and route mounting:

```javascript
// Security & Parsing
app.use(helmet());                          // Security headers
app.use(mongoSanitize());                   // Prevent injection
app.use(compression());                     // Response compression
app.use(express.json());                    // JSON parser
app.use(express.urlencoded());              // URL-encoded parser

// CORS - Allow frontend origin
app.use(cors({
  origin: [process.env.CLIENT_URL, "http://localhost:3000"],
  credentials: true,
}));

// Rate Limiting
app.use(rateLimit(...));                    // 500 req/15min
app.use("/api/ai/chat", strictLimiter);    // 100 req/15min
app.use("/api/payments/*", strictLimiter);
app.use("/api/shipments/:id/confirm-receipt", strictLimiter);

// Routes (31 route groups)
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
// ... more routes

// Error handling
app.use((req, res) => res.status(404).json(...));  // 404
app.use(errorMiddleware);                          // Global error handler
```

---

## Middleware Stack

### Authentication Middleware

**guards.js** - JWT verification and role checking:

```javascript
// protect middleware: validates Bearer token
const protect = async (req, res, next) => {
  // 1. Extract token from "Bearer <token>" header
  // 2. Verify JWT signature with JWT_SECRET
  // 3. Load user from database by ID + model name
  // 4. Check if account is suspended
  // 5. Attach user to req.user and modelName to req.modelName
  req.user = user;
  req.modelName = modelName;
  next();
};

// authorize middleware: restricts to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};

// membershipGuard: restricts to membership statuses
const membershipGuard = (...statuses) => {
  return (req, res, next) => {
    if (!statuses.includes(req.user.membershipStatus)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};
```

### Authorization Middleware

**permissionMiddleware.js**:

```javascript
const canManageUser = () => {
  return async (req, res, next) => {
    // 1. Load target user
    // 2. Check if requester is admin OR has hierarchy to manage target
    // 3. Attach target user to req.targetUser
    req.targetUser = targetUser;
    next();
  };
};
```

### Error Middleware

**errorMiddleware.js** - Global error handler:

```javascript
const errorMiddleware = (err, req, res, next) => {
  const statusCode = res.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
```

---

## Route Architecture

### Route Groups (23 API endpoints)

| Endpoint         | Purpose                  | Protected | Controller                             |
| ---------------- | ------------------------ | --------- | -------------------------------------- |
| `/auth`          | OTP, registration, login | Partial   | authController, firebaseAuthController |
| `/users`         | Profile, settings        | Yes       | userController                         |
| `/admin`         | User management, audit   | Yes       | adminController                        |
| `/pickups`       | Waste submissions        | Yes       | pickupController                       |
| `/recycler`      | Recycler operations      | Yes       | recycleController                      |
| `/shipments`     | Shipment tracking        | Yes       | shipmentController                     |
| `/payments`      | Razorpay integration     | Yes       | paymentService                         |
| `/membership`    | Plans, upgrades          | Yes       | membershipController                   |
| `/rewards`       | Catalog, redemption      | Yes       | rewardController                       |
| `/wallet`        | Balance, transactions    | Yes       | walletController                       |
| `/dashboard`     | Analytics, metrics       | Yes       | dashboardController                    |
| `/ai`            | Chat, segregation        | Yes       | aiChatController                       |
| `/marketplace`   | Products, orders         | Yes       | marketplaceController                  |
| `/notifications` | Push notifications       | Yes       | notificationController                 |
| `/orders`        | Order management         | Yes       | orderController                        |
| `/cart`          | Shopping cart            | Yes       | cartController                         |
| `/analytics`     | Reports, stats           | Yes       | analyticsController                    |
| `/schedules`     | Recycler schedules       | Yes       | scheduleController                     |
| `/trial`         | Trial workflows          | Partial   | trialController                        |
| `/waste`         | Waste tracking           | Yes       | wasteController                        |
| `/revenue`       | Revenue tracking         | Yes       | revenueController                      |
| `/delivery`      | Delivery agent ops       | Yes       | deliveryRouter                         |
| `/health`        | Health check             | No        | healthRouter                           |

### Sample Route Handler

```javascript
// authRoutes.js
router.post("/send-otp", sendOtp); // No auth
router.post("/verify-otp", verifyOtp); // No auth
router.post("/register", registerUser); // No auth
router.post("/firebase", loginWithFirebase); // No auth
router.get("/me", protect, getMe); // Protected
router.put("/profile", protect, updateProfile); // Protected
```

---

## Controller Pattern

### Controller Structure

Each controller follows a standard pattern:

```javascript
// authController.js
const sendOtp = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    // Validation
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: "..." });
    }

    // Rate limiting check (max 5 OTPs/hour, 60-second cooldown)
    const recentOtps = await Otp.countDocuments({
      phoneNumber,
      createdAt: { $gte: oneHourAgo },
    });
    if (recentOtps >= 5) {
      return res
        .status(429)
        .json({ success: false, message: "Too many requests" });
    }

    // Generate OTP
    const otpCode =
      process.env.OTP_BYPASS === "true"
        ? process.env.DEMO_OTP
        : crypto.randomInt(100000, 999999).toString();

    // Save to database
    await Otp.create({ phoneNumber, otp: otpCode });

    // Send via SMS (placeholder - would integrate with SMS gateway)
    console.log(`[OTP] Sent to ${phoneNumber}: ${otpCode}`);

    // Return response
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp: process.env.OTP_BYPASS === "true" ? otpCode : undefined,
    });
  } catch (err) {
    return next(err);
  }
};
```

### Controller Error Handling Pattern

- Try-catch wraps all async operations
- Validation errors return 400
- Authentication errors return 401
- Authorization errors return 403
- Business logic errors return 409
- Unexpected errors caught by global error handler

---

## Service Layer

### Available Services

| Service                    | Purpose               | Key Functions                         |
| -------------------------- | --------------------- | ------------------------------------- |
| **walletService.js**       | Financial operations  | `ensureWallet(ownerId, ownerModel)`   |
| **paymentService.js**      | Razorpay integration  | Payment order creation & verification |
| **notificationService.js** | Notification handling | Sending push notifications            |

### walletService Pattern

```javascript
async function ensureWallet(ownerId, ownerModel) {
  // Check if wallet exists for owner
  let w = await Wallet.findOne({ ownerId, ownerModel });

  // Create if not exists
  if (!w) {
    w = await Wallet.create({
      ownerId,
      ownerModel,
      ecoPointsBalance: ownerModel === "User" ? 120 : 0,
    });
  }

  return w;
}

// Usage: Create wallet for new user on login
const wallet = await ensureWallet(user._id, "User");
```

---

## Data Layer (Models)

### Model Categories

#### **User Models** (5)

- `User.js` - Citizen/member
- `Recycler.js` - Recycling facility
- `DeliveryAgent.js` - Pickup coordinator
- `Supervisor.js` - Verification authority
- `Admin.js` - Platform admin

#### **Transaction Models** (8)

- `Payment.js` - Razorpay payment records
- `Order.js` - Marketplace orders
- `Cart.js` - Shopping carts
- `Wallet.js` - Financial wallets
- `LedgerEntry.js` - Ledger entries
- `TransactionLedger.js` - Transaction log
- `RecyclerPayment.js` - Recycler payouts
- `WithdrawalRequest.js` - Withdrawal requests

#### **Operational Models** (9)

- `Pickup.js` - Waste submissions
- `Shipment.js` - Waste transportation
- `WasteSubmission.js` - Waste tracking
- `Product.js` - Recycled goods
- `RecyclerSchedule.js` - Recurring pickups
- `Proof.js` - Photo proofs
- `LocationHistory.js` - GPS tracking
- `TrialSubmission.js` - Trial submissions
- `ProcessedWebhook.js` - Webhook tracking

#### **Catalog Models** (3)

- `MembershipPlan.js` - Membership tiers
- `Reward.js` - Reward catalog
- `RewardRedemption.js` - Claimed rewards

#### **System Models** (4)

- `Notification.js` - Push notifications
- `AuditLog.js` - Audit trail
- `Otp.js` - OTP records
- `PlatformSettings.js` - System configuration

### Example Model: User

```javascript
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phoneNumber: { type: String, required: true, unique: true, index: true },
    firebaseUid: { type: String, default: "", sparse: true, index: true },
    role: {
      type: String,
      enum: ["citizen", "recycler", "supervisor", "admin"],
      default: "citizen",
    },
    ecoPoints: { type: Number, default: 0 },
    membershipStatus: {
      type: String,
      enum: ["trial", "member"],
      default: "trial",
    },
    isSuspended: { type: Boolean, default: false },
    // ... more fields
  },
  { timestamps: true },
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Exclude password from JSON responses
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});
```

---

## Authentication Flows

### OTP-Based Registration

```
1. User calls POST /auth/send-otp { phoneNumber }
   ├─ Check rate limit (5 per hour, 60s cooldown)
   ├─ Generate OTP: DEMO_OTP or random 6 digits
   ├─ Save to Otp collection
   └─ Return OTP (only if OTP_BYPASS enabled)

2. User receives OTP via SMS

3. User calls POST /auth/verify-otp { phoneNumber, otp }
   ├─ Find latest OTP record
   ├─ Check attempt limit (max 3 attempts)
   ├─ Validate OTP matches
   ├─ Check if account exists (by phone)
   ├─ If new: return { isNewUser: true }
   └─ If existing: return { token, user, modelName }

4. If new user: POST /auth/register { phone, email, password, name }
   ├─ Validate all required fields
   ├─ Check email not in use
   ├─ Hash password with bcryptjs
   ├─ Create User document
   ├─ Create Wallet with 120 initial eco-points
   └─ Return token
```

### Email/Password Login

```
1. User calls POST /auth/login { email, password }
   ├─ Find user by email
   ├─ Compare password hash
   ├─ Check not suspended
   ├─ Generate JWT token
   └─ Return { token, user, modelName }

2. Frontend stores token in Zustand + localStorage
3. Subsequent requests include token in Authorization header
```

### Firebase Phone Auth

```
1. Frontend calls POST /auth/firebase { idToken }
   ├─ Backend verifies ID token with Firebase Admin SDK
   ├─ Extract phone from decoded token
   ├─ Find account by phone (check all user models)
   ├─ Create or update firebaseUid
   └─ Return { token, user, wallet, modelName }
```

### Token Generation

```javascript
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      model: user.constructor.modelName, // User, Recycler, etc
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};
```

---

## Business Logic Flows

### Waste Pickup Workflow

```
1. Citizen: POST /pickups { wasteType, weight, address, scheduledDate }
   ├─ Create Pickup with status: "pending"
   ├─ Award eco-points for submission
   └─ Create notification

2. Supervisor: PATCH /pickups/:id { status: "approved" }
   ├─ Validate pickup
   ├─ Assign delivery agent
   └─ Update status → "assigned"

3. DeliveryAgent: PATCH /pickups/:id/accept
   ├─ Check assignment to this agent
   ├─ Update status → "accepted"

4. DeliveryAgent: POST /pickups/:id/complete { actualWeight, proofImage }
   ├─ Validate actual weight
   ├─ Upload proof to Cloudinary
   ├─ Update status → "completed"
   ├─ Award eco-points
   └─ Create shipment for recycler

5. Supervisor: PATCH /pickups/:id/verify { verified: true }
   ├─ Validate waste quality
   ├─ Update status → "verified"
   └─ Finalize eco-points
```

### Marketplace Order Workflow

```
1. Citizen: POST /cart { productId, quantity }
   ├─ Add to shopping cart

2. Citizen: POST /orders { items }
   ├─ Create Order with status: "unpaid"
   ├─ Create Razorpay order

3. Razorpay: POST /payments/webhook
   ├─ Verify webhook signature
   ├─ Update Payment status → "paid"
   ├─ Update Order status → "processing"
   └─ Emit Socket.IO notification

4. Recycler/Admin: PATCH /orders/:id { status: "shipped" }
   ├─ Create Shipment
   ├─ Emit notification to buyer

5. Citizen: PATCH /orders/:id/confirm-delivery
   ├─ Update Order status → "delivered"
   ├─ Deduct coins from wallet
   └─ Award seller commission
```

### Membership Upgrade Workflow

```
1. User: POST /membership/upgrade { planName }
   ├─ Create Razorpay order for plan price
   ├─ Return order details

2. Frontend: Display Razorpay checkout

3. User: Enters card details (handled by Razorpay)

4. Razorpay: Webhook POST /payments/webhook
   ├─ Verify signature
   ├─ Update Payment status
   ├─ Create membership record
   ├─ Update User membershipStatus → "member"
   ├─ Emit notification
   └─ Grant member-only features
```

---

## Payment Integration (Razorpay)

### Payment Flow

```javascript
// 1. Create Order
const order = await razorpay.orders.create({
  amount: price * 100, // Razorpay uses paise
  currency: "INR",
  receipt: `receipt_${Date.now()}`,
  notes: { userId, planName },
});

// 2. Store Payment record (status: "created")
const payment = await Payment.create({
  user: userId,
  membershipPlan: planId,
  razorpayOrderId: order.id,
  amount: price,
  status: "created",
});

// 3. Frontend initializes Razorpay checkout
const razorpayCheckout = new window.Razorpay({
  key: RAZORPAY_KEY_ID,
  order_id: order.id,
  handler: function (response) {
    // 4. Frontend calls verify endpoint with payment details
    axios.post("/payments/verify", {
      razorpayPaymentId: response.razorpay_payment_id,
      razorpayOrderId: response.razorpay_order_id,
      razorpaySignature: response.razorpay_signature,
    });
  },
});

// 5. Backend verifies signature
const isValid = razorpay.utils.validateWebhookSignature({
  body: JSON.stringify(webhookData),
  signature: razorpaySignature,
  key: RAZORPAY_KEY_SECRET,
});

// 6. Update Payment status → "paid"
// 7. Emit notification
```

---

## Real-Time Architecture (Socket.IO)

### Socket Server Setup

```javascript
const { Server } = require("socket.io");

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Client joins room with their user ID
    socket.on("join", (userId) => {
      if (!userId) return;
      socket.join(String(userId));
    });
  });

  return io;
};
```

### Broadcasting Notifications

```javascript
// In any controller after an action
const io = req.app.get("io");

io.to(userId).emit("notification", {
  title: "Pickup Complete",
  message: "Your waste has been picked up successfully",
});

// Broadcast to multiple recipients (e.g., all agents)
agents.forEach((agent) => {
  io.to(agent._id.toString()).emit("notification", { ... });
});
```

### Notification Types

1. **Pickup Status**: pending → assigned → completed → verified
2. **Order Updates**: order created, payment received, item shipped
3. **Admin Alerts**: new user, payment failed, agent offline
4. **Rewards**: points earned, reward redeemed
5. **System Messages**: scheduled maintenance, announcements

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "modelName": "User"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Invalid OTP",
  "stack": "Error: Invalid OTP at verifyOtp (development only)"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

---

## Database Indexes

### User Model Indexes

```javascript
email: unique;
phoneNumber: (unique, index);
role: index;
membershipStatus: index;
```

### Pickup Model Indexes

```javascript
user: index;
status: index;
scheduledDate: index;
createdAt: descending;
```

### Payment Model Indexes

```javascript
razorpayOrderId: (unique, index);
user: index;
status: index;
```

### Wallet Model Indexes

```javascript
{ ownerId: 1, ownerModel: 1 }: unique compound index
```

---

## Configuration Files

### Database Connection

**config/db.js**:

```javascript
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  await mongoose.connect(uri);
  console.log("MongoDB connected");
};
```

### Firebase Admin

**config/firebaseAdmin.js**:

```javascript
function initFirebaseAdmin() {
  if (admin.apps.length) return admin;

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({ credential: admin.credential.cert(cred) });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }
  } catch (e) {
    console.warn("[firebase-admin] init skipped:", e.message);
    return null;
  }

  return admin;
}
```

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Load demo data
npm run seed

# Start server
npm run dev    # Runs on :5000 with nodemon

# Production start
npm start
```

### Seeding Demo Data

**seeds/seedEcoXchangeDemo.js** creates:

- Demo users with different roles
- Sample pickups & shipments
- Marketplace products
- Membership plans
- Rewards & wallet balances

---

## Security Best Practices

1. **Password Hashing**: bcryptjs with 10 salt rounds
2. **JWT Secrets**: Long, random JWT_SECRET
3. **CORS**: Restricted to frontend origin only
4. **Rate Limiting**: Global & endpoint-specific
5. **Input Validation**: express-validator on all inputs
6. **SQL Injection Prevention**: Mongoose sanitization
7. **XSS Prevention**: JSON responses (not HTML)
8. **Helmet Security**: HSTS, CSP, X-Frame-Options, etc
9. **Suspended Accounts**: Checked on every protected request
10. **Audit Logging**: Actions logged for compliance

---

## Performance Considerations

1. **Database Indexing**: Indexes on frequently queried fields
2. **Connection Pooling**: Mongoose manages connection pool
3. **Response Compression**: gzip compression enabled
4. **Rate Limiting**: Prevents abuse and DDoS
5. **Caching**: Client-side caching via TanStack Query
6. **Query Optimization**: Select only needed fields
7. **Pagination**: Limit results for large datasets

---

## Monitoring & Logging

1. **Morgan**: HTTP request/response logging
2. **Console Logging**: Important events (OTP, payments)
3. **Error Stack Traces**: In development only
4. **Audit Logs**: User actions stored in AuditLog collection
5. **Webhook Logging**: Payment callbacks logged

---

## Conclusion

The EcoXchange backend is a robust, secure, and scalable API that handles complex waste management workflows, financial transactions, and real-time communications. It follows industry best practices for error handling, authentication, and data validation, making it production-ready and maintainable.
