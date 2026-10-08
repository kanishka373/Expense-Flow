const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { setBudget, getBudgets,deleteBudget } = require("../controllers/budgetControllers");

router.post("/", authMiddleware, setBudget);
router.get("/", authMiddleware, getBudgets);
router.delete("/:category", authMiddleware, deleteBudget);

module.exports = router;