# Finova - Digital Banking & Investment Platform

A full-stack personal finance platform for managing accounts, tracking transactions, monitoring investments, setting financial goals, and analyzing financial performance.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Deployment | Render (free tier) |

## Features

- **Authentication** - Register/Login with JWT
- **Dashboard** - Balance overview, charts, net worth
- **Accounts** - Manage multiple bank accounts (Savings, Current, Cash, Credit Card)
- **Transactions** - CRUD with filtering, search, pagination
- **Transfers** - Simulated money transfers with DB transactions
- **Investments** - Portfolio tracking with P&L and watchlist
- **Goals** - Financial goal tracking with progress bars
- **Analytics** - Expense/income analytics, charts, net worth
- **Notifications** - System notifications with read/unread tracking
- **Profile** - User profile and password management

## Local Development

### Prerequisites
- Node.js >= 18
- PostgreSQL

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/finova.git
cd finova

# Create PostgreSQL database
createdb finova

# Edit server/.env with your database credentials

# Install dependencies and build
npm run install:all
npm run build

# Start server (also creates tables automatically)
npm start
```

The app runs at `http://localhost:5000`

### Environment Variables (server/.env)

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finova
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
```

## Deployment (Render - Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) and sign up
3. Click **New > Blueprint** and connect your GitHub repo
4. Render detects `render.yaml` and provisions:
   - Web Service (Node.js)
   - PostgreSQL database (free, 90 days)
5. Deploy — your app will be live at `https://finova.onrender.com`

## Project Structure

```
finova/
├── server/
│   ├── controllers/    # Route handlers
│   ├── routes/         # API routes
│   ├── middleware/      # Auth, validation
│   ├── db/             # Pool, schema
│   ├── utils/          # Helpers
│   ├── app.js          # Express config
│   └── server.js       # Entry point
├── client/
│   ├── src/
│   │   ├── pages/      # All page components
│   │   ├── components/ # Layout, ProtectedRoute
│   │   ├── context/    # AuthContext
│   │   ├── services/   # Axios API
│   │   └── utils/      # Formatters, helpers
│   ├── index.html
│   └── vite.config.js
├── render.yaml         # Render deployment config
└── package.json        # Root scripts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET/POST | /api/accounts | List/Create accounts |
| PUT/DELETE | /api/accounts/:id | Update/Delete account |
| GET/POST | /api/transactions | List/Create transactions |
| PUT/DELETE | /api/transactions/:id | Update/Delete transaction |
| POST | /api/transfers | Transfer between accounts |
| GET | /api/transfers | List transfers |
| GET/POST | /api/investments | List/Create investments |
| PUT/DELETE | /api/investments/:id | Update/Delete investment |
| GET | /api/investments/portfolio/summary | Portfolio metrics |
| GET/POST/PUT/DELETE | /api/goals | Financial goals CRUD |
| GET | /api/analytics/expenses | Expense analytics |
| GET | /api/analytics/income | Income analytics |
| GET | /api/analytics/net-worth | Net worth calculation |
| GET | /api/analytics/monthly-trends | 6-month trends |
| GET | /api/notifications | Notifications |
| PATCH | /api/notifications/:id/read | Mark as read |
| GET/POST | /api/watchlist | Investment watchlist |
| PUT | /api/profile | Update profile |
| PUT | /api/profile/change-password | Change password |

## License

MIT
