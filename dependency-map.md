# Dependency & Integration Map - EcoXchange

## External Service Dependencies

### 1. Firebase (Authentication & Analytics)

**Type**: SaaS - Authentication Provider
**Endpoints Used**:

- Firebase Authentication Client SDK (frontend)
- Firebase Admin SDK (backend)
- Firebase Analytics (frontend)

**Frontend Integration**:

```typescript
// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const auth = getAuth(initializeApp(firebaseConfig));
```

**Backend Integration**:

```javascript
// src/config/firebaseAdmin.js
const admin = require("firebase-admin");

function initFirebaseAdmin() {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
  return admin;
}

async function verifyIdToken(idToken) {
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded;
}
```

**Data Flow**:

1. Frontend: User initiates phone auth
2. Firebase: Sends SMS OTP
3. User: Enters OTP → Firebase verifies
4. Frontend: Receives ID token from Firebase
5. Frontend: Sends ID token to backend: `POST /api/auth/firebase`
6. Backend: Verifies ID token with Firebase Admin
7. Backend: Returns JWT token + user data
8. Frontend: Uses JWT for subsequent requests

**Failure Mode**: If Firebase is down:

- Phone OTP auth unavailable
- Fallback: Email/password login via backend
- System operational but phone auth disabled

**Account**: `ecoxchange-a7cb8`
**Region**: US
**Pricing**: Pay-as-you-go (authentication included in free tier)

---

### 2. Razorpay (Payment Processing)

**Type**: SaaS - Payment Gateway
**Endpoints Used**:

- `/orders` - Create payment order
- `/webhooks` - Payment status callbacks
- Razorpay Checkout JS (frontend)

**Backend Integration**:

```javascript
// controllers/paymentController.js
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order
const order = await razorpay.orders.create({
  amount: price * 100, // Razorpay uses paise
  currency: "INR",
  receipt: `receipt_${Date.now()}`,
});

// Verify webhook signature
const isValid = razorpay.utils.validateWebhookSignature({
  body: JSON.stringify(body),
  signature: signature,
  key: process.env.RAZORPAY_KEY_SECRET,
});
```

**Frontend Integration**:

```typescript
// app/layout.tsx
<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
```

**Data Flow**:

1. Backend: `POST /api/payments/create-order` → Razorpay creates order
2. Frontend: Receives `order_id`
3. Frontend: Initializes Razorpay Checkout with order_id
4. User: Enters payment details (Razorpay hosted)
5. Razorpay: Processes payment, sends webhook
6. Backend: `POST /api/webhooks/razorpay` - verifies signature
7. Backend: Updates `Payment.status = "paid"`, `Order.paymentStatus = "paid"`
8. Backend: Emits Socket.IO notification to user

**Supported Methods**:

- Credit/Debit Cards
- UPI
- Net Banking
- Wallets
- EMI

**Test Credentials**:

- Key ID: `rzp_test_SoJjAAaWOrRDOf` (from .env.example)
- Sandbox Mode: All test transactions successful

**Failure Mode**:

- If Razorpay down: Payment unavailable, membership upgrades blocked
- Automatic retry: Orders persist, can retry later
- No fallback: No alternative payment method

**Webhook Handling**:

```javascript
// Route: POST /api/webhooks/razorpay
// Headers: X-Razorpay-Signature: hmac-sha256

// Process:
// 1. Verify signature matches
// 2. Check payment_status in webhook
// 3. Update Payment & Order records
// 4. Emit notifications
// 5. Return 200 OK (Razorpay retries if no 200)
```

---

### 3. MongoDB Atlas (Database)

**Type**: DBaaS - Document Database
**Connection**: Mongoose ODM via connection string

**Configuration**:

```javascript
// src/config/db.js
const uri = process.env.MONGODB_URI;
await mongoose.connect(uri);
```

**Connection String Format**:

```
mongodb+srv://user:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Collections**: 29 MongoDB collections
**Backup**: Automatic daily snapshots (30-day window)
**SLA**: 99.9% uptime

**Index Usage**:

```javascript
// Frequently indexed fields
User: { email: 1, phoneNumber: 1, role: 1 }
Pickup: { user: 1, status: 1, createdAt: -1 }
Wallet: { ownerId: 1, ownerModel: 1 } // unique compound
Payment: { razorpayOrderId: 1 }
```

**Failure Mode**:

- Connection timeout: All operations fail
- Automatic retry: Mongoose reconnect every 5 seconds
- Fallback: None - system offline
- Recovery: Manual connection restore, no data loss

---

### 4. Cloudinary (Image Storage)

**Type**: CDN - Image Storage & Delivery
**Integration**: Direct client upload + backend verification

**Configuration**:

```javascript
// Used but not actively integrated
CLOUDINARY_CLOUD_NAME=dlcqussi7
CLOUDINARY_API_KEY=***
CLOUDINARY_API_SECRET=***
```

**Use Cases**:

- User avatars
- Proof images (pickup verification)
- Product images (marketplace)
- Waste submission photos

**Upload Flow**:

1. Frontend/Backend: Upload image file
2. Cloudinary: Returns public URL
3. Database: Store URL reference
4. Frontend: Display via <Image> component

**CDN Serving**:

- Global edge network
- Automatic optimization
- Caching for 1 year

**Failure Mode**:

- If Cloudinary down: Upload fails, but system operational
- Cached images still served from CDN
- Fallback: Use placeholder image

---

### 5. Google Maps API (Location Services)

**Type**: SaaS - Geolocation & Maps
**Frontend Only**:

```typescript
// Environment variable
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIzaSyCDGfkQnI0jcnmySOYSElHMObfVgn - g1d0;
```

**Use Cases**:

- Display pickup location on map
- DeliveryAgent GPS tracking
- Distance calculation
- Geocoding

**Libraries Used**:

- Leaflet (frontend map rendering)
- react-leaflet (React component wrapper)

**Failure Mode**:

- If Maps API down: Map not displayed, but location still shows text
- System operational without maps

---

### 6. Socket.IO (Real-Time Notifications)

**Type**: Protocol - WebSocket Server
**Implementation**: Custom Node.js server

**Backend Setup**:

```javascript
// src/config/socket.js
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
    socket.on("join", (userId) => socket.join(String(userId)));
  });

  return io;
};
```

**Frontend Connection**:

```typescript
// src/lib/socket.ts
import { io } from "socket.io-client";

export const socket = io(process.env.NEXT_PUBLIC_API_URL, {
  autoConnect: false,
  withCredentials: true,
});

// In AuthInitializer component
socket.connect();
socket.emit("join", user.id);
socket.on("notification", (data) => {
  toast.success(data.message);
});
```

**Event Types**:

- `notification`: Generic notification
- `pickup_update`: Pickup status changed
- `order_update`: Order/payment status
- `admin_alert`: Admin notifications

**Failure Mode**:

- If Socket disconnected: User won't receive real-time notifications
- Fallback: Poll API at intervals
- Manual refresh shows latest state

---

## Module Dependency Graph

### Frontend Dependencies

```
src/
├── app/                          # Next.js App Router
│   └── layout.tsx                # Root layout
│       └── AppProviders
│           ├── QueryClientProvider (@tanstack/react-query)
│           ├── ThemeProvider (next-themes)
│           ├── Toaster (react-hot-toast)
│           └── AuthInitializer
│               ├── useAuthStore (zustand)
│               ├── api (axios)
│               ├── firebase (firebase/auth)
│               └── socket (socket.io-client)
│
├── lib/
│   ├── api.ts (axios)            # HTTP client
│   ├── firebase.ts               # Firebase SDK
│   ├── socket.ts                 # Socket.IO client
│   ├── phone.ts                  # Phone normalization
│   ├── offlineSync.ts            # Offline queue
│   └── utils.ts                  # Helper functions
│
├── store/
│   ├── useAuthStore (zustand)    # Auth state + localStorage
│   └── useCartStore (zustand)    # Cart state
│
├── components/
│   ├── ui/                       # Base components (lucide-react, framer-motion)
│   ├── forms/                    # react-hook-form + zod
│   │   └── PickupForm
│   │       ├── react-hook-form
│   │       └── zod (validation)
│   └── eco/
│       └── NotificationBell
│           └── socket listener
```

### Backend Dependencies

```
server/
├── src/app.js                    # Express app
│   ├── helmet                    # Security headers
│   ├── cors                      # CORS middleware
│   ├── express-rate-limit        # Rate limiting
│   ├── express-mongo-sanitize    # Input sanitization
│   ├── compression               # Response compression
│   ├── morgan                    # HTTP logging
│   └── Routes (23 endpoint groups)
│       └── Each route
│           ├── middleware/guards.js (JWT verify)
│           ├── middleware/permissionMiddleware.js (RBAC)
│           └── controllers/
│               └── mongoose models
│
├── src/config/
│   ├── db.js (mongoose)          # MongoDB connection
│   ├── socket.js (socket.io)     # WebSocket server
│   ├── firebaseAdmin.js          # Firebase Admin SDK
│   └── cloudinary.js             # Cloudinary client
│
├── src/services/
│   ├── walletService.js          # Wallet operations
│   ├── paymentService.js (razorpay) # Payment processing
│   └── notificationService.js    # Push notifications
│
└── src/models/ (29 mongoose schemas)
    └── Each model
        ├── Pre-hooks (password hashing, validation)
        └── Indexes (for query optimization)
```

---

## API Integration Points

### Third-Party API Calls

| Service        | Endpoint              | Method    | Purpose              | Auth       |
| -------------- | --------------------- | --------- | -------------------- | ---------- |
| Firebase Admin | `/auth/verifyIdToken` | `POST`    | Verify phone OTP     | Key        |
| Razorpay       | `/orders`             | `POST`    | Create payment order | Key+Secret |
| Razorpay       | `/payments/{id}`      | `GET`     | Check payment status | Key+Secret |
| Razorpay       | `/webhooks`           | `POST`    | Payment callback     | Signature  |
| Cloudinary     | `/upload`             | `POST`    | Upload image         | Key+Secret |
| Google Maps    | `/maps/api/geocode`   | `GET`     | Location lookup      | Key        |
| MongoDB Atlas  | `/db/connect`         | WebSocket | Database connection  | URI        |

---

## CI/CD Integration Points

### Vercel (Frontend)

**Auto-Deploy**:

- Trigger: Push to main branch
- Build Command: `npm run build`
- Output: `.next/` directory
- Environment Variables: Configured in Vercel dashboard

**Build Process**:

1. `npm install`
2. `npm run lint` (ESLint)
3. `npm run build` (Next.js build)
4. Deploy to CDN

**Deployment Artifacts**:

- Static HTML/CSS (pre-rendered)
- Next.js server components
- API route handlers
- Middleware

---

### Backend Deployment (Manual)

**Current**: Node.js server on custom infrastructure

**Process**:

1. SSH to server
2. `git pull`
3. `npm install`
4. `npm run seed` (optional - load demo data)
5. `npm start`

**Future Improvement**:

- Docker containerization
- Kubernetes orchestration
- CI/CD pipeline (GitHub Actions)

---

## Environment Variable Dependencies

### Frontend (.env.local)

```
# API Connectivity
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=***
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=***
NEXT_PUBLIC_FIREBASE_PROJECT_ID=***

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_***

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy***

# Feature Flags
NEXT_PUBLIC_ENABLE_PHONE_AUTH=true
NEXT_PUBLIC_ENABLE_DEMO_AUTH=false
```

### Backend (.env)

```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://***

# JWT
JWT_SECRET=***
JWT_EXPIRES_IN=7d

# Firebase Admin
FIREBASE_PROJECT_ID=ecoxchange-a7cb8
FIREBASE_CLIENT_EMAIL=***
FIREBASE_PRIVATE_KEY=***

# Razorpay
RAZORPAY_KEY_ID=rzp_test_***
RAZORPAY_KEY_SECRET=***

# Cloudinary
CLOUDINARY_CLOUD_NAME=dlcqussi7
CLOUDINARY_API_KEY=***
CLOUDINARY_API_SECRET=***

# Feature Flags
OTP_BYPASS=false
DEMO_OTP=123456
USE_MOCK_AI=true
```

---

## Version Compatibility Matrix

| Dependency | Frontend | Backend | Compatibility Note  |
| ---------- | -------- | ------- | ------------------- |
| Node.js    | 18+      | 18+     | Async/await support |
| npm        | 9+       | 9+      | Lock file format    |
| React      | 19.2.4   | N/A     | Latest stable       |
| Next.js    | 16.2.5   | N/A     | App Router required |
| Express    | N/A      | 4.22.1  | LTS                 |
| Mongoose   | 9.7.0    | 8.23.1  | API compatible      |
| Firebase   | 12.13.0  | 13.9.0  | Admin SDK separate  |
| Razorpay   | Latest   | 2.9.6   | API v1              |

---

## Performance Dependencies

### Data Fetching

- **TanStack Query**: Caching with 60s stale time
- **Axios**: HTTP client with retry logic
- **Socket.IO**: WebSocket for real-time updates

### State Management

- **Zustand**: Lightweight, with persistence
- **React Context**: Built-in (minimal usage)

### UI Rendering

- **Next.js Image**: Optimization + lazy loading
- **Framer Motion**: Animation library (light)
- **Tailwind CSS**: Utility-first CSS (minimal bundle)

### Build Optimization

- **Tree-shaking**: Remove unused code
- **Code splitting**: Per-route bundles
- **CSS purging**: Remove unused styles

---

## Fallback & Redundancy

### Single Points of Failure

| Component  | SPF     | Mitigation              |
| ---------- | ------- | ----------------------- |
| MongoDB    | Yes     | Daily backups, Atlas HA |
| Firebase   | No      | Fallback email auth     |
| Razorpay   | Yes     | None (manual override?) |
| Socket.IO  | Partial | Polling fallback        |
| Cloudinary | Partial | Placeholder images      |

### Recommended Redundancy

1. **Database**: Multi-region replica set
2. **Payment**: Secondary provider (Stripe backup)
3. **Auth**: Multiple Firebase projects (fallback)
4. **Notifications**: Message queue (Redis) + retry logic

---

## Dependency Audit

### Frontend Vulnerabilities

```bash
npm audit
```

**Status**: Check for security patches

### Backend Vulnerabilities

```bash
npm audit
```

**Status**: Check for security patches

### Update Strategy

- Critical: Apply immediately
- High: Apply within 1 week
- Medium: Apply within 1 month
- Low: Apply within quarterly review

---

## Conclusion

EcoXchange has well-defined integrations with Firebase, Razorpay, MongoDB Atlas, and Socket.IO. The modular architecture allows independent deployment and scaling. Main dependency risks are payment processing (Razorpay) and database (MongoDB Atlas) with no fallbacks - recommend implementing redundancy before production scale-up.
