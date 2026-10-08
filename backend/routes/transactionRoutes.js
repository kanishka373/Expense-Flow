const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { addTransaction, getTransactions, deleteTransaction, updateTransaction } = require("../controllers/transactionControllers");

router.get("/", authMiddleware, getTransactions);
router.post("/", authMiddleware, addTransaction);
router.delete("/:id", authMiddleware, deleteTransaction);
router.put("/:id", authMiddleware, updateTransaction);

module.exports = router;