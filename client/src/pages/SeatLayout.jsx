import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import { ArrowRightIcon, ClockIcon, DoorOpen } from "lucide-react";
import isoTimeFormate from "../lib/isoTimeFormate";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

// ─── Theater Configurations ────────────────────────────────────────────────────
const THEATER_LAYOUTS = {
  INOX: {
    name: "INOX",
    color: "#1a73e8",
    sections: [
      {
        label: "CLASSIC",
        priceMultiplier: 1.0,
        rowLabels: ["A", "B", "C", "D", "E", "F"],
        seatsPerRow: 16,
        gap: true,
      },
      {
        label: "EXECUTIVE",
        priceMultiplier: 1.2,
        rowLabels: ["G", "H", "I"],
        seatsPerRow: 20,
        gap: true,
      },
      {
        label: "GOLD",
        priceMultiplier: 1.5,
        rowLabels: ["J", "K"],
        seatsPerRow: 12,
        gap: false,
      },
    ],
  },
  PVR: {
    name: "PVR",
    color: "#e53935",
    sections: [
      {
        label: "STANDARD",
        priceMultiplier: 1.0,
        rowLabels: ["A", "B", "C", "D", "E"],
        seatsPerRow: 12,
        gap: true,
      },
      {
        label: "PREMIUM",
        priceMultiplier: 1.4,
        rowLabels: ["F", "G", "H"],
        seatsPerRow: 16,
        gap: true,
      },
      {
        label: "RECLINER",
        priceMultiplier: 2.0,
        rowLabels: ["I", "J"],
        seatsPerRow: 14,
        gap: false,
      },
    ],
  },
  CINEPOLIS: {
    name: "CINEPOLIS",
    color: "#ff6f00",
    sections: [
      {
        label: "COMFORT",
        priceMultiplier: 1.0,
        rowLabels: ["A", "B", "C", "D", "E", "F", "G"],
        seatsPerRow: 12,
        gap: true,
      },
      {
        label: "ELITE",
        priceMultiplier: 1.5,
        rowLabels: ["H", "I", "J"],
        seatsPerRow: 16,
        gap: true,
      },
      {
        label: "VIP",
        priceMultiplier: 2.0,
        rowLabels: ["K"],
        seatsPerRow: 12,
        gap: false,
      },
    ],
  },
};

// ─── Section Color Map ─────────────────────────────────────────────────────────
const SECTION_COLORS = {
  0: "border-yellow-500/60 hover:bg-yellow-500/20",
  1: "border-blue-400/60 hover:bg-blue-400/20",
  2: "border-gray-400/60 hover:bg-gray-400/20",
};
const SECTION_LABEL_COLORS = {
  0: "text-yellow-400",
  1: "text-blue-400",
  2: "text-gray-400",
};
const SECTION_TAG_COLORS = {
  0: "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30",
  1: "bg-blue-900/30 text-blue-400 border border-blue-400/30",
  2: "bg-gray-800/50 text-gray-400 border border-gray-600/30",
};

// ─── Component ─────────────────────────────────────────────────────────────────
const SeatLayout = () => {
  const { id, date } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const theaterId = sp.get("theater");
  const timeFromQuery = sp.get("time");

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const { axios, user, loading: authLoading } = useAuth();

  const theaterConfig = THEATER_LAYOUTS[theaterId] || THEATER_LAYOUTS["PVR"];

  // ─── Fetch show details ──────────────────────────────────────────────────────
  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/shows/${id}`, { withCredentials: true });
      if (data.success) {
        setShow({ movie: data.movie, dateTime: data.dateTime });
      } else if (user) {
        toast.error("Show not found");
      }
    } catch (err) {
      if (user) {
        console.error("❌ Error fetching show:", err);
        toast.error("Failed to load show details");
      }
    }
  };

  // ─── Fetch occupied seats ────────────────────────────────────────────────────
  const getOccupiedSeats = async () => {
    try {
      if (!selectedTime?.showId) return;
      const { data } = await axios.get(
        `/api/bookings/occupied-seats/${selectedTime.showId}?theater=${theaterId}&date=${date}&showTime=${selectedTime.time}`,
        { withCredentials: true }
      );
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats || []);
      } else if (user) {
        toast.error("Failed to fetch occupied seats");
      }
    } catch (err) {
      if (user) {
        console.error("❌ Error fetching occupied seats:", err);
        toast.error("Failed to load occupied seats");
      }
    }
  };

  // ─── Auth redirect ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}` },
        replace: true,
      });
    }
  }, [authLoading, user, navigate, location]);

  useEffect(() => {
    if (selectedTime && user) getOccupiedSeats();
  }, [selectedTime, user]);

  // ─── Seat selection handler ──────────────────────────────────────────────────
  const handleSeatClick = (seatId) => {
    if (!selectedTime) return toast("Please select a show time first");
    if (occupiedSeats.includes(seatId)) return toast("Seat already booked");
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5)
      return toast("You can select up to 5 seats");

    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  };

  // ─── Razorpay Script Loader ──────────────────────────────────────────────────
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ─── Booking & Payment logic ─────────────────────────────────────────────────
  const bookTickets = async () => {
    try {
      if (!user) return toast.error("Please login to book tickets");
      if (!selectedTime || selectedSeats.length === 0)
        return toast.error("Please select show time and seats");

      const resLoad = await loadRazorpay();
      if (!resLoad) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        return;
      }

      const ticketPrice = selectedTime?.price || 200;
      const amount = selectedSeats.length * ticketPrice;

      const bookingData = {
        showId: selectedTime.showId,
        bookedSeats: selectedSeats,
        amount,
        theater: theaterId,
        date,
        showTime: selectedTime.time,
      };

      const { data } = await axios.post(`/api/bookings`, bookingData, {
        withCredentials: true,
      });

      if (data.success) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SSgEnYj4Ib1OLE", 
          amount: data.amount, 
          currency: data.currency,
          name: "QuickShow",
          description: `Booking for ${show?.movie?.title || "Movie"}`,
          order_id: data.orderId,
          handler: async function (response) {
            try {
              const verifyRes = await axios.post("/api/bookings/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: data.bookingId
              }, { withCredentials: true });

              if (verifyRes.data.success) {
                toast.success("Payment Successful! Booking Confirmed.");
                navigate("/my-bookings");
              } else {
                toast.error(verifyRes.data.message || "Payment Verification Failed");
              }
            } catch (err) {
              console.error(err);
              toast.error("Payment verification error");
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: {
            color: "#e11d48", // matches Tailwind primary (rose-600)
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

      } else {
        toast.error(data.message || "Failed to create order");
      }
    } catch (error) {
      console.error("❌ Error creating booking:", error);
      toast.error("Failed to process checkout");
    }
  };

  // ─── Load show details ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user) getShow();
  }, [id, user, authLoading]);

  // ─── Match selected time & theater ──────────────────────────────────────────
  useEffect(() => {
    if (!show || !timeFromQuery) return;

    const slots = show?.dateTime?.[date] || [];
    const decodedTime = decodeURIComponent(timeFromQuery);
    const match = slots.find(
      (s) => s.time === decodedTime && s.theater === theaterId && s.showId
    );

    if (match) {
      // Prevent booking past shows if visited directly via URL
      if (new Date(match.time).getTime() < Date.now()) {
        toast.error("You cannot book tickets for a past show.");
        navigate(`/movies/${id}`);
        return;
      }

      setSelectedTime(match);
      setSelectedSeats([]);
      setOccupiedSeats([]);
    }
  }, [show, timeFromQuery, date, theaterId, id, navigate]);

  // ─── Guards ──────────────────────────────────────────────────────────────────
  if (authLoading) return <Loading />;
  if (!user) return null;
  if (!show) return <Loading />;

  const ticketPrice = selectedTime?.price || 200;
  const totalAmount = selectedSeats.length * ticketPrice;

  // ─── Render a single seat ────────────────────────────────────────────────────
  const renderSeat = (seatId, sectionIdx) => {
    const isOccupied = occupiedSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);
    const baseClass = `relative flex items-center justify-center w-8 h-8 rounded-t-lg text-[9px] font-semibold cursor-pointer transition-all duration-150 active:scale-90 border`;

    let colorClass;
    if (isOccupied) {
      colorClass = "bg-gray-700/50 border-gray-600/40 text-gray-600 cursor-not-allowed opacity-40";
    } else if (isSelected) {
      colorClass = "bg-primary border-primary text-white shadow-lg shadow-primary/40 scale-105";
    } else {
      colorClass = `bg-gray-800 ${SECTION_COLORS[sectionIdx]} text-gray-300`;
    }

    return (
      <button
        key={seatId}
        disabled={isOccupied}
        onClick={() => !isOccupied && handleSeatClick(seatId)}
        title={seatId}
        className={`${baseClass} ${colorClass}`}
      >
        {seatId}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Top bar: Movie & Timing info ── */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-primary rounded-full" />
          <div>
            <p className="font-bold text-sm">{show?.movie?.title || "Now Playing"}</p>
            <p className="text-gray-400 text-xs">{theaterId} &bull; {date}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {(show?.dateTime?.[date] || []).filter(s => s.theater === theaterId).map((item) => (
            <button
              key={item.time}
              onClick={() => setSelectedTime(item)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                selectedTime?.time === item.time
                  ? "bg-primary border-primary text-white"
                  : "border-gray-700 text-gray-400 hover:border-primary/50 hover:text-gray-200"
              }`}
            >
              <ClockIcon className="w-3 h-3" />
              {isoTimeFormate(item.time)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── SCREEN + ENTRY/EXIT ── */}
        <div className="mb-24 relative">
          {/* Entry / Exit side markers beside screen */}
          <div className="flex items-start justify-between max-w-5xl mx-auto px-2 mb-3">
            {/* LEFT = EXIT */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/50 bg-red-950/40">
                <DoorOpen className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">Exit</span>
              </div>
              <div className="w-px h-8 bg-red-500/30" />
            </div>

            {/* SCREEN bar */}
            <div className="flex-1 flex flex-col items-center mx-4">
              <div className="relative w-full" style={{ maxWidth: "560px" }}>
                <div
                  className="h-3 rounded-b-[50%] w-full"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${theaterConfig.color}55 30%, white 50%, ${theaterConfig.color}55 70%, transparent 100%)`,
                    boxShadow: `0 4px 30px 4px ${theaterConfig.color}44`,
                  }}
                />
              </div>
              <p className="text-center text-xs text-gray-500 uppercase tracking-[0.3em] mt-2">All Eyes This Way — SCREEN</p>
            </div>

            {/* RIGHT = ENTRY */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/50 bg-green-950/40">
                <DoorOpen className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest">Entry</span>
              </div>
              <div className="w-px h-8 bg-green-500/30" />
            </div>
          </div>
        </div>

        {/* ── SEAT MAP ── */}
        <div className="space-y-5">
          {theaterConfig.sections.map((section, sIdx) => (
            <div key={section.label}>
              {/* Section Label */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 h-px bg-gray-800" />
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${SECTION_TAG_COLORS[sIdx]}`}>
                  {section.label}
                </span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* Entry on left side of top section */}
              <div className="relative">

                {/* Rows */}
                <div className="space-y-1.5">
                  {section.rowLabels.map((rowLabel) => (
                    <div key={rowLabel} className="flex items-center gap-2 justify-center">
                      {/* Row label */}
                      <span className={`text-[10px] font-bold w-5 text-right shrink-0 ${SECTION_LABEL_COLORS[sIdx]}`}>
                        {rowLabel}
                      </span>

                      {/* Left aisle group */}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.floor(section.seatsPerRow / 2) }, (_, i) =>
                          renderSeat(`${rowLabel}${i + 1}`, sIdx)
                        )}
                      </div>

                      {/* Center aisle gap */}
                      <div className="w-6 shrink-0" />

                      {/* Right aisle group */}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.ceil(section.seatsPerRow / 2) }, (_, i) =>
                          renderSeat(`${rowLabel}${Math.floor(section.seatsPerRow / 2) + i + 1}`, sIdx)
                        )}
                      </div>

                      {/* Row label mirror */}
                      <span className={`text-[10px] font-bold w-5 shrink-0 ${SECTION_LABEL_COLORS[sIdx]}`}>
                        {rowLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {section.gap && (
              <div className="mt-4 flex items-center justify-center gap-3 text-gray-700">
                <div className="flex-1 h-px bg-gray-800/60" />
                <span className="text-[9px] uppercase tracking-widest">—— Aisle ——</span>
                <div className="flex-1 h-px bg-gray-800/60" />
              </div>
            )}
            </div>
          ))}
        </div>

        {/* ── LEGEND ── */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-t-lg bg-gray-800 border border-gray-400/60" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-t-lg bg-primary border border-primary" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-t-lg bg-gray-700/50 border border-gray-600/40 opacity-40" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-t-lg bg-gray-800 border border-yellow-500/60" />
            <span className="text-yellow-400">Gold / VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-t-lg bg-gray-800 border border-blue-400/60" />
            <span className="text-blue-400">Executive / Premium</span>
          </div>
        </div>

        {/* ── BOOKING SUMMARY BAR ── */}
        {selectedSeats.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-800 bg-gray-950/95 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-gray-400">Selected:</span>
              {selectedSeats.map((seat) => (
                <span key={seat} className="px-2 py-0.5 bg-primary/20 border border-primary/40 text-primary rounded text-xs font-bold">
                  {seat}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-gray-400 text-xs">{selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""}</p>
                <p className="font-bold text-white text-base">₹{totalAmount}</p>
              </div>
              <button
                onClick={bookTickets}
                className="flex items-center gap-2 px-7 py-2.5 bg-primary hover:bg-primary/90 transition rounded-full font-bold text-white active:scale-95"
              >
                Proceed to Checkout
                <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* padding when bar shown */}
        {selectedSeats.length > 0 && <div className="h-24" />}
      </div>
    </div>
  );
};

export default SeatLayout;
