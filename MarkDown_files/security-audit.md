# Security Audit - EcoXchange

## Executive Summary

EcoXchange implements a comprehensive security architecture with Firebase phone OTP authentication, JWT-based authorization, role-based access control (RBAC), and payment security via Razorpay. However, several areas require attention for production deployment.

**Risk Level: MEDIUM** (with recommendations for HIGH security)

---

## Authentication Security

### 1. Firebase Phone OTP Flow ✅

**Implemented Correctly**:

- Firebase Admin SDK verifies ID tokens server-side
- Phone number extracted from Firebase-signed token
- Backend-only token validation (no client-side verification)
- Supports both Firebase auth and custom OTP backend

**Code**:

```javascript
// firebaseAuthController.js
const decoded = await verifyIdTokenSafe(req.body.idToken);
firebaseUid = decoded.uid;
phone = normalizePhone(decoded.phone_number || decoded.phone || "");
```

**Strengths**:

- Leverages Firebase's verified infrastructure
- Phone number trusted source
- Protected against token forgery

**Risks**: None identified

---

### 2. Backend OTP Flow ⚠️

**Implementation**:

```javascript
// authController.js - sendOtp
const generateOtp = () => {
  return process.env.OTP_BYPASS === "true"
    ? process.env.DEMO_OTP || "123456"
    : crypto.randomInt(100000, 999999).toString();
};
```

**Rate Limiting** ✅:

- Max 5 OTP requests per hour
- 60-second cooldown between requests
- Max 3 verification attempts before reset

**Verification Limits** ⚠️:

```javascript
if (otpRecord.attempts >= 3) {
  return res.status(400).json({
    success: false,
    message: "Maximum verification attempts reached",
  });
}
```

**Issues**:

- ✅ OTP stored in database (correct)
- ✅ Rate limiting implemented (correct)
- ⚠️ **Missing**: OTP not stored hashed (plaintext in DB)
- ⚠️ **Missing**: No SMS gateway integrated (console.log only)
- ⚠️ **Demo Mode Risk**: `OTP_BYPASS=true` exposes OTP in API response

**Recommendations**:

1. Hash OTP before storage: `const hashedOtp = await bcrypt.hash(otp, 10)`
2. Integrate with SMS provider (Twilio, AWS SNS)
3. **NEVER** enable OTP_BYPASS in production
4. Add audit log for OTP requests

---

### 3. Password Hashing ✅

**Implementation**:

```javascript
// User.js
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**Strengths**:

- 10 salt rounds (strong)
- Only hashed when modified
- Excluded from JSON responses

**Verification**:

```javascript
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
```

**Risk**: None identified ✅

---

### 4. JWT Token Generation ✅

**Implementation**:

```javascript
// utils/generateToken.js
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

**Strengths**:

- 7-day expiry (reasonable)
- Contains role and model name
- Uses environment variable secret

**Issues**:

- ⚠️ **No Refresh Tokens**: Sessions can't be revoked early
- ⚠️ **No Token Blacklist**: Compromised tokens remain valid
- ⚠️ **No Sliding Window**: Token expires after 7 days regardless of activity

**Recommendations**:

1. Implement refresh token with shorter main token (15 min main, 7d refresh)
2. Add token blacklist for logout/revocation
3. Implement sliding window (reset expiry on use)
4. Use strong JWT_SECRET (minimum 256 bits)

---

### 5. Token Verification ✅

**Implementation**:

```javascript
// middleware/guards.js - protect
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing token" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Load user from database (verify not deleted/suspended)
  const user = await findUserById(decoded.id, decoded.model);

  if (user.isSuspended) {
    return res
      .status(403)
      .json({ success: false, message: "Account suspended" });
  }

  req.user = user;
  req.modelName = decoded.model;
  next();
};
```

**Strengths**:

- Verifies token signature
- Reloads user (detects deletions/suspensions)
- Checks suspension status
- Returns 401 for invalid tokens

**Risk**: None identified ✅

---

## Authorization Security

### 1. Role-Based Access Control (RBAC) ✅

**Role Hierarchy**:

```
ADMIN
  ├── Can manage all users/resources
  │
SUPERVISOR
  ├── Can verify pickups
  ├── Can approve recyclers
  ├── Can dispatch shipments
  │
DELIVERY_AGENT / RECYCLER
  ├── Can view assigned tasks
  ├── Can update own status
  │
MEMBER / TRIAL_MEMBER
  ├── Can view own pickups
  ├── Can place orders
  ├── Can view own wallet
```

**Implementation**:

```javascript
// middleware/guards.js
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};

// Usage:
router.get("/users", protect, authorize("admin"), getAllUsers);
```

**Strengths**:

- Clear role definitions
- Route-level enforcement
- Role aliases supported (citizen = member)

**Issues**:

- ⚠️ **Incomplete Route Protection**: Not all routes have role checks
- ⚠️ **Missing Fine-Grained Permissions**: Role only, no permission flags

**Recommendations**:

1. Add permission-based middleware (not just role)
2. Audit all routes for proper authorization
3. Implement ACL (Access Control List) for granular control

---

### 2. Membership Guard ✅

**Implementation**:

```javascript
const membershipGuard = (...statuses) => {
  return (req, res, next) => {
    if (!statuses.includes(req.user.membershipStatus)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};

// Usage: Only members can access marketplace
router.post(
  "/marketplace/order",
  protect,
  membershipGuard("member"),
  placeOrder,
);
```

**Strengths**: Restricts features by subscription tier

**Risk**: None identified ✅

---

### 3. Data Isolation ✅

**Example: User can only view own wallet**:

```javascript
const getMyWallet = async (req, res, next) => {
  const wallet = await Wallet.findOne({
    ownerId: req.user._id,
    ownerModel: req.modelName,
  });
  res.json({ success: true, data: wallet });
};
```

**Strengths**:

- Uses req.user.\_id (authenticated user)
- Never trusts client-provided user ID

**Issues**:

- ⚠️ **Cross-Model Lookups**: `findAccountByPhone` searches all models - potential race condition

**Recommendations**:

1. Specify model explicitly when searching
2. Use database transactions for multi-model operations

---

## API Security

### 1. CORS Configuration ✅

**Implementation**:

```javascript
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.CLIENT_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ].filter(Boolean);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

**Strengths**: Restricts to frontend origins only

**Issues**:

- ⚠️ **Localhost Hardcoded**: Should be removed before production
- ⚠️ **Missing Preflight Cache**: Add `maxAge` header

**Recommendations**:

```javascript
cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
});
```

---

### 2. Rate Limiting ✅

**Global Limiter**:

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // 500 requests
});
app.use(limiter);
```

**Strict Limiter** (for sensitive endpoints):

```javascript
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { success: false, message: "Too many requests" },
});

app.use("/api/ai/chat", strictLimiter);
app.use("/api/payments/create-order", strictLimiter);
app.use("/api/payments/verify", strictLimiter);
app.use("/api/shipments/:id/confirm-receipt", strictLimiter);
```

**Strengths**: Prevents brute-force and DDoS

**Issues**:

- ⚠️ **OTP Rate Limit**: Also implemented at controller level (double protection - acceptable)
- ⚠️ **Missing**: No per-IP identification (uses default IP detection)

**Recommendations**:

1. Configure rate limiter to trust proxy: `limiter.options.skip = req.ip === process.env.ADMIN_IP`
2. Monitor and adjust limits based on usage patterns

---

### 3. Input Validation ⚠️

**Current State**: Minimal validation

**Example - sendOtp**:

```javascript
const { phoneNumber } = req.body;
if (!phoneNumber) {
  return res.status(400).json({ success: false, message: "Phone required" });
}
```

**Issues**:

- ⚠️ **No express-validator used**: Manual validation only
- ⚠️ **Missing Format Validation**: Phone format not validated before rate limit check
- ⚠️ **No Sanitization**: Input not sanitized

**Recommendations**:

```javascript
// Use express-validator
const { body, validationResult } = require("express-validator");

router.post(
  "/send-otp",
  body("phoneNumber")
    .trim()
    .matches(/^\d{7,15}$/)
    .withMessage("Invalid phone format"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  sendOtp,
);
```

---

### 4. Output Encoding ✅

**Implementation**: All responses are JSON (automatically escaped)

**Password Exclusion**:

```javascript
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});
```

**Strengths**: Prevents sensitive data exposure

**Risk**: None identified ✅

---

## Data Protection

### 1. MongoDB Sanitization ✅

**Implementation**:

```javascript
app.use(mongoSanitize());
```

**Protection**: Prevents NoSQL injection

**Example Prevention**:

```javascript
// Prevents: { email: { $ne: null } }
const email = mongoSanitize({ replaceWith: "_" })(req.body.email);
```

**Risk**: None identified ✅

---

### 2. Helmet Security Headers ✅

**Implementation**:

```javascript
app.use(helmet());
```

**Headers Added**:

- X-Content-Type-Options: nosniff (prevents MIME sniffing)
- X-Frame-Options: DENY (prevents clickjacking)
- Strict-Transport-Security: HSTS (forces HTTPS)
- Content-Security-Policy: Restricts external resources
- X-XSS-Protection: Enables XSS filter

**Risk**: None identified ✅

---

### 3. Sensitive Data in Responses ⚠️

**Good Practice Observed**:

- Passwords excluded from all responses ✅
- firebaseUid not sent to client ✅
- License numbers protected ✅

**Potential Issue**:

- ⚠️ **Full User Objects**: Complete user records sent (could expose internal fields)

**Recommendation**:

```javascript
// Create user DTO (Data Transfer Object)
const userDTO = {
  id: user._id,
  name: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  ecoPoints: user.ecoPoints,
  // ... only safe fields
};
```

---

### 4. Database Encryption ⚠️

**Current State**: Not implemented

**MongoDB Atlas**: Encryption at rest available but not confirmed enabled

**Recommendations**:

1. Enable MongoDB Atlas encryption at rest
2. Enable TLS for all client connections
3. Implement field-level encryption for sensitive data:
   ```javascript
   // Use mongoose-field-encryption
   const phoneEncrypted = await encrypt(phoneNumber);
   ```

---

## Payment Security

### 1. Razorpay Integration ✅

**Webhook Verification**:

```javascript
const isValid = razorpay.utils.validateWebhookSignature({
  body: JSON.stringify(webhookData),
  signature: webhookSignature,
  key: RAZORPAY_KEY_SECRET,
});
```

**Strengths**:

- Verifies webhook authenticity
- Protects against webhook spoofing
- Uses HMAC-SHA256

**Issues**:

- ⚠️ **Idempotency**: Check for duplicate webhook processing
- ⚠️ **ProcessedWebhook Collection**: Exists but usage not verified

**Recommendations**:

```javascript
// Before processing webhook
const existing = await ProcessedWebhook.findOne({
  webhookId: webhookData.id,
});
if (existing) {
  return res.json({ success: true, message: "Already processed" });
}

// Process webhook...

await ProcessedWebhook.create({
  webhookId: webhookData.id,
  source: "razorpay",
  status: "processed",
  processedAt: new Date(),
});
```

---

### 2. Payment Order Verification ⚠️

**Current Implementation** (inferred):

- Order created with Razorpay
- Client receives order details
- Client completes payment
- Backend receives webhook

**Potential Issues**:

- ⚠️ **Missing Amount Verification**: Amount should be verified server-side before accepting payment
- ⚠️ **No Currency Validation**: Verify currency matches expected

**Recommendations**:

```javascript
// After payment verified
const expectedAmount = plan.price * 100; // Razorpay uses paise
if (webhookData.amount !== expectedAmount) {
  throw new Error("Amount mismatch - potential tampering");
}
if (webhookData.currency !== "INR") {
  throw new Error("Unexpected currency");
}
```

---

### 3. PCI Compliance ✅

**Implemented Correctly**:

- No card data stored (Razorpay handles this)
- No card data transmitted through backend
- Razorpay PCI-DSS Level 1 certified

**Risk**: None identified ✅

---

## Firebase Security

### 1. Firebase Client SDK ✅

**Credentials in .env**: Public project credentials (safe)

```
NEXT_PUBLIC_FIREBASE_API_KEY=*** (public, safe)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=***
NEXT_PUBLIC_FIREBASE_PROJECT_ID=***
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=***
```

**Strengths**:

- Uses NEXT*PUBLIC* prefix (correctly public)
- No private keys in frontend

**Risk**: None identified ✅

---

### 2. Firebase Admin SDK ⚠️

**Implementation**:

```javascript
// config/firebaseAdmin.js
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});
```

**Issues**:

- ⚠️ **Private Key in Environment**: Correct storage method, but ensure .env not committed
- ⚠️ **No Key Rotation**: Manual process

**Recommendations**:

1. Use GitHub Secrets for CI/CD (not .env)
2. Implement automatic key rotation policy
3. Monitor Firebase Admin SDK usage
4. Use service account with minimal permissions

---

### 3. Firebase Security Rules ⚠️

**Current State**: Not implemented (backend handles auth)

**Not Critical** since:

- Backend validates all requests
- Razorpay handles payment data
- Database is MongoDB (not Firestore)

**Optional Enhancement**:

- If using Firestore: Implement strong security rules
- If using Cloud Storage: Protect with auth rules

---

## Frontend Security

### 1. Token Storage ✅

**Frontend** (`src/store/useAuthStore.ts`):

```typescript
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      // ...
    }),
    {
      name: "ecoxchange-auth-v2",
    },
  ),
);
```

**Storage Location**: Zustand persist → localStorage

**Issues**:

- ⚠️ **localStorage**: Vulnerable to XSS
- ⚠️ **No HttpOnly Flag**: Backend could force HttpOnly cookies

**Recommendations**:

1. Use httpOnly cookies for token storage (requires backend change)
2. Implement CSRF tokens
3. Set SameSite=Strict

**Current Mitigation**:

- CSP headers prevent most XSS
- Helmet protects headers

---

### 2. API Interceptor ✅

**Token Injection**:

```typescript
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**401 Handling**:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

**Strengths**: Automatic logout on token expiry

**Risk**: None identified ✅

---

### 3. Offline Sync ⚠️

**Implementation** (`src/lib/offlineSync.ts`):

```typescript
export function queueAction(action: Omit<QueuedAction, "id" | "timestamp">) {
  const queue = getOfflineQueue();
  const newAction: QueuedAction = {
    ...action,
    id: `idemp-${Date.now()}-${Math.random().toString(36)}`,
    timestamp: Date.now(),
  };
  queue.push(newAction);
  saveOfflineQueue(queue); // Stores in localStorage
}
```

**Issues**:

- ⚠️ **Sensitive Data in localStorage**: Queued actions stored unencrypted
- ⚠️ **No Conflict Resolution**: If data changes offline, sync could overwrite

**Recommendations**:

1. Encrypt sensitive payloads before storage
2. Implement conflict resolution strategy
3. Add timestamp validation

---

## Third-Party Security

### 1. Cloudinary (Image Upload) ⚠️

**Current Implementation**:

- Direct upload from client/server to Cloudinary
- No URL signing

**Issues**:

- ⚠️ **Public URLs**: Uploaded images publicly accessible
- ⚠️ **No Access Control**: Anyone with URL can view

**Recommendations**:

1. Use authenticated_upload parameter
2. Implement signed URLs for delivery
3. Set expiry on public URLs
4. Use private storage for sensitive proofs

---

### 2. Google OAuth (Potential Feature) ✅

**Implementation Exists**:

```javascript
// config/firebase.js - Google OAuth configured
const firebaseConfig = {
  // ... Firebase config with auth provider
};
```

**Potential Issues**:

- ⚠️ **Not Integrated**: Passport.js set up but not used
- ⚠️ **Missing Callback URL**: Ensure redirect URL matches Firebase config

---

## Audit & Logging

### 1. Audit Logging ⚠️

**Implementation**:

```javascript
// When user logs in via OTP
await AuditLog.create({
  action: "login_otp",
  user: doc._id,
  ipAddress: req.ip,
});
```

**Issues**:

- ⚠️ **Incomplete Coverage**: Only login logged (not all actions)
- ⚠️ **No Retention Policy**: Logs kept indefinitely
- ⚠️ **No Export**: Can't export audit trail for compliance

**Recommendations**:

1. Log all authentication attempts
2. Log sensitive actions (payment, user suspension)
3. Implement 90-day retention policy
4. Create audit export endpoint
5. Monitor for suspicious patterns

---

### 2. Error Logging ⚠️

**Current State**:

```javascript
console.log(`[OTP] Sent to ${phoneNumber}: ${otpCode}`); // Debug logging
```

**Issues**:

- ⚠️ **Logs sent to console**: Not persistent
- ⚠️ **Could contain sensitive data**: OTP logged in plain text
- ⚠️ **No structured logging**: Hard to search/alert

**Recommendations**:

1. Use structured logging (Winston, Bunyan)
2. Never log sensitive data (OTP, passwords)
3. Send logs to external service (CloudWatch, DataDog, Splunk)
4. Set up alerts for errors

---

## Summary of Issues by Severity

### 🔴 CRITICAL

None identified

### 🟠 HIGH (Must Fix Before Production)

1. **OTP Bypass Mode** - Can expose OTPs in API response
2. **Token Blacklist Missing** - No token revocation capability
3. **Input Validation** - Minimal validation (use express-validator)
4. **Audit Logging** - Incomplete coverage of security events

### 🟡 MEDIUM (Should Fix)

1. **OTP Not Hashed** - Plaintext in database
2. **Refreshable Tokens** - No refresh token mechanism
3. **Fine-Grained Permissions** - Only role-based checks
4. **Data Encryption** - Database and transit encryption not confirmed
5. **Frontend Token Storage** - localStorage vulnerable to XSS
6. **Offline Sync Encryption** - Sensitive data unencrypted

### 🟢 LOW (Nice to Have)

1. **Cloudinary URL Signing** - Implement for private images
2. **Structured Logging** - Implement centralized logging
3. **Key Rotation** - Automated Firebase key rotation
4. **CSRF Tokens** - If using cookies (currently not)

---

## Compliance Considerations

### GDPR

- ✅ Can delete user data (implement export/right-to-be-forgotten)
- ⚠️ Need data retention policy
- ⚠️ Need privacy notice in-app

### Data Privacy Act (India)

- ✅ PAN/Aadhaar not stored (only phone/email)
- ⚠️ Need data localization compliance
- ⚠️ Need privacy policy

### Payment Security (PCI-DSS)

- ✅ No card data processed/stored
- ✅ Razorpay handles compliance
- ✅ Third-party verified

---

## Recommendations Priority List

### Phase 1 (Before Production)

1. Disable OTP_BYPASS mode
2. Hash OTP values before storage
3. Integrate SMS gateway (stop console logging)
4. Implement token blacklist/revocation
5. Add comprehensive input validation (express-validator)
6. Expand audit logging

### Phase 2 (Within 3 Months)

1. Implement refresh tokens
2. Add fine-grained permission system
3. Encrypt database (enable MongoDB Atlas encryption)
4. Implement structured logging
5. Frontend token storage: migrate to httpOnly cookies
6. Encrypt offline sync payloads

### Phase 3 (Within 6 Months)

1. Implement Cloudinary URL signing
2. Key rotation automation
3. Security headers audit (OWASP A03:2021)
4. Penetration testing
5. Compliance certification (ISO 27001)

---

## Conclusion

EcoXchange has a solid foundation for security with proper authentication, authorization, and payment integration. The main areas for improvement are:

1. **Token Management**: Implement refresh tokens and revocation
2. **Input Validation**: Comprehensive validation across all endpoints
3. **Audit Logging**: Complete coverage of security events
4. **Data Protection**: Encryption at rest and in transit

With these improvements, EcoXchange will be production-ready for high-security deployments and compliant with major data protection regulations.
