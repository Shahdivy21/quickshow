import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  getOccupiedSeats,
  verifyRazorpayPayment,
  cancelBooking
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

// 🎟️ Create a new booking (user must be logged in)
bookingRouter.post("/", userAuth, createBooking);

// 🔐 Verify Razorpay Payment
bookingRouter.post("/verify", userAuth, verifyRazorpayPayment);

// 📚 Get logged-in user's all bookings
bookingRouter.get("/my-bookings", userAuth, getMyBookings);

// 🧾 (Optional) Get all bookings (for admin panel)
bookingRouter.get("/all", userAuth, getAllBookings);

// 💺 Get occupied seats for a particular show
bookingRouter.get("/occupied-seats/:showId", userAuth, getOccupiedSeats); 

// ❌ Cancel a booking
bookingRouter.post("/cancel/:id", userAuth, cancelBooking);

export default bookingRouter;
