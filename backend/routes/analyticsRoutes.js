const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getSummary, getCategoryBreakdown } = require("../controllers/analyticsControllers");

router.get("/summary", authMiddleware, getSummary);
router.get("/breakdown", authMiddleware, getCategoryBreakdown);

module.exports = router;