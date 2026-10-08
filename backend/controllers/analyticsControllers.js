const pool = require("../db");
async function getSummary(req, res) {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
             FROM transactions
             WHERE user_id = $1`,
            [userId]
        );
        const { total_income, total_expense } = result.rows[0];
        const balance = total_income - total_expense;

        res.status(200).json({
            totalIncome: total_income,
            totalExpense: total_expense,
            balance: balance
        });

    } catch (error) {
        console.error("Summary error:", error);
        res.status(500).json({ message: "Something went wrong while fetching summary." });
    }
}
async function getCategoryBreakdown(req, res) {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT category, SUM(amount) AS total
             FROM transactions
             WHERE user_id = $1 AND type = 'expense'
             GROUP BY category
             ORDER BY total DESC`,
            [userId]
        );

        res.status(200).json({
            breakdown: result.rows
        });

    } catch (error) {
        console.error("Category breakdown error:", error);
        res.status(500).json({ message: "Something went wrong while fetching category breakdown." });
    }
}

module.exports = { getSummary, getCategoryBreakdown };