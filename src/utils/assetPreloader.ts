import { LOADING_CONFIG, getInitialFrameRange } from '../config/loading';

export interface Asset {
  url: string;
  type: 'image' | 'video' | 'animation-frame';
  projectId?: number;
}

export interface PreloadProgress {
  loaded: number;
  total: number;
  currentAsset: string;
  progress: number;
}

export interface PreloadOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  onProgress?: (progress: PreloadProgress) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

export class AssetPreloader {
  private assets: Asset[] = [];
  private options: Required<PreloadOptions>;

  constructor(options: PreloadOptions = {}) {
    this.options = {
      batchSize: options.batchSize || LOADING_CONFIG.initial.batchSize,
      delayBetweenBatches: options.delayBetweenBatches || LOADING_CONFIG.initial.delayBetweenBatches,
      onProgress: options.onProgress || (() => {}),
      retryAttempts: options.retryAttempts || LOADING_CONFIG.initial.retryAttempts,
      retryDelay: options.retryDelay || LOADING_CONFIG.initial.retryDelay,
    };
  }

  addAsset(asset: Asset) {
    this.assets.push(asset);
  }

  addAssets(assets: Asset[]) {
    this.assets.push(...assets);
  }

  async preloadAll(): Promise<Asset[]> {
    const loadedAssets: Asset[] = [];
    let processedCount = 0; // Track processed assets (not just successful ones)

    for (let i = 0; i < this.assets.length; i += this.options.batchSize) {
      const batch = this.assets.slice(i, i + this.options.batchSize);
      
      const batchPromises = batch.map(async (asset) => {
        const currentAsset = asset.url.split('/').pop() || '';
        
        try {
          await this.loadAssetWithRetry(asset);
          loadedAssets.push(asset);
        } catch (error) {
          console.warn(`Failed to load ${asset.url}:`, error);
          // Continue loading even if some assets fail
        } finally {
          // Always increment processed count for linear progress
          processedCount++;
          
          this.options.onProgress({
            loaded: processedCount, // Use processed count for linear progress
            total: this.assets.length,
            currentAsset,
            progress: (processedCount / this.assets.length) * 100,
          });
        }
      });
      
      await Promise.all(batchPromises);
      
      // Delay between batches
      if (i + this.options.batchSize < this.assets.length) {
        await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenBatches));
      }
    }

    return loadedAssets;
  }

  private async loadAssetWithRetry(asset: Asset): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        if (asset.type === 'video') {
          await this.loadVideo(asset.url);
        } else {
          await this.loadImage(asset.url);
        }
        return; // Success
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.options.retryAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, this.options.retryDelay * attempt)
          );
        }
      }
    }
    
    throw lastError || new Error(`Failed to load ${asset.url}`);
  }

  private loadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        reject(new Error(`Image load timeout: ${url}`));
      }, LOADING_CONFIG.performance.assetTimeout);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  }

  private loadVideo(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const timeout = setTimeout(() => {
        reject(new Error(`Video load timeout: ${url}`));
      }, LOADING_CONFIG.performance.assetTimeout);
      
      video.onloadeddata = () => {
        clearTimeout(timeout);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load video: ${url}`));
      };
      video.src = url;
      video.load();
    });
  }

  // Static method to collect all assets from projects
  static collectAssetsFromProjects(projects: any[]): Asset[] {
    const assets: Asset[] = [];
    
    projects.forEach(project => {
      // Main project images
      if (project.image) {
        assets.push({
          url: project.image,
          type: 'image',
          projectId: project.id
        });
      }
      
      // Videos
      if (project.video) {
        assets.push({
          url: project.video,
          type: 'video',
          projectId: project.id
        });
      }
      
      // Page Videos
      if (project.pageVideo) {
        assets.push({
          url: project.pageVideo,
          type: 'video',
          projectId: project.id
        });
      }
      
      // Animation sequences - load every Nth frame for faster loading
      if (project.hasAnimation && project.animationSequence) {
        // Check if this project uses video scrubbing (has videoPath)
        const useVideoScrubbing = project.animationSequence.videoPath !== undefined;
        
        if (useVideoScrubbing) {
          // For video scrubbing projects, only load the video file
          assets.push({
            url: project.animationSequence.videoPath,
            type: 'video',
            projectId: project.id
          });
        } else {
          // For legacy image sequence projects, load the webp frames
          const { startFrame, endFrame, basePath } = project.animationSequence;
          if (startFrame !== undefined && endFrame !== undefined && basePath) {
            const frameRange = getInitialFrameRange(startFrame, endFrame);
            
            frameRange.forEach(frameNumber => {
              const paddedNumber = frameNumber.toString().padStart(4, '0');
              const imageUrl = basePath + `${paddedNumber}.webp`;
              assets.push({
                url: imageUrl,
                type: 'animation-frame',
                projectId: project.id
              });
            });
          }
        }
      }
    });
    
    // Add static assets
    const staticAssets = [
      '/assets/heroimage.webp',
      '/assets/locationBackground.svg',
      '/assets/World Icon.svg',
      '/assets/arrow.svg'
    ];
    
    staticAssets.forEach(url => {
      assets.push({
        url,
        type: 'image'
      });
    });
    
    return assets;
  }
} 