import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import BlurCircle from "./BlurCircle";

const getYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:v=|\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const TrailersSection = () => {
  const { API_URL } = useAuth();
  const [trailers, setTrailers] = useState([]);
  const [currentTrailer, setCurrentTrailer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrailers = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/shows/top-trailers`);
        if (data.success && data.trailers.length > 0) {
          setTrailers(data.trailers);
          setCurrentTrailer(data.trailers[0]);
        }
      } catch (err) {
        console.error("Fetch trailers error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrailers();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (trailers.length === 0) return null;

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
      <p className="text-gray-300 font-medium text-lg max-w-[960px] mx-auto">
        Trailers
      </p>

      {/* Main Video */}
      <div className="relative mt-6 max-w-[960px] mx-auto">
        <BlurCircle top="-100px" right="-100px" />

        {/* Video wrapper for 16:9 ratio */}
        <div className="relative pt-[56.25%]">
          {currentTrailer && (
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(currentTrailer.videoUrl)}?rel=0`}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube Trailer"
            ></iframe>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex flex-wrap justify-center gap-4 mt-15 max-w-[960px] mx-auto">
        {trailers.map((trailer, index) => (
          <img
            key={index}
            src={trailer.image}
            alt={trailer.title || `Trailer ${index + 1}`}
            onClick={() => {
              setCurrentTrailer(trailer);
              // Scroll slightly up to the player if on mobile
              // window.scrollTo({ top: document.querySelector('.relative.mt-6').offsetTop - 100, behavior: 'smooth' });
            }}
            className={`w-32 h-20 object-cover rounded-lg cursor-pointer border-2 transition-all duration-300
              ${currentTrailer?.videoUrl === trailer.videoUrl ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
          />
        ))}
      </div>

      {/* Why Choose Us Section */}
      <section className="py-15 mt-15">
        <BlurCircle left="30px" />
        <BlurCircle right="20px" />
        <div className="max-w-6xl mx-auto px-6 md:px-16 lg:px-24 xl:px-44">
          <h2 className="text-3xl font-bold text-primary-400 text-center mb-10">
            Why Choose Us?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="flex flex-col justify-between p-4 bg-gray-800 rounded-2xl hover:translate-y-1 transition duration-300 w-full text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                Easy Booking
              </h3>
              <p className="text-sm text-gray-300">
                Book your favorite movies in just a few clicks with our smooth UI.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col justify-between p-4 bg-gray-800 rounded-2xl hover:translate-y-1 transition duration-300 w-full text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                Latest Releases
              </h3>
              <p className="text-sm text-gray-300">
                Stay updated with the newest blockbusters and showtimes.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col justify-between p-4 bg-gray-800 rounded-2xl hover:translate-y-1 transition duration-300 w-full text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                Secure Payments
              </h3>
              <p className="text-sm text-gray-300">
                All transactions are secure and encrypted for your safety.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TrailersSection;
