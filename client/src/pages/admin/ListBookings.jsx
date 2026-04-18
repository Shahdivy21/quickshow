import React, { useState, useEffect, useMemo } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { useAuth } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";
import { Search, CalendarDays, X } from "lucide-react";

const STATUS_ALL       = "all";
const STATUS_PAID      = "paid";
const STATUS_PENDING   = "pending";
const STATUS_CANCELLED = "cancelled";

const ListBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY || "₹";
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  // ─── Filters ───────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [searchQ,      setSearchQ]      = useState("");

  const { axios } = useAuth();

  // ─── Helpers ───────────────────────────────────────────────────────
  const formatDateTime = (iso) => {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleString("en-IN", {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const getStatus = (b) => {
    if (b.status === "cancelled") return "cancelled";
    if (b.isPaid) return "paid";
    return "pending";
  };

  // ─── Fetch ─────────────────────────────────────────────────────────
  const getAllBookings = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-bookings");
      if (data.success) setBookings(data.bookings);
      else toast.error("Failed to fetch bookings");
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Unable to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getAllBookings(); }, []);

  // ─── Apply filters ─────────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (statusFilter !== STATUS_ALL && getStatus(b) !== statusFilter) return false;

      // Date range filter — compare booking creation date
      const bookingDate = new Date(b.createdAt);
      if (fromDate && bookingDate < new Date(fromDate)) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (bookingDate > end) return false;
      }

      // Search by user name, email or movie title
      if (searchQ) {
        const q = searchQ.toLowerCase();
        const matchUser  = (b.user?.name || "").toLowerCase().includes(q) || (b.user?.email || "").toLowerCase().includes(q);
        const matchMovie = (b.show?.movie?.title || "").toLowerCase().includes(q);
        if (!matchUser && !matchMovie) return false;
      }

      return true;
    });
  }, [bookings, statusFilter, fromDate, toDate, searchQ]);

  // ─── Group filtered bookings by user ───────────────────────────────
  const groupedByUser = useMemo(() => {
    return filteredBookings.reduce((acc, b) => {
      const userId = b.user?._id || "unknown";
      if (!acc[userId]) acc[userId] = { user: b.user, entries: [] };
      acc[userId].entries.push(b);
      return acc;
    }, {});
  }, [filteredBookings]);

  const groupUserBookings = (entries) => {
    const groups = {};
    entries.forEach((b) => {
      const movieId = b.show?.movie?._id || "unknown";
      const key = `${movieId}-${b.theater}-${b.showTime}`;
      if (!groups[key]) {
        groups[key] = {
          movie: b.show?.movie,
          theater: b.theater,
          showTime: b.show?.showDateTime || b.showTime,
          seats: [...b.bookedSeats],
          totalAmount: b.amount,
          isPaid: b.isPaid,
          status: b.status,
          bookings: [b],
        };
      } else {
        groups[key].seats.push(...b.bookedSeats);
        groups[key].totalAmount += b.amount;
        groups[key].bookings.push(b);
        if (b.isPaid) groups[key].isPaid = true;
        if (b.status === "cancelled") groups[key].status = "cancelled";
      }
    });
    return Object.values(groups);
  };

  const clearFilters = () => {
    setStatusFilter(STATUS_ALL);
    setFromDate("");
    setToDate("");
    setSearchQ("");
  };

  const hasActiveFilter = statusFilter !== STATUS_ALL || fromDate || toDate || searchQ;

  // ─── Status badge ──────────────────────────────────────────────────
  const StatusBadge = ({ booking }) => {
    const s = getStatus(booking);
    const styles = {
      paid:      "bg-green-500/20 text-green-400 border-green-500/30",
      pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] rounded-full border font-bold uppercase ${styles[s]}`}>
        {s}
      </span>
    );
  };

  if (loading) return <Loading />;

  const totalCount = filteredBookings.length;

  return (
    <>
      <Title text1="List" text2="Bookings" />

      {/* ── Filter Bar ── */}
      <div className="mt-6 bg-primary/8 border border-primary/20 rounded-xl p-4 mb-6 flex flex-col gap-3">
        {/* Row 1: Search + Status tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-black/30 border border-primary/20 px-3 py-2 rounded-lg flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by user name, email or movie..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="bg-transparent text-sm text-white outline-none w-full placeholder:text-gray-500"
            />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1">
            {[
              { key: STATUS_ALL,       label: "All",       color: "border-primary/40 text-primary" },
              { key: STATUS_PAID,      label: "Paid",      color: "border-green-500/40 text-green-400" },
              { key: STATUS_PENDING,   label: "Pending",   color: "border-yellow-500/40 text-yellow-400" },
              { key: STATUS_CANCELLED, label: "Cancelled", color: "border-red-500/40 text-red-400" },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                  statusFilter === key
                    ? `${color} bg-primary/10`
                    : "border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Date range */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-black/30 border border-primary/20 px-3 py-2 rounded-lg">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 font-semibold">FROM</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-white outline-none text-sm" />
          </div>
          <div className="flex items-center gap-2 bg-black/30 border border-primary/20 px-3 py-2 rounded-lg">
            <span className="text-xs text-gray-400 font-semibold">TO</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-white outline-none text-sm" />
          </div>
          {hasActiveFilter && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-400 rounded-lg transition">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <span className="text-xs text-gray-500 ml-auto">
            {totalCount} booking{totalCount !== 1 ? "s" : ""} found
          </span>
        </div>
      </div>

      {/* ── Bookings List ── */}
      <div className="w-full">
        {Object.values(groupedByUser).length === 0 ? (
          <div className="py-16 text-center text-gray-500 border border-primary/10 rounded-xl">
            No bookings found for the selected filters.
          </div>
        ) : (
          Object.values(groupedByUser).map((userBlock) => {
            const groupedMovies = groupUserBookings(userBlock.entries);
            return (
              <div key={userBlock.user?._id} className="bg-primary/10 p-3 mb-5 rounded-md border border-primary/20">
                {/* User header */}
                <h2 className="text-base font-semibold text-primary mb-3">
                  👤 {userBlock.user?.name || "Unknown"}
                  <span className="text-gray-500 text-xs font-normal ml-2">{userBlock.user?.email}</span>
                </h2>

                {groupedMovies.map((group, index) => {
                  const groupStatus = group.status === "cancelled" ? "cancelled" : group.isPaid ? "paid" : "pending";
                  const badgeClass = {
                    paid:      "bg-green-500/20 text-green-400 border-green-500/30",
                    pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
                  }[groupStatus];

                  return (
                    <div key={index} className="p-3 mb-3 bg-black/30 rounded-md border border-gray-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-bold">{group.movie?.title || "Unknown Movie"}</h3>
                          <p className="text-xs text-gray-400">{group.theater}</p>
                          <p className="text-xs text-gray-300 mt-1">{formatDateTime(group.showTime)}</p>
                          <p className="text-xs text-gray-300">Seats: {group.seats.join(" · ")}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="font-semibold text-base">{currency} {group.totalAmount}</p>
                          <span className={`px-2 py-0.5 text-[10px] rounded-full border font-bold uppercase ${badgeClass}`}>
                            {groupStatus}
                          </span>
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer text-primary text-xs">▶ View bookings</summary>
                        <div className="mt-2 space-y-1">
                          {group.bookings.map((b, i) => (
                            <div key={i} className="p-2 bg-black/20 rounded border border-gray-700 text-xs">
                              <p>Seats: {b.bookedSeats.join(" · ")}</p>
                              <p>Amount: {currency} {b.amount}</p>
                              <p>Status: <span className={
                                b.status === "cancelled" ? "text-red-400" : b.isPaid ? "text-green-400" : "text-yellow-400"
                              }>{b.status === "cancelled" ? "Cancelled" : b.isPaid ? "Paid" : "Pending"}</span></p>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default ListBookings;
