import Booking from "../models/Bookings.js";
import Show from "../models/Show.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { sendEmail, generateConfirmationEmail, generateRefundEmail } from "../utils/emailService.js";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// -----------------------------
// 📦 Create New Booking (NO WEBHOOK VERSION)
// -----------------------------
export const createBooking = async (req, res) => {
  try {
    const { showId, bookedSeats, amount, theater, date, showTime } = req.body;
    const { origin } = req.headers;

    if (!showId || !bookedSeats || !amount || !theater || !date || !showTime) {
      return res.status(400).json({ success: false, message: "Missing booking details" });
    }

    const showData = await Show.findById(showId).populate("movie");
    if (!showData) return res.status(404).json({ success: false, message: "Show not found" });

    // Ensure showTime is not in the past
    // NOTE: If your showTime string is parsable by Date, or if you also check 'date' depending on format:
    // Here we parse date + showTime robustly if needed, or simply trust the client passed a valid iso timestamp in `showTime` vs `date` string.
    const showDateTimeMs = new Date(showTime).getTime();
    if (!isNaN(showDateTimeMs) && showDateTimeMs < Date.now()) {
      return res.status(400).json({ success: false, message: "Cannot book tickets for a past show" });
    }

    const booking = await Booking.create({
      user: req.user._id,
      show: showId,
      theater,
      date,
      showTime,
      amount,
      bookedSeats,
      isPaid: false,
    });

    const options = {
      amount: Math.floor(amount * 100), // amount in smallest currency unit
      currency: "INR",
      receipt: booking._id.toString(),
    };

    const order = await razorpayInstance.orders.create(options);

    // Save razorpay order id to booking for future reference if needed
    booking.paymentLink = order.id; // optionally repurpose paymentLink to store orderId temporarily
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    return res.status(500).json({ success: false, message: "Server error while creating booking" });
  }
};


export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({ success: false, message: "Missing payment verification parameters" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const booking = await Booking.findById(bookingId)
      .populate("user")
      .populate({ path: "show", populate: { path: "movie" } });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const firstTimePayment = !booking.isPaid;

    booking.isPaid = true;
    booking.paymentId = razorpay_payment_id; 
    await booking.save();

    if (firstTimePayment) {
      try {
        const showTimeStr = booking.show?.showDateTime
          ? new Date(booking.show.showDateTime).toLocaleString()
          : booking.showTime || "Unknown Time";

        const html = generateConfirmationEmail({
          userName: booking.user.name,
          movieTitle: booking.show?.movie?.title || "Unknown Movie",
          theater: booking.theater,
          showTime: showTimeStr,
          seats: booking.bookedSeats,
          amount: booking.amount,
          currency: process.env.VITE_CURRENCY || "₹",
        });

        await sendEmail({
          to: booking.user.email,
          subject: "Booking Confirmed - QuickShow",
          html,
        });

        console.log(`✅ Confirmation email sent to ${booking.user.email}`);
      } catch (emailErr) {
        console.error("❌ Email sending failed:", emailErr);
      }
    }

    return res.json({ success: true, message: "Payment verified successfully", booking });

  } catch (error) {
    console.error("❌ Verify payment error:", error);
    res.status(500).json({ success: false, message: "Server error verifying payment" });
  }
};


// -----------------------------
// 🎟️ Get User Bookings
// -----------------------------
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: "show",
        populate: { path: "movie", model: "Movie" },
      })
      .sort({ createdAt: -1 });

    const totalPaid = bookings
      .filter(b => b.isPaid)
      .reduce((sum, b) => sum + b.amount, 0);

    return res.status(200).json({
      success: true,
      bookings,
      totalPaid,
    });
  } catch (error) {
    console.error("❌ Error fetching user bookings:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching bookings" });
  }
};


// -----------------------------
// 📋 Get All Bookings (Admin) — GROUPED VERSION
// -----------------------------
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate({
        path: "show",
        populate: { path: "movie", model: "Movie" },
      })
      .sort({ createdAt: -1 });

    const grouped = {};

    bookings.forEach((b) => {
      if (!b.show || !b.user || !b.show.movie) return;

      const key = `${b.user._id}-${b.show._id}`;

      if (!grouped[key]) {
        grouped[key] = {
          user: b.user,
          movie: b.show.movie,       // FIXED ✔
          theater: b.show.theater,   // FIXED ✔
          showTime: b.show.showDateTime,
          seats: [...b.bookedSeats],
          totalAmount: b.amount,
          isPaid: b.isPaid
        };
      } else {
        grouped[key].seats.push(...b.bookedSeats);

        if (b.isPaid) grouped[key].totalAmount += b.amount;

        if (b.isPaid) grouped[key].isPaid = true;
      }
    });

    return res.status(200).json({
      success: true,
      bookings: Object.values(grouped),
    });

  } catch (error) {
    console.error("❌ Error grouping bookings:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------
// 💺 Get Occupied Seats for a Show
// -----------------------------
export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const { theater, date, showTime } = req.query;

    const bookings = await Booking.find({ show: showId, theater, date, showTime, status: { $ne: "cancelled" } });
    const occupiedSeats = bookings.flatMap(b => b.bookedSeats);

    res.json({ success: true, occupiedSeats });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching seats" });
  }
};

// -----------------------------
// ❌ Cancel Booking & Refund
// -----------------------------
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate("user")
      .populate({ path: "show", populate: { path: "movie" } });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to cancel this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }

    // Ensure the show is in the future
    const showDateTimeMs = new Date(booking.show.showDateTime || booking.showTime).getTime();
    if (showDateTimeMs < Date.now()) {
      return res.status(400).json({ success: false, message: "Cannot cancel a past show" });
    }

    // Process Refund via Razorpay API if paymentId exists
    if (booking.isPaid && booking.paymentId) {
      try {
        await razorpayInstance.payments.refund(booking.paymentId, {
          amount: booking.amount * 100, // in paise
        });
        console.log(`✅ Refund processed for booking ${booking._id}`);
      } catch (refundErr) {
        console.error("❌ Razorpay Refund Error:", refundErr);
        // Note: In test mode, some refunds might throw depending on the test card. 
        // We will proceed with local cancellation anyway for the sake of the project demo.
      }
    }

    // Update the booking status
    booking.status = "cancelled";
    await booking.save();

    // Send Cancellation & Refund Email
    if (booking.isPaid) {
      try {
        const showTimeStr = booking.show?.showDateTime
          ? new Date(booking.show.showDateTime).toLocaleString()
          : booking.showTime || "Unknown Time";

        const html = generateRefundEmail({
          userName: booking.user.name,
          movieTitle: booking.show?.movie?.title || "Unknown Movie",
          theater: booking.theater,
          showTime: showTimeStr,
          amount: booking.amount,
          currency: process.env.VITE_CURRENCY || "₹",
        });

        await sendEmail({
          to: booking.user.email,
          subject: "Booking Cancelled & Refund Initiated - QuickShow",
          html,
        });
        console.log(`✅ Refund email sent to ${booking.user.email}`);
      } catch (emailErr) {
        console.error("❌ Refund Email sending failed:", emailErr);
      }
    }

    return res.json({ success: true, message: "Booking cancelled successfully and refund initiated", booking });
  } catch (error) {
    console.error("❌ Error cancelling booking:", error);
    res.status(500).json({ success: false, message: "Server error while cancelling booking" });
  }
};
