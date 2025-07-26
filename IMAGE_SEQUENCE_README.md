# Image Sequence Animation

This project includes a React component that can display image sequences as scroll-triggered animations, similar to the Apple AirPods Pro hero animation.

## How it works

The image sequence functionality allows you to:
1. Import a series of numbered images (e.g., `book_0099.jpg` to `book_0186.jpg`)
2. Display them as a scroll-triggered animation
3. Preload all images for smooth playback

## Setup

### 1. Prepare your images
Place your image sequence in the `public/` folder with a consistent naming pattern:
```
public/
  your-sequence/
    image_0001.jpg
    image_0002.jpg
    image_0003.jpg
    ...
    image_0100.jpg
```

### 2. Configure the sequence
Update the configuration in `src/utils/imageSequence.ts`:

```typescript
export const getYourSequenceConfig = (): ImageSequenceConfig => ({
  startFrame: 1,        // Starting frame number
  endFrame: 100,        // Ending frame number
  basePath: '/your-sequence/image_',  // Path to your images
  padding: 4,           // Number of digits (0001, 0002, etc.)
  extension: 'jpg'      // File extension
});
```

### 3. Use in your component
```typescript
import { 
  generateImageSequence, 
  preloadImageSequence, 
  getYourSequenceConfig 
} from '../utils/imageSequence';

// In your component:
const config = getYourSequenceConfig();
const images = generateImageSequence(config);
await preloadImageSequence(images);
```

## Current Implementation

The `Work.tsx` component includes a book animation sequence that:
- Loads 88 frames (book_0099.jpg to book_0186.jpg)
- Animates based on scroll position
- Preloads all images for smooth playback
- Shows a loading state while images are being loaded

## Performance Tips

1. **Optimize images**: Compress your images to reduce file size
2. **Use appropriate formats**: JPG for photos, PNG for graphics with transparency
3. **Consider lazy loading**: Only load sequences when they're about to be viewed
4. **Monitor memory usage**: Large sequences can consume significant memory

## Troubleshooting

- **Images not loading**: Check that images are in the `public/` folder and paths are correct
- **Animation not smooth**: Ensure all images are preloaded before starting animation
- **Memory issues**: Consider reducing image quality or implementing progressive loading

## Example Usage

```typescript
// In your project data:
{
  id: 3,
  title: 'Your Animation',
  image: fallbackImage,
  sequence: true // Enable sequence animation
}
```

The component will automatically detect the `sequence: true` property and load the appropriate image sequence. 