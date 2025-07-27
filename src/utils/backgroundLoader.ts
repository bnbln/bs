import { AssetPreloader, Asset } from './assetPreloader';
import { LOADING_CONFIG, getRemainingFrameRange } from '../config/loading';

export class BackgroundLoader {
  private preloader: AssetPreloader;
  private isRunning = false;

  constructor() {
    this.preloader = new AssetPreloader({
      batchSize: LOADING_CONFIG.background.batchSize,
      delayBetweenBatches: LOADING_CONFIG.background.delayBetweenBatches,
      retryAttempts: LOADING_CONFIG.background.retryAttempts,
      retryDelay: LOADING_CONFIG.background.retryDelay,
    });
  }

  // Load remaining animation frames for a specific project
  async loadRemainingFrames(project: any): Promise<void> {
    if (!project.hasAnimation || !project.animationSequence) {
      return;
    }

    // Check if this project uses video scrubbing (has videoPath)
    const useVideoScrubbing = project.animationSequence.videoPath !== undefined;
    
    if (useVideoScrubbing) {
      // For video scrubbing projects, no additional frames to load
      // The video file is already loaded in the initial preload
      console.log(`Project ${project.id} uses video scrubbing - no additional frames needed`);
      return;
    }

    // For legacy image sequence projects, load remaining webp frames
    const { startFrame, endFrame, basePath } = project.animationSequence;
    if (!startFrame || !endFrame || !basePath) {
      return;
    }

    const remainingAssets: Asset[] = [];

    // Load frames that weren't loaded in the initial preload
    const frameRange = getRemainingFrameRange(startFrame, endFrame);
    
    frameRange.forEach(frameNumber => {
      const paddedNumber = frameNumber.toString().padStart(4, '0');
      const imageUrl = basePath + `${paddedNumber}.webp`;
      remainingAssets.push({
        url: imageUrl,
        type: 'animation-frame',
        projectId: project.id
      });
    });

    if (remainingAssets.length === 0) {
      return;
    }

    this.preloader.addAssets(remainingAssets);
    
    try {
      await this.preloader.preloadAll();
      console.log(`Background loaded ${remainingAssets.length} additional frames for project ${project.id}`);
    } catch (error) {
      console.warn('Background loading failed:', error);
    }
  }

  // Load remaining frames for all projects
  async loadAllRemainingFrames(projects: any[]): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const animationProjects = projects.filter(p => p.hasAnimation && p.animationSequence);
      
      for (const project of animationProjects) {
        await this.loadRemainingFrames(project);
        // Small delay between projects
        await new Promise(resolve => setTimeout(resolve, LOADING_CONFIG.background.projectDelay));
      }
    } finally {
      this.isRunning = false;
    }
  }

  // Stop background loading
  stop(): void {
    this.isRunning = false;
  }
}

// Global background loader instance
export const backgroundLoader = new BackgroundLoader(); 