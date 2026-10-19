import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { DefaultSeo } from 'next-seo'
import { MotionConfig } from 'framer-motion'
import '../index.css'
import LoadingScreen from '../components/LoadingScreen'
import { AssetPreloader } from '../utils/assetPreloader'
import { backgroundLoader } from '../utils/backgroundLoader'
import { AssetCache } from '../utils/assetCache'
import { LOADING_CONFIG } from '../config/loading'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { spaceGrotesk, inter } from '../lib/fonts'
import { buildDefaultSeo, getSeoConfig } from '../lib/seo'

// Global state to track if assets are loaded in memory
let globalAssetsLoaded = false;
let globalProjects: any[] = [];
const seoConfig = getSeoConfig()

const ROUTES_WITHOUT_MAIN = ['/admin/editor/[slug]', '/r/[slug]', '/_error']

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
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

  const path = router.asPath.split('?')[0];
  const defaultSeo = buildDefaultSeo(seoConfig, path);
  // Routes without a #main-content landmark get no skip link.
  const hasMainContent = !ROUTES_WITHOUT_MAIN.includes(router.pathname);

  // Skip loading screen entirely
  return (
    // Not a <main>: each page renders its own main landmark (#main-content).
    <div className={`${spaceGrotesk.variable} ${inter.variable}`}>
      {hasMainContent && <a href="#main-content" className="skip-link">Skip to content</a>}
      <DefaultSeo {...defaultSeo} />
      {/* Honour the OS "reduce motion" setting for all framer-motion animations. */}
      <MotionConfig reducedMotion="user">
        <Component {...pageProps} />
      </MotionConfig>
      <Analytics />
      <SpeedInsights />
    </div>
  )
}
