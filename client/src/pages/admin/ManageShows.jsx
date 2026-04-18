import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { Trash2, Pencil, X } from "lucide-react";

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
                  <div className="text-xs text-gray-300 font-medium mb-2">
                    Upcoming Showtimes ({group.shows.length})
                  </div>
                  <div className="w-full overflow-auto">
                    <table className="w-full text-xs table-fixed">
                      <thead>
                        <tr className="text-left text-gray-400">
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
                            <tr key={s.showId} className="align-top border-b border-gray-800">
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
                    onClick={() => (window.location.href = `/admin/add-shows?movie=${movie._id}`)}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
                  >
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
                Cancel
              </button>
              <button
                onClick={confirmDeleteAll}
                disabled={isDeletingAll}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                {isDeletingAll ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Trash2 className="w-4 h-4" /> Delete All</>
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
