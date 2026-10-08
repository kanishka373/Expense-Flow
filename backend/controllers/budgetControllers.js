const pool = require("../db");

async function setBudget(req, res) {
    try {
        const userId = req.user.id;
        const { category, amount, month } = req.body;

        if (!category || !amount || !month) {
            return res.status(400).json({
                message: "Category, amount and month are required."
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero."
            });
        }

        const result = await pool.query(
            `INSERT INTO budgets (user_id, category, amount, month)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, category, month)
             DO UPDATE SET amount = $3
             RETURNING *`,
            [userId, category, amount, month]
        );

        res.status(200).json({
            message: "Budget saved successfully.",
            budget: result.rows[0]
        });

    } catch (error) {
        console.error("Set budget error:", error);
        res.status(500).json({ message: "Something went wrong while saving the budget." });
    }
}
async function getBudgets(req, res) {
    try {
        const userId = req.user.id;
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({
                message: "Month is required (format: YYYY-MM)."
            });
        }

        const result = await pool.query(
            `SELECT
                b.category,
                b.amount AS budget_amount,
                COALESCE(SUM(t.amount), 0) AS spent_amount
             FROM budgets b
             LEFT JOIN transactions t
                ON t.category = b.category
                AND t.user_id = b.user_id
                AND t.type = 'expense'
                AND TO_CHAR(t.date, 'YYYY-MM') = b.month
             WHERE b.user_id = $1 AND b.month = $2
             GROUP BY b.category, b.amount`,
            [userId, month]
        );

        res.status(200).json({
            budgets: result.rows
        });

    } catch (error) {
        console.error("Get budgets error:", error);
        res.status(500).json({ message: "Something went wrong while fetching budgets." });
    }
}
async function deleteBudget(req, res) {
    try {
        const userId = req.user.id;
        const { category } = req.params;
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({
                message: "Month is required (format: YYYY-MM)."
            });
        }

        const result = await pool.query(
            `DELETE FROM budgets WHERE user_id = $1 AND category = $2 AND month = $3 RETURNING *`,
            [userId, category, month]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Budget not found." });
        }

        res.status(200).json({ message: "Budget removed successfully." });

    } catch (error) {
        console.error("Delete budget error:", error);
        res.status(500).json({ message: "Something went wrong while removing the budget." });
    }
}

module.exports = { setBudget, getBudgets, deleteBudget };