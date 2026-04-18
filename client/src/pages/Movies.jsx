import React from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { useAuth } from "../context/AuthContext";

const Movies = () => {

  const {shows } = useAuth();


  return shows.length > 0 ? (
    <div className="relative my-24 mb-40 px-4 md:px-8 lg:px-16 xl:px-24 overflow-hidden min-h-[80vh]">

      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="150px" right="0px" />
      <h1 className="text-lg font-medium my-4 text-white">Now Showing</h1>
      <div className="grid gap-3 auto-rows-fr grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {shows.map((movie) => (
          <MovieCard movie={movie} key={movie._id} />
        ))}
      </div>
    </div>
  ) : (
   <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-center">No Movies Available</h1>
    </div>
  );
};

export default Movies;
