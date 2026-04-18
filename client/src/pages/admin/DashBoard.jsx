// client/src/pages/admin/DashBoard.jsx
import React, { useEffect, useState, useRef } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import BlurCircle from "../../components/BlurCircle";
import {
  LineChart,
  CircleDollarSign,
  PlayCircle,
  User,
  Star,
  FileSpreadsheet,
  ChevronDown,
  History,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";

const DashBoard = () => {
  const currency = "₹";
  const [data, setData] = useState(null);
  const { axios, image_base_url } = useAuth();

  // dropdown state: null | 'excel' | 'pdf'
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  // recent bookings filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // chart filter state
  const [chartFilter, setChartFilter] = useState("Last 30 Days");
  const [chartFromDate, setChartFromDate] = useState("");
  const [chartToDate, setChartToDate] = useState("");

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // close menu on outside click/touch
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener("mousedown", handler);
    window.addEventListener("touchstart", handler);
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/admin/dashboard", { withCredentials: true });
      if (data.success) setData(data.dashboardData);
      else toast.error("Failed to fetch dashboard data");
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Server error fetching dashboard data");
    }
  };

  // resets to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate]);

  if (!data) return <Loading />;

  const API_BASE = import.meta.env.VITE_API_URL || "";

  // Generic file download helper (works cross-platform)
  const downloadFile = async (path, defaultName) => {
    try {
      const url = `${API_BASE}${path}`;
      const res = await axios.get(url, { responseType: "blob", withCredentials: true });

      const cd = res.headers["content-disposition"] || "";
      const m = cd.match(/filename="?(.+)"?/);
      const filename = m ? m[1] : defaultName;

      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);

      // close menu after download
      setOpenMenu(null);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download report");
      setOpenMenu(null);
    }
  };

  // Excel / PDF handlers
  const handleExcel = (type) => {
    if (type === "users") downloadFile("/api/reports/users/excel", `users-${Date.now()}.xlsx`);
    if (type === "bookings") downloadFile("/api/reports/bookings/excel", `bookings-${Date.now()}.xlsx`);
    if (type === "movies") downloadFile("/api/reports/movies/revenue/excel", `movie-revenue-${Date.now()}.xlsx`);
  };

  const handlePDF = (type) => {
    if (type === "users") downloadFile("/api/reports/users/pdf", `users-${Date.now()}.pdf`);
    if (type === "bookings") downloadFile("/api/reports/bookings/pdf", `bookings-${Date.now()}.pdf`);
    if (type === "movies") downloadFile("/api/reports/movies/revenue/pdf", `movie-revenue-${Date.now()}.pdf`);
  };

  const formatNumber = (num) => (typeof num === "number" ? num.toLocaleString("en-IN") : num);

  const cards = [
    { title: "Total Bookings", value: formatNumber(data.totalBookings || 0), icon: LineChart },
    { title: "Total Revenue", value: `${currency} ${formatNumber(data.totalRevenue || 0)}`, icon: CircleDollarSign },
    { title: "Active Shows", value: (data.activeShows || []).length, icon: PlayCircle },
    { title: "Total Users", value: formatNumber(data.totalUser || 0), icon: User },
  ];

  const recentBookings = data.recentBookings || [];
  const filteredBookings = recentBookings.filter(b => {
    if (fromDate && new Date(b.date) < new Date(fromDate)) return false;
    if (toDate && new Date(b.date) > new Date(toDate)) return false;
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const formatDateTimeIST = (isoString) => {
    if (!isoString) return { date: "N/A", time: "N/A" };
    // Just in case the string is only a date or not a fully valid ISO.
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) return { date: isoString, time: "" };

    const optionsTime = {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    const d = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const formattedTime = dateObj.toLocaleTimeString('en-US', optionsTime).toLowerCase();

    return { date: formattedDate, time: formattedTime };
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const BookingTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, padding: "10px 14px" }}>
        <p style={{ color: "#e5e7eb", fontWeight: 600, marginBottom: 6 }}>{formatDateLabel(label)}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: "3px 0" }}>
            {p.name}: <strong>{p.value} tickets</strong>
          </p>
        ))}
      </div>
    );
  };

  const RevenueTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, padding: "10px 14px" }}>
        <p style={{ color: "#e5e7eb", fontWeight: 600, marginBottom: 6 }}>{formatDateLabel(label)}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: "3px 0" }}>
            {p.name}: <strong>₹{p.value.toLocaleString("en-IN")}</strong>
          </p>
        ))}
      </div>
    );
  };

  const getFilteredChartData = () => {
    if (!data || !data.chartData) return [];
    
    let filtered = [...data.chartData];
    const today = new Date();
    today.setHours(0,0,0,0);

    if (chartFilter === "Last 7 Days") {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 7);
      filtered = filtered.filter(d => new Date(d.date) >= pastDate);
    } else if (chartFilter === "Last 30 Days") {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 30);
      filtered = filtered.filter(d => new Date(d.date) >= pastDate);
    } else if (chartFilter === "This Year") {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      filtered = filtered.filter(d => new Date(d.date) >= startOfYear);
    } else if (chartFilter === "Custom Range") {
      if (chartFromDate) filtered = filtered.filter(d => new Date(d.date) >= new Date(chartFromDate));
      if (chartToDate) filtered = filtered.filter(d => new Date(d.date) <= new Date(chartToDate));
    }

    return filtered;
  };

  const filteredChartData = getFilteredChartData();

  return (
    <>
      <Title text1="Admin" text2="Dashboard" />

      <div className="relative mt-6">
        <BlurCircle top="-100px" left="0" />

        {/* STAT CARDS: responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-3 bg-primary/10 border border-primary/20 rounded-md shadow-sm hover:shadow-md transition"
              >
                <div>
                  <h1 className="text-xs text-white-500">{card.title}</h1>
                  <p className="text-lg font-medium mt-1 text-white-800">{card.value}</p>
                </div>
                <Icon className="w-6 h-6 text-primary/80" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE SHOWS: horizontally scrollable on small screens */}
      <p className="mt-8 text-lg font-medium">Active Shows</p>

      <div className="relative mt-4">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {data.activeShows.map((item, idx) => (
            <div key={idx} className="min-w-[12rem] w-48 rounded-lg overflow-hidden bg-primary/10 border border-primary/20">
              <div className="aspect-[2/3] w-full">
                <img src={image_base_url + item.movie.poster_path} alt={item.movie.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-2">
                <p className="font-medium truncate text-sm">{item.movie.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    {Number(item.movie.vote_average || 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHARTS */}
      <div className="mt-12 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">Overview</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="bg-primary/10 border border-primary/20 text-white text-sm rounded px-3 py-1.5 outline-none cursor-pointer focus:border-primary/50"
            value={chartFilter}
            onChange={(e) => setChartFilter(e.target.value)}
          >
            <option value="Last 7 Days" className="bg-gray-900">Last 7 Days</option>
            <option value="Last 30 Days" className="bg-gray-900">Last 30 Days</option>
            <option value="This Year" className="bg-gray-900">This Year</option>
            <option value="All Time" className="bg-gray-900">All Time</option>
            <option value="Custom Range" className="bg-gray-900">Custom Range</option>
          </select>

          {chartFilter === "Custom Range" && (
            <div className="flex items-center gap-2">
              <input type="date" className="bg-primary/10 border border-primary/20 px-2 py-1 sm:py-1.5 rounded text-white text-sm outline-none" value={chartFromDate} onChange={(e) => setChartFromDate(e.target.value)} />
              <span className="text-gray-400">-</span>
              <input type="date" className="bg-primary/10 border border-primary/20 px-2 py-1 sm:py-1.5 rounded text-white text-sm outline-none" value={chartToDate} onChange={(e) => setChartToDate(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {data.chartData && data.chartData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Bookings */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white">Daily Bookings (Tickets)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="date" stroke="#6b7280" tickFormatter={formatDateLabel} tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip content={<BookingTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <defs>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#9f1239" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#9a3412" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <Bar dataKey="ticketsBooked" name="Confirmed Tickets" fill="url(#colorTickets)" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="cancelledTickets" name="Cancelled Tickets" fill="url(#colorCancelled)" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Status */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white">Revenue Status (₹)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="date" stroke="#6b7280" tickFormatter={formatDateLabel} tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                  <Tooltip content={<RevenueTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <defs>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#991b1b" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#047857" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <Bar dataKey="failedRevenue" name="Cancelled / Refunded" fill="url(#colorFailed)" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="successRevenue" name="Confirmed Revenue" fill="url(#colorSuccess)" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center text-gray-500 border border-primary/20 rounded-md">
          No chart data available.
        </div>
      )}

      {/* RECENT BOOKINGS */}
      <div className="mt-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Recent Bookings
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded">
              <span className="text-gray-400 font-medium text-xs">FROM</span>
              <input type="date" className="bg-transparent text-white outline-none w-28" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded">
              <span className="text-gray-400 font-medium text-xs">TO</span>
              <input type="date" className="bg-transparent text-white outline-none w-28" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto border border-primary/20 rounded-md">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-primary/20 text-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold">User Details</th>
                <th className="px-4 py-3 font-semibold">Movie</th>
                <th className="px-4 py-3 font-semibold">Show Date & Time</th>
                <th className="px-4 py-3 font-semibold">Seats</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {currentItems.length > 0 ? (
                currentItems.map((b, idx) => {
                  // b.showTime contains ISO string based on backend, or fallback to b.createdAt
                  const { date, time } = formatDateTimeIST(b.showTime || b.createdAt);
                  const bookingId = b._id ? b._id.substring(b._id.length - 6).toUpperCase() : "N/A";

                  return (
                    <tr key={idx} className="hover:bg-primary/5 transition">
                      <td className="px-4 py-4">
                        <p className="font-bold text-[15px] text-white">{b.user?.name || "Unknown User"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{b.user?.email || "N/A"}</p>
                        <p className="text-[10px] text-red-800 font-semibold mt-1 tracking-wider">ID: {bookingId}</p>
                      </td>
                      <td className="px-4 py-4 max-w-[150px] truncate text-primary font-medium">{b.show?.movie?.title || "N/A"}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-300 mt-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>{time}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block px-2 py-0.5 bg-primary/20 text-primary rounded text-[11px] font-semibold mb-1">
                          {b.bookedSeats?.length || 0} Tickets
                        </span>
                        <p className="text-xs text-gray-400">{b.bookedSeats?.join(", ") || "None"}</p>
                      </td>
                      <td className="px-4 py-4 font-bold text-[15px] text-white">₹ {b.amount || 0}</td>
                      <td className="px-4 py-4">
                        {b.status === "cancelled" ? (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold tracking-wide">CANCELLED</span>
                        ) : b.isPaid ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-[10px] font-bold tracking-wide">PAID</span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-[10px] font-bold tracking-wide">PENDING</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No recent bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination Footer */}
          {filteredBookings.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-t border-primary/20">
              <p className="text-sm text-gray-400">
                Showing <span className="text-white font-medium">{indexOfFirstItem + 1}</span> to <span className="text-white font-medium">{Math.min(indexOfLastItem, filteredBookings.length)}</span> of <span className="text-white font-medium">{filteredBookings.length}</span> bookings
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded bg-primary/20 hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <span className="text-sm font-medium mx-2">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded bg-primary/20 hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REPORTS: grouped buttons, responsive */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          Reports
        </h2>

        <div ref={menuRef} className="flex flex-col sm:flex-row gap-4">
          {/* Excel group - mobile: full width; desktop: inline */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setOpenMenu(openMenu === "excel" ? null : "excel")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded shadow hover:bg-blue-700 transition"
              aria-expanded={openMenu === "excel"}
            >
              Download Excel <ChevronDown className="w-4 h-4" />
            </button>

            {openMenu === "excel" && (
              <div className="absolute left-0 mt-2 w-full sm:w-56 bg-black rounded shadow-md ring-1 ring-black ring-opacity-5 z-50">
                <button className="w-full text-left px-4 py-3 hover:bg-gray-800" onClick={() => handleExcel("users")}>
                  Users (Excel)
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-gray-800" onClick={() => handleExcel("bookings")}>
                  Bookings (Excel)
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-gray-800" onClick={() => handleExcel("movies")}>
                  Movie Revenue (Excel)
                </button>
              </div>
            )}
          </div>

          {/* PDF group */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setOpenMenu(openMenu === "pdf" ? null : "pdf")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-700 text-white px-4 py-3 rounded shadow hover:bg-red-800 transition"
              aria-expanded={openMenu === "pdf"}
            >
              Download PDF <ChevronDown className="w-4 h-4" />
            </button>

            {openMenu === "pdf" && (
              <div className="absolute left-0 mt-2 w-full sm:w-64 bg-black rounded shadow-md ring-1 ring-black ring-opacity-5 z-50">
                <button className="w-full text-left px-4 py-3 hover:bg-gray-800" onClick={() => handlePDF("users")}>
                  Users (PDF)
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-gray-800" onClick={() => handlePDF("bookings")}>
                  Bookings (PDF)
                </button>
                <button className="w-full text-left px-4 py-3 hover:bg-gray-800" onClick={() => handlePDF("movies")}>
                  Movie Revenue (PDF)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashBoard;
