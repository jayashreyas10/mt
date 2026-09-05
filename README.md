# MortgageTrack — Full-Stack Production Application

MortgageTrack is a modern, high-precision mortgage management and financial planning web application built from the ground up for homeowners, real estate investors, and financial advisors.

It enables users to track multiple mortgages, monitor real-time amortization schedules, simulate aggressive payoff strategies (both monthly extra payments and lump-sum windfalls), record actual payments against projected schedules, and compare scenarios side-by-side.

---

## 1. Architectural Overview

The application is structured as a clean TypeScript monorepo with strict separation of concerns:

```
MT/
├── shared/              # Pure, deterministic, zero-dependency financial math engine
│   ├── src/engine/      # Amortization, extra payments, scenario comparisons, Decimal.js
│   ├── src/schemas/     # Universal Zod schemas for input validation
│   └── tests/           # 16-test comprehensive financial unit suite
├── backend/             # Express.js REST API with Prisma ORM
│   ├── prisma/          # Database schema (PostgreSQL & SQLite compatible)
│   ├── src/controllers/ # HTTP handlers for Auth, Mortgages, Payments, Scenarios
│   ├── src/services/    # Core business logic & balance synchronization
│   ├── src/middleware/  # JWT auth, Zod validation, Helmet, Rate Limiting, Error handling
│   └── tests/           # Supertest API integration test suite
├── frontend/            # React 18 SPA with Vite & Tailwind CSS
│   ├── src/pages/       # Dashboard, Mortgages, Detail, Scenarios, Login, Register
│   ├── src/components/  # Fintech design system, AmortizationTable, Recharts graphs
│   ├── src/context/     # AuthContext with session persistence
│   └── src/tests/       # React Testing Library component tests
└── tests-e2e/           # Playwright end-to-end browser automation suite
```

---

## 2. Core Financial Calculation Engine

All calculations are pure, deterministic, and isolated from UI components in `@mortgage-tracker/shared`.

### Precision & Rounding Policy
- Standard JavaScript floating-point numbers (`0.1 + 0.2 !== 0.3`) are strictly prohibited in the financial engine.
- All monetary operations utilize `decimal.js` configured with 30-digit precision and `ROUND_HALF_UP` (standard banking rounding convention).
- Results are systematically rounded to 2 decimal places per payment interval.

### Standard Amortization Formula
For monthly compounding fixed-rate loans:
$$M = P \times \frac{r(1+r)^n}{(1+r)^n - 1}$$
Where:
- $P$ = Principal loan balance
- $r$ = Monthly interest rate ($\text{Annual Rate} / 12 / 100$)
- $n$ = Total scheduled payments ($\text{Term Years} \times 12$)
- $M$ = Monthly principal and interest (P&I) payment

*Special case*: For 0% interest loans, payment equals $M = P / n$.

### Final Payment Adjustment
Because fixed monthly payments are rounded to the nearest cent, tiny cumulative discrepancies of a few pennies occur over 360 payments. The engine automatically adjusts the final payment:
$$\text{Final Payment} = \text{Remaining Balance} + \text{Final Month Interest}$$
The calculated loan balance is strictly guaranteed never to become negative.

### Extra Payment Logic
- **Recurring Monthly Extra**: Added directly to principal reduction each month, compressing the amortization curve and terminating the loan early once balance reaches \$0.00.
- **One-Time Lump Sum**: Applied to the specified month index or target date. The engine re-amortizes the remaining loan balance, showing exact months eliminated and interest dollars saved.

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query (React Query v5), React Hook Form, Zod, Recharts, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Bcrypt, JsonWebToken, Helmet, CORS, Express-Rate-Limit.
- **Database**: SQLite for local zero-configuration development, fully compatible with PostgreSQL in production via Prisma.
- **Testing**: Vitest for unit & integration tests, React Testing Library, Supertest, Playwright for browser E2E tests.

---

## 4. Setup & Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
git clone <repo-url>
cd MT
npm install
```

### Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```
Default `.env` contents:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-development-jwt-key-32chars"
FRONTEND_URL="http://localhost:5173"
```

### Database Initialization
Generate the Prisma client and sync the schema:
```bash
npx prisma db push --schema=backend/prisma/schema.prisma
```

---

## 5. Development & Running

Run both backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4000/api](http://localhost:4000/api)
- **API Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

Or run individual services:
```bash
npm run dev:backend   # Starts Express on port 4000
npm run dev:frontend  # Starts Vite dev server on port 5173
```

---

## 6. Testing

The project maintains 100% test coverage across financial math, backend APIs, and frontend components:

```bash
# Run all unit and integration tests
npm test

# Run financial math engine tests (16 required edge cases)
npm run test:engine

# Run backend REST API integration tests (Supertest)
npm run test:backend

# Run frontend component tests (React Testing Library)
npm run test:frontend

# Run full end-to-end browser tests (Playwright)
npm run test:e2e
```

---

## 7. Production Build & Deployment

To build all packages for production:
```bash
npm run build
```
This produces:
- `shared/dist`: Compiled TypeScript library and type definitions
- `backend/dist`: Compiled Express application
- `frontend/dist`: Optimized production static bundle (HTML, CSS, JS)

### Production Deployment Strategy
1. **Container / VM / Platform (Render, Railway, Fly.io, AWS, Heroku)**:
   - Set `DATABASE_URL` to a production PostgreSQL database.
   - Run `npx prisma migrate deploy` in backend.
   - Start the backend via `node backend/dist/index.js`.
2. **Frontend Static Hosting (Vercel, Netlify, Cloudflare Pages, S3/CloudFront)**:
   - Deploy `frontend/dist` directory.
   - Set API proxy or route `/api` to the backend production URL.

---

## 8. Security Controls
- Passwords hashed using Bcrypt with 10 salt rounds.
- JWT stored in HTTP-only, secure, SameSite cookies and supported via Bearer Authorization headers.
- Backend authorization validation on every request — users can only access their own mortgages.
- Helmet security headers (HSTS, Content-Security-Policy, X-Frame-Options).
- Rate limiting active on all API routes to mitigate brute-force attacks.
- SQL injection protection via Prisma ORM parameterized queries.
- Strict input validation with Zod schemas before data reaches controllers.
