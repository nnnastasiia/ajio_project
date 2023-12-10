import { getARGB, grayscale, localMean } from './helpers';

export function threshold(pixels: Uint8ClampedArray, level: number = 0.5) {
  if (level === undefined) {
    level = 0.5;
  }
  const thresh = Math.floor(level * 255);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    let val;
    if (gray >= thresh) {
      val = 255;
    } else {
      val = 0;
    }
    pixels[i] = pixels[i + 1] = pixels[i + 2] = val;
  }
}

export function adaptiveThreshold(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  size: number = 7,
  compensation: number = 7
): void {
  const midSize = Math.floor(size / 2);

  const grayscaled = new Uint8ClampedArray(pixels);
  grayscale(grayscaled, width, height);

  const meanMatrix: Array<number> = localMean(grayscaled, width, height, size);

  const mWidth = width - size + 1;
  const mHeight = height - size + 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = grayscaled[(y * width + x) * 4];

      let mX = x - midSize;
      let mY = y - midSize;

      if (x - midSize < 0) {
        mX = 0;
      } else if (x - midSize >= mWidth) {
        mX = mWidth - 1;
      } else if (y - midSize < 0) {
        mY = 0;
      } else if (y - midSize > mHeight) {
        mY = mHeight - 1;
      }

      const mean = meanMatrix[mY * mWidth + mX];
      const threshold = mean - compensation;

      const offset = (y * width + x) * 4;

      // Update the alpha component based on the threshold
      pixels[offset] = pixel < threshold ? 0 : 255;
      pixels[offset + 1] = pixel < threshold ? 0 : 255;
      pixels[offset + 2] = pixel < threshold ? 0 : 255;

      // pixels[offset + 3] = pixel < threshold ? 0 : 255;
    }
  }
}
