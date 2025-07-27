import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress } from 'react-icons/fa';
import screenfull from 'screenfull';

interface CustomVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  color?: string;
  startPlaying?: boolean;
}

// Custom slider component for seek and volume
const CustomSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onChangeStart?: () => void;
  onChangeEnd?: (value: number) => void;
  className?: string;
  color?: string;
  'aria-label': string;
}> = ({ 
  value, 
  min, 
  max, 
  step, 
  onChange, 
  onChangeStart, 
  onChangeEnd, 
  className = "", 
  color = "teal",
  'aria-label': ariaLabel 
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.target.value))}
        onMouseDown={onChangeStart}
        onMouseUp={(e: React.MouseEvent<HTMLInputElement>) => onChangeEnd?.(parseFloat((e.target as HTMLInputElement).value))}
        aria-label={ariaLabel}
        className="w-full h-2 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, ${color === 'teal' ? '#319795' : color} 0%, ${color === 'teal' ? '#319795' : color} ${percentage}%, rgba(255,255,255,0.3) ${percentage}%, rgba(255,255,255,0.3) 100%)`
        }}
      />
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 2px rgba(0,0,0,0.6);
        }
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 2px rgba(0,0,0,0.6);
        }
      `}</style>
    </div>
  );
};

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
);

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  color = '#319795',
  startPlaying = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- State for Custom Controls ---
  const [isPlaying, setIsPlaying] = useState(false); // Always start paused
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(screenfull.isEnabled ? screenfull.isFullscreen : false);
  const [showControls, setShowControls] = useState(false);

  // --- Controls Visibility Logic ---
  const hideControls = useCallback(() => {
    if (isPlaying && playedSeconds > 0) {
       setShowControls(false);
    }
  }, [playedSeconds, isPlaying]);

  const displayControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && playedSeconds > 0) {
       controlsTimeoutRef.current = setTimeout(hideControls, 3000);
    }
  }, [hideControls, isPlaying, playedSeconds]);

  // --- Handlers ---
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    if (!isPlaying) {
      displayControls();
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, displayControls]);
  
  const handleVolumeChange = (value: number) => { 
    if (!videoRef.current) return;
    setVolume(value); 
    setIsMuted(value === 0); 
    videoRef.current.volume = value;
    videoRef.current.muted = value === 0;
  };
  
  const handleToggleMute = () => { 
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
    if (newMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };
  
  const handleSeekMouseDown = () => setSeeking(true);
  const handleSeekChange = (value: number) => setPlayedSeconds(value);
  const handleSeekMouseUp = (value: number) => { 
    if (!videoRef.current) return;
    setSeeking(false); 
    videoRef.current.currentTime = value;
  };
  
  const handleTimeUpdate = () => {
    if (!videoRef.current || seeking) return;
    setPlayedSeconds(videoRef.current.currentTime);
  };
  
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsReady(true);
    if (startPlaying) {
      // Auto-play after a short delay to ensure everything is ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().then(() => {
            setIsPlaying(true);
            displayControls();
          }).catch(() => {
            // If autoplay fails, show play button
            setIsPlaying(false);
          });
        }
      }, 100);
    }
  };

  const handleLoadedData = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsReady(true);
  };

  const handleCanPlay = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsReady(true);
  };

  const handleEnded = () => setIsPlaying(false);

  const handleToggleFullscreen = () => {
    if (screenfull.isEnabled && playerWrapperRef.current) {
      screenfull.toggle(playerWrapperRef.current);
    }
  };

  // --- Handler for clicking the main video area ---
  const handleVideoAreaClick = useCallback(() => {
    if (isReady) {
      handlePlayPause();
      displayControls();
    }
  }, [isReady, handlePlayPause, displayControls]);

  // --- Keyboard Listener for Space Bar ---
  useEffect(() => {
    const playerElement = playerWrapperRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement === playerElement && (event.key === ' ' || event.code === 'Space')) {
        event.preventDefault();
        handlePlayPause();
      }
    };

    if (playerElement) {
      playerElement.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (playerElement) {
        playerElement.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [handlePlayPause]);

  // --- Fullscreen Change Listener ---
  useEffect(() => {
    const handleChange = () => {
      if (screenfull.isEnabled) {
        setIsFullscreen(screenfull.isFullscreen);
      }
    };

    if (screenfull.isEnabled) {
      screenfull.on('change', handleChange);
    }

    return () => {
      if (screenfull.isEnabled) {
        screenfull.off('change', handleChange);
      }
    };
  }, []);

  // --- Initialize video properties ---
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // --- Fallback to set ready state if events don't fire ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReady && videoRef.current) {
        setIsReady(true);
        // Also try to get duration again
        if (videoRef.current.duration && videoRef.current.duration > 0) {
          setDuration(videoRef.current.duration);
        }
      }
    }, 2000); // 2 second fallback

    return () => clearTimeout(timer);
  }, [isReady]);

  // --- Additional fallback for duration ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (videoRef.current && duration === 0 && videoRef.current.duration > 0) {
        setDuration(videoRef.current.duration);
      }
    }, 3000); // 3 second fallback for duration

    return () => clearTimeout(timer);
  }, [duration]);

  // --- Helper Function ---
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds === Infinity) {
      return '0:00';
    }
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };



  // --- Render
  return (
    <div
      ref={playerWrapperRef}
      className={`relative w-full bg-black overflow-hidden focus-visible:outline-2 focus-visible:outline-teal-500 ${
        showControls ? 'cursor-default' : 'cursor-none'
      }`}
      onMouseEnter={displayControls}
      onMouseLeave={hideControls}
      onMouseMove={displayControls}
      onClick={handleVideoAreaClick}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        className="w-full aspect-[1298/730.125] object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        onCanPlay={handleCanPlay}
        onLoadStart={() => setIsReady(false)}
        onError={(e: React.SyntheticEvent<HTMLVideoElement, Event>) => console.error('Video error:', e)}
        onEnded={handleEnded}
        playsInline
        preload="metadata"

      />

      {!isReady && (
         <div className="absolute inset-0 flex items-center justify-center z-10">
           <LoadingSpinner />
         </div>
      )}

      {isReady && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button
            aria-label="Play"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handlePlayPause();
            }}
            className="w-16 h-16 rounded-full bg-black bg-opacity-40 backdrop-blur-sm text-white text-2xl flex items-center justify-center hover:bg-white hover:bg-opacity-30 transition-colors duration-200"
          >
            <FaPlay />
          </button>
        </div>
      )}

      {isReady && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-40 backdrop-blur-sm z-20 transition-all duration-300 ease-in-out ${
            showControls 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 translate-y-full pointer-events-none'
          }`}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
             <button
               aria-label={isPlaying ? 'Pause' : 'Play'}
               onClick={handlePlayPause}
               className="text-white hover:bg-white hover:bg-opacity-30 p-2 rounded transition-colors duration-200"
             >
               {isPlaying ? <FaPause /> : <FaPlay />}
             </button>
             
             <CustomSlider
               aria-label="seek-slider"
               value={playedSeconds}
               min={0}
               max={duration}
               step={0.1}
               onChange={handleSeekChange}
               onChangeStart={handleSeekMouseDown}
               onChangeEnd={handleSeekMouseUp}
               className="flex-1 mx-4"
               color={color}
             />
             
             <span className="text-xs text-white min-w-20 text-center">
               {formatTime(playedSeconds)} / {formatTime(duration)}
             </span>
             
             <div className="flex items-center ml-4">
                <button
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  onClick={handleToggleMute}
                  className="text-white hover:bg-white hover:bg-opacity-30 p-2 rounded transition-colors duration-200"
                >
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                
                <CustomSlider
                  aria-label="volume-slider"
                  value={isMuted ? 0 : volume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={handleVolumeChange}
                  className="w-16 ml-2"
                  color={color}
                />
             </div>
             
             {screenfull.isEnabled && (
               <button
                 aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                 onClick={handleToggleFullscreen}
                 className="text-white hover:bg-white hover:bg-opacity-30 p-2 rounded transition-colors duration-200 ml-2"
               >
                 {isFullscreen ? <FaCompress /> : <FaExpand />}
               </button>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomVideoPlayer; 