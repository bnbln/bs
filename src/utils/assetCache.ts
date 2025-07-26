// Asset cache management system
export class AssetCache {
  private static CACHE_KEY = 'benedikt-assets-loaded';
  private static CACHE_VERSION = '1.0';
  private static CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

  // Check if assets are already cached
  static isAssetsCached(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) return false;
      
      const { version, timestamp, loaded } = JSON.parse(cacheData);
      
      // Check if cache is expired
      const now = Date.now();
      const cacheAge = now - timestamp;
      const maxAge = this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
      
      if (cacheAge > maxAge) {
        this.clearCache();
        return false;
      }
      
      // Check version
      if (version !== this.CACHE_VERSION) {
        this.clearCache();
        return false;
      }
      
      return loaded;
    } catch (error) {
      console.warn('Error reading asset cache:', error);
      return false;
    }
  }

  // Mark assets as cached
  static markAssetsCached(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = {
        version: this.CACHE_VERSION,
        timestamp: Date.now(),
        loaded: true
      };
      
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log('Assets marked as cached');
    } catch (error) {
      console.warn('Error saving asset cache:', error);
    }
  }

  // Clear cache
  static clearCache(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.CACHE_KEY);
      
      // Also remove DOM cache container
      const cacheContainer = document.getElementById('asset-cache-container');
      if (cacheContainer) {
        cacheContainer.remove();
      }
      
      console.log('Asset cache cleared');
    } catch (error) {
      console.warn('Error clearing asset cache:', error);
    }
  }

  // Force images to stay in browser cache by creating hidden references
  static maintainImageCache(imageUrls: string[]): void {
    if (typeof window === 'undefined') return;
    
    // Create or get cache container
    let cacheContainer = document.getElementById('asset-cache-container');
    if (!cacheContainer) {
      cacheContainer = document.createElement('div');
      cacheContainer.id = 'asset-cache-container';
      cacheContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
        z-index: -9999;
      `;
      document.body.appendChild(cacheContainer);
    }

    // Clear existing cache images
    cacheContainer.innerHTML = '';

    // Add images to maintain browser cache
    imageUrls.forEach((url, index) => {
      // Only cache a subset to avoid memory issues
      if (index < 50) {
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'width: 1px; height: 1px;';
        img.loading = 'lazy'; // Use lazy loading for cache images
        cacheContainer!.appendChild(img);
      }
    });
    
    console.log(`Maintaining cache for ${Math.min(imageUrls.length, 50)} images`);
  }

  // Preload critical images into browser cache
  static async preloadCriticalImages(imageUrls: string[]): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Only preload first few critical images
    const criticalImages = imageUrls.slice(0, 10);
    
    const promises = criticalImages.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Don't fail on individual image errors
        img.src = url;
      });
    });

    try {
      await Promise.all(promises);
      console.log(`Preloaded ${criticalImages.length} critical images`);
    } catch (error) {
      console.warn('Error preloading critical images:', error);
    }
  }

  // Check if browser has good cache support
  static hasCacheSupport(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      return 'localStorage' in window && 'sessionStorage' in window;
    } catch {
      return false;
    }
  }

  // Get cache info for debugging
  static getCacheInfo(): { isCached: boolean; cacheAge: number; version: string } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) return { isCached: false, cacheAge: 0, version: 'none' };
      
      const { version, timestamp } = JSON.parse(cacheData);
      const cacheAge = Date.now() - timestamp;
      
      return {
        isCached: true,
        cacheAge: Math.round(cacheAge / 1000 / 60), // minutes
        version
      };
    } catch {
      return null;
    }
  }

  // Debug function to manually clear cache (can be called from browser console)
  static debug = {
    clearCache: () => {
      AssetCache.clearCache();
      window.location.reload();
    },
    getCacheInfo: () => AssetCache.getCacheInfo(),
    forceClear: () => {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    }
  };
} 