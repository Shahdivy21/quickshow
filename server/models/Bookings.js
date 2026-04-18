import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },
    theater: { type: String, required: true }, // ✅ Added theater
    date: { type: String, required: true }, // ✅ Added show date (e.g., "2025-11-01")
    showTime: { type: String, required: true },    
    amount: { type: Number, required: true },
    bookedSeats: { type: [String], required: true },
    isPaid: { type: Boolean, default: false },
    paymentLink: { type: String },
    paymentId: { type: String }, // Store Razorpay Payment ID for refunds
    status: { type: String, default: "booked", enum: ["booked", "cancelled"] },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
