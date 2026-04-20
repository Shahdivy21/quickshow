import { StarIcon } from "lucide-react";
import React, { use } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import timeFormate from "../lib/timeFormate";
import { useAuth } from "../context/AuthContext";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { search } = useLocation();

  const {image_base_url} = useAuth();

  const today = new Date();
  const releaseDate = new Date(movie.release_date);
  const isComingSoon = releaseDate > today;

  const goToMovie = () => {
    if (isComingSoon) {
      // Redirect to detail page instead of tickets, or show alert
      // alert("This movie is coming soon. Tickets will be available after release.");
      navigate(`/coming-soon/${movie._id}`, { state: { movie } });
      return;
    }

    // Already released movie → go to ticket page
    navigate({ pathname: `/movies/${movie._id}`, search });
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div className="flex flex-col justify-between p-2 bg-gray-800 rounded-xl hover:translate-y-1 transition duration-300 w-full max-w-full">
      <img
        onClick={goToMovie}
        src={ image_base_url+movie.backdrop_path}
        alt={movie.title}
        className="rounded-lg w-full object-cover object-center cursor-pointer aspect-[2/2.6]"
      />

      <p className="font-semibold mt-2 text-sm sm:text-base truncate">
        {movie.title}
      </p>

      <p className="text-xs text-gray-400 mt-1 truncate">
        {releaseDate.getFullYear()} •{" "}
        {Array.isArray(movie.genres)
          ? movie.genres.slice(0, 2).map((g) => g.name).join(" | ")
          : ""}{" "}
        • {timeFormate(movie.runtime)}
      </p>

      <div className="flex items-center justify-between mt-3 pb-2 gap-2">
        {!isComingSoon && (
          <button
            onClick={goToMovie}
            className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
          >
            Tickets
          </button>
        )}

        <p className="flex items-center gap-1 text-xs text-gray-400">
          <StarIcon className="w-4 h-4 text-primary fill-primary" />
          {(movie.vote_average ?? 0).toFixed(1)}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
