# PDCON Lending Platform — Backend (Phase 1)

A private lending and investment management platform for PDCON. Tracks loans, calculates returns, generates statements for investors and accountants, and forecasts cash flow.

## What's in this package

This is **Phase 1: backend foundation**. You get the database schema, authentication, and all the API endpoints. Frontend pages (dashboard UI, lender portal UI) and PDF rendering are Phase 2.

### Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** ORM (database-agnostic — start on PostgreSQL, swap if needed)
- **NextAuth.js** for authentication
- **bcrypt** for password hashing
- Designed to deploy to **Vercel** with a managed PostgreSQL (Neon, Supabase, Railway)

### Three user roles

| Role     | Sees                                                                                                  |
|----------|-------------------------------------------------------------------------------------------------------|
| `OWNER`  | Everything: cash position, forecasts, all loans, audit log, user management                           |
| `ADMIN`  | Loans, borrowers, projects, statements, transactions — but **never** owner cash position or forecasts |
| `LENDER` | Only their own loans, transactions, and statements; can request top-ups and early repayments         |

Admins have **granular permissions** stored as JSON: e.g. `{ "loans": ["view","edit"], "projects": ["view"] }`. Owner can adjust per admin.

### Three loan types

| Type             | Description                                                                  |
|------------------|------------------------------------------------------------------------------|
| `FIXED_MONTHLY`  | Lender receives fixed monthly interest payments throughout the term         |
| `FIXED_END`      | Lender receives lump sum (principal + interest) at maturity                 |
| `PROFIT_SHARE`   | Lender receives base interest + a percentage of project profit at completion |

Loans can be tied to a project (for profit share) or sit as general company loans (no project link).

---

## Getting set up

### 1. Install dependencies

```bash
cd pdcon-lending
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — your PostgreSQL connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for dev

### 3. Set up the database

```bash
npx prisma migrate dev --name init   # creates the database schema
npm run db:seed                      # creates the owner account
```

The seed will print the default owner email and password. **Change them immediately** after first login.

### 4. Run

```bash
npm run dev
```

Server starts on `http://localhost:3000`. Auth endpoint is at `/api/auth/signin`.

---

## API endpoints

All endpoints (except `/api/auth/*`) require an authenticated session cookie. Returns `{ success: true, data: ... }` on success or `{ success: false, error: "..." }` on failure.

### Loans

| Method | Path                  | Who                     |
|--------|-----------------------|-------------------------|
| GET    | `/api/loans`          | All roles (lenders see only theirs) |
| POST   | `/api/loans`          | Owner / Admin           |
| GET    | `/api/loans/:id`      | All (with access check) |
| PUT    | `/api/loans/:id`      | Owner / Admin           |
| DELETE | `/api/loans/:id`      | Owner only (and only if no transactions) |

Filter list: `?status=ACTIVE&projectId=...&borrowerId=...`

### Borrowers

| Method | Path                       | Who              |
|--------|----------------------------|------------------|
| GET    | `/api/borrowers`           | Staff only       |
| POST   | `/api/borrowers`           | Staff only       |
| GET    | `/api/borrowers/:id`       | Staff or self    |
| PUT    | `/api/borrowers/:id`       | Staff only       |
| DELETE | `/api/borrowers/:id`       | Owner only       |

### Projects

| Method | Path                | Who                                      |
|--------|---------------------|------------------------------------------|
| GET    | `/api/projects`     | Staff (all); lenders see only theirs     |
| POST   | `/api/projects`     | Staff only                               |
| GET    | `/api/projects/:id` | Staff or lender with loan in project     |
| PUT    | `/api/projects/:id` | Staff only                               |
| DELETE | `/api/projects/:id` | Owner only                               |

Projects have a `customFields` JSON column — add any structured data without schema changes.

### Transactions

| Method | Path                   | Who                                    |
|--------|------------------------|----------------------------------------|
| GET    | `/api/transactions`    | All (lenders filtered to theirs)       |
| POST   | `/api/transactions`    | Staff only                             |

Filters: `?loanId=...&from=YYYY-MM-DD&to=YYYY-MM-DD`. POSTing automatically updates loan balance based on transaction type.

### Estimated inflows (cash flow forecast input)

| Method | Path                  | Who         |
|--------|-----------------------|-------------|
| GET    | `/api/inflows`        | Owner only  |
| POST   | `/api/inflows`        | Owner only  |
| PUT    | `/api/inflows/:id`    | Owner only  |
| DELETE | `/api/inflows/:id`    | Owner only  |

Body example: `{ "description": "Project A profit", "amount": 500000, "expectedDate": "2026-08-01", "projectId": "...", "confidence": "LIKELY" }`

### Statements

| Method | Path              | Description                                   |
|--------|-------------------|-----------------------------------------------|
| GET    | `/api/statements` | Generates statement based on query params     |

Query params:
- `type` — `investor` | `project` | `combined`
- `borrowerId` — required for investor type (lenders auto-locked to themselves)
- `projectId` — required for project type
- `from`, `to` — required date range (YYYY-MM-DD)
- `format` — `json` (default) or `csv`

The combined statement is what you send Vishal — it groups by investor and by project, includes general company loans separately, and totals everything for the period.

### Repayment requests (early payback)

| Method | Path                              | Who                                          |
|--------|-----------------------------------|----------------------------------------------|
| GET    | `/api/repayment-requests`         | All (lenders see theirs)                     |
| POST   | `/api/repayment-requests`         | Lender (own loans) or Staff                  |
| PUT    | `/api/repayment-requests/:id`     | Staff: status=APPROVED/REJECTED/COMPLETED    |

When marked `COMPLETED`, the system automatically creates an `EARLY_REPAYMENT` transaction and decrements the loan balance.

### Top-up requests (add more funds)

Same shape as repayment requests, at `/api/topup-requests`. Completion creates a `TOP_UP` transaction and increments principal + balance.

### Owner dashboard

| Method | Path                | Who         |
|--------|---------------------|-------------|
| GET    | `/api/dashboard`    | Owner only  |

Query: `?months=12` (default 12). Returns:
- Summary: total outstanding, active loan count, totals
- Month-by-month forecast (inflows, scheduled outflows, net)
- Running cash projection
- Active loans list

### Users

| Method | Path                | Who          |
|--------|---------------------|--------------|
| GET    | `/api/users`        | Owner only   |
| POST   | `/api/users`        | Owner only   |
| PUT    | `/api/users/:id`    | Owner only   |
| DELETE | `/api/users/:id`    | Owner only (soft delete — sets `active: false`) |

For lender accounts, supply `borrowerId` linking to their borrower record. For admin accounts, supply `permissions` JSON.

---

## Database notes

### Custom fields (flexible schemas)

`Project`, `Loan`, and `Borrower` all have a `customFields` JSON column. You can add any extra data per record without changing the schema:

```json
{
  "siteAccessNotes": "Use rear gate after 5pm",
  "councilApproval": "VCAT 2026/01234",
  "estimatedYield": 8.5
}
```

These are passed straight through the API.

### Audit logging

Every important mutation (create/update/delete) writes an `AuditLog` entry with user, action, entity, IP address, and user agent. Use this for dispute resolution and compliance.

### Signature model (e-signature ready)

The `Signature` model is ready for Phase 2 — it stores the drawn signature as base64, the photo URL, IP/user-agent, and a SHA256 hash of the document at signing time. Phase 2 wires the UI capture flow.

### Swapping databases

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"   // was "postgresql"
  url      = env("DATABASE_URL")
}
```

Then `npx prisma migrate dev`. SQLite for local dev also works (change a couple of `Decimal` columns since SQLite doesn't natively support them).

---

## Phase 2 roadmap

Not built yet — this is what to build next:

1. **Frontend pages** (server components in `/src/app`):
   - `/login` — sign in form
   - `/owner` — owner dashboard with cash flow chart + table (4 months detailed, 12 months chart)
   - `/admin` — staff loans/projects/borrowers management
   - `/portal` — lender's view of their investments
   - PDF rendering of statements (use `@react-pdf/renderer` or `puppeteer`)

2. **E-signature flow:**
   - Capture drawn signature on canvas
   - Take photo via `getUserMedia`
   - Hash the document on submit
   - Store all in `Signature` table

3. **Document file storage:**
   - Wire up S3 (or Cloudflare R2) for actual file uploads
   - Replace `Document.url` with proper signed URLs

4. **Email notifications:**
   - Send statement when generated
   - Notify owner of new repayment / top-up requests
   - Password reset emails

5. **Mobile app** (later, when you scale past 20 lenders).

---

## Security checklist (already done)

- Passwords hashed with bcrypt (12 rounds)
- JWT-based session, 30-day expiry
- Role-based access on every endpoint
- Granular admin permissions
- Owner-only access to cash flow data
- IP and user agent logged on every signature
- SHA256 document hash captured at signing
- Owner cannot delete loans with transactions (data integrity)
- Borrowers with loans cannot be deleted (audit trail preserved)
- Soft delete on users (preserves audit trail)

## File structure

```
pdcon-lending/
├── prisma/
│   ├── schema.prisma           Database schema
│   └── seed.ts                 Owner account seeder
├── src/
│   ├── lib/
│   │   ├── prisma.ts           Prisma singleton
│   │   ├── auth.ts             NextAuth config + helpers
│   │   └── api-helpers.ts      Response wrappers + audit log
│   ├── types/
│   │   └── next-auth.d.ts      TypeScript extensions
│   ├── middleware.ts           Route protection
│   └── app/api/
│       ├── auth/[...nextauth]/route.ts
│       ├── loans/{,[id]}/route.ts
│       ├── borrowers/{,[id]}/route.ts
│       ├── projects/{,[id]}/route.ts
│       ├── transactions/route.ts
│       ├── inflows/{,[id]}/route.ts
│       ├── statements/route.ts
│       ├── repayment-requests/{,[id]}/route.ts
│       ├── topup-requests/{,[id]}/route.ts
│       ├── dashboard/route.ts
│       └── users/{,[id]}/route.ts
├── .env.example
├── package.json
└── tsconfig.json
```
