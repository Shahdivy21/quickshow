import React, { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { ArrowRight, CalendarIcon, ClockIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const HeroSlider = () => {
  const navigate = useNavigate()
  const { shows, showsLoading, image_base_url } = useAuth()

  // Helper to format runtime (tmdb returns minutes)
  const formatRuntime = (minutes) => {
    if (!minutes) return "N/A"
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
  }

  // Handle genres format
  const formatGenres = (genres) => {
    if (!genres || !Array.isArray(genres)) return "Unknown"
    return genres.map(g => g.name || g).join(' • ')
  }

  // Helper to style the last word of the title with primary color
  const renderTitle = (title) => {
    if (!title) return null;
    const words = title.split(' ');
    // If it's just one word, style the whole thing or leave it?
    // Let's color the last word for multi-word titles, or just the word if it's one.
    if (words.length === 1) return <span className="text-white">{title}</span>;
    const lastWord = words.pop();
    return (
      <span className="text-white">
        {words.join(' ')} <span className="text-primary">{lastWord}</span>
      </span>
    );
  }

  if (showsLoading || !shows || shows.length === 0) return null;

  const movies = shows;

  return (
    <>
      <style>
        {`
          .hero-swiper-pagination .swiper-pagination-bullet {
            background-color: #9ca3af;
            opacity: 0.5;
            width: 8px;
            height: 8px;
            transition: all 0.3s ease;
          }
          .hero-swiper-pagination .swiper-pagination-bullet-active {
            background-color: #ef4444; /* Standard primary red/pink color fallback */
            opacity: 1;
            width: 24px;
            border-radius: 8px;
          }
          /* If CSS variable for primary exists, we can use it, but inline class is safer */
          @apply text-primary bg-primary;
        `}
      </style>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation={false} 
        pagination={{ clickable: true, el: '.hero-swiper-pagination' }}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        loop={movies.length > 1}
        className="w-full h-[70vh] sm:h-[80vh] lg:h-[85vh] bg-[#0d0d0f] relative cursor-pointer"
        onClick={(swiper, event) => {
          // If clicking on a button or its children, don't slide
          if (event.target.closest('button')) return;
          
          const { width, left } = swiper.el.getBoundingClientRect();
          const clickX = event.clientX - left;
          
          if (clickX > width / 2) {
            swiper.slideNext();
          } else {
            swiper.slidePrev();
          }
        }}
      >
        {movies.map((movie) => (
          <SwiperSlide key={movie._id || movie.id}>
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Background image */}
              <img
                src={movie.backdrop_path ? image_base_url + movie.backdrop_path : '/placeholder.jpg'}
                alt={movie.title}
                className="absolute inset-0 w-full h-full object-cover object-top sm:object-center opacity-[0.85]"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0f] via-[#0d0d0f]/80 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent"></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-start justify-center gap-4 px-6 sm:px-12 md:px-16 lg:px-24 w-full max-w-7xl mx-auto h-full">
                
                {/* Now Showing Badge */}
                <div className="flex items-center gap-2 mb-2 bg-white/5 border border-white/10 w-fit px-3 py-1.5 rounded-md backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-primary text-xs font-bold tracking-widest uppercase">Now Showing</span>
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight max-w-[90%] sm:max-w-2xl drop-shadow-lg">
                  {renderTitle(movie.title)}
                </h1>

                {/* Info Row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                  {/* Year Pill */}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm font-semibold text-gray-200 backdrop-blur-sm shadow-sm">
                    <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                    <span>{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                  </div>
                  
                  {/* Duration Pill */}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm font-semibold text-gray-200 backdrop-blur-sm shadow-sm">
                    <ClockIcon className="w-3.5 h-3.5 text-primary" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>

                  {/* Divider & Genres */}
                  <span className="hidden sm:inline text-gray-600 font-light mx-1">|</span>
                  <span className="text-gray-300 text-xs sm:text-sm font-medium tracking-wide">
                    {formatGenres(movie.genres)}
                  </span>
                </div>

                {/* Description */}
                <p className="max-w-xl text-gray-300/90 text-xs sm:text-sm leading-relaxed italic drop-shadow-md line-clamp-2 md:line-clamp-4 mt-2">
                  {movie.overview}
                </p>

                {/* Button */}
                <button
                  onClick={() => navigate(`/movies/${movie._id ? movie._id : movie.id}`)}
                  className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold tracking-wide px-6 py-2.5 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/40 text-sm"
                >
                  Get Tickets <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
        {/* Custom Pagination Container */}
        <div className="hero-swiper-pagination absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-1.5"></div>
      </Swiper>
    </>
  )
}

export default HeroSlider