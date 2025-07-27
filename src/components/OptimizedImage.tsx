import React from 'react';

interface OptimizedImageProps {
  webpSrc: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  webpSrc,
  fallbackSrc,
  alt,
  className,
  style,
  onLoad,
  onError
}) => {
  const [useFallback, setUseFallback] = React.useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!useFallback) {
      setUseFallback(true);
    } else if (onError) {
      onError(e);
    }
  };

  return (
    <img
      src={useFallback ? fallbackSrc : webpSrc}
      alt={alt}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={handleError}
    />
  );
};

export default OptimizedImage; 