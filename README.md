# 📊 Portfolio Management System (PMS)

A full-stack Portfolio Management System built with **Next.js**, **Express.js**, and **MongoDB**.

---

## 🚀 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) + JavaScript |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Tables | TanStack Table v8 |
| Auth | JWT + bcryptjs |

---

## 📁 Project Structure

```
Portfolio Management System/
├── frontend/     # Next.js app (port 3000)
└── backend/      # Express API (port 5000)
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 2. Backend Setup

```bash
cd backend
npm install
# Edit .env — set your MONGODB_URI
npm run seed    # Load dummy data
npm run dev     # Start backend on :5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev     # Start frontend on :3000
```

### 4. Open Browser

Visit: **http://localhost:3000**

---

## 🔐 Login Credentials

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `Admin@123` |

---

## 📦 Modules

### Masters
- Groups / Families
- Investors
- Categories & Subcategories
- Companies (Stocks)
- AMCs
- Schemes

### Transactions
- Fixed Deposits (with auto interest calculation)
- Mutual Funds (Buy/Redeem + Holdings)
- Shares (Buy/Sell + Portfolio)

### Reports
- Investor Portfolio
- AMC-wise Report
- FD Maturity Report
- MF Holdings
- Profit/Loss
- Asset Allocation

---

## 🗄️ Environment Variables

### Backend `.env`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/portfolio_management
JWT_SECRET=pms_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
