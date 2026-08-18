# Finova - Digital Banking & Investment Platform

A full-stack personal finance platform for managing accounts, tracking transactions, monitoring investments, setting financial goals, and analyzing financial performance.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Frontend deployment | Vercel |
| Backend + database | Render |

## Features

- Authentication - Register/Login with JWT
- Dashboard - Balance overview, charts, net worth
- Accounts - Manage multiple bank accounts
- Transactions - CRUD with filtering, search, pagination
- Transfers - Simulated money transfers with DB transactions
- Investments - Portfolio tracking with P&L and watchlist
- Goals - Financial goal tracking
- Analytics - Expense/income analytics, charts, net worth
- Notifications - Read/unread notifications
- Profile - User profile and password management

## Local Development

### Prerequisites

- Node.js >= 18
- PostgreSQL

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/finova.git
cd finova
createdb finova
```

Create `server/.env` with your local PostgreSQL credentials.

Install dependencies:

```bash
npm run install:all
```

Build the client:

```bash
npm run build
```

Start the backend:

```bash
npm start
```

The local backend runs at `http://localhost:5000`.

## Production Deployment

Finova is deployed as two applications:

```text
Vercel
  └── React/Vite frontend

Render
  └── Node/Express backend
       └── PostgreSQL
```

### 1. Render

The repository contains `render.yaml`.

The Blueprint provisions:

- `finova` Node.js Web Service on Render Starter
- `finova-db` PostgreSQL on Render Basic-256mb

The backend uses the database environment variables supplied by Render.

Connect the GitHub repository in Render using:

**New + -> Blueprint -> select the Finova repository -> Connect -> Apply**

After deployment, test:

```text
https://<your-render-service>.onrender.com/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "finova-api",
  "environment": "production"
}
```

### 2. Vercel

Import the same GitHub repository into Vercel.

Set:

- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

Add:

```text
VITE_API_URL=https://<your-render-service>.onrender.com
```

### 3. Connect frontend and backend

After Vercel gives you the frontend URL, set this Render environment variable:

```text
FRONTEND_URL=https://<your-vercel-frontend-url>
```

The backend CORS configuration must use `process.env.FRONTEND_URL`.

### 4. Secrets

Never commit:

```text
.env
server/.env
client/.env
```

JWT secrets and database credentials must remain in Render/Vercel environment variables.

## Project Structure

```text
finova/
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── db/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── client/
│   ├── src/
│   ├── index.html
│   └── vite.config.js
├── render.yaml
└── package.json
```

## Important

Finova is a portfolio/demo digital banking platform. Banking transactions and investments are simulated and do not represent real financial services.
