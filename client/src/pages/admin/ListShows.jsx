import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import BlurCircle from "../../components/BlurCircle";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  Search, ChevronDown, ChevronUp, CalendarDays,
  Clock, TicketCheck, IndianRupee, Users, X, Film
} from "lucide-react";

const ListShows = () => {
  const currency = "₹";
  const { axios, image_base_url } = useAuth();

  // ─── State ─────────────────────────────────────────────────────────────────
  const [allShows,        setAllShows]        = useState([]);   // raw shows from API
  const [upcomingGroups,  setUpcomingGroups]  = useState([]);   // future grouped
  const [searchResults,   setSearchResults]   = useState(null); // null = not searched
  const [expandedMovies,  setExpandedMovies]  = useState({});
  const [loading,         setLoading]         = useState(true);
  const [searching,       setSearching]       = useState(false);

  // — Movie filter dropdown
  const [selectedMovieId, setSelectedMovieId] = useState("all");
  const [activeMovies,    setActiveMovies]    = useState([]); // unique movies with upcoming shows

  // — Customer panel (when movie clicked)
  const [customerMovie,  setCustomerMovie]  = useState(null); // movie object
  const [customers,      setCustomers]      = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // — Date filter
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const formatDateTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-IN", {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const groupShowsByMovie = (shows) => {
    const groups = {};
    shows.forEach((show) => {
      const movieId = show.movie._id;
      if (!groups[movieId]) {
        groups[movieId] = {
          movie: show.movie,
          totalBookings: 0,
          totalEarnings: 0,
          shows: [],
        };
      }
      groups[movieId].shows.push({
        time: show.showDateTime,
        totalBookings: show.totalBookings,
        earnings: show.totalEarnings,
      });
      groups[movieId].totalBookings += show.totalBookings || 0;
      groups[movieId].totalEarnings += show.totalEarnings || 0;
    });
    return Object.values(groups);
  };

  const toggleExpand = (movieId) =>
    setExpandedMovies((prev) => ({ ...prev, [movieId]: !prev[movieId] }));

  // ─── Load all shows on mount ────────────────────────────────────────────────
  const loadShows = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-shows", { withCredentials: true });
      if (!data.success) return toast.error("Failed to load shows");

      setAllShows(data.shows);

      const now = new Date();
      const futureShows = data.shows.filter((s) => new Date(s.showDateTime) >= now);
      const grouped = groupShowsByMovie(futureShows);
      setUpcomingGroups(grouped);

      // Build unique active movie list for the dropdown
      const seen = new Set();
      const movies = [];
      futureShows.forEach((s) => {
        if (!seen.has(s.movie._id)) {
          seen.add(s.movie._id);
          movies.push(s.movie);
        }
      });
      setActiveMovies(movies);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while fetching shows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShows(); }, []);

  // ─── Handle movie poster click → fetch TODAY's bookings only ───────────────
  const handleMovieSelect = async (movieId) => {
    setSelectedMovieId(movieId);
    setCustomerMovie(null);
    setCustomers([]);

    if (movieId === "all") return;

    const movie = activeMovies.find((m) => m._id === movieId);
    setCustomerMovie(movie || null);
    setLoadingCustomers(true);

    try {
      const { data } = await axios.get("/api/admin/all-bookings", { withCredentials: true });
      if (!data.success) {
        toast.error("Failed to fetch bookings");
        return;
      }

      // ── Filter: only TODAY's bookings for this movie ──────────────────────
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const filtered = (data.bookings || []).filter((b) => {
        const showDate = new Date(b.show?.showDateTime || b.showTime);
        return (
          b.show?.movie?._id === movieId &&
          b.isPaid &&
          b.status !== "cancelled" &&
          showDate >= todayStart &&
          showDate <= todayEnd
        );
      });

      setCustomers(filtered);

      if (filtered.length === 0)
        toast("No bookings for today for this movie", { icon: "ℹ️" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer list");
    } finally {
      setLoadingCustomers(false);
    }
  };

  // ─── Date-range search ─────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!fromDate || !toDate) { toast.error("Please select both From and To dates"); return; }
    if (new Date(fromDate) > new Date(toDate)) { toast.error("From date cannot be after To date"); return; }

    setSearching(true);
    try {
      const from = new Date(fromDate);
      const to   = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      const filtered = allShows.filter((s) => {
        const t = new Date(s.showDateTime);
        return t >= from && t <= to;
      });
      setSearchResults(groupShowsByMovie(filtered));
      if (filtered.length === 0) toast("No shows found in the selected range", { icon: "ℹ️" });
    } catch (err) {
      console.error(err);
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setFromDate(""); setToDate(""); setSearchResults(null);
  };

  // ─── Render a movie group card ──────────────────────────────────────────────
  const renderGroup = (group) => {
    const isOpen = !!expandedMovies[group.movie._id];
    return (
      <div key={group.movie._id} className="bg-primary/8 border border-primary/20 rounded-xl mb-4 overflow-hidden">
        <button
          onClick={() => toggleExpand(group.movie._id)}
          className="w-full flex items-center gap-4 p-4 hover:bg-primary/10 transition text-left"
        >
          <img
            src={image_base_url + group.movie.poster_path}
            className="w-12 h-16 rounded-lg object-cover border border-primary/30 shrink-0"
            alt={group.movie.title}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate">{group.movie.title}</p>
            <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <TicketCheck className="w-3.5 h-3.5 text-primary" />
                {group.shows.length} Show{group.shows.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-primary" />
                Bookings: <strong className="text-white ml-0.5">{group.totalBookings}</strong>
              </span>
              <span className="flex items-center gap-1 text-green-400">
                <IndianRupee className="w-3.5 h-3.5" />
                <strong>{group.totalEarnings.toLocaleString("en-IN")}</strong>
              </span>
            </div>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-primary shrink-0" /> : <ChevronDown className="w-5 h-5 text-primary shrink-0" />}
        </button>

        {isOpen && (
          <div className="border-t border-primary/20 overflow-x-auto">
            <table className="w-full text-sm text-white">
              <thead>
                <tr className="bg-primary/20 text-xs uppercase tracking-wide text-gray-300">
                  <th className="px-4 py-2 text-left">Show Time</th>
                  <th className="px-4 py-2 text-left">Total Bookings</th>
                  <th className="px-4 py-2 text-left">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {group.shows.map((show, idx) => (
                  <tr key={idx} className="border-b border-primary/10 hover:bg-primary/10 transition">
                    <td className="px-4 py-2.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      {formatDateTime(show.time)}
                    </td>
                    <td className="px-4 py-2.5">{show.totalBookings}</td>
                    <td className="px-4 py-2.5 font-semibold text-green-400">
                      {currency} {show.earnings.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ─── Guard ─────────────────────────────────────────────────────────────────
  if (loading) return <Loading />;

  const displayGroups = searchResults ?? upcomingGroups;
  const sectionTitle  = searchResults
    ? `Search Results (${searchResults.length} movie${searchResults.length !== 1 ? "s" : ""})`
    : `Upcoming Shows (${upcomingGroups.length} movie${upcomingGroups.length !== 1 ? "s" : ""})`;

  return (
    <>
      <Title text1="List" text2="Shows" />

      <div className="relative mt-6">
        <BlurCircle top="-80px" left="0" />

        {/* ── Active Movies Grid ── */}
        <div className="bg-primary/8 border border-primary/20 rounded-xl p-5 mb-4">
          <p className="text-sm text-gray-400 font-medium mb-4 flex items-center gap-2">
            <Film className="w-4 h-4 text-primary" />
            Active Movies — click to view booked customers
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {activeMovies.map((m) => (
              <button
                key={m._id}
                onClick={() => handleMovieSelect(m._id === selectedMovieId ? "all" : m._id)}
                className={`flex-shrink-0 flex flex-col items-center w-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  selectedMovieId === m._id
                    ? "border-primary shadow-lg shadow-primary/30 scale-105"
                    : "border-transparent hover:border-primary/50 hover:scale-105"
                }`}
              >
                <img
                  src={image_base_url + m.poster_path}
                  alt={m.title}
                  className="w-24 h-32 object-cover"
                />
                <p className="text-[10px] text-center text-gray-300 px-1 py-1.5 leading-tight line-clamp-2 bg-gray-900/80 w-full">
                  {m.title}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Customer Panel (shown when a movie is selected) ── */}
        {selectedMovieId !== "all" && (
          <div className="bg-gray-900 border border-primary/30 rounded-xl mb-6 overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-primary/20 bg-primary/10">
              <div className="flex items-center gap-3">
                {customerMovie && (
                  <img
                    src={image_base_url + customerMovie.poster_path}
                    className="w-10 h-14 rounded-md object-cover border border-primary/30"
                    alt={customerMovie.title}
                  />
                )}
                <div>
                  <p className="font-bold text-white">{customerMovie?.title}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    {loadingCustomers ? "Loading..." : `${customers.length} Booked Customer${customers.length !== 1 ? "s" : ""}`}
                  </p>
                  <p className="text-[10px] text-primary/70 mt-0.5 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Today — {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button onClick={() => handleMovieSelect("all")} className="p-1.5 rounded-full hover:bg-gray-700 transition">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Customer Table */}
            {loadingCustomers ? (
              <div className="py-10 text-center text-gray-500 text-sm">Loading customers...</div>
            ) : customers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-white">
                  <thead>
                    <tr className="bg-primary/10 text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Show Time</th>
                      <th className="px-4 py-3 text-left">Seats</th>
                      <th className="px-4 py-3 text-left">Amount Paid</th>
                      <th className="px-4 py-3 text-left">Theater</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((b, idx) => (
                      <tr key={b._id} className="border-b border-primary/10 hover:bg-primary/5 transition">
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{b.user?.name || "Unknown"}</p>
                          <p className="text-xs text-gray-400">{b.user?.email || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs">{formatDateTime(b.show?.showDateTime || b.showTime)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[11px] font-bold">
                            {b.bookedSeats?.length} Seats
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">{b.bookedSeats?.join(", ")}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-green-400">₹ {b.amount?.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-gray-300">{b.theater || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-500 text-sm">No customers found for this movie.</div>
            )}
          </div>
        )}

        {/* ── Date Range Search ── */}
        <div className="bg-primary/8 border border-primary/20 rounded-xl p-5 mb-6">
          <p className="text-sm text-gray-400 font-medium mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Search Shows by Date Range
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-black/30 border border-primary/20 px-3 py-2 rounded-lg">
              <span className="text-xs text-gray-400 font-semibold">FROM</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-white outline-none text-sm" />
            </div>
            <div className="flex items-center gap-2 bg-black/30 border border-primary/20 px-3 py-2 rounded-lg">
              <span className="text-xs text-gray-400 font-semibold">TO</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-white outline-none text-sm" />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-semibold text-sm transition active:scale-95 disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              {searching ? "Searching..." : "Search DB"}
            </button>
            {searchResults && (
              <button onClick={clearSearch} className="px-4 py-2 text-sm border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded-lg transition">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Shows List ── */}
        <p className="text-base font-semibold text-gray-300 mb-3">{sectionTitle}</p>
        {displayGroups.length > 0
          ? displayGroups.map(renderGroup)
          : (
            <div className="py-16 text-center text-gray-500 border border-primary/10 rounded-xl">
              {searchResults
                ? "No shows found in the selected date range."
                : "No upcoming shows scheduled."}
            </div>
          )
        }
      </div>
    </>
  );
};

export default ListShows;
