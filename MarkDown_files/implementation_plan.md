# EcoXchange Implementation Plan

This document outlines the architecture, tech stack, and step-by-step implementation plan for **EcoXchange**, a futuristic role-based civic-tech platform for waste segregation and circular economy management.

## User Review Required

> [!IMPORTANT]
> - **Database Choice**: I plan to use **MongoDB** (with Mongoose) as it allows for rapid scaffolding of the data models required for this MVP, while integrating seamlessly with Next.js API routes.
> - **Authentication**: I will use **NextAuth.js** (Auth.js) with a custom credentials provider using JWTs for Role-Based Access Control (RBAC). 
> - **Framework**: **Next.js 14+ (App Router)** will be used to handle both the frontend UI and the backend API routes, keeping everything tightly integrated in a single repository.
> 
> Please confirm if you are okay with these technical choices before I begin the execution.

## Open Questions

> [!WARNING]
> 1. Should I use TypeScript for this project? (Highly recommended for a production-grade SaaS to enforce role and data structure typing).
> 2. For the mock AI assistant, would you like a simple pre-defined chat tree, or just a visual UI that shows a placeholder response for now?

## Proposed Architecture & Design

### 1. Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + `framer-motion` (for smooth scale/glow animations) + custom Glassmorphism utilities.
- **Components:** Radix UI / Shadcn UI base for accessible modals and dropdowns, customized heavily for the neo-futuristic look.
- **Database:** MongoDB + Mongoose
- **Auth:** NextAuth.js (JWT strategy)
- **Charts:** Recharts

### 2. Design System
- **Colors:**
  - Background: Soft off-white (`#f8fafc` or similar).
  - Accents: Blue (`#3b82f6`) to Purple (`#8b5cf6`) gradients.
  - Success States: Cyan glow (`#06b6d4`).
- **UI Elements:**
  - Glassmorphism: `bg-white/70 backdrop-blur-md border border-white/20`.
  - Hover effects: `hover:scale-[1.03] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-300`.
- **Typography:** Space Grotesk (Headings), Inter (Body).

### 3. Folder Structure
```text
/
├── app/
│   ├── (auth)/             # Login / Register
│   ├── (public)/           # Landing page
│   ├── (dashboards)/
│   │   ├── member/         # 5-day trial, Bins, Rewards, Marketplace
│   │   ├── agent/          # Mobile-first route list, QR scanner mock
│   │   ├── supervisor/     # Verification queue, dispatch, tables
│   │   ├── recycler/       # Incoming shipments, processing
│   │   └── admin/          # User management, audit logs
│   ├── api/                # Backend API Routes
│   │   ├── auth/           # NextAuth integration
│   │   ├── waste/          # Waste tracking endpoints
│   │   ├── marketplace/    # Products
│   │   └── users/          # RBAC user management
│   ├── layout.tsx          # Global providers (Auth, Toast, etc.)
│   └── page.tsx            # Public Landing Page
├── components/
│   ├── ui/                 # Reusable buttons, cards, inputs (Glass UI)
│   ├── charts/             # Recharts wrappers
│   └── layout/             # Sidebar, Navbar, AI Assistant Orb
├── lib/
│   ├── db.ts               # MongoDB connection
│   └── auth.ts             # NextAuth configuration
├── models/
│   ├── User.ts
│   ├── WasteRecord.ts
│   ├── Shipment.ts
│   └── Product.ts
└── middleware.ts           # Route protection based on user roles
```

### 4. Database Schema (Mongoose Models)
- **User:** `name`, `email`, `password` (hashed), `role` (enum), `trialProgress` (0-5), `address`.
- **WasteRecord:** `userId`, `type`, `weight`, `status` (pending, verified, rejected), `verifiedBy` (supervisorId).
- **Shipment:** `agentId`, `recyclerId`, `records` (array of WasteRecord IDs), `status` (dispatched, accepted, processed).
- **Product (Marketplace):** `sellerId`, `title`, `price`, `ecoScore`, `status` (pending, approved), `image`.

## Proposed Changes

### Setup & Infrastructure
- Initialize Next.js project with Tailwind CSS.
- Install necessary dependencies (`mongoose`, `next-auth`, `recharts`, `framer-motion`, `lucide-react`, `bcryptjs`).
- Setup MongoDB connection utility.

### Frontend Components
- **Global:** Setup custom Tailwind theme in `tailwind.config.ts`, import fonts, create base UI components (GlassCard, GradientButton).
- **Authentication:** Sign In / Sign Up pages with role selection/detection.
- **Dashboards:** Build out the structural layouts (Sidebars, Topbars) for the 5 different roles.
- **Specific Views:**
  - *Member*: Trial progress ring, daily task cards, marketplace grid.
  - *Agent*: Mobile-optimized list, mock camera overlay for QR.
  - *Supervisor*: Data tables, approval buttons.
  - *Recycler*: Shipment acceptance panels, input/output forms.
  - *Admin*: Recharts visualizations, system overview.

### Backend API
- Create RESTful API routes under `/app/api` to handle CRUD operations for Waste, Shipments, and Marketplace.
- Implement middleware to secure routes (e.g., Recycler cannot access `/api/users`).

### Mock Data
- Create a setup script or API endpoint to seed the database with dummy users, active waste records, and marketplace items for immediate demonstration.

## Verification Plan

### Automated/Manual Testing
1. **Routing & Auth:** Log in as each of the 5 roles and verify that unauthorized access to other dashboards is blocked.
2. **Member Flow:** Register a new user, check that trial is at 0/5, mock completing a task, verify it increments.
3. **Supervisor Flow:** Verify waste submissions appear in the Supervisor queue and can be approved/rejected.
4. **UI Validation:** Ensure all hover states trigger the requested `scale 1.03` and cyan glow. Verify responsive design (especially the Agent mobile view).
