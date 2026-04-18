import Show from "../models/Show.js";
import Booking from "../models/Bookings.js";
import User from "../models/userModel.js";
import Movie from "../models/Movie.js";
import axios from "axios";

// -------------------------------------------
//  CHECK ADMIN
// -------------------------------------------
export const isAdmin = (req, res) => {
  res.json({ success: true, isAdmin: true });
};

// -------------------------------------------
//  DASHBOARD DATA (FIXED + PRICE SUPPORT)
// -------------------------------------------
export const getDashboardData = async (req, res) => {
  try {
    const shows = await Show.find().populate("movie");
    const bookings = await Booking.find();
    const users = await User.find();

    // Correct revenue — exclude cancelled bookings
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (b.isPaid && b.status !== "cancelled" ? (b.amount || 0) : 0),
      0
    );

    // Total bookings = only paid, non-cancelled ones
    const totalBookings = bookings.filter(b => b.isPaid && b.status !== "cancelled").length;

    // Group shows by movie
    const movieMap = new Map();

    shows.forEach(show => {
      if (!show.movie || !show.movie._id) {
        console.log("⚠️ Skipped corrupted show:", show._id);
        return;
      }

      const movieId = show.movie._id.toString();

      if (!movieMap.has(movieId)) {
        movieMap.set(movieId, {
          movie: show.movie,
          upcomingShows: [],
          prices: []   // <-- collect prices per movie
        });
      }

      const movieData = movieMap.get(movieId);

      // Only future shows count as active
      if (new Date(show.showDateTime) >= new Date()) {
        movieData.upcomingShows.push(show.showDateTime);
        movieData.prices.push(show.showPrice);
      }
    });

    // Convert grouped data (add lowest/highest prices)
    const activeShows = Array.from(movieMap.values()).map(item => {
      let lowestPrice = null;
      let highestPrice = null;

      if (item.prices.length > 0) {
        lowestPrice = Math.min(...item.prices);
        highestPrice = Math.max(...item.prices);
      }

      return {
        movie: item.movie,
        upcomingShows: item.upcomingShows,
        lowestPrice,
        highestPrice
      };
    });

    // Chart Data (Daily Bookings and Revenue)
    const chartMap = bookings.reduce((acc, b) => {
      const dateStr = new Date(b.createdAt).toISOString().split("T")[0];
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          ticketsBooked: 0,
          cancelledTickets: 0,
          successRevenue: 0,
          failedRevenue: 0,
        };
      }
      
      const seats = Array.isArray(b.bookedSeats) ? b.bookedSeats.length : 0;

      if (b.status === "cancelled") {
        acc[dateStr].cancelledTickets += seats;
        acc[dateStr].failedRevenue += (b.amount || 0);
      } else if (b.isPaid) {
        acc[dateStr].ticketsBooked += seats;
        acc[dateStr].successRevenue += (b.amount || 0);
      } else {
        // unpaid/pending — count as failed revenue but 0 tickets booked
        acc[dateStr].failedRevenue += (b.amount || 0);
      }

      return acc;
    }, {});

    const chartData = Object.values(chartMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    // For Recent Bookings
    const recentBookings = await Booking.find()
      .populate("user")
      .populate({
        path: "show",
        populate: { path: "movie" }
      })
      .sort({ createdAt: -1 })
      .limit(50); // Get top 50 recent bookings for table

    const dashboardData = {
      totalBookings,
      totalRevenue,
      totalUser: users.length,
      activeShows,
      chartData,
      recentBookings
    };

    return res.status(200).json({ success: true, dashboardData });

  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching dashboard data"
    });
  }
};

// -------------------------------------------
//  LIST SHOWS WITH EARNINGS
// -------------------------------------------
export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find().populate("movie").sort({ showDateTime: 1 }).lean();

    // ─── Single aggregation to get booking counts & earnings per show ───────────
    const bookingStats = await Booking.aggregate([
      { $match: { isPaid: true, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$show",
          totalBookings: { $sum: 1 },
          totalEarnings: { $sum: "$amount" },
        },
      },
    ]);

    // Build a lookup map: showId → { totalBookings, totalEarnings }
    const statsMap = {};
    bookingStats.forEach((s) => {
      statsMap[s._id.toString()] = {
        totalBookings: s.totalBookings,
        totalEarnings: s.totalEarnings,
      };
    });

    // Merge stats into shows
    const showsWithEarnings = shows.map((show) => {
      const stats = statsMap[show._id.toString()] || { totalBookings: 0, totalEarnings: 0 };
      return { ...show, ...stats };
    });

    res.status(200).json({ success: true, shows: showsWithEarnings });

  } catch (err) {
    console.error("Error fetching shows:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// -------------------------------------------
//  LIST ALL BOOKINGS
// -------------------------------------------
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user")
      .populate({
        path: "show",
        populate: { path: "movie" }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });

  } catch (error) {
    console.error("getAllBookings error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------
//  ADD SHOW (THEATER + DATE + TIME)
// -------------------------------------------
export const addShow = async (req, res) => {
  try {
    console.log("🟢 Add show request:", req.body);

    const { movieId, showsInput, showPrice, theater } = req.body;

    if (!theater || theater === "N/A") {
      return res.status(400).json({
        success: false,
        message: "Please select a valid theater.",
      });
    }

    let movie = await Movie.findById(movieId);

    if (!movie) {
      // Fetch from TMDB
      const [details, credits] = await Promise.all([
        axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}`,
          {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
          }
        ),
        axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}/credits`,
          {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
          }
        )
      ]);

      movie = await Movie.create({
        _id: movieId,
        title: details.data.title,
        overview: details.data.overview,
        poster_path: details.data.poster_path,
        backdrop_path: details.data.backdrop_path,
        release_date: details.data.release_date,
        original_language: details.data.original_language,
        tagline: details.data.tagline || "",
        genres: details.data.genres,
        casts: credits.data.cast,
        runtime: details.data.runtime,
        vote_average: details.data.vote_average,
      });
    }

    // Create all shows
    const showsToCreate = [];

    showsInput.forEach(show => {
      show.time.forEach(time => {
        showsToCreate.push({
          movie: movieId,
          theater,
          showDateTime: new Date(`${show.date}T${time}`),
          showPrice,
          occupiedSeats: {}
        });
      });
    });

    await Show.insertMany(showsToCreate);

    res.json({ success: true, message: "Shows added successfully." });

  } catch (error) {
    console.error("Error adding show:", error);
    res.status(500).json({ success: false, message: "Failed to add show." });
  }
};

// -------------------------------------------
// EXTRA → Not used but kept clean
// -------------------------------------------
export const getAllShowsWithEarnings = getAllShows;
