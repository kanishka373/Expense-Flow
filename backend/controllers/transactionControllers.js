const pool = require("../db");
async function addTransaction(req, res) {
    try {
        const userId = req.user.id;
        const { type, amount, category, description, date, paymentMethod } = req.body;

        if (!type || !amount || !category || !date) {
            return res.status(400).json({
                message: "Type, amount, category and date are required."
            });
        }

        if (type !== "income" && type !== "expense") {
            return res.status(400).json({
                message: "Type must be either 'income' or 'expense'."
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than zero."
            });
        }

        const result = await pool.query(
            `INSERT INTO transactions (user_id, type, amount, category, description, date, payment_method)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [userId, type, amount, category, description || null, date, paymentMethod || "Cash"]
        );

        res.status(201).json({
            message: "Transaction added successfully.",
            transaction: result.rows[0]
        });

    } catch (error) {
        console.error("Add transaction error:", error);
        res.status(500).json({ message: "Something went wrong while adding the transaction." });
    }
}
async function getTransactions(req, res) {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            "SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC",
            [userId]
        );

        res.status(200).json({
            transactions: result.rows
        });

    } catch (error) {
        console.error("Get transactions error:", error);
        res.status(500).json({ message: "Something went wrong while fetching transactions." });
    }
}
async function deleteTransaction(req, res) {
    try {
        const userId = req.user.id;
        const transactionId = req.params.id;

        const result = await pool.query(
            "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *",
            [transactionId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found."
            });
        }

        res.status(200).json({
            message: "Transaction deleted successfully.",
            transaction: result.rows[0]
        });

    } catch (error) {
        console.error("Delete transaction error:", error);
        res.status(500).json({ message: "Something went wrong while deleting the transaction." });
    }
}

async function updateTransaction(req, res) {
    try {
        const userId = req.user.id;
        const transactionId = req.params.id;
        const { type, amount, category, description, date } = req.body;

        if (!type || !amount || !category || !date) {
            return res.status(400).json({
                message: "Type, amount, category and date are required."
            });
        }

        const result = await pool.query(
            `UPDATE transactions
             SET type = $1, amount = $2, category = $3, description = $4, date = $5
             WHERE id = $6 AND user_id = $7
             RETURNING *`,
            [type, amount, category, description || null, date, transactionId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found."
            });
        }

        res.status(200).json({
            message: "Transaction updated successfully.",
            transaction: result.rows[0]
        });

    } catch (error) {
        console.error("Update transaction error:", error);
        res.status(500).json({ message: "Something went wrong while updating the transaction." });
    }
}
module.exports = { addTransaction, getTransactions, deleteTransaction, updateTransaction };