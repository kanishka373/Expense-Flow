# ExpenseFlow 💜

A full-stack personal expense tracker with real-time budgeting, analytics, and a glassmorphism UI. Built to track income and expenses, set monthly and category-wise budgets, and visualize spending patterns, all backed by a secure, multi-user authentication system.

---

## ✨ Features

- **Authentication**: Secure signup/login with JWT-based sessions and bcrypt password hashing
- **Transaction Management**: Full CRUD (add, edit, delete) for income and expense entries
- **Smart Filtering & Sorting**: Filter by type, category, or search term; sort by date or amount
- **Budgets**: Overall monthly limit plus category-wise budgets, with live progress bars and over-budget warnings
- **Analytics**: Category-wise spending (doughnut chart) and income vs. expense comparison (bar chart) using Chart.js
- **Multi-User Support**: Every user has an isolated account; all data is scoped to the logged-in user
- **Data Export**: Download transaction history
- **Glassmorphism UI**: Custom design system with blur effects, soft gradients, and smooth animations
- **Toast Notifications**: Non-blocking success/error feedback across the app

---

## 🛠️ Tech Stack

**Frontend**
- HTML5, CSS3 (custom glassmorphism design system)
- Vanilla JavaScript
- [Chart.js](https://www.chartjs.org/) for data visualization
- [Lucide Icons](https://lucide.dev/) for icons

**Backend**
- Node.js + Express.js
- PostgreSQL (Supabase)
- JWT (`jsonwebtoken`) for authentication
- `bcryptjs` for password hashing

---

## 🏗️ Architecture

<!-- Architecture diagram will be added here -->

*Architecture diagram coming soon.*

---

## 📂 Project Structure

```
expenseflow/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── db.js
│   ├── server.js
│   └── .env              (not committed)
│
└── frontend/
    ├── css/
    ├── js/
    ├── login.html
    ├── dashboard.html
    ├── add-transactions.html
    ├── transactions.html
    ├── budgets.html
    ├── analytics.html
    └── settings.html
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A PostgreSQL database (for example, a free [Supabase](https://supabase.com/) project)

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/expenseflow.git
cd expenseflow
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_long_random_secret_string
```

Start the server:
```bash
node server.js
```
The backend runs on `http://localhost:5000`.

### 3. Database setup
Create the `users`, `transactions`, and `budgets` tables in your PostgreSQL database.

### 4. Frontend setup
Open `frontend/login.html` using a live server (for example, the VS Code Live Server extension). No build step is required.

> **Note:** API calls in the frontend JS files point to `http://localhost:5000`. When deploying, replace this with your deployed backend URL.

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWT tokens |

---

## 🗺️ Roadmap

- [ ] Change password and account settings
- [ ] Monthly report view
- [ ] Dark mode
- [ ] Recurring transactions

---

## 👤 Author

Built by **Kanishka**