# 📐 Technical Documentation — Portfolio Management System

> **Version:** 1.0.0 | **Last Updated:** May 2026  
> This document is intended for developers and technical stakeholders. For setup and usage, see [README.md](./README.md).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [API Reference](#3-api-reference)
4. [Frontend Page Inventory](#4-frontend-page-inventory)
5. [Authentication Flow](#5-authentication-flow)
6. [Business Rules](#6-business-rules)
7. [Data Seeding Details](#7-data-seeding-details)
8. [Error Handling](#8-error-handling)
9. [Key Design Decisions](#9-key-design-decisions)

---

## 1. Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│   Next.js 16 App Router · React 19 · Radix UI · Recharts        │
│   Port: 3000                                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP (Axios)  · Authorization: Bearer JWT
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend API (Express.js)                        │
│   Node.js · Express 4 · JWT Auth · CORS                         │
│   Port: 5000                                                      │
│                                                                   │
│   ┌───────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│   │  Routes   │→│ Middleware  │→│ Controllers │→│  Models   │  │
│   │ 15 files  │ │ auth+role  │ │ 9 files     │ │ 12 files  │  │
│   └───────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ Mongoose ODM
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB                                      │
│   Port: 27017 · Database: portfolio_management                   │
│   Collections: users, groups, investors, categories,             │
│                subcategories, companies, amcs, schemes,           │
│                fixeddeposits, mutualfunds, shares                 │
└─────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
Browser Request
     │
     ▼
Next.js App Router (frontend/app/)
     │ fetch / axios via api.service.js
     ▼
Express Router (backend/routes/*.routes.js)
     │
     ▼
protect middleware (JWT verify → req.user)
     │
     ▼
requireRole middleware (checks req.user.role)
     │
     ▼
Controller (business logic + aggregations)
     │
     ▼
Mongoose Model (MongoDB query)
     │
     ▼
JSON Response { success, data | message }
```

### Frontend Architecture

The frontend uses **Next.js App Router** with the following conventions:

- Each route segment has a `page.js` (the UI) and optionally a `layout.js` (shared shell).
- **Admin routes** live under `app/` (dashboard, masters, transactions, reports).
- **Investor routes** live under `app/investor/`.
- `layout.js` files in each segment serve as route guards — they check `useAuth()` and redirect unauthenticated/wrong-role users.
- Global state is minimal: only auth state lives in `AuthContext`. Everything else is fetched on-demand via Axios.
- No Tailwind utility classes are used directly in component JSX; all styling is via `globals.css` custom classes and Radix UI primitives.

---

## 2. Database Schema

All models use Mongoose with automatic `createdAt` and `updatedAt` timestamps (`{ timestamps: true }`).

---

### 2.1 User

**Collection:** `users`

| Field        | Type      | Required | Default | Notes                                  |
|--------------|-----------|----------|---------|----------------------------------------|
| `_id`        | ObjectId  | auto     | —       | MongoDB auto-generated ID              |
| `username`   | String    | ✅       | —       | Unique, trimmed                        |
| `email`      | String    | ✅       | —       | Unique, lowercase, trimmed             |
| `password`   | String    | ✅       | —       | bcrypt hashed (12 rounds), min 6 chars |
| `role`       | String    | —        | `admin` | Enum: `admin`, `investor`, `user`      |
| `isActive`   | Boolean   | —        | `true`  | Account active flag                    |
| `investorId` | ObjectId  | —        | `null`  | Ref to `Investor`; only set for investor role |
| `createdAt`  | Date      | auto     | —       |                                        |
| `updatedAt`  | Date      | auto     | —       |                                        |

**Password handling:** A `pre('save')` Mongoose hook hashes the password before persisting. An instance method `comparePassword(candidate)` uses `bcrypt.compare`.

---

### 2.2 Group

**Collection:** `groups`

| Field         | Type    | Required | Default    | Notes                        |
|---------------|---------|----------|------------|------------------------------|
| `_id`         | ObjectId| auto     | —          |                              |
| `code`        | String  | —        | `''`       | e.g., `GRP-001`              |
| `name`        | String  | ✅       | —          | e.g., `Jadhav Family`        |
| `description` | String  | —        | `''`       | Free text                    |
| `status`      | String  | —        | `Active`   | Enum: `Active`, `Inactive`   |
| `createdAt`   | Date    | auto     | —          |                              |
| `updatedAt`   | Date    | auto     | —          |                              |

Groups represent family units. Each investor can belong to one group.

---

### 2.3 Investor

**Collection:** `investors`

| Field       | Type     | Required | Default   | Notes                              |
|-------------|----------|----------|-----------|------------------------------------|
| `_id`       | ObjectId | auto     | —         |                                    |
| `name`      | String   | ✅       | —         | Full name                          |
| `email`     | String   | ✅       | —         | Lowercase, trimmed                 |
| `mobile`    | String   | ✅       | —         | 10-digit mobile number             |
| `pan`       | String   | ✅       | —         | Uppercase PAN card number          |
| `address`   | String   | —        | `''`      | Full postal address                |
| `groupId`   | ObjectId | —        | `null`    | Ref to `Group`                     |
| `status`    | String   | —        | `Active`  | Enum: `Active`, `Inactive`         |
| `createdAt` | Date     | auto     | —         |                                    |
| `updatedAt` | Date     | auto     | —         |                                    |

---

### 2.4 Category (Asset Class)

**Collection:** `categories`

| Field         | Type     | Required | Default | Notes                                         |
|---------------|----------|----------|---------|-----------------------------------------------|
| `_id`         | ObjectId | auto     | —       |                                               |
| `code`        | String   | —        | `''`    | e.g., `FI`, `MF`, `SH`                       |
| `name`        | String   | ✅       | —       | e.g., `Fixed Income`, `Mutual Funds`, `Shares`|
| `description` | String   | —        | `''`    |                                               |
| `createdAt`   | Date     | auto     | —       |                                               |
| `updatedAt`   | Date     | auto     | —       |                                               |

---

### 2.5 Subcategory (Asset Sub Class)

**Collection:** `subcategories`

| Field         | Type     | Required | Default | Notes                                                    |
|---------------|----------|----------|---------|----------------------------------------------------------|
| `_id`         | ObjectId | auto     | —       |                                                          |
| `categoryId`  | ObjectId | ✅       | —       | Ref to `Category`                                        |
| `code`        | String   | —        | `''`    | e.g., `BNFD`, `CNFD`, `PMIS`                            |
| `name`        | String   | ✅       | —       | e.g., `Bank Fixed Deposit`, `Post Office MIS`            |
| `description` | String   | —        | `''`    |                                                          |
| `createdAt`   | Date     | auto     | —       |                                                          |
| `updatedAt`   | Date     | auto     | —       |                                                          |

**Subcategory codes used in Fixed Income filtering:**

| Code   | Category       | Company/Bank Filter |
|--------|----------------|---------------------|
| `BNFD` | Bank FD (New)  | Banks only          |
| `BCFD` | Bank CD (New)  | Banks only          |
| `CNFD` | Company FD (New)| Companies only     |
| `CCFD` | Company CD (New)| Companies only     |
| `CD`   | Certificate of Deposit | Companies only |
| `NCD`  | Non-Convertible Debenture | Companies only |
| `PMIS` | Post Office MIS | Post Office — no company |
| `PTD`  | Post Office TD  | Post Office — no company |

---

### 2.6 Company (Company / Bank Master)

**Collection:** `companies`

| Field    | Type     | Required | Default | Notes                                   |
|----------|----------|----------|---------|-----------------------------------------|
| `_id`    | ObjectId | auto     | —       |                                         |
| `code`   | String   | —        | `''`    | Company/Bank code                       |
| `name`   | String   | ✅       | —       | Company or bank name                    |
| `flag`   | String   | ✅       | `C`     | Enum: `C` = Company, `B` = Bank        |
| `isin`   | String   | —        | `''`    | ISIN code (only for companies; `flag=C`)|
| `sector` | String   | —        | `''`    | Sector name (e.g., Banking, IT, Pharma) |
| `createdAt`| Date   | auto     | —       |                                         |
| `updatedAt`| Date   | auto     | —       |                                         |

The `flag` field drives the Fixed Income dropdown filtering logic.

---

### 2.7 AMC

**Collection:** `amcs`

| Field       | Type     | Required | Default | Notes                           |
|-------------|----------|----------|---------|---------------------------------|
| `_id`       | ObjectId | auto     | —       |                                 |
| `code`      | String   | —        | `''`    | AMC short code (e.g., `ABSL`)   |
| `name`      | String   | ✅       | —       | Full AMC name                   |
| `createdAt` | Date     | auto     | —       |                                 |
| `updatedAt` | Date     | auto     | —       |                                 |

---

### 2.8 Scheme

**Collection:** `schemes`

| Field        | Type     | Required | Default | Notes                                             |
|--------------|----------|----------|---------|---------------------------------------------------|
| `_id`        | ObjectId | auto     | —       |                                                   |
| `amcId`      | ObjectId | ✅       | —       | Ref to `AMC`                                      |
| `schemeCode` | String   | —        | `''`    | Official scheme code                              |
| `name`       | String   | ✅       | —       | Scheme name                                       |
| `isin`       | String   | —        | `''`    | ISIN; auto-populated in MF transaction form       |
| `mfType`     | String   | —        | `''`    | Type of MF (e.g., Equity, Debt, Hybrid)           |
| `dgFlag`     | String   | —        | `''`    | Enum: `Dividend`, `Growth`, `''`                  |
| `createdAt`  | Date     | auto     | —       |                                                   |
| `updatedAt`  | Date     | auto     | —       |                                                   |

---

### 2.9 FixedDeposit

**Collection:** `fixeddeposits`

| Field               | Type     | Required | Default | Notes                                              |
|---------------------|----------|----------|---------|----------------------------------------------------|
| `_id`               | ObjectId | auto     | —       |                                                    |
| `investorId`        | ObjectId | ✅       | —       | Ref to `Investor`                                  |
| `effectiveDate`     | Date     | ✅       | —       | Date FD was opened                                 |
| `subcategoryCode`   | String   | ✅       | —       | Enum: `BNFD`, `CNFD`, `BCFD`, `CCFD`, `CD`, `NCD`, `PMIS`, `PTD`, `Insurance Annuity` |
| `companyId`         | ObjectId | —        | —       | Ref to `Company`; not used for PMIS/PTD            |
| `jointHolder1`      | String   | —        | `''`    | Name of first joint holder                        |
| `jointHolder2`      | String   | —        | `''`    | Name of second joint holder                       |
| `depositAmount`     | Number   | ✅       | —       | Principal amount in INR (min 0)                   |
| `interestRate`      | Number   | ✅       | —       | Annual interest rate % (0–100)                    |
| `firstInterestDate` | Date     | —        | `null`  | Date of first interest payment                    |
| `maturityDate`      | Date     | ✅       | —       | Date FD matures                                   |
| `maturityAmount`    | Number   | —        | `0`     | Calculated maturity value                         |
| `createdAt`         | Date     | auto     | —       |                                                   |
| `updatedAt`         | Date     | auto     | —       |                                                   |

---

### 2.10 MutualFund

**Collection:** `mutualfunds`

| Field               | Type     | Required | Default  | Notes                                           |
|---------------------|----------|----------|----------|-------------------------------------------------|
| `_id`               | ObjectId | auto     | —        |                                                 |
| `investorId`        | ObjectId | ✅       | —        | Ref to `Investor`                               |
| `amcId`             | ObjectId | ✅       | —        | Ref to `AMC`                                    |
| `amcType`           | String   | —        | `''`     | AMC category type                               |
| `schemeId`          | ObjectId | ✅       | —        | Ref to `Scheme`                                 |
| `effectiveDate`     | Date     | ✅       | —        | Date of transaction                             |
| `transactionDate`   | Date     | —        | —        | Processing/settlement date                      |
| `type`              | String   | ✅       | —        | Enum: `Purchase`, `Redemption`                  |
| `mfType`            | String   | —        | `Growth` | Enum: `Dividend`, `Growth`                      |
| `jointHolder1`      | String   | —        | `''`     |                                                 |
| `jointHolder2`      | String   | —        | `''`     |                                                 |
| `amount`            | Number   | ✅       | —        | Transaction amount in INR (min 0)               |
| `firstDividendDate` | Date     | —        | —        | First dividend date (for Dividend type)         |
| `nav`               | Number   | —        | `0`      | Net Asset Value at time of transaction          |
| `units`             | Number   | —        | `0`      | Units purchased or redeemed                     |
| `notes`             | String   | —        | `''`     | Free-text notes                                 |
| `createdAt`         | Date     | auto     | —        |                                                 |
| `updatedAt`         | Date     | auto     | —        |                                                 |

**Net holdings calculation:** `Σ(Purchase units) − Σ(Redemption units)` per investor per scheme.

---

### 2.11 Share

**Collection:** `shares`

| Field               | Type     | Required | Default | Notes                                              |
|---------------------|----------|----------|---------|----------------------------------------------------|
| `_id`               | ObjectId | auto     | —       |                                                    |
| `investorId`        | ObjectId | ✅       | —       | Ref to `Investor`                                  |
| `effectiveDate`     | Date     | ✅       | —       | Trade date                                         |
| `bseNseFlag`        | String   | ✅       | —       | Enum: `BSE`, `NSE`                                 |
| `companyId`         | ObjectId | —        | —       | Ref to `Company` (scrip)                           |
| `isin`              | String   | —        | `''`    | ISIN of the scrip                                  |
| `sector`            | String   | —        | `''`    | Sector (auto-populated from Company)               |
| `type`              | String   | ✅       | —       | Enum: `Purchase`, `Sales`                          |
| `jointHolder1`      | String   | —        | `''`    |                                                    |
| `jointHolder2`      | String   | —        | `''`    |                                                    |
| `amount`            | Number   | —        | `0`     | Total investment amount                            |
| `firstDividendDate` | Date     | —        | `null`  | First dividend date                                |
| `price`             | Number   | —        | `0`     | Price per share at trade date                      |
| `noOfShares`        | Number   | —        | `0`     | Number of shares traded                            |
| `createdAt`         | Date     | auto     | —       |                                                    |
| `updatedAt`         | Date     | auto     | —       |                                                    |

**Net holdings calculation:** `Σ(Purchase shares) − Σ(Sales shares)` per investor per company.

---

## 3. API Reference

All API responses follow this envelope:

```json
{ "success": true,  "data": <payload> }
{ "success": false, "message": "Error description" }
```

All protected routes require the header:
```
Authorization: Bearer <jwt_token>
```

---

### 3.1 Authentication

#### POST `/api/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f3a...",
    "username": "admin",
    "email": "admin@pms.com",
    "role": "admin",
    "investorId": null
  }
}
```

**Error Response (401):**
```json
{ "success": false, "message": "Invalid credentials" }
```

---

#### GET `/api/auth/me`

**Access:** Protected (any role)

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "64f3a...",
    "username": "admin",
    "email": "admin@pms.com",
    "role": "admin",
    "investorId": null
  }
}
```

---

### 3.2 Groups

#### GET `/api/groups`

Returns all groups.

```json
{
  "success": true,
  "data": [
    { "_id": "...", "code": "GRP-001", "name": "Jadhav Family", "status": "Active", "createdAt": "..." }
  ]
}
```

#### POST `/api/groups`

```json
// Request
{ "code": "GRP-009", "name": "Patel Family", "description": "Patel family group", "status": "Active" }

// Response (201)
{ "success": true, "data": { "_id": "...", "code": "GRP-009", "name": "Patel Family", ... } }
```

#### PUT `/api/groups/:id`
#### DELETE `/api/groups/:id`

Standard update/delete returning `{ success: true, data: <updated_doc> }` or `{ success: true, message: "Deleted" }`.

---

### 3.3 Investors

#### GET `/api/investors`

Returns all investors with group populated.

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Yash Jadhav",
      "email": "yash.jadhav@gmail.com",
      "mobile": "9876543201",
      "pan": "ARJPJ1234A",
      "address": "Flat 301, Sai Heights, Pune",
      "groupId": { "_id": "...", "name": "Jadhav Family" },
      "status": "Active"
    }
  ]
}
```

#### POST `/api/investors`

```json
{
  "name": "Rahul Patel",
  "email": "rahul.patel@gmail.com",
  "mobile": "9876540001",
  "pan": "ABCDE1234F",
  "address": "123 Main St, Mumbai",
  "groupId": "<group_object_id>",
  "status": "Active"
}
```

---

### 3.4 Fixed Deposits

#### GET `/api/fd`

Returns all FD records with `investorId` and `companyId` populated.

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "investorId": { "name": "Yash Jadhav" },
      "effectiveDate": "2024-01-15T00:00:00.000Z",
      "subcategoryCode": "BNFD",
      "companyId": { "name": "HDFC Bank", "flag": "B" },
      "depositAmount": 500000,
      "interestRate": 7.5,
      "maturityDate": "2025-01-15T00:00:00.000Z",
      "maturityAmount": 537500
    }
  ]
}
```

#### POST `/api/fd`

```json
{
  "investorId": "<investor_id>",
  "effectiveDate": "2024-06-01",
  "subcategoryCode": "BNFD",
  "companyId": "<company_id>",
  "depositAmount": 200000,
  "interestRate": 7.0,
  "maturityDate": "2026-06-01",
  "maturityAmount": 230000,
  "jointHolder1": "Suresh Jadhav",
  "jointHolder2": ""
}
```

---

### 3.5 Mutual Funds

#### GET `/api/mf`

Returns all MF transactions with `investorId`, `amcId`, `schemeId` populated.

#### POST `/api/mf`

```json
{
  "investorId": "<investor_id>",
  "amcId": "<amc_id>",
  "schemeId": "<scheme_id>",
  "effectiveDate": "2024-03-01",
  "type": "Purchase",
  "mfType": "Growth",
  "amount": 50000,
  "nav": 125.50,
  "units": 398.41,
  "jointHolder1": "",
  "jointHolder2": "",
  "notes": "Monthly SIP"
}
```

---

### 3.6 Shares

#### GET `/api/shares`

Returns all share transactions.

#### POST `/api/shares`

```json
{
  "investorId": "<investor_id>",
  "effectiveDate": "2024-04-10",
  "bseNseFlag": "NSE",
  "companyId": "<company_id>",
  "isin": "INE040A01034",
  "sector": "Banking",
  "type": "Purchase",
  "price": 1650.75,
  "noOfShares": 100,
  "amount": 165075
}
```

---

### 3.7 Reports (Admin)

#### GET `/api/reports/amc-wise`

```json
{
  "success": true,
  "data": [
    {
      "_id": "<amc_id>",
      "amc": { "code": "ABSL", "name": "Aditya Birla Sun Life" },
      "totalPurchased": 500000,
      "totalRedeemed": 50000,
      "netInvested": 450000,
      "totalUnits": 3200.5,
      "txCount": 8
    }
  ]
}
```

#### GET `/api/reports/fd-maturity?from=2024-01-01&to=2025-12-31`

Query params: `from` (ISO date), `to` (ISO date), `status`.

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "investorId": { "name": "Yash Jadhav", "email": "...", "pan": "ARJPJ1234A" },
      "subcategoryCode": "BNFD",
      "depositAmount": 500000,
      "maturityAmount": 537500,
      "maturityDate": "2025-01-15T00:00:00.000Z"
    }
  ]
}
```

#### GET `/api/reports/mf-holdings`

Returns investors with net positive unit holdings per scheme.

```json
{
  "success": true,
  "data": [
    {
      "investor": { "name": "Yash Jadhav", "pan": "ARJPJ1234A" },
      "amc": { "name": "HDFC Mutual Fund" },
      "scheme": { "name": "HDFC Flexi Cap Fund" },
      "netUnits": 350.25,
      "totalInvested": 50000,
      "currentValue": 62000
    }
  ]
}
```

#### GET `/api/reports/profit-loss`

```json
{
  "success": true,
  "data": [
    {
      "investor": "Yash Jadhav",
      "mfPurchased": 200000,
      "mfRedeemed": 230000,
      "mfPnL": 30000,
      "sharesPnL": 15000,
      "totalPnL": 45000
    }
  ]
}
```

#### GET `/api/reports/asset-allocation`

```json
{
  "success": true,
  "data": [
    { "asset": "Fixed Deposits", "amount": 2500000, "percentage": "45.5" },
    { "asset": "Mutual Funds",   "amount": 1800000, "percentage": "32.7" },
    { "asset": "Shares",         "amount": 1200000, "percentage": "21.8" }
  ]
}
```

---

### 3.8 Dashboard

#### GET `/api/dashboard/stats`

**Access:** Admin required

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalInvestors": 22,
      "totalPortfolio": 5500000,
      "totalFD": 2500000,
      "totalMF": 1800000,
      "totalShares": 1200000,
      "totalAMCs": 15,
      "totalSchemes": 120,
      "totalGroups": 8
    },
    "assetAllocation": [
      { "name": "Fixed Deposits", "value": 2500000, "color": "#3B82F6" },
      { "name": "Mutual Funds",   "value": 1800000, "color": "#8B5CF6" },
      { "name": "Shares",         "value": 1200000, "color": "#10B981" }
    ],
    "amcDistribution": [
      { "name": "HDFC Mutual Fund", "value": 600000 }
    ],
    "monthlyTrend": {
      "mf": [{ "_id": { "year": 2024, "month": 3 }, "amount": 150000 }],
      "fd": [{ "_id": { "year": 2024, "month": 2 }, "amount": 300000 }]
    },
    "recentActivity": {
      "fd": [{ "type": "Fixed Deposit", "investor": "Yash Jadhav", "amount": 500000, "date": "..." }],
      "mf": [{ "type": "MF Purchase",  "investor": "Amit Sharma", "amount": 50000, "scheme": "HDFC Flexi Cap", "date": "..." }]
    }
  }
}
```

---

### 3.9 Investor Portal

All `/api/investor-portal/*` routes require `role = investor` (except the two admin-only provision routes).

#### GET `/api/investor-portal/dashboard`

Returns the authenticated investor's complete portfolio summary with asset-class breakdown, similar to the admin dashboard but scoped to one investor.

#### GET `/api/investor-portal/group-tree`

Returns the investor's family group with all members and their individual portfolio summaries.

#### GET `/api/investor-portal/mf/holdings`

Net MF unit holdings for the authenticated investor.

#### GET `/api/investor-portal/shares/holdings`

Companies where the investor holds net positive shares.

#### GET `/api/investor-portal/reports/fd-maturity`

FD maturity report scoped to this investor.

#### GET `/api/investor-portal/reports/profit-loss`

P&L report scoped to this investor's MF and share transactions.

#### POST `/api/investor-portal/investors/:id/create-login`

**Access:** Admin only

Creates a `User` account (role = `investor`) linked to the investor record.

**Request Body:**
```json
{
  "username": "yash.jadhav",
  "email": "yash.jadhav@gmail.com",
  "password": "Investor@123"
}
```

---

## 4. Frontend Page Inventory

### 4.1 Shared / Root

| File                        | Purpose                                            |
|-----------------------------|----------------------------------------------------|
| `app/layout.js`             | Root layout; wraps app in `AuthProvider`           |
| `app/page.js`               | Root redirect: admin → `/dashboard`, investor → `/investor/dashboard`, else → `/login` |
| `app/globals.css`           | Global CSS custom properties and component styles  |
| `app/error.js`              | Next.js error boundary page                        |
| `app/login/page.js`         | Login form with username/password, role detection  |

### 4.2 Admin Section

| File                                  | Route                         | Key Features                                              |
|---------------------------------------|-------------------------------|-----------------------------------------------------------|
| `app/dashboard/layout.js`             | —                             | Auth guard (admin only), renders `<Sidebar>` + `<Header>`|
| `app/dashboard/page.js`               | `/dashboard`                  | Stats cards, asset allocation pie, AMC bar chart, monthly trend, recent transactions |
| `app/masters/layout.js`               | —                             | Masters section shell                                     |
| `app/masters/groups/page.js`          | `/masters/groups`             | CRUD table for Groups                                     |
| `app/masters/investors/page.js`       | `/masters/investors`          | CRUD table; "Create Login" action on each row             |
| `app/masters/categories/page.js`      | `/masters/categories`         | CRUD table for Asset Classes                              |
| `app/masters/subcategories/page.js`   | `/masters/subcategories`      | CRUD table; Category dropdown in form                     |
| `app/masters/companies/page.js`       | `/masters/companies`          | CRUD table; flag (C/B) toggle; ISIN field for companies   |
| `app/masters/banks/page.js`           | `/masters/banks`              | Bank-specific master management                           |
| `app/masters/amcs/page.js`            | `/masters/amcs`               | CRUD table for AMCs                                       |
| `app/masters/schemes/page.js`         | `/masters/schemes`            | CRUD table; AMC dropdown; ISIN, D/G flag fields           |
| `app/transactions/layout.js`          | —                             | Transactions section shell                                |
| `app/transactions/fixed-deposits/page.js` | `/transactions/fixed-deposits` | FD transaction form with subcategory-driven company filter |
| `app/transactions/mutual-funds/page.js`   | `/transactions/mutual-funds`   | MF form; ISIN auto-fill on scheme selection             |
| `app/transactions/shares/page.js`         | `/transactions/shares`         | Share form; Purchase shows all companies, Sales shows holdings only |
| `app/reports/layout.js`               | —                             | Reports section shell                                     |
| `app/reports/page.js`                 | `/reports`                    | Tabbed report viewer: AMC-wise, FD Maturity, MF Holdings, P&L, Share Holdings |

### 4.3 Investor Section

| File                                          | Route                                  | Key Features                                                    |
|-----------------------------------------------|----------------------------------------|-----------------------------------------------------------------|
| `app/investor/layout.js`                      | —                                      | Auth guard (investor only), renders `<InvestorSidebar>` + `<Header>` |
| `app/investor/dashboard/page.js`              | `/investor/dashboard`                  | Personal portfolio cards by asset class (expandable); group tree  |
| `app/investor/transactions/fixed-income/page.js`| `/investor/transactions/fixed-income`| Own FD records                                                  |
| `app/investor/transactions/mutual-funds/page.js`| `/investor/transactions/mutual-funds`| Own MF records                                                  |
| `app/investor/transactions/shares/page.js`    | `/investor/transactions/shares`        | Own share records                                               |
| `app/investor/transactions/insurance/page.js` | `/investor/transactions/insurance`     | Own insurance records                                           |
| `app/investor/masters/groups/page.js`         | `/investor/masters/groups`             | Groups master (read + write)                                    |
| `app/investor/masters/investors/page.js`      | `/investor/masters/investors`          | Investors master (read + write)                                 |
| `app/investor/masters/categories/page.js`     | `/investor/masters/categories`         | Categories master (read + write)                                |
| `app/investor/masters/subcategories/page.js`  | `/investor/masters/subcategories`      | Subcategories master (read + write)                             |
| `app/investor/masters/companies/page.js`      | `/investor/masters/companies`          | Companies master (read + write)                                 |
| `app/investor/masters/amcs/page.js`           | `/investor/masters/amcs`               | AMCs master (read + write)                                      |
| `app/investor/masters/schemes/page.js`        | `/investor/masters/schemes`            | Schemes master (read + write)                                   |
| `app/investor/reports/page.js`                | `/investor/reports`                    | Tabbed reports: FD Maturity + P&L, scoped to this investor      |

### 4.4 Shared Components

| Component                             | Purpose                                                      |
|---------------------------------------|--------------------------------------------------------------|
| `components/layout/Sidebar.js`        | Admin sidebar with animated collapsible nav groups           |
| `components/layout/Header.js`         | Top bar with mobile menu toggle and user info                |
| `components/investor/InvestorSidebar.js` | Investor-specific sidebar navigation                      |
| `components/CrudPage.js`             | Generic CRUD page: renders table + add/edit modal           |
| `components/ErrorBoundary.js`        | React error boundary wrapper                                |
| `components/ProtectedRoute.js`       | Client-side role-based route guard                          |
| `components/dashboard/`             | Dashboard-specific widgets and chart wrappers               |
| `components/tables/`                | Reusable TanStack Table data grid components                |
| `components/ui/`                    | Base UI: Button, Input, Select, Dialog, Toast, etc.         |

---

## 5. Authentication Flow

### Login Flow

```
User submits username + password
        │
        ▼
POST /api/auth/login
        │
        ▼
Server finds user by username OR email
        │
        ├─ Not found → 401 "Invalid credentials"
        │
        ▼
bcrypt.compare(password, stored_hash)
        │
        ├─ Mismatch → 401 "Invalid credentials"
        │
        ▼
Check isActive === true
        │
        ├─ false → 403 "Account is deactivated"
        │
        ▼
jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' })
        │
        ▼
Return { token, user: { id, username, email, role, investorId } }
        │
        ▼
Client stores token in memory (AuthContext) + localStorage
        │
        ▼
All subsequent requests: Authorization: Bearer <token>
```

### Route Protection (Frontend)

```
Page renders
    │
    ▼
layout.js checks useAuth() → { user, loading }
    │
    ├─ loading: true  → Show loading spinner
    │
    ├─ user: null     → router.push('/login')
    │
    ├─ user.role wrong → router.push('/dashboard') or '/investor/dashboard'
    │
    └─ OK             → Render children (the page)
```

### Route Protection (Backend)

```
Request arrives at protected route
    │
    ▼
auth.middleware.js (protect)
    │
    ├─ No Authorization header → 401
    ├─ Token invalid/expired   → 401
    └─ Token valid             → req.user = User from DB
    │
    ▼
role.middleware.js (requireRole('admin' | 'investor'))
    │
    ├─ req.user.role doesn't match → 403
    └─ Matches → next()
    │
    ▼
Controller executes
```

### Token Storage

- Token is stored in `localStorage` under key `pms_token` (via `AuthContext`).
- On app load, `AuthContext` reads from `localStorage` and calls `GET /api/auth/me` to validate and restore the session.
- On logout, the token is removed from `localStorage` and the context is cleared.

---

## 6. Business Rules

### 6.1 Fixed Income — Company/Bank Filtering

When a user selects a **Subcategory Code** in a Fixed Income (FD) transaction form, the **Company / Bank** dropdown is dynamically filtered:

| Subcategory Code | Dropdown Shows        | Logic                            |
|------------------|-----------------------|----------------------------------|
| `BNFD`           | Banks only            | `Company.flag === 'B'`           |
| `BCFD`           | Banks only            | `Company.flag === 'B'`           |
| `CNFD`           | Companies only        | `Company.flag === 'C'`           |
| `CCFD`           | Companies only        | `Company.flag === 'C'`           |
| `CD`             | Companies only        | `Company.flag === 'C'`           |
| `NCD`            | Companies only        | `Company.flag === 'C'`           |
| `PMIS`           | Hidden / not required | Post Office — no entity to select|
| `PTD`            | Hidden / not required | Post Office — no entity to select|
| `Insurance Annuity` | Companies only     | `Company.flag === 'C'`           |

This filtering happens on the **frontend** by filtering the loaded companies list client-side based on the `flag` field.

---

### 6.2 Share Purchase vs. Sales — Company Dropdown

| Transaction Type | Company Dropdown Population                                   |
|------------------|---------------------------------------------------------------|
| `Purchase`       | All companies from the Company master                        |
| `Sales`          | Only companies where `Σ(Purchase noOfShares) > Σ(Sales noOfShares)` for this investor — i.e., only held companies |

The "held companies" list is derived by calling `GET /api/investor-portal/shares/holdings` (or equivalent admin endpoint) which returns companies with `netShares > 0`.

---

### 6.3 MF Transaction — ISIN Auto-Fetch

When a user selects a **Scheme** in a Mutual Fund transaction:

1. The scheme's details are fetched from the Scheme master (already loaded).
2. The `isin` field is automatically populated from `Scheme.isin`.
3. The `mfType` (Dividend/Growth) can also be pre-filled from `Scheme.dgFlag`.

---

### 6.4 Investor Portal Scoping

All investor portal controller methods automatically scope queries to `req.user.investorId`:

```javascript
// Example: getMyFD
const fds = await FixedDeposit.find({ investorId: req.user.investorId });
```

This ensures investors can **never** access other investors' data regardless of URL manipulation.

---

### 6.5 Family Group Tree

The `GET /api/investor-portal/group-tree` endpoint:

1. Looks up the authenticated investor's `groupId`.
2. Finds all investors in the same group.
3. For each group member, fetches their FD, MF, and Share totals.
4. Returns a tree structure enabling the investor's dashboard to show family-wide portfolio context.

---

### 6.6 Admin Investor Login Provisioning

To give an investor access to the portal:

1. Admin navigates to **Masters → Investors**.
2. Admin clicks **Create Login** on an investor row.
3. Admin provides `username`, `email`, and `password`.
4. The system calls `POST /api/investor-portal/investors/:id/create-login`.
5. A new `User` document is created with `role: 'investor'` and `investorId` pointing to this investor.
6. The investor can now log in at `/login`.

**Constraint:** Each investor can only have one login account. The login status endpoint `GET /api/investor-portal/investors/:id/login-status` checks whether a `User` record with `investorId === id` already exists.

---

### 6.7 Joint Holders

Fixed Deposits, Mutual Funds, and Share transactions all support up to **two joint holders**. These are stored as plain strings (names only), not as references to Investor records. Joint holders are informational and do not affect portfolio calculations.

---

### 6.8 Portfolio Value Calculations

| Asset Class | Invested Value                                    | Notes                                              |
|-------------|---------------------------------------------------|----------------------------------------------------|
| Fixed Income| `Σ(depositAmount)`                               | Maturity value stored separately                   |
| Mutual Funds| `Σ(Purchase.amount) − Σ(Redemption.amount)`      | Net invested; current value = `netUnits × currentNAV` |
| Shares      | `Σ(Purchase.amount) − Σ(Sales.amount)`           | Net invested at cost                               |

---

## 7. Data Seeding Details

The seed system runs via `npm run seed` which executes `seed.js` → `data-seeder.js` / `sample-seeder.js`.

### 7.1 Seeding Pipeline

```
npm run seed
    │
    ▼
seed.js
    │
    ├──▶ Create admin user: admin / Admin@123 (if not exists)
    │
    ├──▶ Load SAMPLE_GROUPS from seeders/seed-data.js
    │    Insert 8 family groups (upsert by name)
    │
    ├──▶ Load SAMPLE_INVESTORS from seeders/seed-data.js
    │    Insert 22 investors (upsert by PAN), link to groups
    │
    ├──▶ excel-seeder.js: Parse SchemeData*.csv (AMFI)
    │    ├─ Extract unique AMC names → insert AMC documents
    │    └─ Insert Scheme documents linked to AMCs
    │
    └──▶ excel-seeder.js: Parse Equity.csv / NSE/BSE Excel
         └─ Insert Company documents (flag='C') with ISIN, sector
```

### 7.2 Sample Groups

| Code    | Name             |
|---------|------------------|
| GRP-001 | Jadhav Family    |
| GRP-002 | Vagal Family     |
| GRP-003 | Sharma Family    |
| GRP-004 | Mehta Family     |
| GRP-005 | Patil Family     |
| GRP-006 | Joshi Family     |
| GRP-007 | Kulkarni Family  |
| GRP-008 | Desai Family     |

### 7.3 Sample Investors (22 total)

| Family    | Members                                    |
|-----------|--------------------------------------------|
| Jadhav    | Yash, Suresh, Priya                        |
| Vagal     | Rajesh, Sunita, Akash                      |
| Sharma    | Amit, Anita, Rohan                         |
| Mehta     | Vikram, Kavita, Nikhil                     |
| Patil     | Mahesh, Rekha, Saurabh                     |
| Joshi     | Dinesh, Asha                               |
| Kulkarni  | Prakash, Sushma, Kiran                     |
| Desai     | Hemant, Ranjana                            |

All investors have unique PANs, email addresses, mobile numbers, and addresses.

### 7.4 AMC & Scheme Data

- Sourced from `SchemeData2205260723SS.csv` (~4 MB, official AMFI data).
- The `excel-seeder.js` parses this CSV to extract AMC names and scheme details (scheme code, name, ISIN, type, D/G flag).
- Duplicate AMC names are deduplicated before insertion.

### 7.5 Company / Equity Data

- Sourced from `Equity.csv`, `List of Scrips traded on BSE.xlsx`, and `List of Scrips traded on NSE (1).xlsx`.
- Each scrip is inserted as a `Company` document with `flag: 'C'`.
- Fields mapped: scrip code → `code`, scrip name → `name`, ISIN → `isin`, sector → `sector`.

---

## 8. Error Handling

### Backend

All controllers use `try/catch` blocks. Errors are returned as:

```json
{ "success": false, "message": "<error_message>" }
```

HTTP status codes used:
- `200` — Success (GET, PUT)
- `201` — Created (POST)
- `400` — Bad request / validation failure
- `401` — Unauthorized (no token / invalid token)
- `403` — Forbidden (wrong role / deactivated account)
- `404` — Route not found
- `500` — Internal server error

A global Express error handler catches any uncaught middleware errors:
```javascript
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});
```

### Frontend

- `ErrorBoundary.js` wraps major page sections to catch React rendering errors.
- Axios errors are caught in service functions and surfaced via **Sonner** toast notifications.
- Layout guards handle auth state loading with a spinner to prevent flash of unauthenticated content.

---

## 9. Key Design Decisions

### Generic CRUD Factory

`controllers/crud.factory.js` exports a factory function that generates standard `getAll`, `getOne`, `create`, `update`, `delete` controller methods for any Mongoose model. This eliminates boilerplate for the 7 master entities (Groups, Investors, Categories, Subcategories, Companies, AMCs, Schemes).

### Separate Investor Portal Controller

Rather than adding investor-scoping logic to every shared controller, all investor-facing operations live in a dedicated `investor-portal.controller.js`. This makes the scoping logic explicit, testable, and keeps the admin controllers clean.

### No Tailwind Utility Classes in JSX

Tailwind is installed but used only for configuration/build pipeline. All component-level styles are written as custom CSS classes in `globals.css`. This provides a consistent design language without coupling component logic to utility class strings.

### MongoDB Without Transactions

All write operations are single-document. No multi-document transactions are used, keeping the implementation simple while accepting the trade-off that partial failures (e.g., creating investor + user in two writes) are handled by defensive checks and idempotent re-runs.

### Flat vs. Embedded Documents

All related data (investor → group, MF → AMC → scheme, FD → company) uses **references (ObjectId)** rather than embedding. This keeps documents small and allows independent querying/updating of masters without touching transaction records.

### Report Aggregations

All reports are computed on-the-fly using MongoDB aggregation pipelines (`$group`, `$lookup`, `$addFields`). There is no pre-computed cache layer. For the current data scale (hundreds of investors, thousands of transactions), this is acceptable. A caching layer (Redis) could be added if query latency becomes a concern at scale.
