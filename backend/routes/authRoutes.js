const express = require("express");
const router = express.Router();
const { signup, verifyOtp, login, me } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.get("/me", verifyToken, me);

module.exports = router;
