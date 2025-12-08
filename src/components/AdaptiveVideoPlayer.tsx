import React, { useState, useEffect, useRef } from 'react';
import CustomVideoPlayer from './CustomVideoPlayer';

interface AdaptiveVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  color: string; // accent color for play button (desktop player passes through)
  autoStart?: boolean; // autoplay on load
  aspect?: string; // tailwind aspect class
  className?: string;
  loop?: boolean;
  muted?: boolean;
  minimal?: boolean; // wenn true: kein UI/Overlay, direkt <video> autoplay muted loop
}

// Lightweight mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      // Both have .matches
      // @ts-ignore
      setIsMobile(e.matches);
    };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
};

const AdaptiveVideoPlayer: React.FC<AdaptiveVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  color,
  autoStart = false,
  aspect = 'aspect-[1298/730.125]',
  className = '',
  loop = false,
  muted = false,
  minimal = false
}) => {
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [showPlayer, setShowPlayer] = useState(autoStart);
  const [shouldPlay, setShouldPlay] = useState(autoStart);

  useEffect(() => { if (autoStart) { setShowPlayer(true); setShouldPlay(true); } }, [autoStart]);

  // Wenn Video sichtbar und abspielen soll -> play() versuchen
  useEffect(() => {
    if (showPlayer && shouldPlay && videoRef.current) {
      const v = videoRef.current;
      const attemptPlay = () => {
        v.play().catch(() => {
          // Falls Ton verhindert: erneut stumm versuchen
          v.muted = true;
          v.play().catch(() => {/* Ignorieren */});
        });
      };
      attemptPlay();
    }
  }, [showPlayer, shouldPlay]);

  if (minimal) {
    return (
      <div className={`relative w-full ${aspect} rounded-[4.5px] overflow-hidden ${className}`}>
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted={true || muted}
          loop={loop}
        />
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className={`relative w-full ${aspect} rounded-[4.5px] overflow-hidden ${className}`}>
        <CustomVideoPlayer
          videoUrl={videoUrl}
          thumbnailUrl={thumbnailUrl}
          color={color}
          startPlaying={autoStart}
        />
      </div>
    );
  }

  const handleClick = () => {
    if (!showPlayer) {
      setShowPlayer(true);
      setShouldPlay(true);
    }
  };

  return (
    <div className={`relative w-full ${aspect} rounded-[4.5px] overflow-hidden ${className}`}>
      {!showPlayer && (
        <button
          type="button"
          aria-label="Play video"
          onClick={handleClick}
          className="absolute inset-0 cursor-pointer group"
          style={thumbnailUrl ? { backgroundImage: `url('${thumbnailUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#000' }}
        >
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)] group-hover:bg-[rgba(0,0,0,0.6)] transition-colors flex items-center justify-center">
            <div
              className="flex items-center justify-center"
              style={{ backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '9999px', padding: '18px' }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill={color}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}
      {showPlayer && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="w-full h-full object-cover"
          controls={!minimal}
          playsInline
          loop={loop}
          muted={muted || shouldPlay}
        />
      )}
    </div>
  );
};

export default AdaptiveVideoPlayer;
