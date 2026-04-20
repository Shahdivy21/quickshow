import { ArrowRight } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BlurCircle from './BlurCircle';

import MovieCard from './MovieCard';
import { useAuth } from '../context/AuthContext';

const FeaturedSection = () => {
  const navigate = useNavigate();
  const { shows } = useAuth();

  if (!shows || shows.length === 0) return null;

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-24 overflow-hidden mt-10"> 
      <div className="relative flex items-center justify-between pt-10 pb-10">
        <BlurCircle top="0" right="-80px" />
        <p className="text-gray-300 font-medium text-lg">Now Showing</p>
        <button
          onClick={() => navigate('/movies')}
          className="group flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
        >
          View All
          <ArrowRight className="group-hover:translate-x-0.5 transition w-4.5 h-4.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 mt-4">
        {shows.slice(0, 14).map((show) => (
          <MovieCard key={show._id} movie={show} />
        ))}
      </div>

      {shows.length > 14 && (
        <div className="flex justify-center mt-20">
          <button
            onClick={() => {
              navigate('/movies');
              window.scrollTo(0, 0);
            }}
            className="px-10 py-3 text-sm bg-primary hover:bg-primary/90 transition rounded-md font-medium cursor-pointer shadow-lg shadow-primary/10"
          >
            Show More
          </button>
        </div>
      )}
    </div>
  );
};

export default FeaturedSection;
