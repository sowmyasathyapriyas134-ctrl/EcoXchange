  # CLAUDE.md - EcoXchange Platform Complete Developer Guide

  **Last Updated**: Phase 8 Analysis Complete  
  **Status**: Ready for Production Review  
  **Version**: 1.0.0

  ---

  ## Table of Contents

  1. [Project Overview](#project-overview)
  2. [System Architecture](#system-architecture)
  3. [Repository Structure](#repository-structure)
  4. [Technology Stack](#technology-stack)
  5. [Frontend Architecture](#frontend-architecture)
  6. [Backend Architecture](#backend-architecture)
  7. [Database Architecture](#database-architecture)
  8. [Authentication & Authorization](#authentication--authorization)
  9. [User Roles & Permissions](#user-roles--permissions)
  10. [External Integrations](#external-integrations)
  11. [API Standards](#api-standards)
  12. [Development Workflow](#development-workflow)
  13. [Deployment & DevOps](#deployment--devops)
  14. [Testing Strategy](#testing-strategy)
  15. [Common Tasks](#common-tasks)
  16. [Known Issues & Tech Debt](#known-issues--tech-debt)
  17. [Architectural Decisions](#architectural-decisions)

  ---

  ## Project Overview

  ### Business Context

  **EcoXchange** is a comprehensive waste management and recycling platform that connects citizens, recyclers, delivery agents, and administrators in a circular economy ecosystem.

  **Primary Features**:

  - Waste submission & pickup scheduling (citizens)
  - Waste recycling & marketplace (recyclers)
  - Delivery coordination & tracking (agents)
  - Membership & rewards system (gamification)
  - Admin dashboard & analytics
  - Real-time notifications (WebSocket)
  - Payment processing (Razorpay)
  - Role-based access control (6 user types)

  **Core Business Flow**:

  ```
  Citizen submits waste → Supervisor schedules pickup →
  Delivery Agent collects → Recycler processes →
  Products listed on marketplace → Citizens purchase → Revenue shared
  ```

  **Target Users**:

  - Citizens: Earn ecoPoints, cashback for waste disposal
  - Recyclers: Manage inventory, sell products
  - Delivery Agents: Earn income from pickups
  - Supervisors: Coordinate pickups
  - Vendors: Sell recycled products
  - Admins: Platform oversight & analytics

  ---

  ## System Architecture

  ### High-Level Architecture Diagram

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                         CLIENT LAYER                            │
  ├─────────────────────────────────────────────────────────────────┤
  │  Next.js 16.2.5 (React 19.2.4)                                 │
  │  ├── App Router (TypeScript)                                    │
  │  ├── Zustand (State Management)                                 │
  │  ├── TanStack Query (Data Fetching)                             │
  │  ├── Socket.IO Client (Real-time)                              │
  │  └── Tailwind CSS 4.x (UI)                                      │
  ├─────────────────────────────────────────────────────────────────┤
  │                    COMMUNICATION LAYER                          │
  ├─────────────────────────────────────────────────────────────────┤
  │  HTTP REST API (Axios)      │    WebSocket (Socket.IO)         │
  │  JWT Authentication         │    Real-time Notifications       │
  ├─────────────────────────────────────────────────────────────────┤
  │                         SERVER LAYER                            │
  ├─────────────────────────────────────────────────────────────────┤
  │  Express.js 4.22.1 (Node.js 18+)                              │
  │  ├── Route Controllers (23 endpoint groups)                     │
  │  ├── Middleware Stack (auth, RBAC, rate limiting, etc)         │
  │  ├── Business Services                                         │
  │  ├── Mongoose ODM (Database Interface)                         │
  │  └── External Integrations                                      │
  ├─────────────────────────────────────────────────────────────────┤
  │                    EXTERNAL SERVICES LAYER                      │
  ├─────────────────────────────────────────────────────────────────┤
  │  Firebase Admin (Phone OTP Auth)   │   Razorpay (Payments)     │
  │  Cloudinary (Image Storage)        │   Socket.IO (Pub/Sub)     │
  │  Google Maps API (Geolocation)     │   MongoDB Atlas (Database)│
  └─────────────────────────────────────────────────────────────────┘
  ```

  ### Key Architectural Principles

  1. **Modular Design**: Controllers, services, models separated
  2. **Role-Based Access**: Middleware enforces RBAC at route level
  3. **Real-Time Updates**: Socket.IO for instant notifications
  4. **State Persistence**: Zustand with localStorage for frontend
  5. **Error Resilience**: Offline sync queue for network failures
  6. **Security First**: Helmet, rate limiting, JWT, input sanitization

  ---

  ## Repository Structure

  ```
  e:\My Projects\EcoXchange_2/
  │
  ├── 📄 implementation_plan.md          # Phase roadmap & milestones
  ├── 📄 structure.txt                   # Full file tree reference
  ├── 📄 TODO.md                         # Incomplete features
  ├── 📄 CLAUDE.md                       # This file
  ├── 📄 architecture-report.md          # Phase 1 output
  ├── 📄 frontend-architecture.md        # Phase 2 output
  ├── 📄 backend-architecture.md         # Phase 3 output
  ├── 📄 database-documentation.md       # Phase 4 output
  ├── 📄 security-audit.md               # Phase 5 output
  ├── 📄 dependency-map.md               # Phase 6 output
  ├── 📄 risk-assessment.md              # Phase 7 output
  │
  ├── 📂 ecoxchang-client/               # FRONTEND (Next.js 16.2.5)
  │   ├── package.json                   # npm dependencies
  │   ├── next.config.ts                 # Next.js configuration
  │   ├── tsconfig.json                  # TypeScript config
  │   ├── playwright.config.ts           # E2E test config
  │   ├── eslint.config.mjs              # Linting rules
  │   ├── postcss.config.mjs             # Tailwind CSS config
  │   │
  │   ├── 📂 public/                     # Static assets
  │   ├── 📂 e2e/                        # Playwright E2E tests
  │   │   ├── auth.spec.ts               # Auth flow tests
  │   │   ├── basic.spec.ts              # Smoke tests
  │   │   ├── delivery.spec.ts           # Delivery feature tests
  │   │   └── phone.spec.ts              # Phone verification tests
  │   │
  │   ├── 📂 src/
  │   │   ├── app/                       # Next.js App Router
  │   │   │   ├── layout.tsx             # Root layout + providers
  │   │   │   ├── page.tsx               # Home page
  │   │   │   ├── not-found.tsx          # 404 page
  │   │   │   ├── globals.css            # Global styles
  │   │   │   ├── (auth)/                # Auth routes
  │   │   │   ├── admin/                 # Admin routes
  │   │   │   ├── agent/                 # Delivery agent routes
  │   │   │   ├── api/                   # API routes (NextJS)
  │   │   │   ├── dashboard/             # Dashboard routes
  │   │   │   ├── delivery/              # Delivery routes
  │   │   │   ├── member/                # Member routes
  │   │   │   ├── recycler/              # Recycler routes
  │   │   │   ├── roles/                 # Role management
  │   │   │   ├── supervisor/            # Supervisor routes
  │   │   │   └── trial/                 # Trial member routes
  │   │   │
  │   │   ├── components/                # React components
  │   │   │   ├── auth/                  # Auth components
  │   │   │   ├── dashboard/             # Dashboard widgets
  │   │   │   ├── eco/                   # EcoXchange-specific
  │   │   │   ├── forms/                 # Form components
  │   │   │   ├── layout/                # Layout components
  │   │   │   └── ui/                    # Base UI components
  │   │   │
  │   │   ├── config/
  │   │   │   └── role-nav.ts            # Navigation by role
  │   │   │
  │   │   ├── hooks/                     # Custom React hooks
  │   │   ├── store/                     # Zustand stores
  │   │   │   ├── useAuthStore.ts        # Auth state (persistent)
  │   │   │   └── useCartStore.ts        # Cart state
  │   │   │
  │   │   ├── lib/                       # Utility functions
  │   │   │   ├── api.ts                 # Axios HTTP client
  │   │   │   ├── firebase.ts            # Firebase SDK init
  │   │   │   ├── socket.ts              # Socket.IO client
  │   │   │   ├── phone.ts               # Phone normalization
  │   │   │   ├── offlineSync.ts         # Offline action queue
  │   │   │   ├── auth.ts                # Auth utilities (EMPTY)
  │   │   │   ├── utils.ts               # Helper functions
  │   │   │   ├── map-api-user.ts        # Map conversion functions
  │   │   │   ├── path-role.ts           # Path-based role detection
  │   │   │   ├── role-map.ts            # Role name mapping
  │   │   │   └── mock/                  # Mock data for testing
  │   │   │
  │   │   ├── providers/
  │   │   │   └── AppProviders.tsx       # Global providers wrapper
  │   │   │
  │   │   └── types/
  │   │       └── api.ts                 # TypeScript type definitions
  │   │
  │   ├── prisma/                        # Prisma schema (UNUSED - technical debt)
  │   │   └── schema.prisma              # Not used with Mongoose
  │   │
  │   └── playwright-report/             # E2E test results
  │
  └── 📂 server/                         # BACKEND (Express.js 4.22.1)
      ├── package.json                   # npm dependencies
      ├── .env.example                   # Example env vars
      ├── README.md                      # Setup instructions
      │
      ├── 📂 src/
      │   ├── server.js                  # HTTP server entry point
      │   ├── app.js                     # Express middleware stack
      │   │
      │   ├── config/                    # Configuration files
      │   │   ├── db.js                  # MongoDB connection
      │   │   ├── socket.js              # Socket.IO initialization
      │   │   ├── firebaseAdmin.js       # Firebase Admin SDK
      │   │   ├── cloudinary.js          # Cloudinary client
      │   │   └── swagger.js             # API documentation
      │   │
      │   ├── middleware/                # Express middleware
      │   │   ├── authMiddleware.js      # JWT verification
      │   │   ├── guards.js              # protect + authorize
      │   │   ├── permissionMiddleware.js # Fine-grained RBAC
      │   │   ├── errorMiddleware.js     # Global error handler
      │   │   └── ...
      │   │
      │   ├── controllers/               # Route handlers (23 groups)
      │   │   ├── authController.js      # OTP & login endpoints
      │   │   ├── firebaseAuthController.js
      │   │   ├── userController.js
      │   │   ├── pickupController.js
      │   │   ├── deliveryController.js
      │   │   ├── paymentController.js
      │   │   ├── orderController.js
      │   │   ├── recycleController.js
      │   │   ├── walletController.js
      │   │   ├── membershipController.js
      │   │   ├── dashboardController.js
      │   │   ├── adminController.js
      │   │   └── ... (14 more)
      │   │
      │   ├── models/                    # Mongoose schemas (29 models)
      │   │   ├── User.js                # Citizen profile
      │   │   ├── Recycler.js            # Business entity
      │   │   ├── DeliveryAgent.js       # Delivery coordinator
      │   │   ├── Pickup.js              # Waste submission
      │   │   ├── Shipment.js            # Waste transport
      │   │   ├── Payment.js             # Razorpay record
      │   │   ├── Order.js               # Marketplace order
      │   │   ├── Wallet.js              # Financial balance
      │   │   ├── Product.js             # Recycled goods
      │   │   ├── ... (19 more)
      │   │
      │   ├── routes/                    # API route definitions
      │   │   ├── auth.routes.js
      │   │   ├── user.routes.js
      │   │   ├── pickup.routes.js
      │   │   └── ... (20 more)
      │   │
      │   ├── services/                  # Business logic
      │   │   ├── walletService.js
      │   │   ├── paymentService.js
      │   │   ├── notificationService.js
      │   │   └── ... (more as needed)
      │   │
      │   ├── utils/                     # Helper functions
      │   │   ├── generateToken.js       # JWT creation
      │   │   ├── findUserById.js        # User lookup
      │   │   └── ...
      │   │
      │   ├── validations/               # Input validation (minimal)
      │   └── seeds/                     # Demo data (optional)
      │
      └── logs/                          # Application logs
  ```

  ---

  ## Technology Stack

  ### Frontend

  ```json
  {
    "runtime": "Node.js 18+",
    "framework": "Next.js 16.2.5",
    "language": "TypeScript 5.x",
    "ui": {
      "library": "React 19.2.4",
      "styling": "Tailwind CSS 4.x",
      "icons": "lucide-react",
      "animations": "framer-motion"
    },
    "state": {
      "management": "Zustand 4.x",
      "persistence": "localStorage",
      "queries": "@tanstack/react-query 5.90.0"
    },
    "forms": {
      "handling": "react-hook-form 7.75.0",
      "validation": "Zod 4.4.3"
    },
    "http": "Axios 1.x",
    "realtime": "Socket.IO 4.8.3",
    "auth": "Firebase 12.13.0",
    "maps": "Leaflet + react-leaflet",
    "charts": "Recharts 3.8.1",
    "notifications": "react-hot-toast",
    "testing": {
      "e2e": "Playwright 1.60.0",
      "unit": "Jest (configured but not primary)"
    }
  }
  ```

  ### Backend

  ```json
  {
    "runtime": "Node.js 18+",
    "framework": "Express.js 4.22.1",
    "language": "JavaScript (ES6+)",
    "database": {
      "client": "Mongoose 8.23.1",
      "server": "MongoDB Atlas (cloud)"
    },
    "auth": {
      "jwt": "jsonwebtoken 9.0.3",
      "password": "bcryptjs 2.4.3",
      "otp": "crypto (built-in)",
      "firebase": "firebase-admin 13.9.0"
    },
    "payments": "razorpay 2.9.6",
    "storage": "cloudinary 2.10.0",
    "realtime": "Socket.IO 4.8.3",
    "security": {
      "headers": "helmet 8.1.0",
      "rate-limit": "express-rate-limit 8.5.1",
      "cors": "cors 2.8.5",
      "sanitize": "express-mongo-sanitize"
    },
    "compression": "compression",
    "logging": "morgan",
    "api-docs": "swagger-jsdoc + swagger-ui-express"
  }
  ```

  ### Infrastructure

  ```
  Database:       MongoDB Atlas (cloud)
  Auth:           Firebase (phone OTP)
  Payments:       Razorpay (sandbox + production)
  Storage:        Cloudinary
  Frontend Deploy: Vercel (auto-deploy on git push)
  Backend Deploy:  Manual (SSH + git pull + restart)
  Monitoring:     None (TODO)
  ```

  ---

  ## Frontend Architecture

  ### App Router Structure

  ```typescript
  // src/app/layout.tsx - Root layout with global providers
  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          <AppProviders>
            {children}
          </AppProviders>
        </body>
      </html>
    );
  }
  ```

  **AppProviders** wraps:

  1. QueryClientProvider (@tanstack/react-query)
  2. ThemeProvider (next-themes)
  3. Toaster (react-hot-toast)
  4. AuthInitializer (fetches user + listens to notifications)

  ### State Management

  **Zustand Stores** (localStorage persistence):

  ```typescript
  // store/useAuthStore.ts
  const useAuthStore = create(
    persist(
      (set) => ({
        user: null,
        token: null,
        membershipStatus: "trial",
        setAuth: (user, token) => set({ user, token }),
        logout: () => set({ user: null, token: null }),
      }),
      { name: "ecoxchange-auth-v2" },
    ),
  );
  ```

  **TanStack Query** (server state):

  ```typescript
  // Automatic caching with 60s stale time
  const { data: pickups } = useQuery({
    queryKey: ["pickups"],
    queryFn: () => api.get("/pickups"),
    staleTime: 60000,
  });
  ```

  ### API Client (Axios)

  ```typescript
  // lib/api.ts
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
  });

  // Request interceptor: Add JWT token
  api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: Handle 401 (token expired)
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = "/auth/login";
      }
      return Promise.reject(error);
    },
  );
  ```

  ### Real-Time Notifications (Socket.IO)

  ```typescript
  // lib/socket.ts
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
    // Update UI based on data type
    if (data.type === "pickup_update") {
      queryClient.invalidateQueries({ queryKey: ["pickups"] });
    }
  });
  ```

  ### Offline Sync Queue

  ```typescript
  // lib/offlineSync.ts
  interface QueuedAction {
    id: string; // Idempotency key
    action: string;
    payload: any;
    timestamp: number;
  }

  export function queueAction(action: string, payload: any) {
    const queue = JSON.parse(localStorage.getItem("offline_queue") || "[]");
    queue.push({
      id: generateUUID(),
      action,
      payload,
      timestamp: Date.now(),
    });
    localStorage.setItem("offline_queue", JSON.stringify(queue));
  }

  export async function syncOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem("offline_queue") || "[]");

    for (const item of queue) {
      try {
        await api.post(`/offlineSync`, item);
        // Remove from queue on success
        const idx = queue.indexOf(item);
        queue.splice(idx, 1);
      } catch (error) {
        // Retry on next sync
        toast.error("Offline action queued for retry");
      }
    }

    localStorage.setItem("offline_queue", JSON.stringify(queue));
  }
  ```

  ### Form Handling (react-hook-form + Zod)

  ```typescript
  // Example: PickupForm component
  import { useForm } from "react-hook-form";
  import { z } from "zod";
  import { zodResolver } from "@hookform/resolvers/zod";

  const pickupSchema = z.object({
    wasteType: z.enum(["organic", "plastic", "metal", "paper"]),
    weight: z.number().positive("Weight must be positive"),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    proofImages: z.array(z.instanceof(File)),
  });

  type PickupFormData = z.infer<typeof pickupSchema>;

  export function PickupForm() {
    const { register, handleSubmit, formState: { errors } } = useForm<PickupFormData>({
      resolver: zodResolver(pickupSchema),
    });

    const onSubmit = async (data: PickupFormData) => {
      try {
        await api.post("/pickups", data);
        toast.success("Pickup submitted!");
      } catch (error) {
        toast.error("Failed to submit");
        // Queue action for offline sync
        queueAction("submit_pickup", data);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <select {...register("wasteType")}>
          <option value="organic">Organic</option>
          <option value="plastic">Plastic</option>
        </select>
        {errors.wasteType && <span>{errors.wasteType.message}</span>}

        <input type="number" {...register("weight", { valueAsNumber: true })} />

        <button type="submit">Submit Pickup</button>
      </form>
    );
  }
  ```

  ### Role-Based Navigation

  ```typescript
  // config/role-nav.ts
  export const NAV_BY_ROLE: Record<AppRole, NavItem[]> = {
    trial: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Submit Waste", href: "/trial/submit", icon: Plus },
    ],
    member: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "My Pickups", href: "/member/pickups", icon: Truck },
      { label: "Wallet", href: "/member/wallet", icon: Wallet },
      { label: "Marketplace", href: "/marketplace", icon: ShoppingCart },
    ],
    delivery: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Assigned Pickups", href: "/delivery/assigned", icon: MapPin },
      { label: "Schedule", href: "/delivery/schedule", icon: Calendar },
      { label: "Earnings", href: "/delivery/earnings", icon: DollarSign },
    ],
    recycler: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Inventory", href: "/recycler/inventory", icon: Package },
      { label: "Products", href: "/recycler/products", icon: Boxes },
    ],
    supervisor: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Assign Pickups", href: "/supervisor/assign", icon: UserCheck },
    ],
    admin: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart },
    ],
  };
  ```

  ---

  ## Backend Architecture

  ### Express Middleware Stack

  ```javascript
  // app.js - Order matters!
  app.use(helmet()); // Security headers
  app.use(cors({ origin: CLIENT_URL })); // CORS
  app.use(express.json({ limit: "50mb" })); // JSON parser
  app.use(compression()); // Compression
  app.use(mongoSanitize()); // Prevent NoSQL injection
  app.use(morgan("combined")); // Logging

  // Rate limiting
  app.use(globalLimiter); // 500 req / 15min
  app.use("/api/payments", strictLimiter); // 100 req / 15min
  app.use("/api/chat", strictLimiter); // 100 req / 15min

  // Routes (23 endpoint groups)
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/pickups", pickupRoutes);
  // ... 20 more route groups

  // Error handling (must be last)
  app.use(globalErrorHandler);
  ```

  ### Authentication Middleware (JWT)

  ```javascript
  // middleware/guards.js
  async function protect(req, res, next) {
    // 1. Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    // 2. Verify JWT signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Load user from database
    const user = await findUserById(decoded.id, decoded.model);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 4. Check if suspended
    if (user.suspended)
      return res.status(403).json({ error: "Account suspended" });

    // 5. Attach to request
    req.user = user;
    req.modelName = decoded.model;

    next();
  }

  // Usage in routes
  router.get("/profile", protect, userController.getProfile);
  ```

  ### Authorization Middleware (RBAC)

  ```javascript
  // middleware/guards.js
  function authorize(...allowedRoles) {
    return (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient role" });
      }
      next();
    };
  }

  // Usage
  router.post(
    "/assign-pickup",
    protect,
    authorize("supervisor", "admin"),
    pickupController.assignPickup,
  );
  ```

  ### Controller Example

  ```javascript
  // controllers/authController.js
  exports.sendOtp = async (req, res) => {
    const { phone } = req.body;

    // 1. Validate phone
    const normalized = normalizePhoneNumber(phone);

    // 2. Rate limit: Max 5 OTPs/hour, 60s cooldown
    const existingOtp = await Otp.findOne({ phone: normalized });
    if (existingOtp && Date.now() - existingOtp.sentAt < 60000) {
      return res.status(429).json({ error: "Wait 60 seconds before retry" });
    }

    // 3. Generate OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();

    // 4. Send SMS (currently console.log - TODO: integrate SMS gateway)
    console.log(`[OTP] Sent to ${normalized}: ${otpCode}`);

    // 5. Store OTP (plaintext - TODO: hash before storing)
    await Otp.updateOne(
      { phone: normalized },
      { otp: otpCode, sentAt: new Date() },
      { upsert: true },
    );

    res.json({ message: "OTP sent" });
  };

  exports.verifyOtp = async (req, res) => {
    const { phone, otp } = req.body;
    const normalized = normalizePhoneNumber(phone);

    // 1. Find stored OTP
    const stored = await Otp.findOne({ phone: normalized });
    if (!stored) return res.status(400).json({ error: "No OTP found" });

    // 2. Check expiry (5 minutes)
    if (Date.now() - stored.sentAt > 5 * 60 * 1000) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // 3. Check attempts
    if (stored.attempts >= 3) {
      return res.status(429).json({ error: "Max attempts exceeded" });
    }

    // 4. Compare OTP
    if (stored.otp !== otp) {
      stored.attempts += 1;
      await stored.save();
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // 5. Find or create user
    let user = await findAccountByPhone(normalized);
    if (!user) {
      user = new User({ phone: normalized });
      await user.save();
    }

    // 6. Generate JWT
    const token = generateToken(user._id, user.role, user.constructor.name);

    // 7. Clean up OTP
    await Otp.deleteOne({ phone: normalized });

    res.json({ token, user });
  };
  ```

  ### Service Layer Example

  ```javascript
  // services/walletService.js
  class WalletService {
    async addBalance(ownerId, ownerModel, amount, reason) {
      const wallet = await Wallet.findOne({ ownerId, ownerModel });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      wallet.availableBalance += amount;
      await wallet.save();

      // Log transaction
      await Ledger.create({
        wallet: wallet._id,
        type: "credit",
        amount,
        reason,
      });

      return wallet;
    }

    async deductBalance(ownerId, ownerModel, amount, reason) {
      const wallet = await Wallet.findOne({ ownerId, ownerModel });
      if (wallet.availableBalance < amount) {
        throw new Error("Insufficient balance");
      }

      wallet.availableBalance -= amount;
      await wallet.save();

      await Ledger.create({
        wallet: wallet._id,
        type: "debit",
        amount,
        reason,
      });

      return wallet;
    }

    async getBalance(ownerId, ownerModel) {
      return await Wallet.findOne({ ownerId, ownerModel });
    }
  }

  module.exports = new WalletService();
  ```

  ### Socket.IO Server Setup

  ```javascript
  // config/socket.js
  const { Server } = require("socket.io");

  function initSocket(httpServer) {
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // On connection
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Join user's private room
      socket.on("join", (userId) => {
        socket.join(String(userId));
        console.log(`User ${userId} joined room`);
      });

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });

    return io;
  }

  // In server.js
  const io = initSocket(server);
  app.set("io", io);

  // Emit notification from controller
  const io = req.app.get("io");
  io.to(String(user._id)).emit("notification", {
    type: "pickup_update",
    message: "Your pickup has been assigned",
    data: pickup,
  });
  ```

  ---

  ## Database Architecture

  ### MongoDB Collections (29 Total)

  #### Core User Models

  1. **User** (Citizens)
    - Roles: "trial_member", "member"
    - Fields: phone, email, name, ecoPoints, membershipStatus, walletId, etc.

  2. **Recycler** (Business)
    - Fields: companyName, licenseNumber, acceptedWasteTypes, verified, inventory[], etc.

  3. **DeliveryAgent** (Pickup Coordinators)
    - Fields: employeeId, vehicleType, currentLocation, availabilityStatus, earnings, etc.

  4. **Supervisor** (Coordinators)
    - Fields: agencyName, assignedZone, supervisedAgents[], etc.

  5. **Vendor** (Marketplace Seller)
    - Fields: shopName, products[], ratings, etc.

  #### Operational Models

  6. **Pickup** (Waste Submission)
    - Status: "pending" → "assigned" → "in-transit" → "completed" → "verified"
    - Fields: user, quantity, wasteType, recycler, proofImages, weight, etc.

  7. **Shipment** (Waste Transportation)
    - Status progression with timestamps
    - Fields: pickup[], destination, recycler, status, tracking, etc.

  8. **DeliverySlot** (Scheduling)
    - Fields: date, timeWindow, agentId, capacity, booked, etc.

  #### Financial Models

  9. **Payment** (Razorpay Record)
    - Fields: razorpayOrderId, status, amount, user, membership, etc.

  10. **Wallet** (Financial Balance)
      - Unique index: { ownerId, ownerModel }
      - Fields: availableBalance, pendingBalance, ecoPointsBalance, etc.

  11. **Ledger** (Transaction Log)
      - Fields: wallet, type, amount, reason, timestamp, etc.

  12. **Order** (Marketplace Purchase)
      - Fields: items[], buyer, payment, deliveryStatus, total, etc.

  #### Product Models

  13. **Product** (Recycled Goods)
      - Fields: name, materialsUsed[], sustainabilityScore, price, seller, stock, etc.

  14. **Inventory** (Recycler Stock)
      - Fields: recycler, wasteType, quantity, storageLocation, etc.

  #### Reward Models

  15. **Reward** (Incentives)
      - Fields: type, ecoPoints, cashback, rewardedUser, claimedAt, etc.

  16. **MembershipPlan** (Subscription)
      - Fields: name, ecoPointsBenefit, cashbackPercentage, price, duration, etc.

  #### System Models

  17. **Otp** (Phone Verification)
      - Fields: phone, otp, sentAt, attempts, expiresAt, etc.

  18. **ProcessedWebhook** (Payment Idempotency)
      - Fields: webhookId, status, processedAt, etc.

  19. **Notification** (Real-Time Messages)
      - Fields: recipient, type, message, read, createdAt, etc.

  20. **AuditLog** (Security)
      - Fields: user, action, resource, timestamp, ipAddress, etc.

  21. **AnalyticsEvent** (Tracking)
      - Fields: event, user, properties, timestamp, etc.

  22. **Schedule** (Pickup Scheduling)
      - Fields: date, timeWindow, agentId, capacity, booked[], etc.

  #### Additional Models (23-29)

  23. **Subscription** (Auto-renew Memberships)
  24. **Discount** (Promotional)
  25. **Review** (Product Ratings)
  26. **Report** (Admin Analytics)
  27. **Configuration** (System Settings)
  28. **FAQ** (Help Content)
  29. **Feedback** (User Surveys)

  ### Database Indexes

  ```javascript
  // High-priority indexes
  User: { email: 1, phone: 1, role: 1 }
  Pickup: { user: 1, status: 1, createdAt: -1 }
  Pickup: { recycler: 1, status: 1 }
  Wallet: { ownerId: 1, ownerModel: 1 } // unique
  Payment: { razorpayOrderId: 1 }
  Order: { buyer: 1, createdAt: -1 }
  ```

  ### Data Relationships

  ```
  User (1) ──── (∞) Pickup
  User (1) ──── (1) Wallet
  User (1) ──── (∞) Ledger (via Wallet)
  User (1) ──── (∞) Payment

  Recycler (1) ──── (∞) Product
  Recycler (1) ──── (∞) Shipment

  DeliveryAgent (1) ──── (∞) Pickup
  DeliveryAgent (1) ──── (∞) DeliverySlot

  Pickup (∞) ──── (1) Shipment
  Shipment (1) ──── (1) Recycler

  Product (∞) ──── (1) Order
  Order (∞) ──── (1) User
  ```

  ---

  ## Authentication & Authorization

  ### Authentication Flow Diagram

  ```
  FIREBASE PHONE OTP (Primary)
  ┌─────────────────────────────────────────────────────┐
  │ 1. Frontend: User enters phone                       │
  │ 2. Frontend: Call Firebase to send OTP              │
  │ 3. Firebase: SMS OTP to user's phone               │
  │ 4. User: Enters OTP in Firebase widget              │
  │ 5. Firebase: Verifies OTP, returns ID token        │
  │ 6. Frontend: POST /auth/firebase with ID token     │
  │ 7. Backend: Verify ID token with Firebase Admin    │
  │ 8. Backend: Find/create account by phone           │
  │ 9. Backend: Return JWT token (7-day expiry)        │
  │10. Frontend: Store JWT in localStorage + Zustand   │
  └─────────────────────────────────────────────────────┘

  FALLBACK: CUSTOM OTP (Backend-managed)
  ┌─────────────────────────────────────────────────────┐
  │ 1. Frontend: POST /api/auth/send-otp with phone    │
  │ 2. Backend: Generate 6-digit OTP                    │
  │ 3. Backend: Send SMS (TODO: integrate SMS gateway)  │
  │ 4. Backend: Store OTP in MongoDB (5min expiry)     │
  │ 5. Frontend: POST /api/auth/verify-otp with OTP   │
  │ 6. Backend: Verify OTP, create/find user           │
  │ 7. Backend: Return JWT token                        │
  │ 8. Frontend: Store JWT in localStorage              │
  └─────────────────────────────────────────────────────┘

  JWT TOKEN STRUCTURE
  ┌─────────────────────────────────────────────────────┐
  │ Header: { alg: "HS256", typ: "JWT" }               │
  │ Payload: {                                          │
  │   id: "user_id",                                    │
  │   role: "member",                                   │
  │   model: "User",  // User, Recycler, DeliveryAgent │
  │   iat: timestamp,                                   │
  │   exp: timestamp + 7 days                           │
  │ }                                                   │
  │ Signature: HMAC-SHA256(header.payload, SECRET)     │
  └─────────────────────────────────────────────────────┘
  ```

  ### Authorization (RBAC)

  **Role Hierarchy**:

  ```
  admin (highest)
    ├── supervisor
    ├── delivery_agent
    ├── recycler
    ├── vendor
    └── member / trial_member (lowest)
  ```

  **Permission Matrix**:

  | Permission      | Admin | Supervisor | Delivery | Recycler | Vendor | Member | Trial |
  | --------------- | ----- | ---------- | -------- | -------- | ------ | ------ | ----- |
  | View own data   | ✅    | ✅         | ✅       | ✅       | ✅     | ✅     | ✅    |
  | Submit pickup   | ✅    | ✅         | ✅       | ✅       | ✅     | ✅     | ✅    |
  | View all users  | ✅    | ❌         | ❌       | ❌       | ❌     | ❌     | ❌    |
  | Assign pickup   | ✅    | ✅         | ❌       | ❌       | ❌     | ❌     | ❌    |
  | Process payment | ✅    | ❌         | ❌       | ❌       | ❌     | ✅     | ❌    |
  | Verify pickup   | ✅    | ✅         | ❌       | ✅       | ❌     | ❌     | ❌    |
  | Upload products | ✅    | ❌         | ❌       | ✅       | ✅     | ❌     | ❌    |

  ### Token Management

  **Frontend Token Storage**:

  ```typescript
  // store/useAuthStore.ts
  const useAuthStore = create(
    persist(
      (set) => ({
        token: null, // JWT from backend
        user: null, // User object
        setAuth: (user, token) => set({ user, token }),
      }),
      { name: "ecoxchange-auth-v2" }, // localStorage key
    ),
  );

  // Used in api.ts interceptor
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  ```

  **Token Expiry Handling**:

  ```typescript
  // api.ts response interceptor
  if (error.response?.status === 401) {
    // Token expired or invalid
    useAuthStore.getState().logout();
    window.location.href = "/auth/login";
  }
  ```

  ---

  ## User Roles & Permissions

  ### 1. Trial Member

  - **Permissions**: Submit 1 pickup/month, view ecoPoints
  - **Cannot**: Process payment, access marketplace as buyer
  - **Upgrade Path**: Pay ₹499/month for membership

  ### 2. Member

  - **Permissions**: Unlimited pickups, marketplace access, wallet, rewards
  - **Restrictions**: Cannot verify pickups, cannot upload products
  - **Benefits**: 5% cashback, monthly ecoPoints bonus

  ### 3. Delivery Agent

  - **Permissions**: View assigned pickups, update pickup status, view earnings
  - **Restrictions**: Cannot modify pickup details
  - **Earnings**: ₹50 per pickup + incentives

  ### 4. Supervisor

  - **Permissions**: Assign pickups, escalate issues, view team performance
  - **Restrictions**: Cannot delete pickups
  - **Responsibilities**: Zone management, agent coordination

  ### 5. Recycler

  - **Permissions**: Upload products, manage inventory, view orders
  - **Restrictions**: Cannot delete user accounts
  - **Earnings**: Revenue from product sales

  ### 6. Admin

  - **Permissions**: Full system access, user management, analytics, configuration
  - **Restrictions**: Cannot delete blockchain records (if implemented)
  - **Responsibilities**: Platform oversight, dispute resolution

  ### 7. Vendor (Limited Role)

  - **Permissions**: Upload products (limited), view sales
  - **Restrictions**: Cannot manage pickups or shipments

  ---

  ## External Integrations

  ### Firebase Authentication

  **Configuration**:

  ```typescript
  // src/lib/firebase.ts
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    // ... other fields
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  ```

  **Phone OTP Flow**:

  1. User enters phone
  2. Firebase sends SMS (Firebase manages CAPTCHA & SMS gateway)
  3. User verifies in Firebase UI
  4. Frontend receives ID token
  5. Frontend sends ID token to backend
  6. Backend verifies with Firebase Admin SDK

  **Fallback if Firebase Down**:

  - Use backend-generated OTP
  - Limited to 5 OTPs/hour, 60s cooldown

  ### Razorpay Payments

  **Configuration**:

  ```javascript
  // server/config/db.js (example)
  const Razorpay = require("razorpay");

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  ```

  **Payment Flow**:

  1. Frontend: `POST /api/payments/create-order` with amount
  2. Backend: Razorpay API creates order, returns order_id
  3. Frontend: Initialize Razorpay Checkout with order_id
  4. User: Enters payment details (Razorpay handles payment)
  5. Razorpay: Returns payment_id
  6. Frontend: `POST /api/payments/verify` with payment details
  7. Backend: Verify signature, update Payment record
  8. Backend: Grant membership, update Wallet, emit notification

  **Webhook (Async Confirmation)**:

  - Razorpay → `POST /api/webhooks/razorpay`
  - Backend: Verify signature, process payment
  - Risk: Webhook could fail, leaving payment unreconciled

  ### Socket.IO Real-Time Updates

  **Connection**:

  ```typescript
  // Frontend
  socket.connect();
  socket.emit("join", userId);

  // Backend
  io.to(String(userId)).emit("notification", data);
  ```

  **Event Types**:

  - `pickup_update`: Status change in pickup
  - `order_update`: Payment or delivery status
  - `admin_alert`: System alerts
  - `notification`: Generic message

  **Failure Modes**:

  - Connection drops: Frontend reconnects automatically
  - Message loss: Socket.IO queues 1 message per connection
  - No persistence: Lost if server restarts (no Redis adapter)

  ### Google Maps API

  **Usage**: Display pickup locations on interactive map

  **Key Required**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

  **Libraries**: Leaflet + react-leaflet

  **Fallback**: If API down, show text addresses instead

  ### Cloudinary Image Storage

  **Configuration**:

  ```javascript
  // Not actively integrated in current codebase
  CLOUDINARY_CLOUD_NAME=dlcqussi7
  CLOUDINARY_API_KEY=***
  CLOUDINARY_API_SECRET=***
  ```

  **Use Cases** (not yet implemented):

  - User avatars
  - Proof images
  - Product images

  **Integration When Needed**:

  ```javascript
  const cloudinary = require("cloudinary");

  cloudinary.uploader.upload(
    filePath,
    {
      public_id: `ecoxchange/${userId}/${fileName}`,
      resource_type: "auto",
    },
    callback,
  );
  ```

  ---

  ## API Standards

  ### Request Format

  **Base URL**: `http://localhost:5000/api` (development)

  **Headers**:

  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer <JWT_TOKEN>",
    "Accept": "application/json"
  }
  ```

  **Query Parameters**:

  ```
  GET /api/pickups?status=pending&skip=0&limit=20&sort=-createdAt
  ```

  ### Response Format

  **Success (200 OK)**:

  ```json
  {
    "success": true,
    "data": {
      /* resource data */
    },
    "message": "Operation successful"
  }
  ```

  **Client Error (400 Bad Request)**:

  ```json
  {
    "success": false,
    "error": "Invalid request",
    "details": { "field": "phone", "reason": "Invalid format" }
  }
  ```

  **Unauthorized (401)**:

  ```json
  {
    "success": false,
    "error": "Unauthorized",
    "message": "Token expired or invalid"
  }
  ```

  **Forbidden (403)**:

  ```json
  {
    "success": false,
    "error": "Forbidden",
    "message": "Insufficient permissions"
  }
  ```

  **Server Error (500)**:

  ```json
  {
    "success": false,
    "error": "Internal Server Error",
    "requestId": "req-123abc" // For debugging
  }
  ```

  ### Rate Limiting

  ```
  Global: 500 requests / 15 minutes
  Strict (payments, AI, shipments): 100 requests / 15 minutes

  Status Code: 429 Too Many Requests
  Headers:
    X-RateLimit-Limit: 500
    X-RateLimit-Remaining: 342
    X-RateLimit-Reset: 1234567890
  ```

  ### Common Endpoints

  **Authentication**:

  - `POST /api/auth/send-otp` - Send phone OTP
  - `POST /api/auth/verify-otp` - Verify OTP
  - `POST /api/auth/firebase` - Firebase phone auth
  - `POST /api/auth/logout` - Logout

  **Users**:

  - `GET /api/users/profile` - Get current user
  - `PUT /api/users/profile` - Update profile
  - `GET /api/users/me` - Get auth status

  **Pickups**:

  - `GET /api/pickups` - List pickups
  - `POST /api/pickups` - Create pickup
  - `GET /api/pickups/:id` - Get pickup details
  - `PUT /api/pickups/:id` - Update pickup
  - `DELETE /api/pickups/:id` - Cancel pickup

  **Payments**:

  - `POST /api/payments/create-order` - Create Razorpay order
  - `POST /api/payments/verify` - Verify payment
  - `GET /api/payments/history` - Payment history

  **Wallet**:

  - `GET /api/wallet/balance` - Get balance
  - `GET /api/wallet/transactions` - Transaction history
  - `POST /api/wallet/withdraw` - Request withdrawal

  **Admin**:

  - `GET /api/admin/users` - List all users
  - `POST /api/admin/users/:id/suspend` - Suspend user
  - `GET /api/admin/analytics` - System analytics

  ---

  ## Development Workflow

  ### 1. Setting Up Local Environment

  **Prerequisites**:

  - Node.js 18+
  - npm 9+
  - MongoDB (local or Atlas connection string)
  - Firebase project (for phone auth)
  - Razorpay account (sandbox mode for testing)

  **Frontend Setup**:

  ```bash
  cd ecoxchang-client
  cp .env.example .env.local
  # Edit .env.local with your values
  npm install
  npm run dev
  # Opens http://localhost:3000
  ```

  **Backend Setup**:

  ```bash
  cd server
  cp .env.example .env
  # Edit .env with your values
  npm install
  npm start
  # Server runs on http://localhost:5000
  ```

  ### 2. Creating a New API Endpoint

  **Example**: Add `/api/pickups/bulk-create` for admin

  **Step 1**: Define route

  ```javascript
  // routes/pickup.routes.js
  router.post(
    "/bulk-create",
    protect,
    authorize("admin"),
    pickupController.bulkCreate,
  );
  ```

  **Step 2**: Create controller method

  ```javascript
  // controllers/pickupController.js
  exports.bulkCreate = async (req, res) => {
    const { pickups } = req.body;

    // Validate
    if (!Array.isArray(pickups) || pickups.length === 0) {
      return res.status(400).json({ error: "Invalid pickups array" });
    }

    // Create
    const created = await Pickup.insertMany(pickups);

    res.json({ success: true, data: created });
  };
  ```

  **Step 3**: Test endpoint

  ```bash
  curl -X POST http://localhost:5000/api/pickups/bulk-create \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"pickups": [...]}'
  ```

  ### 3. Adding a New Frontend Component

  **Example**: Create `RewardBadge` component

  **Step 1**: Create component file

  ```typescript
  // src/components/eco/RewardBadge.tsx
  import { Trophy } from "lucide-react";

  interface RewardBadgeProps {
    reward: "silver" | "gold" | "platinum";
    ecoPoints: number;
  }

  export function RewardBadge({ reward, ecoPoints }: RewardBadgeProps) {
    const colors = {
      silver: "bg-gray-200 text-gray-800",
      gold: "bg-yellow-200 text-yellow-800",
      platinum: "bg-purple-200 text-purple-800",
    };

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colors[reward]}`}>
        <Trophy size={20} />
        <span className="font-semibold">{ecoPoints} ecoPoints</span>
      </div>
    );
  }
  ```

  **Step 2**: Export from barrel export

  ```typescript
  // src/components/eco/index.ts
  export { RewardBadge } from "./RewardBadge";
  ```

  **Step 3**: Use in page

  ```typescript
  // src/app/dashboard/page.tsx
  import { RewardBadge } from "@/components/eco";

  export default function Dashboard() {
    return (
      <div>
        <RewardBadge reward="gold" ecoPoints={1250} />
      </div>
    );
  }
  ```

  ### 4. Modifying Database Schema

  **Example**: Add `verificationNotes` field to Pickup

  **Step 1**: Update Mongoose schema

  ```javascript
  // models/Pickup.js
  const pickupSchema = new Schema({
    // ... existing fields
    verificationNotes: {
      type: String,
      default: "",
      maxlength: 500,
    },
  });
  ```

  **Step 2**: Create migration (manual process)

  ```javascript
  // scripts/migrate-verification-notes.js
  const mongoose = require("mongoose");
  const Pickup = require("../models/Pickup");

  async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Add field to all pickups
    await Pickup.updateMany({}, { verificationNotes: "" });

    console.log("Migration complete");
    process.exit(0);
  }

  migrate().catch(console.error);

  // Run: node scripts/migrate-verification-notes.js
  ```

  **Step 3**: Test changes

  ```bash
  npm run lint
  npm run type-check
  npm test
  ```

  ### 5. Implementing Authentication Flow

  **Example**: Phone OTP verification

  **Frontend**:

  ```typescript
  // components/auth/PhoneVerification.tsx
  import { useState } from "react";
  import { api } from "@/lib/api";
  import { useAuthStore } from "@/store/useAuthStore";

  export function PhoneVerification() {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [loading, setLoading] = useState(false);

    const setAuth = useAuthStore((s) => s.setAuth);

    async function sendOtp() {
      setLoading(true);
      try {
        await api.post("/auth/send-otp", { phone });
        setStep("otp");
      } catch (error) {
        toast.error("Failed to send OTP");
      } finally {
        setLoading(false);
      }
    }

    async function verifyOtp() {
      setLoading(true);
      try {
        const response = await api.post("/auth/verify-otp", { phone, otp });
        setAuth(response.data.user, response.data.token);
        router.push("/dashboard");
      } catch (error) {
        toast.error("Invalid OTP");
      } finally {
        setLoading(false);
      }
    }

    return (
      <div className="space-y-4">
        {step === "phone" ? (
          <>
            <input
              type="tel"
              placeholder="Enter phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button onClick={sendOtp} disabled={loading}>
              Send OTP
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button onClick={verifyOtp} disabled={loading}>
              Verify
            </button>
          </>
        )}
      </div>
    );
  }
  ```

  **Backend**:

  ```javascript
  // Already documented above in "Backend Architecture" section
  ```

  ### 6. Building for Production

  **Frontend**:

  ```bash
  cd ecoxchang-client
  npm run lint          # Check code style
  npm run type-check    # TypeScript validation
  npm run build         # Production build
  npm run playwright    # E2E tests (optional)
  # Vercel auto-deploys on git push
  ```

  **Backend**:

  ```bash
  cd server
  npm run lint          # ESLint
  npm run type-check    # TypeScript (if using)
  # Manual deployment:
  # 1. SSH to server
  # 2. git pull
  # 3. npm install
  # 4. npm start (or pm2 restart)
  ```

  ---

  ## Deployment & DevOps

  ### Frontend Deployment (Vercel)

  **Automatic**:

  - Trigger: Push to main branch
  - Process: Auto-build with `npm run build`
  - Environment: Configured in Vercel dashboard
  - CDN: Global edge network

  **Manual Deployment**:

  ```bash
  # Install Vercel CLI
  npm i -g vercel

  # Deploy
  vercel --prod

  # Or push to git and Vercel auto-deploys
  ```

  **Environment Variables** (set in Vercel dashboard):

  ```
  NEXT_PUBLIC_API_URL=https://api.ecoxchange.com
  NEXT_PUBLIC_FIREBASE_API_KEY=***
  NEXT_PUBLIC_RAZORPAY_KEY_ID=***
  # ... all NEXT_PUBLIC_* vars
  ```

  ### Backend Deployment (Manual)

  **Prerequisites**:

  - Linux server (Ubuntu 20.04+)
  - Node.js 18+
  - SSH access
  - MongoDB Atlas connection string

  **Initial Setup**:

  ```bash
  ssh user@server.com

  # Clone repo
  git clone https://github.com/org/ecoxchange-server.git
  cd ecoxchange-server

  # Install dependencies
  npm install

  # Create .env file
  cp .env.example .env
  # Edit .env with production values
  nano .env

  # Start server
  npm start
  # Or use PM2 for process management
  npm i -g pm2
  pm2 start server.js --name ecoxchange
  pm2 save
  ```

  **Updates**:

  ```bash
  # SSH to server
  ssh user@server.com
  cd ecoxchange-server

  # Pull latest code
  git pull

  # Install new dependencies
  npm install

  # Restart server
  pm2 restart ecoxchange
  ```

  **Monitoring**:

  ```bash
  pm2 list                    # Running processes
  pm2 logs ecoxchange         # Application logs
  pm2 monit                   # Resource monitoring
  ```

  ### Environment Variables

  **Frontend (.env.local)**:

  ```
  # API
  NEXT_PUBLIC_API_URL=http://localhost:5000/api

  # Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY=***
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ecoxchange-a7cb8.firebaseapp.com
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=ecoxchange-a7cb8
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ecoxchange-a7cb8.appspot.com
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=***
  NEXT_PUBLIC_FIREBASE_APP_ID=***
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=***

  # Razorpay
  NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_***

  # Google Maps
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy***

  # Feature Flags
  NEXT_PUBLIC_ENABLE_PHONE_AUTH=true
  ```

  **Backend (.env)**:

  ```
  # Server
  PORT=5000
  NODE_ENV=production

  # Database
  MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ecoxchange

  # JWT
  JWT_SECRET=your-very-secret-key-min-32-chars-long
  JWT_EXPIRES_IN=7d

  # Firebase Admin
  FIREBASE_PROJECT_ID=ecoxchange-a7cb8
  FIREBASE_CLIENT_EMAIL=firebase-***@appspot.gserviceaccount.com
  FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

  # Razorpay
  RAZORPAY_KEY_ID=rzp_test_***
  RAZORPAY_KEY_SECRET=***

  # Cloudinary
  CLOUDINARY_CLOUD_NAME=dlcqussi7
  CLOUDINARY_API_KEY=***
  CLOUDINARY_API_SECRET=***

  # Client URL (for CORS)
  CLIENT_URL=http://localhost:3000

  # Feature Flags
  OTP_BYPASS=false
  DEMO_OTP=123456
  USE_MOCK_AI=true
  ```

  ---

  ## Testing Strategy

  ### Frontend Testing (Playwright E2E)

  **Test Files**:

  - `e2e/auth.spec.ts` - Authentication flows
  - `e2e/basic.spec.ts` - Smoke tests
  - `e2e/delivery.spec.ts` - Delivery features
  - `e2e/phone.spec.ts` - Phone verification

  **Run Tests**:

  ```bash
  npm run playwright      # Run all tests
  npm run playwright:ui   # Interactive UI
  npm run playwright:debug # Debug mode
  ```

  **Example Test**:

  ```typescript
  // e2e/auth.spec.ts
  import { test, expect } from "@playwright/test";

  test("User can log in with phone OTP", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");

    // Enter phone
    await page.fill('input[placeholder="Enter phone"]', "+919876543210");
    await page.click("button:has-text('Send OTP')");

    // Wait for OTP page
    await expect(page).toHaveURL(/.*otp/);

    // Enter OTP (mocked to "123456")
    await page.fill('input[placeholder="Enter OTP"]', "123456");
    await page.click("button:has-text('Verify')");

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
  ```

  ### Backend Testing (Jest)

  **Setup** (not primary but available):

  ```bash
  npm install --save-dev jest supertest @types/jest
  ```

  **Example Test** (if implemented):

  ```javascript
  const request = require("supertest");
  const app = require("../app");

  describe("POST /api/auth/send-otp", () => {
    test("Should send OTP to valid phone", async () => {
      const response = await request(app)
        .post("/api/auth/send-otp")
        .send({ phone: "+919876543210" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("OTP sent");
    });

    test("Should rate limit after 5 attempts", async () => {
      // Send 5 OTPs
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/api/auth/send-otp")
          .send({ phone: `+9198765432${i}0` });
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post("/api/auth/send-otp")
        .send({ phone: "+919876543200" });

      expect(response.status).toBe(429);
    });
  });
  ```

  ### Testing Checklist

  - [ ] Authentication flows (phone OTP, Firebase, fallback)
  - [ ] Authorization (RBAC for all roles)
  - [ ] Payment flow (create order → verify)
  - [ ] Pickup workflow (submit → assign → collect → verify)
  - [ ] Wallet operations (add → deduct → withdraw)
  - [ ] Socket.IO real-time (notifications deliver)
  - [ ] Offline sync (actions queued and synced)
  - [ ] Form validation (Zod schemas)
  - [ ] Error handling (all error paths)
  - [ ] Rate limiting (endpoints respect limits)
  - [ ] Database constraints (unique indexes, required fields)

  ---

  ## Common Tasks

  ### How to Add a New User Role

  1. Add role to backend User model:

    ```javascript
    // models/User.js
    const roles = ["trial_member", "member", "supervisor", "new_role"];
    role: { type: String, enum: roles, required: true }
    ```

  2. Add RBAC in guards.js:

    ```javascript
    // middleware/guards.js
    authorize("admin", "new_role", "supervisor");
    ```

  3. Add navigation in frontend:

    ```typescript
    // config/role-nav.ts
    export const NAV_BY_ROLE = {
      new_role: [
        { label: "Dashboard", href: "/dashboard" },
        // ... role-specific items
      ],
    };
    ```

  4. Create routes folder:
    ```
    src/app/new-role/
    ├── page.tsx
    ├── layout.tsx
    └── [action]/
        └── page.tsx
    ```

  ### How to Add a New API Field

  1. Update MongoDB schema:

    ```javascript
    // models/Pickup.js
    pickupSchema.add({
      newField: { type: String, required: false },
    });
    ```

  2. Update frontend types:

    ```typescript
    // types/api.ts
    export interface Pickup {
      // ... existing fields
      newField?: string;
    }
    ```

  3. Update forms if needed:

    ```typescript
    // Add to Zod schema
    const pickupSchema = z.object({
      newField: z.string().optional(),
    });
    ```

  4. Run migrations for existing data

  ### How to Integrate a Third-Party Service

  1. Install package:

    ```bash
    npm install third-party-sdk
    ```

  2. Create config file:

    ```javascript
    // config/thirdParty.js
    module.exports = initThirdParty({
      apiKey: process.env.THIRD_PARTY_KEY,
    });
    ```

  3. Create service layer:

    ```javascript
    // services/thirdPartyService.js
    async function doSomething(params) {
      const thirdParty = require("../config/thirdParty");
      return await thirdParty.api.call(params);
    }
    ```

  4. Use in controller:
    ```javascript
    // controllers/someController.js
    const service = require("../services/thirdPartyService");
    result = await service.doSomething(data);
    ```

  ### How to Debug Production Issues

  1. Check logs:

    ```bash
    pm2 logs ecoxchange
    # Or SSH and check
    tail -f /var/log/ecoxchange.log
    ```

  2. Check database:

    ```bash
    # Connect to MongoDB Atlas
    mongosh "mongodb+srv://user:pass@cluster.mongodb.net/ecoxchange"

    # Find error patterns
    db.AuditLog.find({ action: "error" }).sort({ createdAt: -1 }).limit(10);
    ```

  3. Check API response:

    ```bash
    curl -X GET http://api.ecoxchange.com/api/status \
      -H "Authorization: Bearer <token>"
    ```

  4. Check Socket.IO connections:
    ```javascript
    // In backend server.js
    io.on("connection", (socket) => {
      console.log(`Total connected: ${io.engine.clientsCount}`);
    });
    ```

  ---

  ## Known Issues & Tech Debt

  ### Critical Issues (Fix Before Production)

  1. **OTP Stored in Plaintext** (🔴 CRITICAL)
    - Location: `models/Otp.js`
    - Impact: Database breach exposes active OTPs
    - Fix: Hash OTP with bcryptjs before storing

  2. **SMS Gateway Not Implemented** (🔴 CRITICAL)
    - Location: `controllers/authController.js`
    - Current: `console.log()` only
    - Impact: Phone auth broken in production
    - Fix: Integrate Twilio/AWS SNS/Kaleyra

  3. **No Payment Reconciliation** (🔴 CRITICAL)
    - Location: `controllers/paymentController.js`
    - Impact: Webhook failure → payment unrecorded
    - Fix: Implement daily reconciliation job

  ### High Priority Issues

  4. **Token Never Revoked** (🟠 HIGH)
    - Location: No token blacklist implemented
    - Impact: Stolen token valid for 7 days
    - Fix: Implement Redis blacklist on logout

  5. **No CSRF Protection** (🟠 HIGH)
    - Location: Express app
    - Impact: State-changing requests vulnerable to CSRF
    - Fix: Add `csurf` middleware

  ### Medium Priority Issues

  6. **Unused Prisma Schema** (🟡 MEDIUM)
    - Location: `prisma/schema.prisma`
    - Impact: Confusion, schema sync out of date
    - Fix: Delete Prisma files (using Mongoose only)

  7. **Empty auth.ts File** (🟡 MEDIUM)
    - Location: `src/lib/auth.ts`
    - Impact: Auth logic scattered in components
    - Fix: Centralize auth utilities

  8. **No Rate Limiting Optimization** (🟡 MEDIUM)
    - Location: `app.js`
    - Impact: Global limit unfair to individual users
    - Fix: Implement per-user rate limiting

  9. **Socket.IO Not Scalable** (🟡 MEDIUM at scale)
    - Location: `config/socket.js`
    - Impact: Can't scale horizontally without Redis
    - Fix: Add Redis adapter for multi-server deployment

  ### Low Priority (Nice to Have)

  10. **No Monitoring/Alerting** (🟢 LOW for MVP)
  11. **No Structured Logging** (🟢 LOW for MVP)
  12. **No Caching Layer** (🟢 LOW for MVP, optimize at scale)

  ---

  ## Architectural Decisions

  ### Why Zustand Instead of Redux?

  - **Simpler API**: Easier to learn and use
  - **Less Boilerplate**: No actions/reducers/dispatches
  - **Built-in Persistence**: `persist` middleware out of the box
  - **Smaller Bundle**: ~2KB vs Redux ~15KB
  - **Type-Safe**: Works well with TypeScript

  ### Why Mongoose Over Raw MongoDB?

  - **Schema Validation**: Models enforce data structure
  - **Pre/Post Hooks**: Automatic computed fields, hashing, etc.
  - **Query Builder**: Type-safe query construction
  - **Relationships**: Easier to manage references
  - **Community**: Mature ecosystem, lots of middleware

  ### Why Express Over Next.js API Routes for Backend?

  - **Clear Separation**: Frontend and backend are independent services
  - **Scalability**: Can deploy backend separately, scale independently
  - **Performance**: Pure backend service (no Next.js framework overhead)
  - **Familiarity**: Express is industry standard for Node.js backends
  - **Socket.IO**: Easier to integrate WebSockets with Express

  ### Why Tailwind CSS Instead of CSS-in-JS?

  - **Performance**: Pure CSS (no runtime JS)
  - **Developer Experience**: Utility-first is fast to prototype
  - **Bundle Size**: Tree-shakeable CSS
  - **Consistency**: Predefined color/spacing system
  - **No Runtime**: Faster page loads

  ### Why Firebase Phone Auth?

  - **Simplicity**: Firebase handles SMS + CAPTCHA + rate limiting
  - **Security**: Google-backed, handles edge cases
  - **Cost**: Included in free tier initially
  - **OTP Fallback**: Custom backend OTP for offline/failover

  ### Why Razorpay Over Stripe?

  - **India Focus**: Perfect for INR payments
  - **UPI Support**: Most users in India use UPI
  - **Regulatory**: Already compliant with Indian banking regs
  - **Cost**: Competitive pricing for Indian market

  ---

  ## File Tree Reference

  For detailed directory contents, see `structure.txt` in repository root.

  Key Directories:

  - **Frontend Source**: `ecoxchang-client/src/` (React components, state, utilities)
  - **Backend Source**: `server/src/` (Controllers, models, routes, middleware)
  - **Documentation**: Root directory (multiple .md files generated during analysis)
  - **Configuration**: `*.config.*` files (Next.js, Playwright, Tailwind, etc.)

  ---

  ## Quick Reference Commands

  ### Development

  ```bash
  # Frontend dev server
  cd ecoxchang-client && npm run dev

  # Backend dev server
  cd server && npm start

  # Run linter
  npm run lint

  # Type checking
  npm run type-check

  # Build production
  npm run build
  ```

  ### Testing

  ```bash
  # E2E tests
  npm run playwright

  # E2E with UI
  npm run playwright:ui

  # Debug mode
  npm run playwright:debug
  ```

  ### Database

  ```bash
  # Seed demo data
  cd server && npm run seed

  # Migration (if applicable)
  node scripts/migrate-*.js
  ```

  ### Deployment

  ```bash
  # Frontend (Vercel)
  git push origin main
  # Auto-deploys

  # Backend (manual)
  ssh user@server
  cd ~/ecoxchange-server
  git pull
  npm install
  pm2 restart ecoxchange
  ```

  ---

  ## Support & Troubleshooting

  ### Issue: "Cannot find module 'firebase'"

  ```bash
  npm install firebase
  # or re-install all dependencies
  npm install
  ```

  ### Issue: "MONGODB_URI is not set"

  ```bash
  # Check .env file
  cat .env
  # Must have: MONGODB_URI=mongodb+srv://...
  ```

  ### Issue: "Socket connection refused"

  ```bash
  # Check backend is running
  curl http://localhost:5000/api/health

  # Check CORS is configured
  # In app.js:
  app.use(cors({ origin: "http://localhost:3000" }));
  ```

  ### Issue: "Razorpay test key rejected"

  ```bash
  # Make sure using test key, not live key
  RAZORPAY_KEY_ID=rzp_test_***  # Should have "test"
  ```

  ---

  ## Contact & Resources

  - **Repository**: GitHub repo link
  - **Documentation**: See generated .md files (phases 1-7)
  - **Issues**: GitHub Issues
  - **Slack**: Team Slack channel

  ---


  **Document Version**: 1.0.0  
  **Last Generated**: Phase 8 Complete  
  **Status**: Ready for Production Review  
  **Next Step**: Implement critical security fixes before launch
