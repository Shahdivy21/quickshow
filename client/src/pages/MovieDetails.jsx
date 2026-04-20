import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, PlayCircleIcon, StarIcon, X, MapPin, Clock } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import timeFormate from "../lib/timeFormate";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [show, setShow] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [youMayLike, setYouMayLike] = useState([]);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Fetch movie details
  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/shows/${id}`, { withCredentials: true });
      if (data.success && data.movie) setShow({ movie: data.movie, dateTime: data.dateTime || [] });
      else toast.error("Movie not found");
    } catch (error) {
      console.error("❌ Error fetching show:", error);
      toast.error("Failed to load movie details");
    }
  };

  // Check favorite status
  const checkFavoriteStatus = async () => {
    try {
      const res = await axios.get("/api/favorites", { withCredentials: true });
      if (res.data.success && Array.isArray(res.data.favorites)) {
        const favs = res.data.favorites;
        const movieId = String(show.movie.id || show.movie._id);
        const isFav = favs.some(f => String(f.movieId || f._id || f.id || f) === movieId);
        setIsFavorited(isFav);
      }
    } catch (err) {
      console.error("❌ Error checking favorites:", err);
    }
  };

  // Toggle favorite
  const handleFavoriteClick = async () => {
    if (!show?.movie) return toast.error("Movie data not found");
    const movieId = show.movie.id || show.movie._id;
    try {
      const { data } = await axios.post("/api/favorites/toggle", {
        movieId,
        title: show.movie.title,
        poster_path: show.movie.poster_path,
      }, { withCredentials: true });

      if (data.success) {
        setIsFavorited(prev => !prev);
        toast.success(data.message || "Updated favorites");
      } else toast.error(data.message);
    } catch (err) {
      console.error("❌ Favorite API error:", err);
      toast.error("Failed to toggle favorite");
    }
  };

  // Fetch "You May Like"
  const fetchYouMayLike = async () => {
    try {
      const { data } = await axios.get(`/api/shows/${id}/you-may-like`, { withCredentials: true });
      if (data.success) setYouMayLike(data.movies);
    } catch (err) {
      console.error("❌ Error fetching You May Like movies:", err);
    }
  };

  // Watch Trailer
  const handleWatchTrailer = async () => {
    setTrailerLoading(true);
    try {
      const { data } = await axios.get(`/api/shows/movie/${show.movie.id || show.movie._id}/trailer`);
      if (data.success) {
        setTrailerKey(data.trailerKey);
        setShowModal(true);
      }
    } catch (error) {
      console.error("❌ Error fetching trailer:", error);
      toast.error(error.response?.data?.message || "Trailer not available");
    } finally {
      setTrailerLoading(false);
    }
  };

  useEffect(() => { getShow(); }, [id]);
  
  useEffect(() => {
    if (show?.dateTime) {
      const dates = Object.keys(show.dateTime);
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    }
  }, [show]);
  useEffect(() => { if (show?.movie) checkFavoriteStatus(); }, [show]);
  // useEffect(() => { if (show?.movie) fetchYouMayLike(); }, [show]);

  if (!show) return <Loading />;

  const year = show.movie.release_date?.split?.("-")?.[0] || new Date(show.movie.release_date).getFullYear();

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      {/* Movie Details */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img src={`https://image.tmdb.org/t/p/w500${show.movie.poster_path}`} alt={show.movie.title} className="max-md:mx-auto rounded-xl w-full max-w-[260px] md:max-w-[300px] object-cover"/>
        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary uppercase">{show.movie.original_language}</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">{show.movie.title}</h1>
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary"/>
            {Number(show.movie.vote_average ?? 0).toFixed(1)} User Rating
          </div>
          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">{show.movie.overview}</p>
          <p>{timeFormate(show.movie.runtime)} • {show.movie.genres?.map(g => g.name).join(", ")} • {year}</p>
          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button 
              onClick={handleWatchTrailer}
              disabled={trailerLoading}
              className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {trailerLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Playing...</span>
                </div>
              ) : (
                <>
                  <PlayCircleIcon className="w-5 h-5"/> Watch Trailer
                </>
              )}
            </button>
            <a href="#dateSelect" className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium active:scale-95">Buy Tickets</a>
            <button className="bg-gray-700 p-2.5 rounded-full transition active:scale-95" onClick={handleFavoriteClick} title={isFavorited ? "Remove from favorites" : "Add to favorites"}>
              <Heart className={`w-6 h-5 transition-all ${isFavorited ? "text-red-500 fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Cast */}
      <p className="text-lg font-medium mt-20">Your Favorite Cast</p>
      <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
        <div className="flex items-center gap-4 w-max px-4">
          {show.movie.casts?.length > 0 ? show.movie.casts.slice(0,12).map((cast,index)=>(
            <div key={index} className="flex flex-col items-center text-center">
              <img src={cast.profile_path ? `https://image.tmdb.org/t/p/w200${cast.profile_path}` : "/no-image.jpg"} alt={cast.name} className="rounded-full h-20 md:h-20 aspect-square object-cover"/>
              <p className="font-medium text-xs mt-3">{cast.name}</p>
            </div>
          )) : <p className="text-gray-400 text-sm">No cast information available</p>}
        </div>
      </div>

      {/* Date & Showtime Selection */}
      <div className="mt-16 bg-gray-900/50 rounded-3xl p-6 md:p-10 border border-gray-800">
        <DateSelect 
          dateTime={show.dateTime} 
          id={id} 
          selectedDate={selectedDate} 
          setSelectedDate={setSelectedDate} 
        />

        {selectedDate && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Available Timings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(
                show.dateTime[selectedDate].reduce((acc, curr) => {
                  if (!acc[curr.theater]) acc[curr.theater] = [];
                  acc[curr.theater].push(curr);
                  return acc;
                }, {})
              ).map(([theater, shows]) => (
                <div key={theater} className="p-6 bg-gray-800/40 rounded-2xl border border-gray-700/50 hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {theater}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Premium Experience</p>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-tighter border border-primary/20">
                      Standard
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {shows.map((s) => {
                      const showDateObj = new Date(s.time);
                      const isPastShow = showDateObj.getTime() < Date.now();
                      
                      const timeString = showDateObj.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const handleTimeClick = () => {
                        if (isPastShow) return; // Prevent navigation if somehow clicked
                        const query = new URLSearchParams();
                        query.set("theater", theater);
                        query.set("time", s.time);
                        navigate(`/movies/${id}/${selectedDate}?${query.toString()}`);
                        scrollTo(0, 0);
                      };

                      return (
                        <button
                          key={s.showId}
                          onClick={handleTimeClick}
                          disabled={isPastShow}
                          className={`group flex flex-col items-center gap-1 px-5 py-3 rounded-xl transition-all duration-300 border ${
                            isPastShow 
                              ? "bg-gray-900 border-gray-800 opacity-40 cursor-not-allowed" 
                              : "bg-gray-900 border-gray-700 hover:border-primary hover:bg-primary active:scale-95"
                          }`}
                        >
                          <span className={`text-sm font-bold transition-colors ${
                            isPastShow ? "text-gray-500" : "group-hover:text-white"
                          }`}>
                            {timeString}
                          </span>
                          <span className={`text-[10px] transition-opacity ${
                            isPastShow ? "text-gray-600 hidden" : "opacity-60 group-hover:opacity-100"
                          }`}>
                            ₹{s.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(show.dateTime[selectedDate]).length === 0 && (
              <p className="text-center py-10 text-gray-500 italic">
                No shows available for the selected date.
              </p>
            )}
          </div>
        )}
      </div>

      {/* You May Also Like */}
      <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center">
        {youMayLike.length > 0
          ? youMayLike.map(movie => <MovieCard key={movie._id} movie={movie} />)
          : <p className="text-gray-400 text-sm">No recommendations available.</p>}
      </div>

      {/* Show More Button */}
      <div className="flex justify-center mt-20">
        <button onClick={() => { navigate("/movies"); scrollTo(0,0); }} className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium">
          Show More
        </button>
      </div>
      {/* Trailer Modal */}
      {showModal && trailerKey && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-gray-900/50 hover:bg-gray-800 rounded-full text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Movie Trailer"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
