import React, { useEffect, useState, useRef } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { CheckIcon, StarIcon, ChevronDown, ArrowLeft, CalendarDays, Clock, MapPin, X, Plus } from "lucide-react";
import { kConverter } from "../../lib/kConverter";
import { useAuth } from "../../context/AuthContext.jsx";
import { toast } from "react-hot-toast";

const AddShows = () => {
  const { axios, image_base_url } = useAuth();
  const currency = import.meta.env.VITE_CURRENCY;

  const [moviesList, setMoviesList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedMovieData, setSelectedMovieData] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");
  const [selectedTheater, setSelectedTheater] = useState("N/A");
  const [quickFillTimes, setQuickFillTimes] = useState(["10:00", "14:00", "19:00"]);
  const [newQuickTime, setNewQuickTime] = useState("");

  const [allTimeSlots, setAllTimeSlots] = useState(["10:00", "10:30", "13:00", "13:30", "16:00", "16:30", "19:00", "20:00", "20:30", "23:00"]);

  const theaters = ["INOX", "PVR", "CINEPOLIS"];

  const [dropdownResults, setDropdownResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setDropdownResults([]);
      setShowDropdown(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get(`/api/shows/search?query=${encodeURIComponent(searchQuery)}`);
        if (data.success) {
          setDropdownResults(data.movies);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error(error);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(t);
  }, [searchQuery, axios]);

  // Fetch top rated movies
  const fetchTopRatedMovies = async () => {
    setListLoading(true);
    try {
      const { data } = await axios.get("/api/shows/top-rated");
      if (data.success) {
        setMoviesList(data.movies);
        setIsSearching(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setListLoading(false);
    }
  };

  // Search TMDB movies
  const handleSearch = async () => {
    if (!searchQuery.trim()) return fetchTopRatedMovies();
    
    try {
      const { data } = await axios.get(`/api/shows/search?query=${encodeURIComponent(searchQuery)}`);
      if (data.success) {
        setMoviesList(data.movies);
        setIsSearching(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error searching movies");
    }
  };

  // Add show handler
  const handleAddShow = async () => {
    if (!selectedMovie) return toast.error("Select a movie!");
    if (!showPrice) return toast.error("Enter price!");
    if (selectedTheater === "N/A") return toast.error("Select a theater!");
    if (!Object.keys(dateTimeSelection).length)
      return toast.error("Add at least one date & time!");

    try {
      const showsInput = Object.entries(dateTimeSelection).map(
        ([date, times]) => ({
          date,
          time: times,
        })
      );

      const { data } = await axios.post(
        "/api/shows/add",
        {
          movieId: selectedMovie,
          showsInput,
          showPrice,
          theater: selectedTheater,
        },
        { withCredentials: true }
      );

      if (data.success) {
        const added = data.added ?? 1;
        const skipped = data.skipped ?? 0;
        
        if (added === 0) {
          toast.error(`❌ All slots already exist — nothing new added!`);
        } else {
          toast.success(`✅ ${added} shows added! ${skipped > 0 ? `(${skipped} skipped)` : ""}`);
          setSelectedMovie(null);
          setSelectedMovieData(null);
          setDateTimeSelection({});
          setShowPrice("");
          setDateTimeInput("");
          setSelectedTheater("N/A");
        }
      } else {
        toast.error(data.message || "Failed to add shows");
      }
    } catch (err) {
      console.error("AddShow Error:", err);
      toast.error(err.response?.data?.message || "Server error");
    }
  };

  // Add date & time with validation
  const handleQuickFill = () => {
    if (!selectedMovieData) return toast.error("Select a movie first!");
    if (quickFillTimes.length === 0) return toast.error("Add at least one time slot!");
    
    // Fills next 10 days with standard shows per day
    const next10Days = {};
    
    for (let i = 0; i < 10; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        // local timezone string fix
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        next10Days[dateStr] = [...quickFillTimes];
    }
    
    setDateTimeSelection(next10Days);
    toast.success(`Standard schedule applied with ${quickFillTimes.length} shows per day!`);
  };

  const addQuickTime = () => {
    if (!newQuickTime) return toast.error("Enter a time!");
    
    // Add to selected times if not already there
    if (!quickFillTimes.includes(newQuickTime)) {
      setQuickFillTimes([...quickFillTimes, newQuickTime].sort());
    }

    // Add to the grid buttons if not already there
    if (!allTimeSlots.includes(newQuickTime)) {
      setAllTimeSlots([...allTimeSlots, newQuickTime].sort());
    }
    
    setNewQuickTime("");
  };

  const toggleQuickTime = (time) => {
    if (quickFillTimes.includes(time)) {
      setQuickFillTimes(quickFillTimes.filter(t => t !== time));
    } else {
      setQuickFillTimes([...quickFillTimes, time].sort());
    }
  };

  const removeQuickTime = (time) => {
    setQuickFillTimes(quickFillTimes.filter(t => t !== time));
  };

  const removeSlotFromGrid = (slot) => {
    setAllTimeSlots((prev) => prev.filter((s) => s !== slot));
    setQuickFillTimes((prev) => prev.filter((s) => s !== slot));
  };

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return toast.error("Select date & time!");

    const [date, time] = dateTimeInput.split("T");

    if (selectedMovieData) {
      const release = new Date(selectedMovieData.release_date);
      const selectedDT = new Date(`${date}T${time}`);

      if (selectedDT < release) {
        return toast.error(
          `Show cannot be earlier than release date (${selectedMovieData.release_date})`
        );
      }
    }

    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] };
      }
      return prev;
    });
  };

  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const arr = prev[date].filter((t) => t !== time);
      if (arr.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: arr };
    });
  };

  useEffect(() => {
    fetchTopRatedMovies();
  }, []);

  useEffect(() => {
    if (selectedMovie) {
      const movie = moviesList.find((m) => m.id === selectedMovie);
      setSelectedMovieData(movie || null);
    }
  }, [selectedMovie]);

  return (
    <div className="pb-20">
      <Title text1="Add" text2="Shows" />

      {!selectedMovie ? (
        <>
          {/* TMDB Search Bar */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-lg relative" ref={dropdownRef}>
            <div className="relative flex-1">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if(dropdownResults.length > 0) setShowDropdown(true); }}
                placeholder="Search TMDB for any movie (e.g., Pushpa 2, KGF 2)..."
                className="w-full bg-[#1b1c1f] text-gray-100 text-sm border border-gray-600 px-3 py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowDropdown(false);
                    handleSearch();
                  }
                }}
              />
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1b1c1f] border border-gray-600 rounded-md shadow-2xl z-50 max-h-72 overflow-y-auto">
                  {dropdownResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
                  ) : (
                    dropdownResults.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                            setShowDropdown(false);
                            setSearchQuery(m.title);
                            if (!moviesList.find(x => x.id === m.id)) {
                               setMoviesList(prev => [m, ...prev]);
                            }
                            setSelectedMovie(m.id);
                        }}
                        className="p-3 hover:bg-gray-800 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-800 last:border-0"
                      >
                        {m.poster_path ? (
                          <img src={image_base_url + m.poster_path} alt={m.title} className="w-10 h-14 object-cover rounded shadow border border-gray-700" />
                        ) : (
                          <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-500 border border-gray-700">No Pic</div>
                        )}
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-semibold text-gray-200 truncate">{m.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {m.release_date ? m.release_date.substring(0,4) : "Unknown"} • {m.vote_average.toFixed(1)} <StarIcon className="w-3 h-3 text-primary fill-primary inline mb-0.5"/>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                setShowDropdown(false);
                handleSearch();
              }}
              className="bg-primary hover:bg-primary/90 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors whitespace-nowrap"
            >
              Search TMDB
            </button>
          </div>

          {/* Movie list */}
          <div className="mt-10">
            <p className="text-lg font-medium text-white mb-6">
              {isSearching ? "Search Results" : "Top Rated Movies (TMDB)"}
            </p>

            {listLoading ? (
              <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                <p className="text-gray-400 text-sm mt-4">Loading movie suggestions...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
              {moviesList.map((movie) => (
                <div
                  key={movie.id}
                  className={`flex flex-col p-2 bg-gray-800 rounded-xl relative cursor-pointer font-sans transition duration-300 hover:-translate-y-1 w-full max-w-full ${
                    selectedMovie === movie.id ? "ring-2 ring-primary scale-105 bg-gray-700 shadow-xl shadow-primary/10" : ""
                  }`}
                  onClick={() =>
                    setSelectedMovie((prev) =>
                      prev === movie.id ? null : movie.id
                    )
                  }
                >
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={image_base_url + movie.poster_path}
                      alt={movie.title}
                      className="w-full aspect-[2/2.6] object-cover object-center brightness-95"
                    />
                  </div>

                  {selectedMovie === movie.id && (
                    <div className="absolute top-4 right-4 bg-primary h-6 w-6 rounded-full flex items-center justify-center shadow-md">
                      <CheckIcon className="w-4 h-4 text-white stroke-[3px]" />
                    </div>
                  )}

                  <p className="font-semibold mt-2 text-sm sm:text-base truncate">{movie.title}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate">{movie.release_date}</p>
                  
                  <div className="flex items-center justify-between mt-3 pb-1 gap-2 border-t border-gray-700/50 pt-2">
                    <p className="flex items-center gap-1 text-xs font-medium text-gray-300">
                      <StarIcon className="w-4 h-4 text-primary fill-primary" />
                      {movie.vote_average.toFixed(1)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
                      {kConverter(movie.vote_count)} Votes
                    </p>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT: MOVIE POSTER & DETAILS */}
          <div className="w-full lg:w-[30%] flex flex-col items-center lg:items-start animate-in fade-in slide-in-from-left-4">
            <button 
              onClick={() => {
                setSelectedMovie(null);
                setSelectedMovieData(null);
                setDateTimeSelection({});
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-5 w-fit"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Movies
            </button>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 w-full max-w-[280px] bg-gray-900 border border-gray-800">
              {selectedMovieData?.poster_path ? (
                <img
                  src={image_base_url + selectedMovieData.poster_path}
                  alt={selectedMovieData.title}
                  className="w-full aspect-[2/3] object-cover opacity-90"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-500">No Image</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight drop-shadow-md">
                  {selectedMovieData?.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-200">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 text-primary rounded-md border border-primary/20 backdrop-blur-md">
                    <StarIcon className="w-3.5 h-3.5 fill-primary" />
                    {selectedMovieData?.vote_average?.toFixed(1) || "N/A"}
                  </span>
                  <span className="px-2 py-1 bg-white/10 rounded-md border border-white/10 backdrop-blur-md text-xs">
                    {selectedMovieData?.release_date?.substring(0,4) || "Upcoming"}
                  </span>
                  <span className="px-2 py-1 bg-white/10 rounded-md border border-white/10 backdrop-blur-md text-xs text-gray-300">
                    TMDB
                  </span>
                </div>
              </div>
            </div>
            
            {selectedMovieData?.overview && (
              <div className="mt-5 bg-gray-900/50 p-4 rounded-xl border border-gray-800/50 max-w-[280px] w-full">
                <p className="text-sm text-gray-400 leading-relaxed text-justify">
                  {selectedMovieData.overview.length > 200 ? selectedMovieData.overview.substring(0, 200) + "..." : selectedMovieData.overview}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: SCHEDULING FORM */}
          <div className="w-full lg:w-[70%] animate-in fade-in slide-in-from-right-4">
            <div className="bg-[#18191b] border border-gray-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800/80">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Schedule Shows</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Add timings and theater mapping</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Theater */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Theater</label>
                  <div className="relative group">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <select
                      value={selectedTheater}
                      onChange={(e) => setSelectedTheater(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-black/40 text-sm text-gray-200 border border-gray-700 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all cursor-pointer hover:bg-black/60"
                    >
                      <option value="N/A" disabled className="text-gray-500">Select Theater</option>
                      {theaters.map((t, i) => (
                        <option key={i} value={t} className="bg-gray-900 text-gray-200">{t}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Price</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm group-focus-within:text-primary transition-colors">{currency}</span>
                    <input
                      type="number"
                      min={0}
                      value={showPrice}
                      onChange={(e) => setShowPrice(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-black/40 text-sm text-gray-200 border border-gray-700 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all hover:bg-black/60 placeholder:text-gray-600"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-gray-800/80 pt-4">
                 <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Add Date & Time</label>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative group">
                       <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                       <input
                          type="datetime-local"
                          value={dateTimeInput}
                          min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                          onChange={(e) => setDateTimeInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-black/40 text-sm text-gray-200 border border-gray-700 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all hover:bg-black/60"
                          style={{ colorScheme: "dark" }}
                       />
                    </div>
                    <button
                      onClick={handleDateTimeAdd}
                      className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <Plus className="w-4 h-4" /> Add Slot
                    </button>
                 </div>
                 <div className="mt-6 pt-4 border-t border-gray-800/80">
                    <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                       <Clock className="w-3.5 h-3.5" /> Time Slots Per Day
                    </label>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-4">
                       {allTimeSlots.map((time) => (
                          <div key={time} className="relative group/slot">
                             <button
                                onClick={() => toggleQuickTime(time)}
                                className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all border ${
                                   quickFillTimes.includes(time)
                                      ? "bg-green-600 border-green-500 text-white shadow-lg shadow-green-600/20"
                                      : "bg-gray-800/40 border-gray-700 text-gray-400 hover:border-gray-500"
                                }`}
                             >
                                {time}
                             </button>
                             <button
                                onClick={(e) => { e.stopPropagation(); removeSlotFromGrid(time); }}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                                title="Remove from grid"
                             >
                                ×
                             </button>
                          </div>
                       ))}
                    </div>

                    {/* Custom Time & Quick Fill Container */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="flex-1 flex gap-2 p-1.5 bg-black/20 rounded-xl border border-gray-800/50">
                        <div className="relative flex-1 group">
                           <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 group-focus-within:text-primary transition-colors" />
                           <input 
                              type="time" 
                              value={newQuickTime}
                              onChange={(e) => setNewQuickTime(e.target.value)}
                              className="w-full pl-8 pr-2 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-[11px] text-gray-200 focus:outline-none focus:border-primary transition-all"
                              style={{ colorScheme: "dark" }}
                           />
                        </div>
                        <button 
                           onClick={addQuickTime}
                           className="bg-gray-800 hover:bg-gray-700 text-white text-[9px] font-bold px-3 py-2 rounded-lg transition-all border border-gray-700 whitespace-nowrap"
                        >
                           + Add
                        </button>
                      </div>

                      <button
                         onClick={handleQuickFill}
                         className="flex-1 flex items-center justify-center gap-2 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-4 py-2.5 rounded-xl transition-all shadow-sm"
                      >
                         ✨ Quick Fill (10 Days)
                      </button>
                    </div>
                 </div>
              </div>

              {/* Selected Times Display */}
              {Object.keys(dateTimeSelection).length > 0 && (
                <div className="mt-8 bg-black/30 p-5 rounded-2xl border border-gray-800">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/60">
                    <h4 className="text-sm font-bold text-gray-300">
                      Selected Slots <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full text-[10px] ml-2">{Object.values(dateTimeSelection).flat().length} Total</span>
                    </h4>
                    <button 
                      onClick={() => setDateTimeSelection({})}
                      className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1.5 px-2 py-1 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Clear All
                    </button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(dateTimeSelection).map(([date, times]) => (
                      <div key={date} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-2 hover:bg-gray-900/50 rounded-lg transition-colors">
                        <div className="flex items-center gap-2 w-32 shrink-0 pt-1">
                          <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs font-semibold text-gray-400">{new Date(date).toLocaleDateString("en-GB", { weekday:'short', day:'2-digit', month:'short' })}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {times.map((time) => (
                            <div key={time} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 pl-2.5 pr-1 py-1 rounded-md group hover:bg-primary/20 transition-colors">
                               <span className="text-[11px] font-bold text-primary tracking-wide">{time}</span>
                               <button 
                                 onClick={() => handleRemoveTime(date, time)}
                                 className="text-primary/50 hover:text-red-400 hover:bg-red-500/10 p-0.5 rounded transition"
                                 title="Remove slot"
                               >
                                 <X className="w-3.5 h-3.5" />
                               </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="mt-6 pt-4 border-t border-gray-800/80 flex justify-end">
                <button
                  onClick={handleAddShow}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-8 py-3 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <CheckIcon className="w-4 h-4 stroke-[3px]" />
                  Confirm & Add {Object.values(dateTimeSelection).flat().length} Shows
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddShows;
