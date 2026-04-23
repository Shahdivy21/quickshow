import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { Trash2, Pencil, X, CalendarDays, Clock, Plus, Minus, CheckSquare, Square, Info } from "lucide-react";

const THEATERS = ["INOX", "PVR", "CINEPOLIS"];

const ManageShows = () => {
  const { axios, image_base_url } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  // ─── Delete Modal State ────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  // ─── Delete ALL shows for a movie ─────────────────────────────────
  const [deleteAllTarget, setDeleteAllTarget] = useState(null); // { movie, showCount }
  const [isDeletingAll, setIsDeletingAll]     = useState(false);

  // ─── Edit Modal State ──────────────────────────────────────────────
  const [editTarget, setEditTarget]   = useState(null); // { showId, movie, show }
  const [editDateTime, setEditDT]     = useState("");
  const [editPrice, setEditPrice]     = useState("");
  const [editTheater, setEditTheater] = useState("");
  const [isSaving, setIsSaving]       = useState(false);

  // ─── Bulk Select State ────────────────────────────────────
  const [selectedShowIds, setSelectedShowIds] = useState(new Set()); // selected show IDs
  const [bulkEditOpen, setBulkEditOpen]       = useState(false);
  const [bulkEditPrice, setBulkEditPrice]     = useState("");
  const [bulkEditTheater, setBulkEditTheater] = useState("");
  const [isBulkSaving, setIsBulkSaving]       = useState(false);
  const [isBulkDeleting, setIsBulkDeleting]   = useState(false);
  const [showInfoPopup, setShowInfoPopup]     = useState(false);

  const toggleSelectShow = (showId) =>
    setSelectedShowIds((prev) => {
      const next = new Set(prev);
      next.has(showId) ? next.delete(showId) : next.add(showId);
      return next;
    });

  const toggleSelectAll = (shows) => {
    const ids = shows.map((s) => s.showId);
    const allSelected = ids.every((id) => selectedShowIds.has(id));
    setSelectedShowIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedShowIds(new Set());

  const confirmBulkDelete = async () => {
    if (selectedShowIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const { data } = await axios.post("/api/shows/bulk-delete", { showIds: [...selectedShowIds] });
      if (data.success) {
        toast.success(`🗑️ ${data.deleted} show${data.deleted !== 1 ? "s" : ""} deleted!`);
        clearSelection();
        fetchGroups();
      } else toast.error(data.message || "Bulk delete failed");
    } catch (err) {
      toast.error("Bulk delete failed");
    } finally { setIsBulkDeleting(false); }
  };

  const confirmBulkEdit = async () => {
    if (!bulkEditPrice && !bulkEditTheater) return toast.error("Change at least price or theater!");
    if (bulkEditPrice && (isNaN(bulkEditPrice) || Number(bulkEditPrice) <= 0)) return toast.error("Enter valid price!");
    setIsBulkSaving(true);
    try {
      const { data } = await axios.put("/api/shows/bulk-edit", {
        showIds: [...selectedShowIds],
        showPrice: bulkEditPrice || undefined,
        theater: bulkEditTheater || undefined,
      });
      if (data.success) {
        toast.success(`✅ ${data.updated} show${data.updated !== 1 ? "s" : ""} updated!`);
        setBulkEditOpen(false);
        setBulkEditPrice("");
        setBulkEditTheater("");
        clearSelection();
        fetchGroups();
      } else toast.error(data.message || "Bulk edit failed");
    } catch (err) {
      toast.error("Bulk edit failed");
    } finally { setIsBulkSaving(false); }
  };

  // ─── Quick Schedule Modal State ───────────────────────────────────
  const [scheduleTarget, setScheduleTarget]   = useState(null);
  const [scheduleDates, setScheduleDates]     = useState([]);   // array of "YYYY-MM-DD" strings
  const [scheduleAddDate, setScheduleAddDate] = useState("");   // for the + Add Date picker
  const [schedulePrice, setSchedulePrice]     = useState("");
  const [scheduleTheater, setScheduleTheater] = useState("CINEPOLIS");
  const [scheduleSlots, setScheduleSlots]     = useState(["10:30", "13:30", "16:30", "20:30"]);
  const [customSlot, setCustomSlot]           = useState("");
  const [isScheduling, setIsScheduling]       = useState(false);
  const [scheduleExistingShows, setScheduleExistingShows] = useState([]); // for duplicate detection

  const PRESET_SLOTS = ["10:00", "10:30", "13:00", "13:30", "16:00", "16:30", "19:00", "20:00", "20:30", "23:00"];

  /** Build a date string "YYYY-MM-DD" from a Date object using local time */
  const toDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const openSchedule = (movie, existingShows = []) => {
    // ── Find start date (day after last existing show, or today) ──
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (existingShows.length > 0) {
      const lastShowTime = existingShows.reduce((max, s) => {
        const t = new Date(s.time);
        return t > max ? t : max;
      }, new Date(0));
      const nextDay = new Date(lastShowTime);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
      startDate = nextDay;
    }

    // ── Generate default 7 dates ──
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dates.push(toDateStr(d));
    }

    // ── Extract time slots, price, theater from existing shows ──
    let detectedSlots = [];
    let detectedPrice = "";
    let detectedTheater = "CINEPOLIS";
    if (existingShows.length > 0) {
      const slotSet = new Set();
      existingShows.forEach((s) => {
        const t = new Date(s.time);
        slotSet.add(`${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`);
      });
      detectedSlots = [...slotSet].sort();
      const last = existingShows[existingShows.length - 1];
      detectedPrice = String(last.price || "");
      detectedTheater = last.theater || "CINEPOLIS";
    }

    setScheduleTarget(movie);
    setScheduleDates(dates);
    setScheduleAddDate("");
    setSchedulePrice(detectedPrice);
    setScheduleTheater(detectedTheater);
    setScheduleSlots(detectedSlots.length > 0 ? detectedSlots : ["10:30", "13:30", "16:30", "20:30"]);
    setScheduleExistingShows(existingShows); // store for duplicate pre-check
    setCustomSlot("");
  };

  const closeSchedule = () => { if (!isScheduling) setScheduleTarget(null); };

  const removeScheduleDate = (dateStr) =>
    setScheduleDates((prev) => prev.filter((d) => d !== dateStr));

  const addScheduleDate = () => {
    if (!scheduleAddDate) return toast.error("Pick a date to add!");
    const todayStr = toDateStr(new Date());
    if (scheduleAddDate < todayStr) return toast.error("Cannot add a past date!");
    if (scheduleDates.includes(scheduleAddDate)) return toast.error("Date already in the list!");
    setScheduleDates((prev) => [...prev, scheduleAddDate].sort());
    setScheduleAddDate("");
  };

  const toggleSlot = (slot) =>
    setScheduleSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot].sort()
    );

  const addCustomSlot = () => {
    if (!customSlot) return;
    if (scheduleSlots.includes(customSlot)) return toast.error("Slot already added");
    setScheduleSlots((prev) => [...prev, customSlot].sort());
    setCustomSlot("");
  };

  const confirmSchedule = async () => {
    if (!schedulePrice || isNaN(schedulePrice) || Number(schedulePrice) <= 0)
      return toast.error("Enter valid price!");
    if (scheduleSlots.length === 0)
      return toast.error("Select at least one time slot!");
    if (scheduleDates.length === 0)
      return toast.error("Add at least one date!");

    // ── Frontend pre-flight duplicate check ──
    const existingTimestamps = new Set(
      scheduleExistingShows
        .filter((s) => s.theater === scheduleTheater)
        .map((s) => {
          const t = new Date(s.time);
          return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}|${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`;
        })
    );

    const dupWarnings = [];
    scheduleDates.forEach((date) => {
      scheduleSlots.forEach((slot) => {
        if (existingTimestamps.has(`${date}|${slot}`)) {
          dupWarnings.push(`${date} @ ${slot}`);
        }
      });
    });

    if (dupWarnings.length > 0) {
      toast(`⚠️ ${dupWarnings.length} duplicate slot${dupWarnings.length > 1 ? "s" : ""} will be skipped (already exist).`, {
        icon: "ℹ️",
        duration: 4000,
      });
    }

    setIsScheduling(true);
    try {
      const showsInput = scheduleDates.map((date) => ({ date, time: [...scheduleSlots] }));

      const { data } = await axios.post(
        "/api/shows/add",
        {
          movieId: scheduleTarget.tmdbId || scheduleTarget._id,
          showsInput,
          showPrice: schedulePrice,
          theater: scheduleTheater,
        },
        { withCredentials: true }
      );

      if (data.success) {
        const added   = data.added  ?? scheduleDates.length * scheduleSlots.length;
        const skipped = data.skipped ?? 0;
        const skipMsg = skipped > 0 ? ` (${skipped} duplicate${skipped > 1 ? "s" : ""} skipped)` : "";
        if (added === 0) {
          toast.error(`All slots already exist — nothing new added!`);
        } else {
          toast.success(`✅ ${added} shows added for "${scheduleTarget.title}"${skipMsg}!`);
        }
        setScheduleTarget(null);
        fetchGroups();
      } else {
        toast.error(data.message || "Failed to add shows");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Server error");
    } finally {
      setIsScheduling(false);
    }
  };

  // ─── Fetch ─────────────────────────────────────────────────────────
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/shows/all-grouped");
      if (data.success) setGroups(data.shows || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load shows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  // ─── Filter to future shows only ───────────────────────────────────
  const now = new Date();
  const filtered = groups
    .map((g) => ({
      ...g,
      shows: (g.shows || []).filter((s) => new Date(s.time) > now),
    }))
    .filter(
      (g) =>
        g.shows.length > 0 &&
        (g.movie?.title || "").toLowerCase().includes(q.toLowerCase())
    );

  // ─── Delete Handlers ───────────────────────────────────────────────
  const openDelete = (showId, movie, show) => setDeleteTarget({ showId, movie, show });
  const closeDelete = () => { if (!isDeleting) setDeleteTarget(null); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { data } = await axios.delete(`/api/shows/delete/${deleteTarget.showId}`);
      if (data.success) {
        toast.success("Show deleted successfully! 🗑️");
        setDeleteTarget(null);
        fetchGroups();
      } else toast.error(data.message || "Delete failed");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Delete All Shows Handlers ────────────────────────────────────
  const openDeleteAll  = (movie, showCount) => setDeleteAllTarget({ movie, showCount });
  const closeDeleteAll = () => { if (!isDeletingAll) setDeleteAllTarget(null); };

  const confirmDeleteAll = async () => {
    if (!deleteAllTarget) return;
    setIsDeletingAll(true);
    try {
      const { data } = await axios.delete(`/api/shows/delete-all/${deleteAllTarget.movie._id}`);
      if (data.success) {
        toast.success(`All ${data.deletedCount} shows deleted for "${deleteAllTarget.movie.title}" 🗑️`);
        setDeleteAllTarget(null);
        fetchGroups();
      } else toast.error(data.message || "Delete failed");
    } catch (err) {
      console.error(err);
      toast.error("Delete all shows failed");
    } finally {
      setIsDeletingAll(false);
    }
  };

  // ─── Edit Handlers ─────────────────────────────────────────────────
  const openEdit = (showId, movie, show) => {
    const dt = new Date(show.time);
    // Use local time offset to match IST display (avoids UTC shift issue)
    const localDT = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditTarget({ showId, movie, show });
    setEditDT(localDT);
    setEditPrice(show.price || "");
    setEditTheater(show.theater || "");
  };
  const closeEdit = () => { if (!isSaving) setEditTarget(null); };

  const confirmEdit = async () => {
    if (!editDateTime || !editPrice || !editTheater)
      return toast.error("All fields are required");
    setIsSaving(true);
    try {
      const payload = {
        showDateTime: new Date(editDateTime),
        showPrice: Number(editPrice),
        theater: editTheater,
      };
      const { data } = await axios.put(`/api/shows/update/${editTarget.showId}`, payload);
      if (data.success) {
        toast.success("Show updated successfully! ✏️");
        setEditTarget(null);
        fetchGroups();
      } else toast.error(data.message || "Update failed");
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Manage Shows</h1>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search movies..."
            className="px-3 py-2 bg-[#111214] border border-gray-700 rounded text-sm w-56"
          />
          <button onClick={fetchGroups} className="px-3 py-2 bg-primary rounded text-white text-sm">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400">No upcoming shows found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((group) => {
            const movie = group.movie || {};
            const poster = movie.poster_path ? image_base_url + movie.poster_path : "/placeholder.png";

            return (
              <div key={movie._id} className="bg-[#18191b] border border-gray-700 shadow-sm rounded-lg overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-3 p-3">
                  <img src={poster} alt={movie.title} className="w-16 h-24 object-cover rounded-sm flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold truncate">{movie.title}</h2>
                    <p className="text-xs text-gray-400 mt-1 truncate">{movie.tagline || movie.overview?.slice(0, 80)}</p>
                  </div>
                </div>

                {/* Table */}
                <div className="p-2">
                  <div className="text-xs text-gray-300 font-medium mb-2 flex items-center justify-between">
                    <span>Upcoming Showtimes ({group.shows.length})</span>
                    <button
                      onClick={() => toggleSelectAll(group.shows)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 transition"
                      title="Select/deselect all shows in this movie"
                    >
                      {group.shows.every((s) => selectedShowIds.has(s.showId))
                        ? <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                        : <Square className="w-3.5 h-3.5" />}
                      Select all
                    </button>
                  </div>
                  <div className="w-full overflow-auto">
                    <table className="w-full text-xs table-fixed">
                      <thead>
                        <tr className="text-left text-gray-400">
                          <th className="pr-2 w-5"></th>
                          <th className="pr-2 w-28">Date</th>
                          <th className="pr-2 w-18">Time</th>
                          <th className="pr-2 w-20">Theater</th>
                          <th className="pr-2 w-14">Price</th>
                          <th className="w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.shows.map((s) => {
                          const dt = new Date(s.time);
                          return (
                          <tr
                            key={s.showId}
                            className={`align-top border-b border-gray-800 transition ${
                              selectedShowIds.has(s.showId) ? "bg-blue-900/20" : ""
                            }`}
                          >
                            <td className="py-2 pr-1">
                              <button
                                onClick={() => toggleSelectShow(s.showId)}
                                className="text-gray-500 hover:text-blue-400 transition mt-0.5"
                              >
                                {selectedShowIds.has(s.showId)
                                  ? <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                                  : <Square className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                            <td className="py-2 pr-2 text-gray-200">{dt.toLocaleDateString("en-GB")}</td>
                            <td className="py-2 pr-2 text-gray-200">{dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="py-2 pr-2 text-gray-300 text-xs">{s.theater}</td>
                            <td className="py-2 pr-2 text-gray-100">₹{s.price}</td>
                            <td className="py-2">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => openEdit(s.showId, movie, s)}
                                  className="p-1.5 bg-yellow-500/20 hover:bg-yellow-500 text-yellow-400 hover:text-black rounded transition"
                                  title="Edit"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => openDelete(s.showId, movie, s)}
                                  className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-3 border-t border-gray-800">
                  <button
                    onClick={() => openSchedule(movie, group.shows)}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition flex items-center justify-center gap-1.5"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    Add show
                  </button>
                  <button
                    onClick={() => openDeleteAll(movie, group.shows.length)}
                    className="px-3 py-2 bg-red-800/60 hover:bg-red-700 text-red-300 hover:text-white rounded text-sm transition flex items-center gap-1"
                    title="Delete all upcoming shows for this movie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    All Shows
                  </button>
                  <button onClick={fetchGroups} className="px-3 py-2 bg-gray-700 text-white rounded text-sm">
                    Refresh
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────── FLOATING BULK ACTION BAR ─────────────── */}
      {selectedShowIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 border border-gray-600 rounded-2xl shadow-2xl px-5 py-3 animate-in slide-in-from-bottom-4">
          <div className="relative flex items-center gap-2">
            <span className="text-sm text-white font-semibold">
              <span className="text-blue-400">{selectedShowIds.size}</span> show{selectedShowIds.size !== 1 ? "s" : ""} selected
            </span>
            <button 
              onClick={() => setShowInfoPopup(!showInfoPopup)}
              className="text-gray-400 hover:text-white transition"
              title="Show details"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Info Popup */}
            {showInfoPopup && (
              <div className="absolute bottom-full mb-4 left-0 w-80 bg-[#18191b] border border-gray-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
                  <span className="text-xs font-semibold text-gray-300">Selected Shows Breakdown</span>
                  <button onClick={() => setShowInfoPopup(false)} className="text-gray-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-[50vh] overflow-y-auto pr-1 flex flex-col gap-2.5 custom-scrollbar">
                  {groups
                    .map(g => ({
                      movie: g.movie,
                      selectedShows: g.shows.filter(s => selectedShowIds.has(s.showId))
                    }))
                    .filter(item => item.selectedShows.length > 0)
                    .map((item, idx) => (
                      <div key={idx} className="flex gap-3 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/50">
                        <img 
                          src={item.movie.poster_path ? image_base_url + item.movie.poster_path : "/placeholder.png"} 
                          alt={item.movie.title} 
                          className="w-12 h-16 object-cover rounded shadow-sm shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-200 text-xs font-bold truncate block mb-1.5">{item.movie.title}</span>
                          <div className="flex flex-col gap-1">
                            {item.selectedShows.map(s => {
                              const dt = new Date(s.time);
                              return (
                                <div key={s.showId} className="flex items-center justify-between text-[10px] text-gray-400 bg-gray-900/50 px-1.5 py-0.5 rounded">
                                  <span>{dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                                  <span className="text-blue-300 font-medium">{dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                  <span className="uppercase text-[9px]">{s.theater}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
                {/* Little triangle pointer */}
                <div className="absolute -bottom-2 left-10 w-4 h-4 bg-[#18191b] border-b border-r border-gray-700 transform rotate-45"></div>
              </div>
            )}
          </div>
          <div className="w-px h-5 bg-gray-600" />
          <button
            onClick={() => {
              setBulkEditPrice("");
              setBulkEditTheater("");
              setBulkEditOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 rounded-lg text-sm transition"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit {selectedShowIds.size} Shows
          </button>
          <button
            onClick={confirmBulkDelete}
            disabled={isBulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/60 text-red-300 rounded-lg text-sm transition disabled:opacity-50"
          >
            {isBulkDeleting
              ? <div className="w-3.5 h-3.5 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />
              : <Trash2 className="w-3.5 h-3.5" />}
            Delete {selectedShowIds.size} Shows
          </button>
          <button onClick={clearSelection} className="p-1.5 hover:bg-gray-700 rounded-full transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* ─────────────── BULK EDIT MODAL ─────────────── */}
      {bulkEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111214] border border-gray-700/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gradient-to-r from-yellow-900/20 to-transparent">
              <div>
                <p className="font-bold text-white">Bulk Edit Shows</p>
                <p className="text-xs text-yellow-400 mt-0.5">Updating {selectedShowIds.size} selected show{selectedShowIds.size !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setBulkEditOpen(false)} className="p-1.5 hover:bg-gray-800 rounded-full transition">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {/* Note about time */}
              <div className="flex items-start gap-2 bg-blue-900/20 border border-blue-700/40 rounded-xl px-4 py-3">
                <span className="text-blue-400 text-sm">ℹ️</span>
                <p className="text-xs text-blue-300">
                  <span className="font-semibold text-blue-200">Time cannot be changed</span> in bulk — same movie cannot have duplicate show times on the same date.
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">New Price per Seat (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={bulkEditPrice}
                  onChange={(e) => setBulkEditPrice(e.target.value)}
                  placeholder="Leave blank to keep current price"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-yellow-500 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">New Theater</label>
                <select
                  value={bulkEditTheater}
                  onChange={(e) => setBulkEditTheater(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-yellow-500"
                >
                  <option value="">— Keep current theater —</option>
                  {THEATERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setBulkEditOpen(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkEdit}
                disabled={isBulkSaving}
                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold rounded-lg text-sm transition flex items-center justify-center gap-2"
              >
                {isBulkSaving
                  ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : <><Pencil className="w-3.5 h-3.5" /> Update {selectedShowIds.size} Shows</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── QUICK SCHEDULE MODAL ─────────────── */}
      {scheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111214] border border-gray-700/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gradient-to-r from-green-900/30 to-transparent">
              <div className="flex items-center gap-3">
                {scheduleTarget.poster_path && (
                  <img
                    src={image_base_url + scheduleTarget.poster_path}
                    alt={scheduleTarget.title}
                    className="w-10 h-14 rounded-md object-cover shadow-lg"
                  />
                )}
                <div>
                  <p className="font-bold text-white text-base leading-tight">{scheduleTarget.title}</p>
                  <p className="text-xs text-green-400 mt-0.5 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Quick Schedule — {scheduleDates.length} day{scheduleDates.length !== 1 ? "s" : ""} selected
                  </p>
                </div>
              </div>
              <button onClick={closeSchedule} className="p-1.5 hover:bg-gray-800 rounded-full transition">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">

              {/* ── Selected Dates ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    📅 Show Dates
                    <span className="ml-2 text-green-400 font-bold normal-case">
                      {scheduleDates.length} day{scheduleDates.length !== 1 ? "s" : ""}
                      {scheduleSlots.length > 0 && (
                        <span className="text-gray-500 font-normal">
                          {" "}× {scheduleSlots.length} slots = <span className="text-green-400 font-semibold">{scheduleDates.length * scheduleSlots.length} shows</span>
                        </span>
                      )}
                    </span>
                  </label>
                  {scheduleDates.length > 0 && (
                    <button
                      onClick={() => setScheduleDates([])}
                      className="text-xs text-gray-600 hover:text-red-400 transition"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Date pills with × remove */}
                <div className="flex flex-wrap gap-2 min-h-[36px]">
                  {scheduleDates.length === 0 && (
                    <p className="text-xs text-gray-600 italic">No dates selected. Add dates below.</p>
                  )}
                  {scheduleDates.map((dateStr) => {
                    const d = new Date(dateStr + "T00:00:00");
                    return (
                      <span
                        key={dateStr}
                        className="flex items-center gap-1.5 bg-green-900/30 text-green-300 border border-green-700/50 text-xs px-2.5 py-1 rounded-lg"
                      >
                        <span>{d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                        <button
                          type="button"
                          onClick={() => removeScheduleDate(dateStr)}
                          className="text-green-500 hover:text-red-400 hover:bg-red-900/30 rounded-full w-4 h-4 flex items-center justify-center transition text-sm leading-none"
                          title="Remove this date"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* + Add Date row */}
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="date"
                    value={scheduleAddDate}
                    min={toDateStr(new Date())}
                    onChange={(e) => setScheduleAddDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-green-500 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  />
                  <button
                    onClick={addScheduleDate}
                    className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded-lg transition whitespace-nowrap flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Date
                  </button>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">
                  <Clock className="w-3 h-3 inline mr-1" /> Time Slots Per Day
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => toggleSlot(slot)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                        scheduleSlots.includes(slot)
                          ? "bg-green-600 border-green-500 text-white shadow-sm shadow-green-500/30"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {/* Custom slot input */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="time"
                    value={customSlot}
                    onChange={(e) => setCustomSlot(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-green-500"
                    style={{ colorScheme: "dark" }}
                  />
                  <button
                    onClick={addCustomSlot}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition whitespace-nowrap"
                  >
                    + Add Custom
                  </button>
                </div>
                {scheduleSlots.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {scheduleSlots.map((s) => (
                      <span
                        key={s}
                        className="flex items-center gap-1 text-xs bg-green-900/30 text-green-300 border border-green-700/40 px-2 py-0.5 rounded-full"
                      >
                        {s}
                        <button onClick={() => toggleSlot(s)} className="text-green-500 hover:text-red-400 ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Theater & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Theater</label>
                  <select
                    value={scheduleTheater}
                    onChange={(e) => setScheduleTheater(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-green-500"
                  >
                    {THEATERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Price per Seat (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={schedulePrice}
                    onChange={(e) => setSchedulePrice(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-green-500 placeholder-gray-600"
                  />
                </div>
              </div>

              {/* Summary banner */}
              {scheduleSlots.length > 0 && schedulePrice && scheduleDates.length > 0 && (
                <div className="bg-green-900/20 border border-green-700/40 rounded-xl p-4">
                  <p className="text-sm text-green-300 font-semibold mb-1">📋 Schedule Summary</p>
                  <p className="text-xs text-gray-400">
                    <span className="text-white font-semibold">{scheduleDates.length} days</span>
                    {" × "}
                    <span className="text-white font-semibold">{scheduleSlots.length} shows/day</span>
                    {" = "}
                    <span className="text-green-400 font-bold">{scheduleDates.length * scheduleSlots.length} total shows</span>
                    {" at "}
                    <span className="text-white font-semibold">₹{schedulePrice}</span>
                    {" — "}
                    {scheduleTheater}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-800">
              <button
                onClick={closeSchedule}
                disabled={isScheduling}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmSchedule}
                disabled={isScheduling || scheduleSlots.length === 0 || !schedulePrice || scheduleDates.length === 0}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                {isScheduling ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><CalendarDays className="w-4 h-4" /> Add {scheduleDates.length * scheduleSlots.length} Shows</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── DELETE MODAL ─────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Red icon header */}
            <div className="flex flex-col items-center pt-8 pb-4 px-6">
              <div className="w-14 h-14 rounded-full bg-red-600/20 flex items-center justify-center mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Delete Show?</h2>
              <p className="text-sm text-gray-400 text-center mb-5">
                This will permanently delete the following show.
              </p>

              {/* Show info card */}
              <div className="flex gap-4 w-full bg-gray-800/60 rounded-xl p-4">
                <img
                  src={deleteTarget.movie.poster_path ? image_base_url + deleteTarget.movie.poster_path : "/placeholder.png"}
                  alt={deleteTarget.movie.title}
                  className="w-16 h-22 object-cover rounded-lg shrink-0"
                />
                <div className="flex flex-col justify-center text-sm gap-1">
                  <p className="font-bold text-white text-base leading-tight">{deleteTarget.movie.title}</p>
                  <p className="text-gray-400">
                    📅 {new Date(deleteTarget.show.time).toLocaleDateString("en-GB")}
                  </p>
                  <p className="text-gray-400">
                    🕐 {new Date(deleteTarget.show.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-gray-400">🎭 {deleteTarget.show.theater}</p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 p-5">
              <button
                onClick={closeDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── EDIT MODAL ─────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <img
                  src={editTarget.movie.poster_path ? image_base_url + editTarget.movie.poster_path : "/placeholder.png"}
                  alt={editTarget.movie.title}
                  className="w-10 h-14 rounded-md object-cover"
                />
                <div>
                  <p className="font-bold text-white">{editTarget.movie.title}</p>
                  <p className="text-xs text-gray-400">Edit Show Details</p>
                </div>
              </div>
              <button onClick={closeEdit} className="p-1.5 hover:bg-gray-800 rounded-full transition">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">Date & Time</label>
                <input
                  type="datetime-local"
                  value={editDateTime}
                  onChange={(e) => setEditDT(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">Price (₹)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-semibold uppercase">Theater</label>
                <select
                  value={editTheater}
                  onChange={(e) => setEditTheater(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-primary"
                >
                  <option value="">Select Theater</option>
                  {THEATERS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={closeEdit}
                disabled={isSaving}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmEdit}
                disabled={isSaving}
                className="flex-1 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Pencil className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── DELETE ALL SHOWS MODAL ─────────────── */}
      {deleteAllTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-gray-900 border border-red-900/40 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex flex-col items-center pt-8 pb-4 px-6">
              <div className="w-14 h-14 rounded-full bg-red-600/20 flex items-center justify-center mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Delete All Shows?</h2>
              <p className="text-sm text-gray-400 text-center mb-5">
                This will permanently delete <strong className="text-red-400">all {deleteAllTarget.showCount} upcoming shows</strong> for this movie.
              </p>

              <div className="flex gap-4 w-full bg-gray-800/60 rounded-xl p-4 items-center">
                <img
                  src={deleteAllTarget.movie.poster_path ? image_base_url + deleteAllTarget.movie.poster_path : "/placeholder.png"}
                  alt={deleteAllTarget.movie.title}
                  className="w-14 h-20 object-cover rounded-lg shrink-0"
                />
                <div>
                  <p className="font-bold text-white">{deleteAllTarget.movie.title}</p>
                  <p className="text-sm text-red-400 mt-1">{deleteAllTarget.showCount} shows will be deleted</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5">
              <button
                onClick={closeDeleteAll}
                disabled={isDeletingAll}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition"
              >
                Keep
              </button>
              <button
                onClick={confirmDeleteAll}
                disabled={isDeletingAll}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                {isDeletingAll ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Trash2 className="w-4 h-4" /> Yes, Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageShows;
