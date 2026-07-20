# Frontend Architecture - EcoXchange

## Overview

The EcoXchange frontend is a modern Next.js 16+ application with TypeScript, built using the App Router pattern. It implements a role-based dashboard system with route protection, state management via Zustand, data fetching with TanStack Query, and real-time notifications via Socket.IO.

---

## Routing Architecture

### Route Structure

The application uses Next.js App Router with route groups for organization:

```
app/
├── (auth)/                          # Auth flows - accessible before login
│   ├── login/
│   │   ├── page.tsx                 # Login form (email/password)
│   │   └── layout.tsx
│   ├── register/
│   │   ├── page.tsx                 # Registration form
│   │   └── layout.tsx
│   ├── verify-otp/
│   │   ├── page.tsx                 # OTP verification flow
│   │   └── layout.tsx
│   └── forgot-password/
│       ├── page.tsx                 # Password recovery
│       └── layout.tsx
│
├── dashboard/                       # Main dashboard container
│   └── [role]/                      # Dynamic role segment
│       ├── dashboard/
│       ├── profile/
│       └── ...role-specific routes
│
├── trial/                           # Trial member routes
│   ├── dashboard/
│   ├── schedule/
│   ├── marketplace/
│   ├── rewards/
│   └── profile/
│
├── member/                          # Member/Citizen routes
│   ├── dashboard/
│   ├── pickups/
│   ├── orders/
│   ├── wallet/
│   ├── rewards/
│   └── profile/
│
├── delivery/                        # Delivery agent routes
│   ├── dashboard/
│   ├── tasks/
│   ├── scanner/
│   ├── location/
│   └── profile/
│
├── recycler/                        # Recycler routes
│   ├── dashboard/
│   ├── shipments/
│   ├── products/
│   ├── analytics/
│   └── profile/
│
├── supervisor/                      # Supervisor routes
│   ├── dashboard/
│   ├── verification/
│   ├── dispatch/
│   ├── agents/
│   └── profile/
│
├── admin/                           # Admin routes
│   ├── dashboard/
│   ├── users/
│   ├── analytics/
│   ├── settings/
│   └── audit-logs/
│
├── api/                             # API route handlers (optional - mostly via backend)
│   └── [routes]/
│
├── roles/                           # Role management endpoints (legacy)
├── layout.tsx                       # Root layout
├── page.tsx                         # Home/landing page
└── not-found.tsx                    # 404 handler
```

### Route Guards & Redirects

**next.config.ts** implements intelligent routing:

```typescript
// Rewrites: /dashboard/:role/* → /:role/*
// Redirects: Legacy paths redirected to canonical paths
// Examples:
//   /agent → /dashboard/delivery/dashboard
//   /trial → /dashboard/trial/dashboard
//   /:role/:path* → /dashboard/:role/:path*
```

### Navigation Configuration

**role-nav.ts** defines navigation items per role:

```typescript
export const NAV_BY_ROLE: Record<AppRole, NavItem[]> = {
  trial: [
    { name: "Dashboard", href: "/trial/dashboard" },
    { name: "Schedule", href: "/trial/schedule" },
    { name: "Marketplace", href: "/trial/marketplace" },
    { name: "Rewards", href: "/trial/rewards" },
    { name: "Profile", href: "/trial/profile" },
  ],
  member: [
    { name: "Dashboard", href: "/member/dashboard" },
    // ... more items
  ],
  // ... other roles
};
```

---

## Component Hierarchy

### Layout Structure

```
RootLayout
├── AppProviders
│   ├── QueryClientProvider (TanStack Query)
│   ├── ThemeProvider (next-themes)
│   ├── AuthInitializer (Zustand + Socket.IO)
│   ├── Toaster (react-hot-toast)
│   └── children
│
├── PublicLayout (/)
│   └── LandingPage
│
├── AuthLayout ((auth))
│   ├── AuthContainer
│   └── Auth page (Login/Register/OTP)
│
└── DashboardLayout (/:role/*)
    ├── Sidebar
    ├── Navbar
    │   ├── NotificationBell (with Socket.IO listener)
    │   ├── UserMenu
    │   └── Settings
    ├── MainContent
    └── Footer (optional)
```

### Component Categories

#### **UI Components** (`/components/ui/`)

Base Glass morphism UI components styled with Tailwind:

- `GlassCard` - Card with backdrop blur
- `GradientButton` - Button with gradient hover
- `FormInput` - Custom input with validation
- `Modal` - Dialog component
- `Tabs` - Tab navigation
- `Badge` - Status badge
- `Loading` - Spinner/skeleton
- `Toast` - Notification

#### **Layout Components** (`/components/layout/`)

Page structure components:

- `Sidebar` - Role-specific navigation menu
- `Navbar` - Top navigation bar
- `DashboardContainer` - Main content wrapper
- `Footer` - Page footer

#### **Auth Components** (`/components/auth/`)

Authentication UI:

- `PhoneInput` - Phone number field with country code
- `OTPInput` - 6-digit OTP code input
- `LoginForm` - Email/password login
- `RegisterForm` - New user registration
- `PasswordReset` - Forgot password flow

#### **Dashboard Components** (`/components/dashboard/`)

Role-specific dashboard elements:

- `MetricCard` - KPI display (eco-points, CO2, etc)
- `ActivityFeed` - Recent actions timeline
- `QuickActions` - Common task buttons
- `ChartWidget` - Recharts wrapper
- `StatGrid` - Grid of statistics

#### **Eco Components** (`/components/eco/`)

EcoXchange-specific UI:

- `NotificationBell` - Real-time notifications with Socket.IO
- `EcoPointsDisplay` - Points & rewards badge
- `WasteTypeIcon` - Waste category icons
- `CarbonSaved` - CO2 impact visualization
- `ImpactMeter` - Progress indicator for goals

#### **Forms Components** (`/components/forms/`)

Complex form patterns:

- `PickupRequestForm` - Submit waste for pickup
- `ProductListingForm` - Recycler product creation
- `PaymentForm` - Membership/payment form (Razorpay integration)
- `ProfileEditForm` - User profile update
- `SearchForm` - Marketplace search

---

## State Management

### Zustand Stores

#### **useAuthStore**

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  backendModel: string | null;
  isAuthenticated: boolean;
  pendingPhone: string | null;
  isNewUser: boolean;
  otpMode: "firebase" | "backend" | null;

  // Actions
  login(userData: User): void;
  setSession(args): void;
  logout(): void;
  setPendingPhone(phone: string | null): void;
  updateUser(patch: Partial<User>): void;
}
```

**Persistence**: Uses Zustand persist middleware, stored in `localStorage` with key `"ecoxchange-auth-v2"`

#### **useCartStore** (Marketplace)

```typescript
interface CartState {
  items: CartItem[];
  addItem(product): void;
  removeItem(productId): void;
  updateQuantity(productId, qty): void;
  clearCart(): void;
  // ... computed getters (total, count, etc)
}
```

### Data Fetching Strategy

**TanStack Query** (React Query) is configured with:

- Stale time: 60 seconds
- No refetch on window focus
- Default cache invalidation on mutations

Typical usage:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["pickups", userId],
  queryFn: () => api.get(`/pickups?userId=${userId}`),
});
```

---

## Authentication Flow

### Phone OTP Flow

```
1. User enters phone → sendOtp()
   ├─ Backend sends OTP (or demo mode returns it)
   └─ Stores OTP in session

2. User receives OTP via SMS (or sees in demo)

3. User enters OTP → verifyOtp()
   ├─ Backend validates OTP
   ├─ If new phone: return isNewUser=true
   └─ If existing: return token + user data

4. If new user:
   ├─ Register with email/password/address
   └─ Backend creates user

5. setSession({ token, user, backendModel })
   ├─ Stores token in Zustand + localStorage
   ├─ Initializes socket connection
   └─ Redirects to role dashboard

6. AuthInitializer on app load:
   ├─ If token exists: fetch /auth/me
   ├─ If valid: update auth state
   └─ If 401: logout & redirect to login
```

### Token Management

- **JWT Token**: Included in every request via axios interceptor
- **Authorization Header**: `Bearer <token>`
- **Interception**: axios automatically adds token to headers
- **401 Handling**: Triggers logout & redirects to login
- **No Refresh Tokens**: Only 7-day expiry (can implement sliding window)

### Role Mapping

API roles → App roles (via `role-map.ts`):

```
API Role          → App Role (dashboard segment)
trial_member      → trial
member            → member
citizen           → member
supervisor        → supervisor
delivery_agent    → delivery
recycler          → recycler
admin             → admin
```

---

## Real-Time Architecture (Socket.IO)

### Socket Connection Flow

```
socket = io(process.env.NEXT_PUBLIC_API_URL, {
  autoConnect: false,  // Manual connect
  withCredentials: true,
})
```

### Event Handling

**Client listens for notifications**:

```typescript
// In AuthInitializer component
socket.on("notification", (data) => {
  toast.success({
    title: data.title,
    message: data.message,
  });
});
```

**User joins room on login**:

```typescript
socket.emit("join", user.id); // Backend joins socket to user ID room
```

**Server broadcasts to user**:

```javascript
// Backend
io.to(userId).emit("notification", { title, message });
```

### Notification Types

- Pickup status changes (assigned, completed, rejected)
- Order confirmations
- Reward claims
- Admin announcements
- System alerts

---

## API Communication

### Axios Configuration

```typescript
// baseURL configured from environment
const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  withCredentials: true,
});

// Request interceptor: adds Bearer token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handles 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### Data Fetching Patterns

**useQuery** for reads:

```typescript
const { data: pickups } = useQuery({
  queryKey: ["pickups"],
  queryFn: () => api.get("/pickups"),
});
```

**useMutation** for writes:

```typescript
const createPickup = useMutation({
  mutationFn: (data) => api.post("/pickups", data),
  onSuccess: () => {
    queryClient.invalidateQueries(["pickups"]);
  },
});
```

---

## Offline Capability

### Offline Queue System

**offlineSync.ts** implements:

1. Queue failed requests in localStorage
2. Store: `{ id, type, url, method, payload, timestamp }`
3. On reconnect: retry all queued actions
4. Idempotency: Include `idempotencyKey` in retries

```typescript
queueAction({
  type: "status_change",
  url: "/pickups/123/status",
  method: "PATCH",
  payload: { status: "completed" },
});

// Later, when online:
await syncOfflineQueue();
```

### Proof Upload Offline

- Capture image as base64
- Queue the upload request
- On sync: convert base64 → blob → FormData upload

---

## Form Architecture

### React Hook Form Integration

```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {},
});

// Template
<form onSubmit={form.handleSubmit(onSubmit)}>
  <input {...form.register("field")} />
  {form.formState.errors.field && <Error />}
</form>
```

### Validation

**Zod Schema** for client-side validation:

```typescript
const pickupSchema = z.object({
  wasteType: z.enum([
    "plastic",
    "paper",
    "metal",
    "glass",
    "organic",
    "ewaste",
  ]),
  weight: z.number().min(0.1).max(500),
  address: z.string().min(5),
  scheduledDate: z.date().min(tomorrow),
});
```

---

## Styling & Theme

### Tailwind CSS Configuration

- **Colors**: Gradient from blue → purple
- **Dark Mode**: Supported via next-themes
- **Glass Morphism**:
  ```css
  bg-white/70 backdrop-blur-md border border-white/20
  ```
- **Animations**: Framer Motion for scale, glow effects

### Responsive Design

Mobile-first approach:

```typescript
// Sidebar hidden on mobile, shown on tablet+
<Sidebar className="hidden md:block" />

// Stacked layout on mobile
<div className="flex flex-col md:flex-row gap-4">
```

---

## Performance Optimizations

1. **Image Optimization**: Next.js `<Image>` component
2. **Code Splitting**: Automatic route-based splitting
3. **Lazy Loading**: Dynamic imports for heavy components
4. **Query Caching**: TanStack Query with 60s stale time
5. **Memoization**: React.memo for expensive renders
6. **Debouncing**: Search/filter inputs (lodash.debounce)

---

## Error Handling

### Error Boundary

```typescript
// Catches React component errors
<ErrorBoundary fallback={<ErrorPage />}>
  <Dashboard />
</ErrorBoundary>
```

### API Error Handling

```typescript
try {
  await api.post("/pickup", data);
  toast.success("Pickup scheduled!");
} catch (error) {
  const message = error.response?.data?.message || "An error occurred";
  toast.error(message);
}
```

### User-Friendly Messages

- Show validation errors inline
- Toast notifications for async operations
- Fallback to generic message if backend error

---

## Build & Deployment

### Build Process

```bash
npm run lint      # ESLint
npm run build     # Next.js build (static generation + dynamic routes)
npm start         # Production server
```

### Optimization Flags

- Image optimization enabled
- Font optimization via Google Fonts
- CSS extraction & minification

---

## Testing Strategy

### E2E Tests (Playwright)

**auth.spec.ts** tests:

- Phone OTP flow
- New user registration
- Existing user login
- Logout

**delivery.spec.ts** tests:

- Agent dashboard loading
- Task assignment acceptance
- Proof photo capture
- Status updates

**Approach**:

- Test actual workflows
- Connect to MongoDB for data validation
- Clean up test data after each run

---

## Known Issues & Limitations

1. **Token Refresh**: 7-day expiry without sliding window
2. **Offline Sync**: No conflict resolution if offline data stales
3. **SSR Data Fetching**: Limited - most data fetched client-side
4. **Image Upload**: Direct FormData upload (should use pre-signed URLs)
5. **Type Safety**: Some `any` types in legacy components
6. **Accessibility**: WCAG compliance not fully audited

---

## Directory Tree (Frontend Only)

```
src/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── trial/
│   ├── member/
│   ├── delivery/
│   ├── recycler/
│   ├── supervisor/
│   ├── admin/
│   ├── api/
│   ├── roles/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── not-found.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── layout/
│   ├── auth/
│   ├── dashboard/
│   ├── eco/
│   └── forms/
├── lib/
│   ├── api.ts
│   ├── firebase.ts
│   ├── socket.ts
│   ├── phone.ts
│   ├── role-map.ts
│   ├── path-role.ts
│   ├── offlineSync.ts
│   ├── utils.ts
│   └── mock/
├── config/
│   └── role-nav.ts
├── store/
│   ├── useAuthStore.ts
│   └── useCartStore.ts
├── providers/
│   └── AppProviders.tsx
└── types/
    └── api.ts
```

---

## Conclusion

The EcoXchange frontend is a modern, scalable, and user-friendly application with role-based dashboards, real-time notifications, offline capabilities, and comprehensive form handling. It follows Next.js best practices and provides an excellent foundation for further development and scaling.
