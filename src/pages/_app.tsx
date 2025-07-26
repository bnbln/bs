import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import { DefaultSeo } from 'next-seo'
import { defaultSEO } from '../config/seo'
import '../index.css'
import LoadingScreen from '../components/LoadingScreen'
import { AssetPreloader } from '../utils/assetPreloader'
import { backgroundLoader } from '../utils/backgroundLoader'
import { AssetCache } from '../utils/assetCache'
import { LOADING_CONFIG } from '../config/loading'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

// Global state to track if assets are loaded in memory
let globalAssetsLoaded = false;
let globalProjects: any[] = [];

export default function App({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(false); // Disabled loading screen
  const [assetsInitialized, setAssetsInitialized] = useState(false);

  // Initialize loading state
  useEffect(() => {
    const initializeApp = async () => {
      // Extract projects from pageProps
      if (pageProps.data?.projects) {
        globalProjects = pageProps.data.projects;
        
        // Skip loading screen, just start background loading
        globalAssetsLoaded = true;
        setAssetsInitialized(true);
        
        // Start background loading immediately
        setTimeout(() => {
          backgroundLoader.loadAllRemainingFrames(globalProjects);
        }, LOADING_CONFIG.background.startDelay);
      } else {
        setAssetsInitialized(true);
      }
    };

    initializeApp();
  }, [pageProps.data?.projects]);

  const handleLoadingComplete = () => {
    // This function is kept for compatibility but won't be called
    globalAssetsLoaded = true;
    setIsLoading(false);
  };

  // Skip loading screen entirely
  return (
    <>
      <DefaultSeo {...defaultSEO} />
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  )
} 