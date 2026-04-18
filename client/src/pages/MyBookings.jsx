import React, { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import BlurCircle from '../components/BlurCircle';
import timeFormate from '../lib/timeFormate';
import { dateFormate } from '../lib/dateFormate';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY || "₹";
  const { axios, user, image_base_url } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellationModal, setCancellationModal] = useState({ open: false, booking: null });
  const [isCancelling, setIsCancelling] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // 📌 Fetch bookings
  const getMyBookings = async () => {
    try {
      const { data } = await axios.get(`/api/bookings/my-bookings`, {
        withCredentials: true,
      });

      if (data.success) setBookings(data.bookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 📌 Handle Cancellation Click
  const handleCancelBooking = (bookingItem) => {
    setCancellationModal({ open: true, booking: bookingItem });
  };

  const confirmCancelBooking = async () => {
    const bookingId = cancellationModal.booking._id;
    setIsCancelling(true);
    
    try {
      const { data } = await axios.post(`/api/bookings/cancel/${bookingId}`, {}, {
        withCredentials: true,
      });

      if (data.success) {
        toast.success(data.message || "Booking cancelled successfully");
        getMyBookings(); // Refresh list immediately
        setCancellationModal({ open: false, booking: null });
      } else {
        toast.error(data.message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Cancel API Error:", err);
      toast.error(err.response?.data?.message || "Failed to process cancellation");
    } finally {
      setIsCancelling(false);
    }
  };

  // 📌 Fetch on mount + poll every 10 sec
  useEffect(() => {
    if (user) {
      getMyBookings();

      const interval = setInterval(getMyBookings, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // 📌 Refresh when payment succeeds
  useEffect(() => {
    if (location.search.includes("paid=true")) {
      getMyBookings();
    }
  }, [location.search]);

  // 🔥 NEW FIX — Show toast for cancelled payment
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("payment_cancelled") === "true") {
      toast.error("Payment cancelled — booking is still pending.");

      // remove ?payment_cancelled=true
      navigate("/my-bookings", { replace: true });
    }
  }, [location.search, navigate]);

  // 🔥 NEW FIX — Prevent blank page when pressing BACK
  useEffect(() => {
    const handlePop = () => {
      getMyBookings(); // re-fetch instantly
    };

    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  if (isLoading) return <Loading />;

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="0px" left="600px" />

      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

      {bookings.length > 0 ? (
        bookings.map((item, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-3 md:p-4 max-w-3xl"
          >
            {/* 🎬 Movie Info */}
            <div className="flex flex-col md:flex-row flex-1">
              <img
                src={image_base_url + item.show.movie.poster_path}
                alt={item.show.movie.title}
                className="md:w-44 aspect-video object-cover rounded-md"
              />
              <div className="flex flex-col p-3 flex-1">
                <p className="text-lg font-semibold">{item.show.movie.title}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {timeFormate(item.show.movie.runtime)}
                </p>
                <p className="text-gray-400 text-sm mt-auto">
                  {dateFormate(item.show.showDateTime)}
                </p>
              </div>
            </div>

            {/* 💳 Booking Info */}
            <div className="flex flex-col md:items-end md:text-right justify-between p-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-2xl font-semibold">
                  {currency}
                  {item.amount}
                </p>

                {!item.isPaid && item.paymentLink && item.status !== "cancelled" && (
                  <a
                    href={item.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2 text-sm rounded-full font-medium shadow-sm transition-all duration-200"
                  >
                    Pay Now
                  </a>
                )}
                
                {item.status === "cancelled" && (
                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 text-xs rounded-full font-bold uppercase">
                    Refunded / Cancelled
                  </span>
                )}

                {item.status !== "cancelled" && item.isPaid && 
                  new Date(item.show.showDateTime || item.showTime).getTime() > Date.now() && (
                  <button
                    onClick={() => handleCancelBooking(item)}
                    className="bg-gray-800 hover:bg-red-600 border border-gray-700 hover:border-red-500 text-white px-4 py-2 text-sm rounded-full font-medium transition-all duration-300"
                  >
                    Cancel & Refund
                  </button>
                )}
              </div>

              <div className="text-sm mt-2 md:mt-4 text-left md:text-right w-full">
                <p>
                  <span className="text-gray-400">Status: </span>
                  <span className={item.status === "cancelled" ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                    {item.status === "cancelled" ? "Cancelled" : "Confirmed"}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Total Tickets: </span>
                  {item.bookedSeats.length}
                </p>
                <p>
                  <span className="text-gray-400">Seat Numbers: </span>
                  {item.bookedSeats.join(', ')}
                </p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-400">No bookings found.</p>
      )}

      {/* 🔴 CANCELLATION MODAL */}
      {cancellationModal.open && cancellationModal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Cancel Booking?</h2>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to cancel? The following tickets will be permanently released.
            </p>

            <div className="flex gap-4 p-4 bg-gray-800/50 rounded-xl mb-6">
              <img
                src={image_base_url + cancellationModal.booking.show.movie.poster_path}
                alt={cancellationModal.booking.show.movie.title}
                className="w-20 h-28 object-cover rounded-lg shadow-md"
              />
              <div className="flex flex-col justify-center text-sm">
                <p className="font-bold text-lg leading-tight mb-1">{cancellationModal.booking.show.movie.title}</p>
                <p className="text-gray-300"><span className="text-gray-500 text-xs">Date:</span> {dateFormate(cancellationModal.booking.show.showDateTime || cancellationModal.booking.showTime)}</p>
                <p className="text-gray-300"><span className="text-gray-500 text-xs">Seats:</span> {cancellationModal.booking.bookedSeats.join(", ")}</p>
                <p className="text-primary font-bold mt-1 max-w-max bg-primary/10 px-2 py-0.5 rounded">Refund: {currency}{cancellationModal.booking.amount}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancellationModal({ open: false, booking: null })}
                disabled={isCancelling}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition"
              >
                No, Keep it
              </button>
              <button
                onClick={confirmCancelBooking}
                disabled={isCancelling}
                className="flex-[1.2] py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition flex justify-center items-center gap-2"
              >
                {isCancelling ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Yes, Cancel & Refund"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
