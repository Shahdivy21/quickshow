import express from "express";
import { verifyRazorpayPayment } from "../controllers/bookingController.js";

const router = express.Router();

// 🔍 Verify Razorpay payment
router.post("/verify", verifyRazorpayPayment);

export default router;
