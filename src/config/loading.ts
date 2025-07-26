export const LOADING_CONFIG = {
  // Initial preload settings
  initial: {
    batchSize: 5,
    delayBetweenBatches: 100,
    retryAttempts: 3,
    retryDelay: 1000,
    // Load every Nth frame for initial preload (higher = faster loading)
    frameSkipInterval: 5,
  },
  
  // Background loading settings
  background: {
    batchSize: 3,
    delayBetweenBatches: 200,
    retryAttempts: 2,
    retryDelay: 2000,
    // Delay before starting background loading (ms)
    startDelay: 2000,
    // Delay between loading different projects (ms)
    projectDelay: 500,
  },
  
  // UI settings
  ui: {
    // Minimum loading time to show (ms) - prevents flash for fast connections
    minLoadingTime: 1000,
    // Transition duration for loading screen (ms)
    transitionDuration: 500,
  },
  
  // Performance settings
  performance: {
    // Maximum concurrent connections to avoid overwhelming server
    maxConcurrentConnections: 6,
    // Timeout for individual asset loading (ms)
    assetTimeout: 10000,
  }
};

// Helper function to get frame range for initial preload
export function getInitialFrameRange(startFrame: number, endFrame: number, skipInterval: number = LOADING_CONFIG.initial.frameSkipInterval): number[] {
  const frames: number[] = [];
  for (let i = startFrame; i <= endFrame; i += skipInterval) {
    frames.push(i);
  }
  return frames;
}

// Helper function to get remaining frames for background loading
export function getRemainingFrameRange(startFrame: number, endFrame: number, skipInterval: number = LOADING_CONFIG.initial.frameSkipInterval): number[] {
  const frames: number[] = [];
  for (let i = startFrame; i <= endFrame; i++) {
    if (i % skipInterval !== 0) {
      frames.push(i);
    }
  }
  return frames;
} 