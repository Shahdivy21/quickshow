import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

/* =========================================================
   1️⃣ GET NOW PLAYING MOVIES (from TMDB)
========================================================= */
export const getNowPlayingMovies = async (req, res) => {
  try {
    const url =
      "https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1";

    const { data } = await axios.get(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    });

    res.json({ success: true, movies: data.results });
  } catch (err) {
    console.error("TMDB Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Failed to fetch movies" });
  }
};

export const getTopRatedMovies = async (req, res) => {
  try {
    const url = "https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1";
    const { data } = await axios.get(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    });
    res.json({ success: true, movies: data.results });
  } catch (err) {
    console.error("TMDB Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch top rated movies" });
  }
};

export const searchMovies = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json({ success: true, movies: [] });

    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`;
    const { data } = await axios.get(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    });
    res.json({ success: true, movies: data.results });
  } catch (err) {
    console.error("TMDB Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to search movies" });
  }
};

/* =========================================================
   2️⃣ ADD SHOWS FOR A MOVIE (Admin)
========================================================= */

export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice, theater } = req.body;

    // Basic validation
    if (!movieId || !showsInput || !showPrice || !theater) {
      return res.status(400).json({
        success: false,
        message: "movieId, showsInput, showPrice, and theater are required",
      });
    }

    // 1️⃣ Try fetching movie from DB
    let movie = await Movie.findById(movieId);

    // 2️⃣ If movie does NOT exist → fetch from TMDB + save
    if (!movie) {
      try {
        const [movieDetailsRes, creditsRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
            },
          }),
          axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
            },
          }),
        ]);

        const d = movieDetailsRes.data;

        movie = await Movie.create({
          _id: movieId,
          title: d.title,
          overview: d.overview,
          poster_path: d.poster_path,
          backdrop_path: d.backdrop_path,
          release_date: d.release_date,
          original_language: d.original_language,
          tagline: d.tagline || "",
          genres: d.genres,
          casts: creditsRes.data.cast || [],
          runtime: d.runtime,
          vote_average: d.vote_average,
        });
      } catch (err) {
        console.error("TMDB fetch failed:", err.message);
        return res
          .status(404)
          .json({ success: false, message: "Movie not found on TMDB" });
      }
    }

    // 3️⃣ Release date validation
    const releaseDate = new Date(movie.release_date);

    const showsToCreate = [];

    showsInput.forEach(({ date, time }) => {
      time.forEach((t) => {
        const dt = new Date(`${date}T${t}`);

        if (dt < releaseDate) {
          return res.status(400).json({
            success: false,
            message: `Show cannot be before release date (${movie.release_date})`,
          });
        }

        showsToCreate.push({
          movie: movieId,
          theater,
          showDateTime: dt,
          showPrice,
          occupiedSeats: {},
        });
      });
    });

    // 4️⃣ Insert all show entries at once
    await Show.insertMany(showsToCreate);

    res.json({ success: true, message: "Shows added successfully" });
  } catch (error) {
    console.error("❌ Error adding show:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================
   3️⃣ GET ALL SHOWS → UNIQUE MOVIES LIST
========================================================= */
export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find().populate("movie");

    const map = new Map();

    shows.forEach((show) => {
      if (show.movie) {
        map.set(show.movie._id.toString(), show.movie);
      }
    });

    const sortedMovies = [...map.values()].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

    res.json({ success: true, shows: sortedMovies });
  } catch (error) {
    console.error("❌ Error in getAllShows:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllShowsGrouped = async (req, res) => {
  try {
    const shows = await Show.find().populate("movie");

    // Group by movie
    const grouped = {};

    shows.forEach((show) => {
      const movieId = show.movie?._id?.toString();
      if (!movieId) return;

      if (!grouped[movieId]) {
        grouped[movieId] = {
          movie: show.movie,
          shows: []
        };
      }

      grouped[movieId].shows.push({
        showId: show._id,
        time: show.showDateTime,
        theater: show.theater,
        price: show.showPrice
      });
    });

    const sortedGrouped = Object.values(grouped).sort((a, b) => (b.movie?.vote_average || 0) - (a.movie?.vote_average || 0));

    res.json({
      success: true,
      shows: sortedGrouped
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* =========================================================
   4️⃣ GET ALL UPCOMING SHOWS FOR A MOVIE
========================================================= */
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res
        .status(404)
        .json({ success: false, message: "Movie not found" });
    }

    // Filter shows: Today to Today + 9 days (10 days total)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tenDaysLater = new Date(today);
    tenDaysLater.setDate(today.getDate() + 10);

    const shows = await Show.find({ 
      movie: movieId,
      showDateTime: { $gte: today, $lt: tenDaysLater }
    }).sort({
      showDateTime: 1,
    });

    const grouped = {};

    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];

      if (!grouped[date]) grouped[date] = [];

      grouped[date].push({
        showId: show._id,
        time: show.showDateTime,
        theater: show.theater,
        price: show.showPrice,
      });
    });

    res.json({ success: true, movie, dateTime: grouped });
  } catch (error) {
    console.error("❌ Error in getShow:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================
   5️⃣ GET RELATED MOVIES (TMDB)
========================================================= */
export const getRelatedMovies = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!movieId) {
      return res
        .status(400)
        .json({ success: false, message: "movieId required" });
    }

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "TMDb API key not configured",
      });
    }

    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${apiKey}&language=en-US`
    );

    res.json({ success: true, movies: response.data.results || [] });
  } catch (err) {
    console.error("❌ Related movies error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch related movies",
    });
  }
};

/* =========================================================
   6️⃣ GET SHOWS BY MOVIE + DATE (For TheaterList)
========================================================= */
export const getShowsByMovieAndDate = async (req, res) => {
  try {
    const { movie, date } = req.query;

    if (!movie || !date) {
      return res.status(400).json({
        success: false,
        message: "movie & date are required",
      });
    }

    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const shows = await Show.find({
      movie,
      showDateTime: { $gte: start, $lte: end },
    }).populate("movie");

    res.json({ success: true, shows });
  } catch (error) {
    console.error("❌ Error fetching shows:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   7️⃣ GET LATEST MOVIES ADDED BY ADMIN (Releases Page)
========================================================= */
export const getLatestMovies = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 7;

    const movies = await Movie.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, movies });
  } catch (err) {
    console.error("❌ Error fetching latest movies:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.showId).populate("movie"); // just added populatemovie
    if (!show) {
      return res.status(404).json({ success: false, message: "Show not found" });
    }
    res.json({ success: true, show });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// export const updateShow = async (req, res) => {
//   try {
//     const { showDateTime, showPrice, theater } = req.body;

//     const updated = await Show.findByIdAndUpdate(
//       req.params.showId,
//       { showDateTime, showPrice, theater },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ success: false, message: "Show not found" });
//     }

//     return res.json({ success: true, message: "Show updated successfully", updated });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ success: false, message: "Update failed" });
//   }
// };


// export const deleteShow = async (req, res) => {
//   try {
//     const deleted = await Show.findByIdAndDelete(req.params.showId);
    
//     if (!deleted) {
//       return res.status(404).json({ success: false, message: "Show not found" });
//     }

//     res.json({ success: true, message: "Show deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Delete failed" });
//   }
// };

export const updateShow = async (req, res) => {
  try {
    const { showId } = req.params;
    const { showDateTime, showPrice, theater } = req.body;

    const updatedShow = await Show.findByIdAndUpdate(
      showId,
      { showDateTime, showPrice, theater },
      { new: true }
    );

    if (!updatedShow) {
      return res.status(404).json({ success: false, message: "Show not found" });
    }

    res.json({ success: true, show: updatedShow });
  } catch (error) {
    console.error("❌ Update error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteShow = async (req, res) => {
  try {
    const { showId } = req.params;

    const deletedShow = await Show.findByIdAndDelete(showId);

    if (!deletedShow) {
      return res.status(404).json({ success: false, message: "Show not found" });
    }

    res.json({ success: true, message: "Show deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── Delete ALL shows for a movie ────────────────────────────────────────────
export const deleteAllShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const result = await Show.deleteMany({ movie: movieId });
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} show(s) for this movie`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Delete all shows error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getShowsForAdmin = async (req, res) => {
  try {
    const { movieId } = req.params;

    const shows = await Show.find({ movie: movieId }).sort({ showDateTime: 1 });

    res.json({ success: true, shows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch movie shows" });
  }
};
export const getTopTrailers = async (req, res) => {
  try {
    // 1. Get all shows from now onwards
    const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate("movie");

    // 2. Get unique movies from these shows
    const map = new Map();
    shows.forEach((show) => {
      if (show.movie) {
        map.set(show.movie._id.toString(), show.movie);
      }
    });

    // 3. Sort movies by rating (vote_average) descending
    const sortedMovies = [...map.values()].sort(
      (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
    );

    // 4. Fetch trailers for top movies
    const apiKey = process.env.TMDB_API_KEY;
    const topTrailers = [];
    
    // We'll check the top 10 rated movies to find 4 trailers
    const candidates = sortedMovies.slice(0, 10);
    
    const trailerPromises = candidates.map(async (movie) => {
      // Return cached key if exists
      if (movie.trailer_key) {
        return {
          movieId: movie._id,
          title: movie.title,
          image: `https://img.youtube.com/vi/${movie.trailer_key}/maxresdefault.jpg`,
          videoUrl: `https://www.youtube.com/watch?v=${movie.trailer_key}`,
        };
      }

      // Fetch from TMDB if not cached
      try {
        const { data } = await axios.get(
          `https://api.themoviedb.org/3/movie/${movie._id}/videos`,
          {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );

        const trailer =
          data.results.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
          data.results.find((v) => v.site === "YouTube");

        if (trailer) {
          // Cache the key in background
          Movie.findByIdAndUpdate(movie._id, { trailer_key: trailer.key }).exec();
          
          return {
            movieId: movie._id,
            title: movie.title,
            image: `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`,
            videoUrl: `https://www.youtube.com/watch?v=${trailer.key}`,
          };
        }
      } catch (err) {
        console.error(`❌ TMDB error for ${movie._id}:`, err.message);
      }
      return null;
    });

    const results = await Promise.all(trailerPromises);
    
    // Filter out nulls and take the first 4
    const validTrailers = results.filter(t => t !== null).slice(0, 4);

    res.json({ success: true, trailers: validTrailers });
  } catch (error) {
    console.error("❌ getTopTrailers error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const getMovieTrailer = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    // 1. Check database cache first
    const movie = await Movie.findById(movieId);
    if (movie && movie.trailer_key) {
      return res.json({ success: true, trailerKey: movie.trailer_key });
    }

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: "TMDb API key not configured" });
    }

    // 2. Fetch from TMDB
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/videos`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const trailer =
      data.results.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
      data.results.find((v) => v.site === "YouTube");

    if (!trailer) {
      return res.status(404).json({ success: false, message: "Trailer not found" });
    }

    // 3. Cache the trailer key
    await Movie.findByIdAndUpdate(movieId, { trailer_key: trailer.key });

    res.json({ success: true, trailerKey: trailer.key });
  } catch (error) {
    console.error("❌ getMovieTrailer error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
