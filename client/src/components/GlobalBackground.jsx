import React from "react";
import { assets } from "../assets/assets";

const GlobalBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#09090B]">
      {/* Cinematic Background Image */}
      <img
        src={assets.auth_bg}
        alt="global background"
        className="w-full h-full object-cover opacity-30 scale-105"
      />
      
      {/* Dark Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#09090B] via-[#09090B]/60 to-[#09090B]" />
      
      {/* Subtle Backdrop Blur */}
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      
      {/* Bottom fade for smoother scrolling experience */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#09090B] via-[#09090B]/20 to-transparent" />
    </div>
  );
};

export default GlobalBackground;
