# 📊 Portfolio Management System (PMS)

A full-stack **Portfolio Management System** designed to manage investor portfolios across multiple asset classes — Fixed Deposits, Mutual Funds, and Shares — with support for family-based investor grouping, role-based access control, and comprehensive reporting.

---

## 🗂️ Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Seed Data](#-seed-data)
- [Features](#-features)
- [User Roles](#-user-roles)
- [Application Screens](#-application-screens)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)

---

## 🎯 Project Overview

PMS is a multi-role portfolio management platform that enables:

- **Admins** to manage investor data across all families, record and monitor investments in Fixed Income, Mutual Funds, and Shares, and generate cross-portfolio reports.
- **Investors** to view their personal portfolio dashboard, manage their own transactions, and access detailed holdings and P&L reports scoped to their data.

Investors are organized into **family groups** (e.g., Jadhav Family, Sharma Family) making it easy to view consolidated family holdings.

---

## 🛠️ Tech Stack

| Layer        | Technology                                              | Version    |
|--------------|---------------------------------------------------------|------------|
| Backend      | Node.js + Express                                       | Express 4.x |
| Database     | MongoDB (Mongoose ODM)                                  | Mongoose 8.x |
| Auth         | JWT (JSON Web Tokens) + bcryptjs                       | JWT 9.x    |
| Frontend     | Next.js (App Router)                                    | 16.2.6     |
| React        | React                                                   | 19.2.4     |
| UI Library   | Radix UI primitives + custom CSS (globals.css)         | —          |
| Charts       | Recharts                                                | 3.x        |
| Animations   | Framer Motion                                           | 12.x       |
| Forms        | React Hook Form + Zod validation                       | RHF 7.x    |
| Data Tables  | TanStack Table                                          | 8.x        |
| Icons        | Lucide React                                            | 1.x        |
| HTTP Client  | Axios                                                   | 1.x        |
| Notifications| Sonner                                                  | 2.x        |

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** ≥ 18.x — [Download](https://nodejs.org/)
- **MongoDB** ≥ 6.x running locally on port `27017` — [Download](https://www.mongodb.com/try/download/community)
- **npm** ≥ 9.x (bundled with Node.js)
- **Git** (optional, for cloning)

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Portfolio Management System"
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
copy .env.example .env
# Edit .env with your values (see Environment Variables section)

# Seed the database with sample data
npm run seed

# Start the backend server
npm start
```

The API will be available at **http://localhost:5000**

> For development with auto-reload: `npm run dev`

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.local.example .env.local

# Start the development server
npm run dev
```

The application will be available at **http://localhost:3000**

### 4. Verify Setup

- Visit **http://localhost:5000/api/health** — should return `{ "success": true, "message": "PMS API is running 🚀" }`
- Visit **http://localhost:3000** — you will be redirected to the login page
- Log in with default admin credentials: `admin` / `Admin@123`

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable        | Default Value                                   | Description                              |
|-----------------|------------------------------------------------|------------------------------------------|
| `PORT`          | `5000`                                         | Port the Express server listens on       |
| `MONGODB_URI`   | `mongodb://localhost:27017/portfolio_management`| MongoDB connection string                |
| `JWT_SECRET`    | *(required)*                                   | Secret key for signing JWT tokens        |
| `JWT_EXPIRES_IN`| `7d`                                           | JWT token expiry duration                |
| `NODE_ENV`      | `development`                                  | Environment (`development`/`production`) |
| `FRONTEND_URL`  | `http://localhost:3000`                        | CORS allowed origin                      |

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/portfolio_management
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

| Variable              | Default Value                  | Description                  |
|-----------------------|-------------------------------|------------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api`   | Backend API base URL         |

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🌱 Seed Data

Run `npm run seed` inside the `backend` directory to populate the database with:

| Data Type    | Count | Details                                                    |
|--------------|-------|------------------------------------------------------------|
| Admin User   | 1     | `username: admin`, `password: Admin@123`                  |
| Groups       | 8     | Jadhav, Vagal, Sharma, Mehta, Patil, Joshi, Kulkarni, Desai families |
| Investors    | 22    | 2–3 members per family, with PAN, email, mobile, address   |
| Asset Classes| —     | Fixed Income, Mutual Funds, Shares, Insurance              |
| Subcategories| —     | BNFD, BCFD, CNFD, CCFD, CD, NCD, PMIS, PTD, Insurance Annuity |
| AMCs         | —     | Major Indian AMCs (ABSL, HDFC, ICICI, SBI, etc.)          |
| Schemes      | —     | Seeded from official AMFI scheme data CSV                 |
| Companies    | —     | Seeded from BSE/NSE equity scrip lists                    |

> **Note:** The seeder also reads `SchemeData2205260723SS.csv` (AMFI data) and `Equity.csv` / Excel files in the project root to bulk-load AMC, Scheme, and Company/scrip data.

---

## ✨ Features

### Admin Features

- **Portfolio Dashboard** — Real-time stats: total investors, FD corpus, MF corpus, share corpus; asset allocation pie chart; AMC distribution; monthly investment trend (last 6 months); recent transactions feed
- **Master Management** — Full CRUD for Groups, Investors, Asset Classes (Categories), Asset Sub-Classes (Subcategories), Companies/Banks, AMCs, and Schemes
- **Transaction Recording** — Enter Fixed Income (FD), Mutual Fund purchases/redemptions, and Share purchase/sales for any investor
- **Investor Login Provisioning** — Create investor portal login credentials from the investor's record
- **Reports** — AMC-wise investment report, FD Maturity report (filterable by date range), MF Holdings report (net units held), Profit & Loss report, Share Holdings report, Asset Allocation breakdown

### Investor Features

- **Personal Dashboard** — Portfolio overview with expandable asset-class cards (Fixed Income, Mutual Funds, Shares, Insurance); family/group tree view
- **Own Transactions** — Create, view, edit, delete Fixed Income, Mutual Fund, Share, and Insurance transactions scoped to their account
- **Masters (Read + Write)** — Access to all master data including Groups, Investors, Asset Classes, Subcategories, Companies, AMCs, and Schemes
- **Scoped Reports** — FD Maturity and Profit & Loss reports filtered to their own portfolio

### Business Logic

- **Fixed Income Subcategory Filtering** — When selecting a company/bank in an FD transaction, the list is filtered based on the selected subcategory code:
  - `BNFD` / `BCFD` → Banks only
  - `CNFD` / `CCFD` / `CD` / `NCD` → Companies only
  - `PMIS` / `PTD` → Post Office (neither bank nor company)
- **Share Purchase vs. Sales** — On Share Purchase form, the company dropdown lists **all companies**. On Share Sales form, only companies where the investor holds existing shares (purchases > sales) are shown.
- **AMC + Scheme with ISIN Auto-Fetch** — When a Scheme is selected in a Mutual Fund transaction, the ISIN is automatically populated from the Scheme master.
- **Family Grouping** — Investors are linked to Groups (families). The group-tree view on the investor dashboard shows all family members' portfolios.
- **Joint Holders** — Fixed Income, Mutual Fund, and Share transactions support up to two joint holders.

---

## 👥 User Roles

| Role      | Access Level                                                                                   |
|-----------|-----------------------------------------------------------------------------------------------|
| `admin`   | Full access to all investors' data, all masters, all transactions, all reports, dashboard     |
| `investor`| Access only to their own data; masters (read+write); personal reports; personal dashboard     |

Admins can create investor portal accounts via **Masters → Investors → Create Login**.

---

## 🖥️ Application Screens

### Admin Screens

| Screen                              | Route                                  | Description                                              |
|-------------------------------------|----------------------------------------|----------------------------------------------------------|
| Login                               | `/login`                               | Unified login for admin and investor                     |
| Admin Dashboard                     | `/dashboard`                           | Portfolio stats, charts, recent transactions             |
| Masters – Groups                    | `/masters/groups`                      | CRUD for family groups                                   |
| Masters – Investors                 | `/masters/investors`                   | CRUD for investors; create investor login                |
| Masters – Asset Class               | `/masters/categories`                  | CRUD for asset categories (Fixed Income, MF, Shares…)   |
| Masters – Asset Sub Class           | `/masters/subcategories`               | CRUD for subcategories (BNFD, CNFD, etc.)               |
| Masters – Company / Bank            | `/masters/companies`                   | CRUD for companies and banks (flag: C/B), with ISIN      |
| Masters – AMCs                      | `/masters/amcs`                        | CRUD for Asset Management Companies                      |
| Masters – Schemes                   | `/masters/schemes`                     | CRUD for MF schemes; AMC linkage, ISIN, D/G flag         |
| Transactions – Fixed Income         | `/transactions/fixed-deposits`         | Record and manage FD transactions for any investor       |
| Transactions – Mutual Funds         | `/transactions/mutual-funds`           | Record MF purchase/redemption for any investor           |
| Transactions – Shares               | `/transactions/shares`                 | Record share purchase/sales for any investor             |
| Reports                             | `/reports`                             | All reports: AMC-wise, FD Maturity, MF Holdings, P&L, Share Holdings |

### Investor Screens

| Screen                              | Route                                  | Description                                              |
|-------------------------------------|----------------------------------------|----------------------------------------------------------|
| Investor Dashboard                  | `/investor/dashboard`                  | Personal portfolio with expandable asset-class cards     |
| Investor – Fixed Income             | `/investor/transactions/fixed-income`  | Investor's own FD transactions                           |
| Investor – Mutual Funds             | `/investor/transactions/mutual-funds`  | Investor's own MF transactions                           |
| Investor – Shares                   | `/investor/transactions/shares`        | Investor's own share transactions                        |
| Investor – Insurance                | `/investor/transactions/insurance`     | Investor's insurance records                             |
| Investor Masters – Groups           | `/investor/masters/groups`             | Groups master (read + write)                             |
| Investor Masters – Investors        | `/investor/masters/investors`          | Investors master (read + write)                          |
| Investor Masters – Categories       | `/investor/masters/categories`         | Asset Class master (read + write)                        |
| Investor Masters – Subcategories    | `/investor/masters/subcategories`      | Asset Sub Class master (read + write)                    |
| Investor Masters – Companies        | `/investor/masters/companies`          | Company/Bank master (read + write)                       |
| Investor Masters – AMCs             | `/investor/masters/amcs`               | AMC master (read + write)                                |
| Investor Masters – Schemes          | `/investor/masters/schemes`            | Scheme master (read + write)                             |
| Investor Reports                    | `/investor/reports`                    | FD Maturity + P&L reports scoped to this investor        |

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint         | Auth     | Description                      |
|--------|-----------------|----------|----------------------------------|
| POST   | `/api/auth/login`| Public   | Login; returns JWT token         |
| GET    | `/api/auth/me`  | Required | Get current authenticated user   |

### Masters

| Method   | Endpoint                    | Auth     | Description                          |
|----------|-----------------------------|----------|--------------------------------------|
| GET/POST | `/api/groups`               | Required | List / create groups                 |
| GET/PUT/DELETE | `/api/groups/:id`    | Required | Get / update / delete a group        |
| GET/POST | `/api/investors`            | Required | List / create investors              |
| GET/PUT/DELETE | `/api/investors/:id` | Required | Get / update / delete an investor    |
| GET/POST | `/api/categories`           | Required | List / create asset classes          |
| GET/PUT/DELETE | `/api/categories/:id`| Required | Get / update / delete asset class    |
| GET/POST | `/api/subcategories`        | Required | List / create subcategories          |
| GET/PUT/DELETE | `/api/subcategories/:id`| Required | Get / update / delete subcategory  |
| GET/POST | `/api/companies`            | Required | List / create companies & banks      |
| GET/PUT/DELETE | `/api/companies/:id` | Required | Get / update / delete company        |
| GET/POST | `/api/banks`                | Required | List / create bank records           |
| GET/POST | `/api/amcs`                 | Required | List / create AMCs                   |
| GET/PUT/DELETE | `/api/amcs/:id`      | Required | Get / update / delete AMC            |
| GET/POST | `/api/schemes`              | Required | List / create schemes                |
| GET/PUT/DELETE | `/api/schemes/:id`   | Required | Get / update / delete scheme         |

### Transactions

| Method   | Endpoint          | Auth     | Description                                       |
|----------|-------------------|----------|---------------------------------------------------|
| GET/POST | `/api/fd`         | Required | List / create Fixed Deposit records               |
| PUT/DELETE | `/api/fd/:id`   | Required | Update / delete a Fixed Deposit                   |
| GET/POST | `/api/mf`         | Required | List / create Mutual Fund transactions            |
| PUT/DELETE | `/api/mf/:id`   | Required | Update / delete a Mutual Fund transaction         |
| GET/POST | `/api/shares`     | Required | List / create Share transactions                  |
| PUT/DELETE | `/api/shares/:id`| Required | Update / delete a Share transaction               |

### Reports (Admin)

| Method | Endpoint                         | Auth     | Description                              |
|--------|----------------------------------|----------|------------------------------------------|
| GET    | `/api/reports/investor-portfolio`| Required | Cross-investor portfolio summary         |
| GET    | `/api/reports/amc-wise`          | Required | AMC-wise MF investment breakdown         |
| GET    | `/api/reports/fd-maturity`       | Required | FD maturity schedule (filterable)        |
| GET    | `/api/reports/mf-holdings`       | Required | Net MF unit holdings per investor/scheme |
| GET    | `/api/reports/profit-loss`       | Required | Realized P&L per investor (MF + Shares)  |
| GET    | `/api/reports/asset-allocation`  | Required | Overall asset allocation percentages     |

### Dashboard

| Method | Endpoint               | Auth     | Description                              |
|--------|------------------------|----------|------------------------------------------|
| GET    | `/api/dashboard/stats` | Required | Summary stats + charts data for admin    |

### Investor Portal

| Method   | Endpoint                                    | Role      | Description                                         |
|----------|---------------------------------------------|-----------|-----------------------------------------------------|
| GET      | `/api/investor-portal/dashboard`            | investor  | Personal portfolio overview                         |
| GET      | `/api/investor-portal/group-tree`           | investor  | Family group tree with all members                  |
| GET/POST | `/api/investor-portal/fd`                   | investor  | List / create own FD records                        |
| PUT/DELETE | `/api/investor-portal/fd/:id`             | investor  | Update / delete own FD                              |
| GET/POST | `/api/investor-portal/mf`                   | investor  | List / create own MF transactions                   |
| GET      | `/api/investor-portal/mf/holdings`          | investor  | Own MF holdings (net units)                         |
| PUT/DELETE | `/api/investor-portal/mf/:id`             | investor  | Update / delete own MF transaction                  |
| GET/POST | `/api/investor-portal/shares`               | investor  | List / create own share transactions                |
| GET      | `/api/investor-portal/shares/holdings`      | investor  | Own share holdings (net shares)                     |
| PUT/DELETE | `/api/investor-portal/shares/:id`         | investor  | Update / delete own share transaction               |
| GET      | `/api/investor-portal/reports/fd-maturity`  | investor  | Own FD maturity schedule                            |
| GET      | `/api/investor-portal/reports/profit-loss`  | investor  | Own P&L report                                      |
| POST     | `/api/investor-portal/investors/:id/create-login` | admin | Provision investor portal login              |
| GET      | `/api/investor-portal/investors/:id/login-status` | admin | Check if investor has a login              |

### Health Check

| Method | Endpoint      | Auth   | Description          |
|--------|---------------|--------|----------------------|
| GET    | `/api/health` | Public | API liveness check   |

---

## 📁 Project Structure

```
Portfolio Management System/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js       # Login, getMe
│   │   ├── crud.factory.js          # Generic CRUD factory for masters
│   │   ├── dashboard.controller.js  # Admin dashboard stats & charts
│   │   ├── fd.controller.js         # Fixed Deposit CRUD
│   │   ├── investor-portal.controller.js # Investor-scoped all operations
│   │   ├── mf.controller.js         # Mutual Fund CRUD
│   │   ├── report.controller.js     # All report aggregations
│   │   ├── share.controller.js      # Share CRUD
│   │   └── bank.controller.js       # Bank operations
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT verify (protect)
│   │   └── role.middleware.js        # Role-based access (requireRole)
│   ├── models/
│   │   ├── User.model.js            # username, email, password, role, investorId
│   │   ├── Group.model.js           # code, name, description, status
│   │   ├── Investor.model.js        # name, email, mobile, pan, address, groupId, status
│   │   ├── Category.model.js        # code, name, description (Asset Class)
│   │   ├── Subcategory.model.js     # categoryId, code, name, description
│   │   ├── Company.model.js         # code, name, flag (C/B), isin, sector
│   │   ├── Bank.model.js            # Bank-specific model
│   │   ├── AMC.model.js             # code, name
│   │   ├── Scheme.model.js          # amcId, schemeCode, name, isin, mfType, dgFlag
│   │   ├── FixedDeposit.model.js    # investorId, effectiveDate, subcategoryCode, companyId, …
│   │   ├── MutualFund.model.js      # investorId, amcId, schemeId, type, amount, units, nav, …
│   │   └── Share.model.js           # investorId, effectiveDate, bseNseFlag, companyId, type, …
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── group.routes.js
│   │   ├── investor.routes.js
│   │   ├── category.routes.js
│   │   ├── subcategory.routes.js
│   │   ├── company.routes.js
│   │   ├── bank.routes.js
│   │   ├── amc.routes.js
│   │   ├── scheme.routes.js
│   │   ├── fd.routes.js
│   │   ├── mf.routes.js
│   │   ├── share.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── report.routes.js
│   │   └── investor-portal.routes.js
│   ├── seeders/
│   │   ├── seed-data.js             # Sample groups and investors data
│   │   └── excel-seeder.js          # Bulk importer for AMC/Scheme/Equity Excel/CSV
│   ├── data-seeder.js               # Seeder entry point
│   ├── sample-seeder.js             # Sample data seeder
│   ├── seed.js                      # `npm run seed` entry point
│   ├── server.js                    # Express app entry point
│   ├── .env                         # Environment variables (not committed)
│   └── .env.example                 # Environment variable template
│
├── frontend/
│   ├── app/
│   │   ├── layout.js                # Root layout (AuthProvider)
│   │   ├── page.js                  # Root redirect (→ /dashboard or /login)
│   │   ├── globals.css              # Global CSS (custom design system, no Tailwind base)
│   │   ├── login/
│   │   │   └── page.js              # Login page
│   │   ├── dashboard/
│   │   │   ├── layout.js            # Admin layout guard
│   │   │   └── page.js              # Admin dashboard
│   │   ├── masters/
│   │   │   ├── layout.js
│   │   │   ├── groups/page.js
│   │   │   ├── investors/page.js
│   │   │   ├── categories/page.js
│   │   │   ├── subcategories/page.js
│   │   │   ├── companies/page.js
│   │   │   ├── banks/page.js
│   │   │   ├── amcs/page.js
│   │   │   └── schemes/page.js
│   │   ├── transactions/
│   │   │   ├── layout.js
│   │   │   ├── fixed-deposits/page.js
│   │   │   ├── mutual-funds/page.js
│   │   │   └── shares/page.js
│   │   ├── reports/
│   │   │   ├── layout.js
│   │   │   └── page.js              # All admin reports tabs
│   │   └── investor/
│   │       ├── layout.js            # Investor layout guard
│   │       ├── dashboard/page.js    # Investor personal dashboard
│   │       ├── transactions/
│   │       │   ├── fixed-income/page.js
│   │       │   ├── mutual-funds/page.js
│   │       │   ├── shares/page.js
│   │       │   └── insurance/page.js
│   │       ├── masters/
│   │       │   ├── groups/page.js
│   │       │   ├── investors/page.js
│   │       │   ├── categories/page.js
│   │       │   ├── subcategories/page.js
│   │       │   ├── companies/page.js
│   │       │   ├── amcs/page.js
│   │       │   └── schemes/page.js
│   │       └── reports/page.js      # Investor-scoped reports
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.js           # Admin sidebar navigation
│   │   │   └── Header.js            # Top header bar
│   │   ├── investor/
│   │   │   └── InvestorSidebar.js   # Investor sidebar navigation
│   │   ├── dashboard/               # Dashboard chart/widget components
│   │   ├── tables/                  # Reusable data table components
│   │   ├── ui/                      # Base UI primitives (Button, Input, Modal…)
│   │   ├── CrudPage.js              # Generic CRUD page wrapper
│   │   ├── ErrorBoundary.js         # React error boundary
│   │   └── ProtectedRoute.js        # Client-side route protection
│   ├── lib/
│   │   └── utils.js                 # Utility helpers (cn, formatters…)
│   ├── services/
│   │   ├── api.service.js           # Axios instance + admin API calls
│   │   └── investor-api.service.js  # Investor-portal API calls
│   ├── store/
│   │   └── AuthContext.js           # React context for auth state
│   ├── public/                      # Static assets
│   ├── next.config.mjs
│   ├── jsconfig.json                # Path aliases (@/)
│   └── .env.local                   # Frontend environment variables
│
├── Equity.csv                       # NSE/BSE equity scrip list (used by seeder)
├── SchemeData*.csv                  # AMFI scheme data (used by seeder)
├── List of Scrips*.xlsx             # Equity scrips Excel files
├── List of Mutual Funds*.xlsx       # AMC/Scheme master Excel
└── README.md                        # This file
```

---

## 📖 Usage Guide

### First-Time Setup

1. Complete [Installation & Setup](#-installation--setup) above.
2. Ensure MongoDB is running before starting the backend.
3. Run `npm run seed` to load all master data and create the admin account.

### Logging In

- Open **http://localhost:3000**
- **Admin login:** `admin` / `Admin@123`
- Investors log in with credentials provisioned by the admin (via Masters → Investors → Create Login).

### Admin Workflow

1. **Create Groups** — Add family groups under Masters → Groups.
2. **Add Investors** — Add investors under Masters → Investors, linking them to a group.
3. **Provision Investor Logins** — On each investor record, use "Create Login" to generate portal credentials.
4. **Record Transactions** — Go to Transactions → Fixed Income / Mutual Funds / Shares to record investments.
5. **View Reports** — Navigate to Reports to see AMC-wise, FD Maturity, MF Holdings, P&L, and more.

### Investor Workflow

1. Log in with credentials provided by the admin.
2. View your **My Dashboard** for a complete portfolio overview by asset class.
3. Navigate to **Transactions** to add or manage your Fixed Income, MF, Share, or Insurance records.
4. Use **Reports** to check your FD maturity schedule and P&L.

### Adding a Fixed Deposit

1. Go to **Transactions → Fixed Income**.
2. Select the **Investor**, enter **Effective Date**, and pick a **Subcategory Code** (BNFD, CNFD, etc.).
3. The **Company/Bank** dropdown automatically filters based on the subcategory:
   - `BNFD`/`BCFD` → only banks appear
   - `CNFD`/`CCFD`/`CD`/`NCD` → only companies appear
   - `PMIS`/`PTD` → Post Office; no company selection needed
4. Fill in deposit amount, interest rate, maturity date, and optional joint holders.

### Adding a Mutual Fund Transaction

1. Go to **Transactions → Mutual Funds**.
2. Select the **AMC** from the dropdown.
3. Select the **Scheme** — the ISIN field auto-populates.
4. Choose transaction type: **Purchase** or **Redemption**.
5. Enter amount, NAV, and calculated units.

### Recording Share Transactions

1. Go to **Transactions → Shares**.
2. Select **Purchase** or **Sales**:
   - **Purchase**: all companies are available in the dropdown.
   - **Sales**: only companies where the investor holds shares (purchases exceed sales) are listed.
3. Choose BSE or NSE flag, enter price per share and quantity.

---

## 🔒 Security Notes

- JWT tokens are stored client-side and sent as `Authorization: Bearer <token>` on every API request.
- Passwords are hashed with `bcryptjs` (12 salt rounds) before storage.
- The `protect` middleware validates the token on every protected route.
- The `requireRole` middleware enforces role-based access (`admin` vs `investor`).
- Investor portal routes are inaccessible to admin users and vice versa.
- Change `JWT_SECRET` to a strong random string in production.

---

## 🧪 Development Scripts

### Backend

| Command          | Description                            |
|------------------|----------------------------------------|
| `npm start`      | Start production server                |
| `npm run dev`    | Start with nodemon (auto-reload)       |
| `npm run seed`   | Seed database with sample data         |

### Frontend

| Command          | Description                            |
|------------------|----------------------------------------|
| `npm run dev`    | Start Next.js development server       |
| `npm run build`  | Build for production                   |
| `npm start`      | Start production server                |
| `npm run lint`   | Run ESLint                             |

---

## 📄 License

This project is proprietary. All rights reserved.
