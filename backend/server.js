const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");
require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 5000;
const transactionRoutes = require("./routes/transactionRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
app.get("/", (req, res) => {
    res.send("Expense tracker backend is running");
});

pool.query("SELECT NOW()")
    .then(() => {
        console.log("PostgreSQL connected successfully.");
    })
    .catch((error) => {
        console.error("Database connection failed:", error.message);
    });

app.use(cors());
app.use(express.json());
app.use("/api/transactions", transactionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/budgets", budgetRoutes);

app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, created_at`,
            [name, email, hashedPassword]
        );

        res.status(201).json({
            message: "Account created successfully.",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Something went wrong while creating your account." });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const result = await pool.query(
            "SELECT id, name, email, password FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful.",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Something went wrong during login." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
const authMiddleware = require("./middleware/authMiddleware");
app.put("/api/auth/name", authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: "Name is required." });
        }

        const result = await pool.query(
            "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email",
            [name.trim(), req.user.id]
        );

        res.status(200).json({
            message: "Name updated successfully.",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Update name error:", error);
        res.status(500).json({ message: "Something went wrong while updating your name." });
    }
});
app.put("/api/auth/password", authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters." });
        }

        const result = await pool.query(
            "SELECT password FROM users WHERE id = $1",
            [req.user.id]
        );

        const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);

        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            "UPDATE users SET password = $1 WHERE id = $2",
            [hashedPassword, req.user.id]
        );

        res.status(200).json({ message: "Password updated successfully." });

    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Something went wrong while changing your password." });
    }
});
app.get("/api/export/csv", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT date, description, category, payment_method, type, amount FROM transactions WHERE user_id = $1 ORDER BY date DESC",
            [req.user.id]
        );

        let csv = "Date,Description,Category,Payment Method,Type,Amount\n";

        result.rows.forEach(txn => {
            const row = [
                txn.date,
                `"${(txn.description || "").replace(/"/g, '""')}"`,
                txn.category,
                txn.payment_method || "",
                txn.type,
                txn.amount
            ].join(",");
            csv += row + "\n";
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=expenseflow-transactions.csv");
        res.status(200).send(csv);

    } catch (error) {
        console.error("Export CSV error:", error);
        res.status(500).json({ message: "Something went wrong while exporting your data." });
    }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
    res.status(200).json({
        message: "You are authenticated!",
        user: req.user
    });
});
app.delete("/api/clear-data", authMiddleware, async (req, res) => {
    try {
        await pool.query("DELETE FROM transactions WHERE user_id = $1", [req.user.id]);
        await pool.query("DELETE FROM budgets WHERE user_id = $1", [req.user.id]);

        res.status(200).json({ message: "All transactions and budgets have been cleared." });

    } catch (error) {
        console.error("Clear data error:", error);
        res.status(500).json({ message: "Something went wrong while clearing your data." });
    }
});