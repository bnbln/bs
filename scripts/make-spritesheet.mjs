#!/usr/bin/env node
/**
 * Generate a WebP spritesheet from numbered frame images in a directory.
 *
 * Usage:
 *   node scripts/make-spritesheet.mjs path/to/frames -w 256
 *   node scripts/make-spritesheet.mjs path/to/frames --height 320
 *   node scripts/make-spritesheet.mjs path/to/frames -w 768 -c 8 -q 92
 *   node scripts/make-spritesheet.mjs path/to/frames -w 384 -n spritesheet-mobile
 *
 * Output:
 *   - spritesheet.webp
 *   - spritesheet.json (spriteCount, columnCount, rowCount, spriteWidth, spriteHeight)
 */
import { access, readdir, rm, writeFile } from 'node:fs/promises';
import { extname, join, parse, resolve } from 'node:path';
import sharp from 'sharp';

const MAX_SPRITESHEET_SIZE = 16383;
const SUPPORTED_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.avif']);

const directoryArg = process.argv[2];

if (!directoryArg) {
  throw new Error('Please provide a frame directory path. Example: node scripts/make-spritesheet.mjs public/assets/book-frames -w 256');
}

const parseIntFlag = (...flags) => {
  for (const flag of flags) {
    const index = process.argv.indexOf(flag);
    if (index > -1) {
      const value = Number.parseInt(process.argv[index + 1], 10);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`Invalid value for ${flag}: ${process.argv[index + 1] ?? '(missing)'}`);
      }
      return value;
    }
  }
  return undefined;
};

const parseStringFlag = (...flags) => {
  for (const flag of flags) {
    const index = process.argv.indexOf(flag);
    if (index > -1) {
      const raw = process.argv[index + 1];
      if (!raw || raw.startsWith('-')) {
        throw new Error(`Missing value for ${flag}`);
      }
      return String(raw);
    }
  }
  return undefined;
};

const framesDirectory = resolve(directoryArg);
const outputBaseNameRaw = parseStringFlag('--name', '-n') || 'spritesheet';
const outputBaseName = outputBaseNameRaw.replace(/\.(webp|json)$/i, '');
const outputImageFileName = `${outputBaseName}.webp`;
const outputMetadataFileName = `${outputBaseName}.json`;
const outputImagePath = join(framesDirectory, outputImageFileName);
const outputMetadataPath = join(framesDirectory, outputMetadataFileName);

const numericOrder = (fileName) => {
  const frameNumber = Number.parseInt(parse(fileName).name, 10);
  return Number.isNaN(frameNumber) ? Number.POSITIVE_INFINITY : frameNumber;
};

console.log(`Generating spritesheet for ${framesDirectory}`);

try {
  await access(outputImagePath);
  await rm(outputImagePath);
  console.log(`Removed existing ${outputImagePath}`);
} catch {
  // no-op
}

let frameFileNames = (await readdir(framesDirectory))
  .filter((fileName) => {
    const extension = extname(fileName).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) return false;
    if (fileName === outputImageFileName) return false;
    if (fileName.toLowerCase().startsWith('spritesheet') && fileName.toLowerCase().endsWith('.webp')) return false;
    return true;
  })
  .sort((a, b) => {
    const aNum = numericOrder(a);
    const bNum = numericOrder(b);
    if (aNum !== bNum) {
      return aNum - bNum;
    }
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

if (frameFileNames.length === 0) {
  throw new Error(`No frame images found in ${framesDirectory}`);
}

const framePaths = frameFileNames.map((fileName) => join(framesDirectory, fileName));
const spriteCount = framePaths.length;

console.log(`Found ${spriteCount} frame(s)`);

let spriteWidth = parseIntFlag('--width', '-w');
let spriteHeight = parseIntFlag('--height', '-h');
const requestedColumns = parseIntFlag('--columns', '-c');
const requestedQuality = parseIntFlag('--quality', '-q');

const firstFrameMetadata = await sharp(framePaths[0]).metadata();
if (!firstFrameMetadata.width || !firstFrameMetadata.height) {
  throw new Error(`Could not read dimensions for ${framePaths[0]}`);
}

if (spriteWidth && !spriteHeight) {
  spriteHeight = Math.floor(firstFrameMetadata.height * (spriteWidth / firstFrameMetadata.width));
} else if (spriteHeight && !spriteWidth) {
  spriteWidth = Math.floor(firstFrameMetadata.width * (spriteHeight / firstFrameMetadata.height));
} else if (!spriteWidth && !spriteHeight) {
  spriteWidth = firstFrameMetadata.width;
  spriteHeight = firstFrameMetadata.height;
}

if (!spriteWidth || !spriteHeight) {
  throw new Error('Unable to resolve sprite width/height');
}

if (requestedQuality && (requestedQuality < 1 || requestedQuality > 100)) {
  throw new Error(`--quality must be between 1 and 100. Received: ${requestedQuality}`);
}
const webpQuality = requestedQuality ?? 90;

if (spriteWidth < 384) {
  console.warn(
    `Warning: sprite width ${spriteWidth}px is very small and may look soft on large cards. Consider -w 640 or -w 768.`
  );
}

const maxColumnsByWidth = Math.max(1, Math.floor(MAX_SPRITESHEET_SIZE / spriteWidth));
const maxRowsByHeight = Math.max(1, Math.floor(MAX_SPRITESHEET_SIZE / spriteHeight));

let columnCount = requestedColumns
  ? Math.min(maxColumnsByWidth, Math.max(1, requestedColumns))
  : Math.min(maxColumnsByWidth, Math.max(1, Math.ceil(Math.sqrt(spriteCount))));
let rowCount = Math.ceil(spriteCount / columnCount);

while (rowCount > maxRowsByHeight && columnCount < maxColumnsByWidth) {
  columnCount += 1;
  rowCount = Math.ceil(spriteCount / columnCount);
}

if (rowCount > maxRowsByHeight) {
  throw new Error(
    `Cannot fit ${spriteCount} frames of ${spriteWidth}x${spriteHeight} within ${MAX_SPRITESHEET_SIZE}x${MAX_SPRITESHEET_SIZE}.`
  );
}

if (!requestedColumns) {
  // Reduce trailing transparent cells without changing row count.
  while (columnCount > 1) {
    const nextColumnCount = columnCount - 1;
    const nextRowCount = Math.ceil(spriteCount / nextColumnCount);
    if (nextRowCount !== rowCount) break;
    columnCount = nextColumnCount;
  }
}

const outputWidth = spriteWidth * columnCount;
const outputHeight = spriteHeight * rowCount;
const totalPixels = outputWidth * outputHeight;

console.log(`Sprite size: ${spriteWidth}x${spriteHeight}`);
console.log(`Sheet grid: ${columnCount} columns x ${rowCount} rows`);
console.log(`Sheet size: ${outputWidth}x${outputHeight}`);
if (outputWidth > 8192 || outputHeight > 8192 || totalPixels > 30_000_000) {
  console.warn(
    `Warning: large spritesheet (${outputWidth}x${outputHeight}, ${(totalPixels / 1_000_000).toFixed(1)}MP). ` +
    'For mobile, generate a smaller variant (e.g. -w 384 -n spritesheet-mobile) and set mobileSpritesheetPath.'
  );
}

const composites = await Promise.all(
  framePaths.map(async (filePath, index) => {
    const column = index % columnCount;
    const row = Math.floor(index / columnCount);
    const input = await sharp(filePath)
      .resize({
        width: spriteWidth,
        height: spriteHeight,
        fit: 'cover',
      })
      .toBuffer();

    return {
      input,
      left: column * spriteWidth,
      top: row * spriteHeight,
    };
  })
);

await sharp({
  create: {
    width: outputWidth,
    height: outputHeight,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composites)
  .webp({ quality: webpQuality, alphaQuality: Math.min(100, webpQuality + 8), effort: 5 })
  .toFile(outputImagePath);

await writeFile(
  outputMetadataPath,
  JSON.stringify(
    {
      spriteCount,
      columnCount,
      rowCount,
      spriteWidth,
      spriteHeight,
      spritesheetFile: outputImageFileName,
    },
    null,
    2
  ) + '\n'
);

console.log(`Spritesheet generated at ${outputImagePath}`);
console.log(`Metadata written to ${outputMetadataPath}`);
