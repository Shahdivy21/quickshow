import React, { useState } from 'react'
import BlurCircle from './BlurCircle'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import toast from 'react-hot-toast'
// import { useNavigate } from 'react-router-dom'
import { useNavigate, useLocation } from 'react-router-dom'

const DateSelect = ({ dateTime, id, selectedDate, setSelectedDate }) => {
  return (
    <div id="dateSelect" className="pt-20">
      <div className="relative p-6 bg-gray-800/40 border border-gray-700 rounded-2xl overflow-hidden">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle top="-100px" right="0px" />

        <p className="text-lg font-semibold mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary rounded-full"></span>
          Choose Date
        </p>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-700 rounded-full transition text-gray-400 hover:text-white">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <div className="flex flex-wrap gap-3 flex-1 justify-center md:justify-start">
            {Object.keys(dateTime).map((date) => {
              const dateObj = new Date(date);
              const isSelected = selectedDate === date;

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center justify-center min-w-[70px] py-3 rounded-xl border transition-all duration-300 active:scale-95
                    ${isSelected 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-primary/50 hover:text-gray-200"}`}
                >
                  <span className="text-xs uppercase font-medium opacity-70">
                    {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="text-xl font-bold">
                    {dateObj.getDate()}
                  </span>
                  <span className="text-xs font-medium">
                    {dateObj.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                </button>
              );
            })}
          </div>

          <button className="p-2 hover:bg-gray-700 rounded-full transition text-gray-400 hover:text-white">
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelect
