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

    const sequence = project.animationSequence;
    const useSpritesheetScrubbing = Boolean(
      sequence.spritesheetPath &&
      sequence.spriteCount &&
      sequence.columnCount &&
      sequence.rowCount
    );
    const useVideoScrubbing = sequence.videoPath !== undefined;
    
    if (useSpritesheetScrubbing || useVideoScrubbing) {
      // Spritesheet/video scrubbing projects have no legacy frame backlog to load.
      console.log(`Project ${project.id} uses optimized scrubbing assets - no additional frames needed`);
      return;
    }

    // For legacy image sequence projects, load remaining webp frames
    const { startFrame, endFrame, basePath } = sequence;
    if (startFrame === undefined || endFrame === undefined || !basePath) {
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
