import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { CheckIcon, DeleteIcon, StarIcon, ChevronDown } from "lucide-react";
import { kConverter } from "../../lib/kConverter";
import { useAuth } from "../../context/AuthContext.jsx";
import { toast } from "react-hot-toast";

const AddShows = () => {
  const { axios, image_base_url } = useAuth();
  const currency = import.meta.env.VITE_CURRENCY;

  const [moviesList, setMoviesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedMovieData, setSelectedMovieData] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");
  const [selectedTheater, setSelectedTheater] = useState("N/A");

  const theaters = ["INOX", "PVR", "CINEPOLIS"];

  // Fetch top rated movies
  const fetchTopRatedMovies = async () => {
    try {
      const { data } = await axios.get("/api/shows/top-rated");
      if (data.success) {
        setMoviesList(data.movies);
        setIsSearching(false);
      }
    } catch (error) {
      console.error(error);
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
        toast.success("Show added!");
        setSelectedMovie(null);
        setSelectedMovieData(null);
        setDateTimeSelection({});
        setShowPrice("");
        setDateTimeInput("");
        setSelectedTheater("N/A");
      }
    } catch (err) {
      console.error("AddShow Error:", err);
      toast.error(err.response?.data?.message || "Server error");
    }
  };

  // Add date & time with validation
  const handleQuickFill = () => {
    if (!selectedMovieData) return toast.error("Select a movie first!");
    
    // Fills next 10 days with standard 3 shows per day
    const next10Days = {};
    const standardTimes = ["10:00", "14:00", "19:00"];
    
    for (let i = 0; i < 10; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        next10Days[dateStr] = [...standardTimes];
    }
    
    setDateTimeSelection(next10Days);
    toast.success("Standard schedule applied for 10 days!");
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

  return moviesList.length > 0 ? (
    <>
      <Title text1="Add" text2="Shows" />

      {/* TMDB Search Bar */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search TMDB for any movie (e.g., Pushpa 2, KGF 2)..."
          className="flex-1 bg-[#1b1c1f] text-gray-100 border border-gray-600 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch}
          className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
        >
          Search TMDB
        </button>
      </div>

      {/* Movie list */}
      <div className="mt-10">
        <p className="text-lg font-medium text-white mb-6">
          {isSearching ? "Search Results" : "Top Rated Movies (TMDB)"}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {moviesList.map((movie) => (
            <div
              key={movie.id}
              className={`relative cursor-pointer transition-all duration-300 hover:-translate-y-1 ${selectedMovie === movie.id ? "scale-105" : ""
                }`}
              onClick={() =>
                setSelectedMovie((prev) =>
                  prev === movie.id ? null : movie.id
                )
              }
            >
              <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-lg">
                <img
                  src={image_base_url + movie.poster_path}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover brightness-90"
                />
                <div className="absolute bottom-0 left-0 text-sm flex items-center justify-between p-2 bg-black/70 w-full">
                  <p className="flex items-center gap-1 text-gray-300">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />
                    {movie.vote_average.toFixed(1)}
                  </p>
                  <p className="text-gray-300">
                    {kConverter(movie.vote_count)} Votes
                  </p>
                </div>
              </div>

              {selectedMovie === movie.id && (
                <div className="absolute top-2 right-2 bg-primary h-6 w-6 rounded flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              )}

              <p className="font-medium truncate mt-2">{movie.title}</p>
              <p className="text-gray-500 text-sm">{movie.release_date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="mt-8 pt-8 border-t border-gray-800">
        <label className="block text-sm font-semibold text-gray-200 mb-2">Show Price</label>
        <div className="flex items-center border border-gray-600 bg-[#1b1c1f] w-fit px-3 py-2 rounded-lg gap-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
          <span className="text-gray-500 font-medium">{currency}</span>
          <input
            type="number"
            min={0}
            value={showPrice}
            onChange={(e) => setShowPrice(e.target.value)}
            className="outline-none bg-transparent w-full min-w-[120px] text-gray-100 placeholder-gray-500"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Date & time */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-gray-200 mb-2">Select Date & Time</label>
        <div className="flex flex-col sm:flex-row gap-3 p-1 rounded-lg w-full max-w-md">
          <div className="flex bg-[#1b1c1f] border border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all w-full">
            <input
              type="datetime-local"
              value={dateTimeInput}
              onChange={(e) => setDateTimeInput(e.target.value)}
              className="outline-none px-4 py-3 bg-transparent text-gray-100 w-full"
              style={{ colorScheme: "dark" }}
            />
          </div>
          <button
            onClick={handleDateTimeAdd}
            className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
          >
            Add Time
          </button>
        </div>
      </div>

      {/* Quick Fill Button */}
      <div className="mt-6 flex">
        <button
          onClick={handleQuickFill}
          className="flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary/10 bg-transparent px-6 py-3 font-medium rounded-lg transition-all"
        >
          ✨ Quick Fill Standard Schedule (10 Days)
        </button>
      </div>

      {/* Theater Dropdown */}
      <div className="mt-8">
        <label className="block text-sm font-semibold text-gray-200 mb-2">
          Select Theater
        </label>

        <div className="relative w-full max-w-md">
          <select
            value={selectedTheater}
            onChange={(e) => setSelectedTheater(e.target.value)}
            className="
              w-full px-4 py-3 rounded-lg 
              bg-[#1b1c1f] text-gray-100 
              border border-gray-600 
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
              transition-all
              appearance-none
              cursor-pointer
            "
          >
            <option
              value="N/A"
              disabled
              className="bg-[#1b1c1f] text-gray-400"
            >
              Select Theater
            </option>

            {theaters.map((t, i) => (
              <option
                key={i}
                value={t}
                className="bg-[#1b1c1f] text-gray-200 hover:bg-primary"
              >
                {t}
              </option>
            ))}
          </select>

          {/* ▼ Animated Arrow */}
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200"
          />
        </div>
      </div>


      {/* Selected times */}
      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <h2 className="text-lg font-semibold text-gray-200">Selected Date & Time</h2>
            <button 
              onClick={() => setDateTimeSelection({})}
              className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded hover:bg-red-500/20 transition-colors"
            >
              Clear All
            </button>
          </div>
          {Object.entries(dateTimeSelection).map(([date, times]) => (
            <div key={date} className="mt-2">
              <p className="font-medium">{date}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {times.map((time) => (
                  <div
                    key={time}
                    className="border border-primary bg-primary/10 text-primary px-2 py-1 rounded flex items-center"
                  >
                    {time}
                    <DeleteIcon
                      className="ml-2 text-red-500 cursor-pointer"
                      width={15}
                      onClick={() => handleRemoveTime(date, time)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleAddShow}
        className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 mt-8 rounded-lg shadow-md transition-all whitespace-nowrap"
      >
        Add Show
      </button>
    </>
  ) : (
    <Loading />
  );
};

export default AddShows;
