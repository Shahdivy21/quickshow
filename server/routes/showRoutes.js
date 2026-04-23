import express from "express";
import {
  addShow,
  getAllShows,
  getNowPlayingMovies,
  getShow,
  getRelatedMovies,
  getShowsByMovieAndDate,
  getLatestMovies,
  getShowById,
  updateShow,
  deleteShow,
  getShowsForAdmin,
  getTopRatedMovies,
  searchMovies,
  getAllShowsGrouped, 
  getTopTrailers,
  getMovieTrailer,
  deleteAllShowsByMovie,
  bulkDeleteShows,
  bulkEditShows,
} from "../controllers/showController.js";

const showRouter = express.Router();

showRouter.get("/now-playing", getNowPlayingMovies);
showRouter.get("/top-rated", getTopRatedMovies);
showRouter.get("/search", searchMovies);
showRouter.post("/add", addShow);
showRouter.get("/top-trailers", getTopTrailers);
showRouter.get("/all", getAllShows);
showRouter.get("/all-grouped", getAllShowsGrouped); 
showRouter.get("/by-date", getShowsByMovieAndDate); //
showRouter.get("/:movieId", getShow);
showRouter.get("/:movieId/related", getRelatedMovies);
// showRouter.get("/latest", getLatestMovies);
showRouter.get("/by-id/:showId", getShowById);
showRouter.put("/update/:showId", updateShow);
showRouter.delete("/delete/:showId", deleteShow);
showRouter.delete("/delete-all/:movieId", deleteAllShowsByMovie);
showRouter.get("/movie/:movieId/shows", getShowsForAdmin);
showRouter.get("/movie/:movieId/trailer", getMovieTrailer);
showRouter.post("/bulk-delete", bulkDeleteShows);
showRouter.put("/bulk-edit", bulkEditShows);


export default showRouter;
