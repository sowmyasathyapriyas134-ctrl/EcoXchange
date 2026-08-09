# EcoXchange – Low-Level Design (LLD)

**Project:** EcoXchange  
**Document:** Low-Level Design (LLD)  
**Version:** 1.0  
**Status:** Production / Project Score Viva Preparation  
**Architecture:** React + Vite + Node.js + Express + MongoDB + PostgreSQL

---

# 1. Purpose

This Low-Level Design document describes the implementation-level design of EcoXchange.

The PRD defines what the platform is expected to achieve, the HLD describes the overall system architecture, and this LLD explains how individual frontend components, backend modules, APIs, authentication flows, database models, business rules, integrations, and error-handling mechanisms work together.

The document is intended to:

- Explain the implementation structure of EcoXchange.
- Provide a map between features and technical modules.
- Support development, debugging, testing, and maintenance.
- Provide implementation context for the Project Score viva.
- Document important design decisions and failure cases.

---

# 2. System Scope

EcoXchange is a full-stack circular-economy platform connecting:

- Trial members
- Permanent members
- Supervisors
- Delivery agents
- Recyclers
- Administrators

Major functionality includes:

- Authentication and authorization
- Trial onboarding
- Permanent membership
- Toolkit and QR-code management
- Waste pickup scheduling
- Delivery-agent task management
- QR-based verification
- Proof capture and upload
- EcoPoints
- Wallet and rewards
- Referrals
- Marketplace
- Orders and tracking
- Admin operations
- Supervisor operations
- Recycler operations
- AI assistance
- Payment integration
- Notifications

---

# 3. Repository-Level Design

The project follows a two-application full-stack structure.

```text
EcoXchange/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── routes/
│   │   └── assets/
│   └── ...
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   ├── config/
│   └── ...
│
├── docs/
│   ├── PRD.md
│   ├── HLD.md
│   └── LLD.md
│
├── README.md
└── .gitignore
```

The exact filenames may evolve as the project is maintained; the architectural responsibility of each layer remains the same.

---

# 4. Frontend Low-Level Design

## 4.1 Frontend Technology

The client uses:

- React
- Vite
- JavaScript / JSX
- React Router
- Tailwind CSS
- React Query
- Zustand
- Framer Motion

The frontend is responsible for presentation, user interaction, client-side navigation, local state, server-state handling, and API communication.

---

# 5. React Component Design

EcoXchange follows component composition rather than placing all UI logic inside a single page.

A typical page is composed as:

```text
Page
│
├── Layout
│   ├── Navbar
│   └── Sidebar
│
├── Page Header
│
├── Feature Components
│   ├── Cards
│   ├── Tables
│   ├── Forms
│   └── Modals
│
└── Loading / Error / Empty States
```

Reusable components reduce duplication and make UI changes easier.

### Design principle

A component should ideally have a focused responsibility.

For example:

- A form component handles user input.
- A card component presents a piece of information.
- A modal handles a focused interaction.
- A page coordinates multiple components.

---

# 6. Frontend State Management

## 6.1 Local State

React `useState` is used for state that belongs to an individual component.

Examples include:

- Form fields
- Modal visibility
- Selected filters
- Search values
- Loading flags
- Selected products
- Temporary UI state

Example conceptual flow:

```text
User Input
   ↓
onChange
   ↓
setState
   ↓
React Re-render
   ↓
Updated UI
```

## 6.2 Shared State

Zustand can be used for application-level state that needs to be shared across components.

Typical examples include:

- Authenticated user information
- Authentication state
- Shared application state

## 6.3 Server State

React Query is used where appropriate for API/server state.

It provides mechanisms for:

- Fetching
- Caching
- Refetching
- Loading states
- Error states
- Mutation handling

---

# 7. Side Effects

`useEffect` is used for side effects such as:

- Fetching data when a page loads
- Reacting to authentication changes
- Synchronizing external state
- Registering event listeners
- Cleaning up listeners or resources

The dependency array controls when the effect executes.

A cleanup function is used when an effect creates a resource that needs to be released.

---

# 8. Client-Side Routing

React Router provides client-side navigation.

Conceptual route groups include:

```text
/
├── auth
│   ├── login
│   ├── register
│   └── verify
│
├── member
│   ├── dashboard
│   ├── marketplace
│   ├── cart
│   ├── orders
│   ├── pickups
│   ├── tracking
│   ├── wallet
│   ├── rewards
│   ├── referrals
│   └── membership
│
├── delivery
│   ├── tasks
│   ├── map
│   ├── scanner
│   ├── proofs
│   └── history
│
├── supervisor
├── recycler
└── admin
```

Protected routes verify authentication and role information before allowing access.

---

# 9. Frontend API Communication

The frontend communicates with the backend through HTTP APIs.

Conceptual flow:

```text
React Component
      ↓
API Service / Query
      ↓
HTTP Request
      ↓
Express Backend
      ↓
JSON Response
      ↓
React Query / State
      ↓
UI Update
```

The frontend should not directly access the database.

It also should not expose server-side secrets.

---

# 10. Loading, Error, and Empty States

API-driven pages should distinguish between:

### Loading

The request is still running.

### Success

Data has been received.

### Error

The request failed.

### Empty

The request succeeded but no records are available.

Conceptual state machine:

```text
Initial
  ↓
Loading
  ├── Success → Display Data
  ├── Error   → Display Error + Retry
  └── Empty   → Display Empty State
```

This prevents users from seeing blank screens when an API is slow or fails.

---

# 11. Form Design

Forms use controlled inputs where appropriate.

Conceptual flow:

```text
Input
 ↓
React State
 ↓
Client Validation
 ↓
Submit
 ↓
API Request
 ↓
Server Validation
 ↓
Business Logic
```

Client-side validation improves user experience, but server-side validation remains mandatory because client input cannot be trusted.

---

# 12. Backend Low-Level Design

The backend follows a layered Express architecture:

```text
HTTP Request
     ↓
Route
     ↓
Middleware
     ↓
Controller
     ↓
Service / Business Logic
     ↓
Model / Database
     ↓
Controller Response
     ↓
HTTP Response
```

Responsibilities:

### Routes

Define API endpoints.

### Middleware

Perform cross-cutting operations such as authentication, authorization, validation, logging, and security.

### Controllers

Coordinate request handling and response generation.

### Services

Contain reusable business logic and external-service integration where applicable.

### Models

Represent database entities and data-access structures.

### Validators

Validate request data before business logic is executed.

---

# 13. REST API Design

EcoXchange uses resource-oriented REST APIs.

Major API groups include:

```text
/api/auth
/api/users
/api/memberships
/api/marketplace
/api/orders
/api/pickups
/api/wallet
/api/ecopoints
/api/rewards
/api/referrals
/api/delivery
/api/supervisor
/api/admin
/api/recycler
/api/ai
```

HTTP methods:

```text
GET     Retrieve
POST    Create
PUT     Replace/update
PATCH   Partially update
DELETE  Remove
```

---

# 14. Authentication Design

EcoXchange supports secure authentication flows for registered users.

Conceptual authentication sequence:

```text
User
 ↓
Login / Registration
 ↓
Credential or OTP Verification
 ↓
Password Verification if applicable
 ↓
JWT Generation
 ↓
Token Returned
 ↓
Authenticated Client
```

The backend is responsible for authentication decisions.

The client cannot be trusted to declare its own identity or role.

---

# 15. JWT Design

For protected API requests:

```text
Client
 ↓
Authorization Header
 ↓
JWT Middleware
 ↓
Token Verification
 ↓
User Identity Extracted
 ↓
Authorization Check
 ↓
Controller
```

A JWT contains claims necessary to identify the authenticated user and relevant authorization information.

The server verifies the token before processing protected operations.

Invalid or expired tokens result in an authentication error.

---

# 16. Password Security

Passwords must never be stored as plain text.

The authentication flow is:

```text
Registration
 ↓
Validate Password
 ↓
bcrypt Hash
 ↓
Store Hash
```

During login:

```text
Login Password
 ↓
bcrypt Compare
 ↓
Match?
 ├── Yes → Continue
 └── No  → Reject
```

The original password is never stored.

---

# 17. Role-Based Authorization

EcoXchange has role-specific access.

Conceptual roles:

```text
citizen / member
supervisor
delivery agent
recycler
admin
```

Authorization occurs after authentication.

```text
JWT Verification
      ↓
User Role
      ↓
Role Permission Check
      ↓
Allowed → Controller
Denied  → 403
```

Example:

A delivery agent may access collection tasks, while an admin may access administrative management APIs.

---

# 18. Admin Authorization

Admin APIs are protected by centralized authorization middleware.

The backend verifies:

1. The request contains valid authentication.
2. The token identifies a valid user.
3. The user's role is administrative.
4. The account is eligible to access the operation.

Unauthorized users receive an appropriate error response.

---

# 19. Request Validation

Requests are validated before they reach sensitive business logic.

Validation can include:

- Required fields
- Email format
- Phone number format
- Password complexity
- IDs
- Numeric values
- Marketplace fields
- Pickup information
- File information

Invalid requests should return a client error such as HTTP 400 rather than causing an uncontrolled server exception.

---

# 20. Middleware Design

Middleware provides reusable request-processing logic.

Typical pipeline:

```text
Request
 ↓
CORS
 ↓
JSON Parsing
 ↓
Logging
 ↓
Authentication
 ↓
Authorization
 ↓
Validation
 ↓
Controller
```

Security middleware such as Helmet and rate limiting can be applied at the application or route level where appropriate.

---

# 21. Server-Side Error Handling

Errors are handled centrally where possible.

Expected error categories:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

The server should return useful error information without exposing:

- Passwords
- Tokens
- API keys
- Database credentials
- Internal stack traces in production

---

# 22. MongoDB Data Model

MongoDB is used for flexible document-oriented application data.

Important conceptual entities include:

```text
User
Wallet
Product
Order
Pickup
UserQRCode
UserToolkit
MembershipPurchase
Notification
Reward
Referral
DeliveryTask
PasswordReset
```

The actual schema definitions in the repository are the source of truth for field-level implementation.

---

# 23. User Model

The User entity represents an authenticated platform user.

Conceptual fields include:

```text
User
├── _id
├── name
├── email
├── phone
├── password
├── role
├── membershipStatus
├── address
├── accountStatus
└── timestamps
```

Important design considerations:

- Password is stored as a hash.
- Role determines authorization.
- Membership status determines member-level capabilities.
- Account status can be used to prevent suspended users from accessing protected operations.
- Address is represented using relevant components rather than relying on one unstructured string.

---

# 24. Wallet Model

The wallet represents a user's monetary or cashback-related balance.

Conceptual relationship:

```text
User
  │
  └── Wallet
```

Wallet-related operations must be performed server-side.

The frontend should not be trusted to calculate or directly set balances.

---

# 25. Toolkit Model

A permanent member can receive a toolkit associated with their membership.

Conceptually:

```text
User
 │
 └── Toolkit
      ├── Dustbins
      ├── Covers
      └── QR Stickers
```

The toolkit is associated with the relevant user so that issued resources can be tracked.

---

# 26. QR Code Model

Each eligible household/member can have a unique QR code.

Conceptual relationship:

```text
User
 │
 └── UserQRCode
```

The QR code is used to identify the household during collection.

The backend validates the QR information instead of trusting the scanned value alone.

---

# 27. Marketplace Model

Marketplace functionality contains entities such as:

```text
Product
Order
Order Items
Cart-related data
Listings where applicable
```

Conceptual relationship:

```text
User
 │
 ├── Orders
 │      └── Order Items
 │             └── Products
 │
 └── Marketplace Activity
```

Trial users are restricted from selling while eligible permanent members can access the appropriate selling functionality.

---

# 28. Pickup Model

A pickup represents a waste-collection request.

Conceptual fields include:

```text
Pickup
├── member/user reference
├── scheduled date
├── pickup category/type
├── status
├── assigned agent
├── verification information
└── timestamps
```

Typical states:

```text
Requested
Assigned
Accepted
Started
Paused
Resumed
Completed
Verified
Cancelled
```

Only valid state transitions should be accepted by the backend.

---

# 29. Delivery Task Model

A delivery task represents an operational assignment to a delivery agent.

Conceptual flow:

```text
Pickup
 ↓
Task Assignment
 ↓
Delivery Agent
 ↓
Task Lifecycle
```

Important operations include:

- Accept
- Reject
- Start
- Pause
- Resume
- Complete
- Upload proof
- Update tracking information

The backend verifies that the task belongs to the requesting delivery agent before allowing agent-specific operations.

---

# 30. Membership Model

Membership information tracks the user's membership lifecycle.

Conceptually:

```text
Registration
 ↓
Trial
 ↓
Verification Period
 ↓
Required EcoPoints / Qualification
 ↓
Permanent Membership
```

The membership purchase flow may include:

```text
Member
 ↓
Membership Purchase
 ↓
Payment
 ↓
Payment Verification
 ↓
Membership Update
 ↓
Toolkit / QR Association
```

---

# 31. Trial Membership Business Rules

The trial membership is designed as a limited onboarding period.

Rules include:

- New public registrations start as trial users.
- Trial users have limited access.
- The trial period is five days.
- The user must satisfy the configured EcoPoints requirement.
- Trial users can buy from the marketplace.
- Selling functionality is restricted during trial status.

These rules must be enforced by backend business logic rather than only by hiding frontend buttons.

---

# 32. EcoPoints Design

EcoPoints are used as a sustainability incentive.

Conceptual flow:

```text
Eligible Activity
 ↓
Verification
 ↓
Reward Calculation
 ↓
EcoPoints Update
 ↓
Member Dashboard
```

Reward calculations must be performed or validated on the server to prevent client-side manipulation.

---

# 33. Rewards Design

Rewards consume or use accumulated EcoPoints according to configured business rules.

The system should verify:

- User identity
- Available points
- Reward eligibility
- Requested quantity
- Duplicate redemption conditions

Only after successful validation should the points or reward state be updated.

---

# 34. Referral Design

The referral system connects an existing member with a referred user.

Conceptual flow:

```text
Existing Member
 ↓
Referral Code / Link
 ↓
New User Registration
 ↓
Referral Association
 ↓
Eligibility Verification
 ↓
Referral Reward
```

Referral rewards should be granted only after the defined eligibility conditions are satisfied.

---

# 35. Order Flow

A marketplace order follows:

```text
Browse Products
 ↓
Product Details
 ↓
Cart
 ↓
Checkout
 ↓
Payment
 ↓
Payment Verification
 ↓
Order Creation / Confirmation
 ↓
Order Tracking
```

The backend validates:

- Product availability
- Quantity
- User identity
- Price information
- Payment status
- Order state

The server should calculate trusted financial values instead of accepting arbitrary totals from the client.

---

# 36. Payment Integration

Razorpay is used where payment processing is enabled.

Conceptual sequence:

```text
Client
 ↓
Checkout Request
 ↓
Backend
 ↓
Create Payment Order
 ↓
Razorpay
 ↓
Customer Payment
 ↓
Payment Result
 ↓
Server-Side Verification
 ↓
Application State Update
```

Payment verification is important because a client-side success message alone cannot be trusted.

---

# 37. File Upload Design

Delivery proof images are uploaded through the backend.

```text
Camera / File Input
       ↓
React Form
       ↓
multipart/form-data
       ↓
Upload Middleware
       ↓
Cloudinary / File Storage
       ↓
Stored File URL
       ↓
Database Reference
```

The database stores a reference to the uploaded file rather than large binary content whenever external object storage is used.

File validation should consider:

- File type
- File size
- Upload errors
- Authentication
- Task ownership

---

# 38. AI Assistant Design

The AI assistant follows a server-mediated architecture.

```text
User
 ↓
AI Chat UI
 ↓
POST AI Request
 ↓
Backend AI Route
 ↓
Input Validation
 ↓
Prompt Construction
 ↓
LLM API
 ↓
Response Validation / Formatting
 ↓
Frontend
```

The LLM API key remains on the server.

The browser must never receive the secret API key.

---

# 39. Prompt Design

The prompt should provide:

1. System role
2. EcoXchange context
3. Relevant constraints
4. User input
5. Expected response format

Conceptual structure:

```text
System Instructions
+
EcoXchange Context
+
User Query
+
Output Requirements
```

Prompts should avoid unnecessary context and should be designed to produce consistent responses.

---

# 40. Structured AI Output

Where structured output is required, the backend requests a predictable JSON structure.

Conceptual example:

```json
{
  "answer": "string",
  "category": "string",
  "suggestions": [
    "string"
  ]
}
```

The exact schema should match the implementation.

Structured output is useful because the frontend can reliably render individual fields rather than parsing arbitrary natural-language text.

---

# 41. AI Security Considerations

The AI endpoint should treat user input as untrusted.

Security considerations include:

- Input validation
- Prompt injection awareness
- Restricting system instructions from being overridden by user text
- Avoiding exposure of secrets
- Limiting unnecessary context
- Handling malformed model output
- Rate limiting expensive AI requests where appropriate

The application should never place secrets inside user-visible prompts.

---

# 42. Notification Design

Notifications provide users with information about important system events.

Potential events include:

- Pickup status
- Order status
- Membership updates
- Rewards
- Administrative actions
- Delivery status

Notifications can be generated by backend business logic and retrieved by the relevant authenticated user.

---

# 43. Admin Module

The admin module provides administrative management.

Conceptual flow:

```text
Admin Login
 ↓
JWT Verification
 ↓
Admin Authorization
 ↓
Admin Dashboard
 ↓
Management APIs
```

Admin operations can include:

- User management
- Trial member management
- Permanent member management
- Supervisor management
- Delivery-agent management
- Recycler management
- Marketplace management
- Campaign management
- System monitoring

---

# 44. Supervisor Module

Supervisor functionality focuses on operational monitoring.

```text
Supervisor
 ↓
Authentication
 ↓
Supervisor Authorization
 ↓
Dashboard
 ↓
KPI / Verification / Agent Management
```

Supervisors can manage or monitor delivery agents according to their assigned permissions.

---

# 45. Delivery Agent Module

The delivery module is optimized for field operations.

Primary screens include:

```text
Tasks
Map
Scanner
Proofs
History
```

Typical workflow:

```text
Assigned Task
 ↓
Accept
 ↓
Start
 ↓
Navigate
 ↓
Scan QR
 ↓
Collect Waste
 ↓
Capture Proof
 ↓
Upload Proof
 ↓
Complete
```

The backend validates each important state transition.

---

# 46. Recycler Module

The recycler module connects recyclable material and recycling operations with participating recyclers.

Recycler access is role protected.

The module can be extended with:

- Material listings
- Recycling requests
- Collection information
- Status tracking
- Recycler-specific analytics

---

# 47. API Request Lifecycle

A protected API request follows:

```text
HTTP Request
 ↓
CORS / Security Middleware
 ↓
Authentication Middleware
 ↓
JWT Verification
 ↓
Role Authorization
 ↓
Request Validation
 ↓
Route Handler
 ↓
Controller
 ↓
Service Logic
 ↓
Database / External API
 ↓
Response
```

This layered flow prevents business logic from being mixed directly into routing definitions.

---

# 48. HTTP Status Code Strategy

EcoXchange uses standard HTTP semantics.

```text
200 OK
Successful read/update operation

201 Created
Successful creation

400 Bad Request
Invalid request data

401 Unauthorized
Missing or invalid authentication

403 Forbidden
Authenticated but not authorized

404 Not Found
Requested resource does not exist

409 Conflict
Duplicate or conflicting operation

500 Internal Server Error
Unexpected server-side failure
```

---

# 49. Important Failure Cases

The application should handle failures such as:

## Invalid Login

```text
Credentials invalid
 ↓
Reject request
 ↓
Return 401
```

## Unauthorized Role

```text
Valid JWT
 ↓
Wrong role
 ↓
Reject
 ↓
403
```

## Missing Resource

```text
Requested ID
 ↓
Database lookup
 ↓
No record
 ↓
404
```

## Database Failure

```text
Database error
 ↓
Central error handler
 ↓
Log internally
 ↓
Safe server response
```

## Payment Failure

```text
Payment unsuccessful
 ↓
Do not mark order/membership as paid
 ↓
Return payment error
```

## File Upload Failure

```text
Upload fails
 ↓
Do not mark proof as successfully uploaded
 ↓
Return retryable error
```

---

# 50. Database Query Design

Queries should:

- Retrieve only required records where possible.
- Use filtering instead of loading entire collections.
- Use pagination for large datasets.
- Use indexes for frequently queried fields.
- Avoid unnecessary repeated database calls.

For MongoDB, aggregation pipelines can be used when multiple stages of filtering, grouping, sorting, or joining-like operations are required.

---

# 51. MongoDB Referencing vs Embedding

Embedding is appropriate when:

- Data is small.
- Data belongs tightly to the parent.
- It is normally read together.

Referencing is appropriate when:

- Data is shared.
- Data is large.
- Data changes independently.
- The relationship needs independent querying.

EcoXchange uses references for entities such as users, orders, pickups, wallets, toolkits, and QR-related records where independent lifecycle management is useful.

---

# 52. PostgreSQL Design

Where relational data is used, tables follow relational principles.

Example conceptual model:

```text
Users
  |
  | PK/FK
  v
Orders
  |
  | FK
  v
Products
```

Primary keys uniquely identify rows.

Foreign keys maintain referential relationships.

JOIN operations retrieve related data across tables.

---

# 53. Transactional Operations

Operations involving multiple dependent database changes should be considered for transactional handling.

Examples include:

- Payment confirmation followed by order creation
- Wallet balance update followed by transaction creation
- Reward redemption followed by point deduction
- Membership confirmation followed by toolkit allocation

The goal is to prevent partially completed business operations.

---

# 54. JavaScript Asynchronous Design

The frontend and backend both use asynchronous JavaScript.

## Promises

Promises represent a future result of an asynchronous operation.

```text
Pending
 ↓
Fulfilled
or
Rejected
```

## Async/Await

`async/await` provides a readable way to work with promises.

Conceptual API flow:

```text
try
 ↓
await API request
 ↓
process response
catch
 ↓
handle error
```

## Event Loop

JavaScript executes synchronous code on the call stack and uses the event loop to process asynchronous work after the current stack is available.

This allows Node.js and browser JavaScript to handle I/O without blocking the main execution flow.

---

# 55. Closures

A closure occurs when a function retains access to variables from its lexical scope even after the outer function has completed.

Closures are relevant to JavaScript patterns such as:

- Callbacks
- Event handlers
- Factory functions
- Hooks and encapsulated state

---

# 56. Hoisting

JavaScript declarations are processed before execution.

Important distinction:

- `var` is hoisted and initialized with `undefined`.
- `let` and `const` are hoisted but remain unavailable during the Temporal Dead Zone until their declaration is reached.
- Function declarations can be called before their declaration in the same scope.

---

# 57. Git Workflow

The project uses Git for version control.

Typical workflow:

```text
Create / Update Feature
 ↓
Test
 ↓
git status
 ↓
git add
 ↓
git commit
 ↓
git push
```

Feature branches can be used to isolate development.

The repository should not contain:

- `.env` secrets
- Passwords
- API keys
- Private credentials
- Generated sensitive files

---

# 58. Environment Variables

Configuration and secrets are stored outside source code.

Examples include:

```text
MONGODB_URI
DATABASE_URL
JWT_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
CLOUDINARY credentials
AI API key
```

The exact variable names depend on the current deployment configuration.

The `.env` file should be excluded from Git through `.gitignore`.

---

# 59. Testing Design

Testing should cover the most important business and security paths.

## Authentication Tests

- Registration
- Login
- JWT generation
- Protected route access
- Invalid credentials
- Invalid token

## API Tests

- Valid requests
- Invalid requests
- Unauthorized requests
- Forbidden requests
- Missing resources

## Business Tests

- Trial membership rules
- Pickup lifecycle
- Marketplace rules
- Payment verification
- Reward calculations

The project already uses verification scripts and API-level checks during engineering validation; these should remain aligned with the current implementation.

---

# 60. Security Checklist

Before production deployment:

```text
[ ] Passwords hashed
[ ] JWT secret stored in environment
[ ] API keys stored in environment
[ ] .env excluded from Git
[ ] Protected routes use authentication
[ ] Role-based authorization enabled
[ ] Request validation enabled
[ ] Rate limiting configured where required
[ ] Helmet/security headers configured
[ ] CORS restricted to trusted origins
[ ] File uploads validated
[ ] Sensitive errors hidden in production
[ ] Payment status verified server-side
```

---

# 61. Deployment Design

The frontend and backend are independently buildable applications.

Frontend:

```text
React Source
 ↓
Vite Build
 ↓
Production Static Assets
 ↓
Frontend Hosting
```

Backend:

```text
Node.js + Express
 ↓
Production Environment
 ↓
API Server
 ↓
MongoDB / PostgreSQL / External Services
```

Environment-specific configuration is injected through deployment environment variables.

---

# 62. Performance Considerations

The following techniques can be introduced or used where appropriate:

- Pagination
- Database indexing
- React Query caching
- Lazy loading
- Image optimization
- API response minimization
- Efficient database queries
- Redis caching for high-frequency data

Performance optimization should be based on measured bottlenecks rather than premature optimization.

---

# 63. Scalability Considerations

If the user base grows significantly, the architecture can evolve toward:

```text
                    Load Balancer
                         |
             ┌───────────┼───────────┐
             ↓           ↓           ↓
         API Server  API Server  API Server
             |           |           |
             └───────────┼───────────┘
                         ↓
                    Cache Layer
                         ↓
                    Database
                         |
                 External Services
```

Potential additions:

- Redis
- Message queues
- Background workers
- CDN
- Horizontal API scaling
- Database indexing
- Read replicas
- Centralized monitoring

---

# 64. Key Design Decisions

## React + Vite

Chosen for a fast, component-based client application and straightforward production build.

## Node.js + Express

Chosen for REST API development and efficient asynchronous I/O.

## MongoDB

Chosen for flexible document-oriented entities with evolving schemas.

## PostgreSQL

Used where structured relational modeling and SQL operations are appropriate.

## JWT

Used for stateless API authentication.

## Role-Based Authorization

Used because EcoXchange has multiple user roles with different permissions.

## Cloud Storage

Used for proof images instead of storing large binary files directly inside normal database documents.

## Server-Mediated AI

Used to protect the LLM API key and keep AI-related business logic under backend control.

---

# 65. End-to-End Member Pickup Example

This example demonstrates how multiple LLD components interact.

```text
1. Member opens Pickup page
        ↓
2. React loads pickup data
        ↓
3. Frontend sends authenticated API request
        ↓
4. JWT middleware verifies user
        ↓
5. Role middleware verifies member permission
        ↓
6. Request validation runs
        ↓
7. Pickup controller executes
        ↓
8. Database creates pickup
        ↓
9. Backend returns pickup
        ↓
10. Frontend updates server state
        ↓
11. Supervisor / delivery workflow receives task
        ↓
12. Delivery agent accepts task
        ↓
13. Agent starts task
        ↓
14. Agent scans QR code
        ↓
15. Backend validates QR and task ownership
        ↓
16. Agent collects waste
        ↓
17. Agent uploads proof
        ↓
18. File is stored externally
        ↓
19. Proof reference is stored
        ↓
20. Agent completes task
        ↓
21. Backend validates completion
        ↓
22. Collection is recorded
        ↓
23. Applicable EcoPoints are awarded
        ↓
24. Member sees updated status/reward
```

---

# 66. End-to-End Marketplace Example

```text
Member
 ↓
Marketplace
 ↓
GET products
 ↓
Product selection
 ↓
Cart
 ↓
Checkout
 ↓
Backend validates product and quantity
 ↓
Payment order
 ↓
Payment provider
 ↓
Server-side verification
 ↓
Order creation
 ↓
Order status
 ↓
Member tracking
```

---

# 67. End-to-End Authentication Example

```text
User
 ↓
Login Form
 ↓
Frontend Validation
 ↓
POST /auth/login
 ↓
Authentication Controller
 ↓
Validate Input
 ↓
Find User
 ↓
Compare Password / Verify Login Method
 ↓
Generate JWT
 ↓
Return Authentication Result
 ↓
Frontend Stores Auth State
 ↓
Protected Route
 ↓
Authenticated API Request
 ↓
JWT Verification Middleware
 ↓
Role Authorization
 ↓
Protected Controller
```

---

# 68. Viva Mapping

The following implementation areas map directly to Project Score concepts.

| Concept | EcoXchange Implementation Area |
|---|---|
| React component composition | Reusable pages/components/layouts |
| useState | Forms, UI state, filters, modals |
| useEffect | Data fetching and side effects |
| Async API fetching | Frontend API/query layer |
| Client-side routing | React Router |
| Problem modeling | Waste-management and circular-economy workflow |
| System design | React → Express → DB → external services |
| REST APIs | Express route modules |
| HTTP status codes | API responses |
| Error handling | Central backend error handling |
| Middleware | Auth, role, validation, security |
| Mongo schema modeling | Mongoose models |
| Mongo CRUD | Users, products, orders, pickups, etc. |
| PostgreSQL PK/FK | Relational data model |
| PostgreSQL JOINs | Related relational data |
| Password hashing | bcrypt |
| JWT | Authentication |
| RBAC | Admin/supervisor/delivery/member/recycler access |
| LLM integration | AI assistant |
| Prompt engineering | AI prompt construction |
| Structured outputs | AI response schema |
| Git workflow | Git/GitHub |
| Environment variables | Database/API/payment secrets |
| File upload | Delivery proof images |
| Payment integration | Razorpay |
| 3rd-party APIs | Cloudinary, maps, AI, payment services |

---

# 69. Implementation Verification Rule

This document is intended to describe the actual EcoXchange implementation.

Before claiming a concept during the viva, verify:

1. The feature exists in the current repository.
2. The relevant route/component/model/service can be located.
3. You can explain the request flow.
4. You can explain why the design was chosen.
5. You can explain what happens when the operation fails.
6. You can explain at least one security or scalability consideration.

Future improvements such as Redis, WebSockets, RAG, queues, and additional observability should be described as future architecture unless they are actually implemented.

---

# 70. Final Summary

EcoXchange uses a layered implementation architecture:

```text
                    React + Vite
                         |
                  React Components
                         |
              Routing / State / Queries
                         |
                      REST API
                         |
                 Node.js + Express
                         |
        ┌────────────────┼────────────────┐
        |                |                |
   Middleware       Controllers       Services
        |                |                |
        └────────────────┼────────────────┘
                         |
                Database / External APIs
                         |
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       MongoDB       PostgreSQL     External APIs
                                     |
                         ┌───────────┼───────────┐
                         ↓           ↓           ↓
                      Razorpay   Cloudinary     AI
```

The LLD separates frontend presentation, backend request handling, business logic, data access, authentication, authorization, and external integrations.

This design supports maintainability, security, testability, and future scalability while allowing EcoXchange to serve multiple user roles and workflows through a single platform.

---

# Appendix A – Viva Preparation Checklist

Before the Project Score viva, be able to answer the following for every major feature:

1. Where is it implemented?
2. Which frontend component starts the operation?
3. Which API endpoint receives the request?
4. Which middleware runs?
5. Which controller handles it?
6. Which service/business rule is applied?
7. Which database model/table is affected?
8. What response is returned?
9. What happens if the operation fails?
10. What security checks are applied?
11. Why was this design chosen?
12. How would you scale it for more users?

A strong viva answer should connect:

```text
Concept
  ↓
Actual EcoXchange Feature
  ↓
Actual Code Location
  ↓
Implementation Flow
  ↓
Design Reason
  ↓
Failure Case
  ↓
Scalability / Security Consideration
```

That is the expected level of understanding for defending the project rather than only memorizing definitions.
