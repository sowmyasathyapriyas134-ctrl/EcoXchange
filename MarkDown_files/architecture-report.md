# Architecture Report - EcoXchange

## Executive Summary

**EcoXchange** is a comprehensive role-based civic-tech platform for waste segregation, pickup coordination, and circular economy management. It connects citizens, delivery agents, recyclers, supervisors, and administrators through an integrated web application powered by modern web technologies and cloud services.

### Key Statistics

- **Frontend**: Next.js 16+ with TypeScript
- **Backend**: Express.js on Node.js with MongoDB
- **Database**: MongoDB via Mongoose ORM
- **Authentication**: Firebase Phone OTP + Custom JWT tokens
- **Payment**: Razorpay payment gateway
- **Real-time**: Socket.IO for live notifications
- **Deployment**: Vercel (frontend), Node.js server (backend)
- **Models**: 29 MongoDB collections

---

## Repository Structure

```
EcoXchange_2/
├── ecoxchang-client/                    # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                        # Next.js App Router with route groups
│   │   │   ├── (auth)/                 # Auth flows (login, register, verify-otp, forgot-password)
│   │   │   ├── api/                    # API route handlers
│   │   │   ├── admin/                  # Admin dashboard routes
│   │   │   ├── agent/                  # Delivery agent dashboard (legacy path)
│   │   │   ├── dashboard/              # Main dashboard container
│   │   │   ├── delivery/               # Delivery agent routes
│   │   │   ├── member/                 # Member/Citizen routes
│   │   │   ├── recycler/               # Recycler dashboard routes
│   │   │   ├── roles/                  # Role management routes
│   │   │   ├── supervisor/             # Supervisor routes
│   │   │   └── trial/                  # Trial member routes
│   │   ├── components/
│   │   │   ├── auth/                   # Auth components (OTP, login forms)
│   │   │   ├── dashboard/              # Dashboard layouts & common components
│   │   │   ├── eco/                    # EcoXchange-specific UI (NotificationBell, etc)
│   │   │   ├── forms/                  # Form components
│   │   │   ├── layout/                 # Layout wrappers (Sidebars, Navbars)
│   │   │   └── ui/                     # Base UI components (Glass cards, buttons)
│   │   ├── lib/
│   │   │   ├── api.ts                  # Axios API client with auth interceptors
│   │   │   ├── auth.ts                 # (empty - legacy)
│   │   │   ├── firebase.ts             # Firebase client initialization
│   │   │   ├── phone.ts                # Phone normalization utilities
│   │   │   ├── role-map.ts             # API role to app role mapping
│   │   │   ├── path-role.ts            # Path to role conversion
│   │   │   ├── offlineSync.ts          # Offline queue & sync logic
│   │   │   ├── socket.ts               # Socket.IO client setup
│   │   │   ├── prisma.ts               # (unused - MongoDB used instead)
│   │   │   ├── utils.ts                # Helper utilities
│   │   │   └── map-api-user.ts         # API user model mapping
│   │   ├── config/
│   │   │   └── role-nav.ts             # Role navigation configuration
│   │   ├── store/
│   │   │   ├── useAuthStore.ts         # Zustand auth state with persistence
│   │   │   └── useCartStore.ts         # Zustand cart state
│   │   ├── providers/
│   │   │   └── AppProviders.tsx        # React Query, Theme, Auth initializer
│   │   ├── types/
│   │   │   └── api.ts                  # TypeScript API types
│   │   └── hooks/                      # (empty)
│   ├── prisma/
│   │   └── schema.prisma               # Prisma schema (minimal - not primary DB)
│   ├── e2e/
│   │   ├── auth.spec.ts                # Auth E2E tests
│   │   ├── basic.spec.ts               # Basic functionality tests
│   │   ├── delivery.spec.ts            # Delivery agent tests
│   │   └── phone.spec.ts               # Phone number tests
│   ├── playwright.config.ts            # Playwright E2E test config
│   ├── next.config.ts                  # Next.js configuration with rewrites/redirects
│   ├── tsconfig.json                   # TypeScript config
│   ├── package.json                    # Frontend dependencies
│   └── .env.example                    # Environment variable template
│
├── server/                              # Express.js Backend Server
│   ├── src/
│   │   ├── app.js                      # Express app setup with routes
│   │   ├── server.js                   # Server entry point (HTTP + Socket.IO)
│   │   ├── config/
│   │   │   ├── db.js                   # MongoDB connection
│   │   │   ├── cloudinary.js           # Cloudinary storage config
│   │   │   ├── firebase.js             # Firebase Admin SDK (unused)
│   │   │   ├── firebaseAdmin.js        # Firebase Admin setup
│   │   │   ├── socket.js               # Socket.IO initialization
│   │   │   └── swagger.js              # Swagger/OpenAPI docs config
│   │   ├── controllers/
│   │   │   ├── authController.js       # Auth: OTP, registration, login
│   │   │   ├── firebaseAuthController.js # Firebase phone auth
│   │   │   ├── userController.js       # User profile management
│   │   │   ├── pickupController.js     # Waste pickup workflows
│   │   │   ├── recycleController.js    # Recycler operations
│   │   │   ├── shipmentController.js   # Shipment tracking
│   │   │   ├── paymentController.js    # Razorpay payment processing
│   │   │   ├── membershipController.js # Membership plans & upgrades
│   │   │   ├── rewardController.js     # Reward catalog & redemption
│   │   │   ├── walletController.js     # Wallet & balance operations
│   │   │   ├── dashboardController.js  # Dashboard analytics & stats
│   │   │   ├── adminController.js      # Admin operations
│   │   │   ├── aiChatController.js     # AI chat/segregation assistant
│   │   │   ├── analyticsController.js  # Analytics & reporting
│   │   │   ├── cartController.js       # Shopping cart operations
│   │   │   ├── notificationController.js # Notification sending
│   │   │   ├── orderController.js      # Order management
│   │   │   ├── marketplaceController.js # Marketplace operations
│   │   │   ├── scheduleController.js   # Recycler schedules
│   │   │   ├── trialController.js      # Trial member workflows
│   │   │   ├── revenueController.js    # Revenue tracking
│   │   │   └── wasteController.js      # Waste tracking
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # Legacy auth (unused - guards.js used)
│   │   │   ├── guards.js               # JWT protect & authorization middleware
│   │   │   ├── permissionMiddleware.js # Role-based permission checks
│   │   │   └── errorMiddleware.js      # Global error handler
│   │   ├── models/
│   │   │   ├── User.js                 # Citizen user model
│   │   │   ├── Recycler.js             # Recycler profile
│   │   │   ├── DeliveryAgent.js        # Delivery/pickup agent
│   │   │   ├── Supervisor.js           # Supervisor role
│   │   │   ├── Admin.js                # Admin role
│   │   │   ├── Pickup.js               # Waste pickup records
│   │   │   ├── Shipment.js             # Recycler shipments
│   │   │   ├── Payment.js              # Payment records
│   │   │   ├── Order.js                # Marketplace orders
│   │   │   ├── Product.js              # Marketplace products
│   │   │   ├── MembershipPlan.js       # Membership tiers
│   │   │   ├── Wallet.js               # User wallets
│   │   │   ├── LedgerEntry.js          # Financial ledger
│   │   │   ├── Reward.js               # Reward catalog
│   │   │   ├── RewardRedemption.js     # Reward claiming
│   │   │   ├── WasteSubmission.js      # Waste lifecycle tracking
│   │   │   ├── Notification.js         # Push notifications
│   │   │   ├── Cart.js                 # Shopping carts
│   │   │   ├── Otp.js                  # OTP records
│   │   │   ├── TrialSubmission.js      # Trial period submissions
│   │   │   ├── AuditLog.js             # Audit trail
│   │   │   ├── RecyclerSchedule.js     # Recurring schedules
│   │   │   ├── RecyclerPayment.js      # Recycler payouts
│   │   │   ├── Proof.js                # Photo proof storage
│   │   │   ├── LocationHistory.js      # GPS tracking
│   │   │   ├── WithdrawalRequest.js    # Wallet withdrawals
│   │   │   ├── TransactionLedger.js    # Transaction log
│   │   │   └── PlatformSettings.js     # System configuration
│   │   ├── routes/
│   │   │   ├── authRoutes.js           # /api/auth/*
│   │   │   ├── userRoutes.js           # /api/users/*
│   │   │   ├── adminRoutes.js          # /api/admin/*
│   │   │   ├── pickupRoutes.js         # /api/pickups/*
│   │   │   ├── recycleRoutes.js        # /api/recycler/*
│   │   │   ├── shipmentRoutes.js       # /api/shipments/*
│   │   │   ├── paymentRoutes.js        # /api/payments/*
│   │   │   ├── membershipRoutes.js     # /api/membership/*
│   │   │   ├── rewardRoutes.js         # /api/rewards/*
│   │   │   ├── walletRoutes.js         # /api/wallet/*
│   │   │   ├── dashboardRoutes.js      # /api/dashboard/*
│   │   │   ├── aiRoutes.js             # /api/ai/*
│   │   │   ├── marketplaceRoutes.js    # /api/marketplace/*
│   │   │   ├── notificationRoutes.js   # /api/notifications/*
│   │   │   ├── analyticsRoutes.js      # /api/analytics/*
│   │   │   ├── cartRoutes.js           # /api/cart/*
│   │   │   ├── orderRoutes.js          # /api/orders/*
│   │   │   ├── scheduleRoutes.js       # /api/recycler/schedules/*
│   │   │   ├── trialRoutes.js          # /api/trial/*
│   │   │   ├── wasteRoutes.js          # /api/waste/*
│   │   │   ├── revenueRoutes.js        # /api/revenue/*
│   │   │   ├── deliveryRoutes.js       # /api/delivery/*
│   │   │   ├── healthRoutes.js         # /health
│   │   │   └── docsRoutes.js           # /api/docs
│   │   ├── services/
│   │   │   ├── walletService.js        # Wallet operations
│   │   │   ├── paymentService.js       # Payment processing
│   │   │   └── notificationService.js  # Notification handling
│   │   ├── utils/
│   │   │   ├── generateToken.js        # JWT token generation
│   │   │   ├── findUserById.js         # User lookup by model
│   │   │   ├── findAccountByPhone.js   # Phone lookup
│   │   │   ├── findUserByEmail.js      # Email lookup
│   │   │   ├── canManageRole.js        # Role hierarchy
│   │   │   └── [other utilities]/
│   │   ├── validations/
│   │   ├── seeds/
│   │   │   └── seedEcoXchangeDemo.js   # Demo data seeding
│   │   └── middleware/
│   ├── package.json                    # Backend dependencies
│   └── .env.example                    # Backend environment template
│
├── implementation_plan.md               # Original design & tech stack doc
├── structure.txt                        # Project structure overview
└── TODO.md                              # Phase 4+ implementation roadmap
```

---

## Technology Stack

### Frontend (Next.js 16)

| Technology           | Purpose                 | Version |
| -------------------- | ----------------------- | ------- |
| **React**            | UI library              | 19.2.4  |
| **Next.js**          | Framework (App Router)  | 16.2.5  |
| **TypeScript**       | Type safety             | 5.x     |
| **Tailwind CSS**     | Styling                 | 4.x     |
| **Zustand**          | State management        | 5.0.13  |
| **TanStack Query**   | Data fetching/caching   | 5.90.0  |
| **React Hook Form**  | Form handling           | 7.75.0  |
| **Zod**              | Schema validation       | 4.4.3   |
| **Axios**            | HTTP client             | 1.16.1  |
| **Socket.IO Client** | Real-time notifications | 4.8.3   |
| **Firebase**         | Phone auth & analytics  | 12.13.0 |
| **Leaflet**          | Maps/location           | 1.9.4   |
| **Recharts**         | Data visualization      | 3.8.1   |
| **Lucide React**     | Icons                   | 1.14.0  |
| **Framer Motion**    | Animations              | 12.38.0 |
| **React Hot Toast**  | Toast notifications     | 2.6.0   |
| **Playwright**       | E2E testing             | 1.60.0  |

### Backend (Node.js)

| Technology             | Purpose                | Version |
| ---------------------- | ---------------------- | ------- |
| **Express.js**         | HTTP framework         | 4.22.1  |
| **Mongoose**           | MongoDB ODM            | 8.23.1  |
| **Firebase Admin**     | Server-side phone auth | 13.9.0  |
| **Razorpay**           | Payment gateway        | 2.9.6   |
| **Socket.IO**          | Real-time events       | 4.8.3   |
| **JWT (jsonwebtoken)** | Token generation       | 9.0.3   |
| **Bcryptjs**           | Password hashing       | 2.4.3   |
| **Cloudinary**         | Image storage          | 2.10.0  |
| **Helmet**             | Security headers       | 8.1.0   |
| **Express Rate Limit** | Request throttling     | 8.5.1   |
| **Morgan**             | HTTP logging           | 1.10.1  |
| **Swagger**            | API documentation      | 6.2.8   |
| **Multer**             | File uploads           | 2.1.1   |
| **Passport**           | OAuth (Google)         | 0.7.0   |
| **Nodemon**            | Dev auto-reload        | 3.1.14  |

### Database & Infrastructure

| Component           | Technology         | Purpose                  |
| ------------------- | ------------------ | ------------------------ |
| **Database**        | MongoDB Atlas      | Primary data storage     |
| **Frontend Deploy** | Vercel             | Next.js deployment       |
| **Backend Hosting** | Node.js server     | Custom deployment        |
| **Storage**         | Cloudinary         | Image/proof uploads      |
| **Real-time**       | Socket.IO          | Push notifications       |
| **Auth**            | Firebase Phone OTP | SMS-based authentication |
| **Payments**        | Razorpay           | Payment processing       |

---

## Core Features & Modules

### 1. **Authentication & Authorization**

- **Phone-based OTP** (Firebase + custom backend)
- **Email/Password Registration**
- **JWT Token Generation** (7-day expiry)
- **Role-Based Access Control (RBAC)**:
  - `trial_member` → Trial user (5-day period)
  - `member` → Paid member
  - `citizen` → Alias for member
  - `delivery_agent` → Pickup coordinator
  - `supervisor` → Verification authority
  - `recycler` → Waste processing facility
  - `admin` → Platform administrator

### 2. **Waste Management Lifecycle**

- **Citizen/Member**:
  - Submit waste for pickup
  - Track pickup status (pending→in_progress→completed)
  - Receive eco-points & rewards
  - View history of submissions
- **Delivery Agent**:
  - Accept/reject pickup assignments
  - Scan QR codes at pickup locations
  - Capture proof photos
  - Mark pickups complete
  - Offline sync capability
- **Supervisor**:
  - Verify waste submissions
  - Approve/reject pickups
  - Dispatch shipments to recyclers
  - Monitor delivery agents
- **Recycler**:
  - Accept shipments from supervisors
  - Track incoming waste
  - Mark as processed
  - Accept/reject material quality
  - Create products from recycled material

### 3. **Financial System**

- **Eco-Points**: In-app currency earned from waste submissions
- **Wallet System**:
  - Balance tracking (available, pending, lifetime)
  - Cashback & reward balances
  - Eco-points conversion
- **Membership Tiers**:
  - Silver/Gold/Platinum plans
  - Razorpay payment integration
  - Duration tracking & auto-renewal
- **Marketplace**:
  - Recyclers sell products made from recycled material
  - Citizens/members purchase with eco-points or wallet
  - Order management & tracking
- **Ledger System**: Centralized financial transaction logging

### 4. **Marketplace**

- **Recycler Product Listings**:
  - Product name, price, stock
  - Materials used (with source tracking)
  - Sustainability score & carbon saved
  - Admin approval workflow
- **Citizen Shopping**:
  - Browse products by waste type
  - Purchase with eco-points or wallet balance
  - Order tracking
  - Receipt confirmation

### 5. **Notification & Communication**

- **Socket.IO Real-time Notifications**:
  - Pickup status updates
  - Order confirmations
  - Reward claims
  - Admin alerts
- **Offline Queue Sync**:
  - Store failed requests locally
  - Auto-sync when connection restored
  - Idempotent request handling

### 6. **Reporting & Analytics**

- **Dashboard Metrics**:
  - Total waste collected (by type)
  - Eco-points earned
  - Carbon impact
  - Membership revenue
- **Admin Reports**:
  - User activity
  - Pickup success rates
  - Recycler performance
  - Revenue breakdown

### 7. **Trial Member Program**

- **5-Day Trial**:
  - Initial trial member creation
  - Limited access features
  - Upgrade to paid membership
  - Trial submission tracking

---

## Environment Variables

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=EcoXchange
NEXTAUTH_SECRET=supersecret
NEXTAUTH_URL=http://localhost:3000

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=***
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=***
NEXT_PUBLIC_FIREBASE_PROJECT_ID=***
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=***
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=***
NEXT_PUBLIC_FIREBASE_APP_ID=***
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=***

# APIs & Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=***
NEXT_PUBLIC_RAZORPAY_KEY_ID=***

# Feature Flags
NEXT_PUBLIC_ENABLE_PHONE_AUTH=true
NEXT_PUBLIC_ENABLE_DEMO_AUTH=false
```

### Backend (.env)

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ecoxchange
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
SESSION_SECRET=your_session_secret_for_google_oauth

# Razorpay
RAZORPAY_KEY_ID=rzp_test_****
RAZORPAY_KEY_SECRET=****

# Firebase Admin SDK
FIREBASE_PROJECT_ID=ecoxchange-a7cb8
FIREBASE_CLIENT_EMAIL=***
FIREBASE_PRIVATE_KEY=***

# Cloudinary
CLOUDINARY_CLOUD_NAME=***
CLOUDINARY_API_KEY=***
CLOUDINARY_API_SECRET=***

# Feature Flags
OTP_BYPASS=false
DEMO_OTP=123456
USE_MOCK_AI=true
ECO_DEMO_AUTH=false
```

---

## API Standards

### Base URL

- Development: `http://localhost:5000/api`
- Production: Configured via env vars

### Authentication

- All protected routes require Bearer token in `Authorization` header
- Format: `Authorization: Bearer <jwt_token>`
- Token includes: `{ id, role, model, exp }`

### Response Format

```json
{
  "success": true/false,
  "message": "Human-readable message",
  "data": { ... },
  "stack": "error stack (development only)"
}
```

### Rate Limiting

- General: 500 requests per 15 minutes
- Strict (AI chat, payments, shipments): 100 requests per 15 minutes

### Error Codes

- `400` - Bad Request (validation failure)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (role not authorized)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## Deployment Architecture

### Frontend (Vercel)

- Auto-deploys from git push
- Environment variables configured in Vercel dashboard
- Next.js SSG + dynamic routes
- CDN edge network

### Backend (Custom Node.js Server)

- Runs on specified port (default 5000)
- HTTP server with Socket.IO
- MongoDB connection pooling
- Environment-based configuration

### Database (MongoDB Atlas)

- Cluster-based deployment
- Connection string: `mongodb+srv://user:pass@cluster.mongodb.net/database`
- Automatic backups & failover
- Index optimization for performance

---

## Security Considerations

### Authentication

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens with 7-day expiry
- Suspended account detection on every request
- Firebase ID token verification for phone auth

### Authorization

- Role-based middleware checks at route level
- Permission-based fine-grained access
- Model-specific authorization (e.g., can only view own wallet)

### Data Protection

- CORS configured for frontend origin only
- Helmet security headers enabled
- MongoDB sanitization against injection
- Passwords excluded from all responses

### Rate Limiting

- Global rate limiting (500 req/15min)
- Strict rate limiting for sensitive endpoints (100 req/15min)
- OTP throttling (60-second cooldown, max 5/hour)

---

## Development Workflow

### Local Setup

```bash
# Frontend
cd ecoxchang-client
npm install
npm run dev      # Starts on :3000

# Backend
cd server
npm install
npm run dev      # Starts on :5000

# MongoDB locally or use Atlas connection string
```

### Build & Deployment

```bash
# Frontend
npm run lint
npm run build
npm start

# Backend
npm run seed     # Load demo data
npm start
```

### Testing

```bash
# E2E tests (Playwright)
npm run test:e2e

# Lint
npm run lint

# Type checking
npx tsc --noEmit
```

---

## Data Models Overview

| Model             | Purpose                     | Key Fields                            |
| ----------------- | --------------------------- | ------------------------------------- |
| **User**          | Citizen/member profile      | name, email, role, ecoPoints, phone   |
| **Recycler**      | Recycling facility          | companyName, email, licenseNumber     |
| **DeliveryAgent** | Pickup coordinator          | name, phone, vehicleType, location    |
| **Supervisor**    | Verification authority      | name, email, phone                    |
| **Pickup**        | Waste submission & tracking | user, wasteType, weight, status       |
| **Shipment**      | Waste transportation        | recycler, wasteType, weight, status   |
| **Payment**       | Payment records             | user, membershipPlan, razorpayOrderId |
| **Order**         | Marketplace purchase        | user, items[], total, paymentStatus   |
| **Product**       | Recycled goods listing      | recycler, name, price, materialsUsed  |
| **Wallet**        | Financial balance           | ownerId, available, pending, earnings |
| **Reward**        | Reward catalog              | title, pointsRequired, category       |
| **Notification**  | User notifications          | recipient, type, message              |

---

## Known Limitations & Technical Debt

1. **Prisma Schema**: Included but unused (MongoDB used instead)
2. **Empty Auth Lib**: `src/lib/auth.ts` is empty (authentication in components)
3. **Legacy Routes**: Agent routes at `/agent` redirected to `/delivery`
4. **Mock AI**: Chat endpoint uses mock responses
5. **Payment Integration**: Only Razorpay sandbox configured
6. **Firebase Admin**: Not fully integrated on backend
7. **Offline Sync**: Basic implementation (no conflict resolution)
8. **No Refresh Tokens**: JWT tokens only (no sliding window)
9. **Limited Validation**: Express validator used but not comprehensive

---

## Performance Considerations

1. **TanStack Query**: Caching strategy with 60-second stale time
2. **Socket.IO**: Connection pooling for scalability
3. **MongoDB Indexing**: Indexes on frequently queried fields
4. **Rate Limiting**: Prevents abuse and DDoS
5. **Cloudinary**: Image optimization on upload
6. **Next.js Optimization**: Image optimization, lazy loading

---

## Monitoring & Logging

1. **Morgan**: HTTP request logging on backend
2. **Browser Console**: Client-side debugging
3. **Error Boundaries**: React error catching
4. **Global Error Handler**: Express error middleware
5. **Audit Logs**: Action tracking for compliance

---

## Conclusion

EcoXchange is a feature-rich, production-grade waste management platform with comprehensive role-based access control, financial systems, and real-time capabilities. The architecture supports scalability through modular design, and security is prioritized through authentication, authorization, and rate limiting mechanisms.
