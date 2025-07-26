import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetPreloader, PreloadProgress } from '../utils/assetPreloader';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
  projects: any[];
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete, projects }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentAsset, setCurrentAsset] = useState('');
  const [totalAssets, setTotalAssets] = useState(0);
  const [loadedAssets, setLoadedAssets] = useState(0);

  useEffect(() => {
    const preloadAllAssets = async () => {
      // Collect all assets that need to be preloaded
      const assets = AssetPreloader.collectAssetsFromProjects(projects);
      setTotalAssets(assets.length);
      
      // Create preloader with progress callback
      const preloader = new AssetPreloader({
        batchSize: 5,
        delayBetweenBatches: 100,
        retryAttempts: 3,
        retryDelay: 1000,
        onProgress: (progress: PreloadProgress) => {
          // Ensure progress only goes forward and is linear
          const newProgress = Math.min(progress.progress, 100);
          setLoadingProgress(newProgress);
          setCurrentAsset(progress.currentAsset);
          setLoadedAssets(progress.loaded);
        }
      });
      
      // Add all assets and start preloading
      preloader.addAssets(assets);
      
      try {
        await preloader.preloadAll();
        console.log(`Successfully preloaded ${loadedAssets}/${totalAssets} assets`);
      } catch (error) {
        console.warn('Some assets failed to load:', error);
      }
      
      // Ensure we reach 100% when complete
      setLoadingProgress(100);
      
      // Loading complete
      setTimeout(() => {
        onLoadingComplete();
      }, 500); // Small delay for smooth transition
    };
    
    preloadAllAssets();
  }, [projects, onLoadingComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-[#1C1D20] z-50 flex items-center justify-center"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          {/* Logo or Brand */}
          <motion.h1
            className="text-white font-space-grotesk font-bold text-4xl mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Benedikt Schnupp
          </motion.h1>
          
          {/* Loading Bar */}
          <div className="w-80 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ 
                duration: 0.3, 
                ease: "easeOut",
                // Ensure smooth linear progress
                type: "tween"
              }}
            />
          </div>
          
          {/* Progress Text */}
          {/* <motion.p
            className="text-gray-400 font-inter text-sm mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Loading assets... {Math.round(loadingProgress)}%
          </motion.p> */}
          
          {/* Current Asset */}
          {/* {currentAsset && (
            <motion.p
              className="text-gray-500 font-inter text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={currentAsset}
            >
              {currentAsset}
            </motion.p>
          )} */}
          
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingScreen; 