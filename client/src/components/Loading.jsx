import React from 'react'

const Loading = () => {
  return (
    <div className='fixed inset-0 z-[9999] flex flex-col justify-center items-center bg-[#0d0d0f]/80 backdrop-blur-md'>
      <div className='relative flex items-center justify-center p-10'>
        {/* Outer pulse */}
        <div className='absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-20'></div>
        
        {/* Spinner */}
        <div className='animate-spin rounded-full h-20 w-20 border-[3px] border-gray-800 border-t-primary shadow-[0_0_15px_rgba(239,68,68,0.3)]'></div>
        
        {/* Center dot */}
        <div className='absolute h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(239,68,68,0.8)]'></div>
      </div>
      
      <p className='mt-6 text-gray-400 font-medium tracking-widest text-xs uppercase animate-pulse select-none'>
        Loading Magic...
      </p>
    </div>
  )
}

export default Loading
