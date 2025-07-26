import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import '../index.css'
import LoadingScreen from '../components/LoadingScreen'
import { AssetPreloader } from '../utils/assetPreloader'
import { backgroundLoader } from '../utils/backgroundLoader'
import { AssetCache } from '../utils/assetCache'
import { LOADING_CONFIG } from '../config/loading'

// Global state to track if assets are loaded in memory
let globalAssetsLoaded = false;
let globalProjects: any[] = [];

export default function App({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [assetsInitialized, setAssetsInitialized] = useState(false);

  // Initialize loading state
  useEffect(() => {
    const initializeApp = async () => {
      // Check if assets are already cached
      const isCached = AssetCache.isAssetsCached();
      
      if (isCached && globalAssetsLoaded) {
        // Assets are both cached and loaded in memory
        setIsLoading(false);
        setAssetsInitialized(true);
        return;
      }

      // Extract projects from pageProps
      if (pageProps.data?.projects) {
        globalProjects = pageProps.data.projects;
        
        if (isCached) {
          // Assets are cached, just need to restore browser cache
          const assets = AssetPreloader.collectAssetsFromProjects(globalProjects);
          const imageUrls = assets
            .filter(asset => asset.type === 'image' || asset.type === 'animation-frame')
            .map(asset => asset.url);
          
          // Preload critical images and maintain cache
          await AssetCache.preloadCriticalImages(imageUrls);
          AssetCache.maintainImageCache(imageUrls);
          
          globalAssetsLoaded = true;
          setIsLoading(false);
          setAssetsInitialized(true);
          
          // Start background loading
          setTimeout(() => {
            backgroundLoader.loadAllRemainingFrames(globalProjects);
          }, LOADING_CONFIG.background.startDelay);
        } else {
          // Need to load assets from scratch
          setIsLoading(true);
          setAssetsInitialized(true);
        }
      } else {
        // No projects data yet, wait for it
        setIsLoading(false);
        setAssetsInitialized(true);
      }
    };

    initializeApp();
  }, [pageProps.data?.projects]);

  const handleLoadingComplete = () => {
    // Mark assets as cached in localStorage
    AssetCache.markAssetsCached();
    
    // Mark as loaded in memory
    globalAssetsLoaded = true;
    setIsLoading(false);
    
    // Maintain browser cache
    const assets = AssetPreloader.collectAssetsFromProjects(globalProjects);
    const imageUrls = assets
      .filter(asset => asset.type === 'image' || asset.type === 'animation-frame')
      .map(asset => asset.url);
    
    AssetCache.maintainImageCache(imageUrls);
    
    // Start background loading
    setTimeout(() => {
      backgroundLoader.loadAllRemainingFrames(globalProjects);
    }, LOADING_CONFIG.background.startDelay);
  };

  // Show loading screen only if we need to load assets and have projects
  if (isLoading && assetsInitialized && globalProjects.length > 0) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} projects={globalProjects} />;
  }

  return <Component {...pageProps} />
} 