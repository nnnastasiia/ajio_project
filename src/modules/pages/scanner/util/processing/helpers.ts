export function getARGB(data: Uint8ClampedArray, i: number): number {
  const offset = i * 4;
  return (
    ((data[offset + 3] << 24) & 0xff000000) |
    ((data[offset] << 16) & 0x00ff0000) |
    ((data[offset + 1] << 8) & 0x0000ff00) |
    (data[offset + 2] & 0x000000ff)
  );
}

export function setPixels(pixels: Uint8ClampedArray, data: Int32Array) {
  let offset = 0;
  for (let i = 0, al = pixels.length; i < al; i++) {
    offset = i * 4;
    pixels[offset + 0] = (data[i] & 0x00ff0000) >>> 16;
    pixels[offset + 1] = (data[i] & 0x0000ff00) >>> 8;
    pixels[offset + 2] = data[i] & 0x000000ff;
    pixels[offset + 3] = (data[i] & 0xff000000) >>> 24;
  }
}

export function grayscale(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): void {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const offset = (y * width + x) * 4;
      const gray =
        0.2126 * pixels[offset] +
        0.7152 * pixels[offset + 1] +
        0.0722 * pixels[offset + 2];

      // Update the original pixel values with the grayscale value
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = gray;
    }
  }
}

export function localMean(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  size: number
): Array<number> {
  // I like Shakutori method!
  const rowSumsCol: number[][] = new Array(height);

  for (let y = 0; y < height; y++) {
    const rowSums: number[] = new Array(width).fill(0);

    for (let x = 0; x < size; x++) {
      rowSums[0] += pixels[(y * width + x) * 4];
    }

    for (let xEnd = size; xEnd < width; xEnd++) {
      const xStart = xEnd - size + 1;
      rowSums[xStart] =
        rowSums[xStart - 1] +
        pixels[(y * width + xEnd) * 4] -
        pixels[(y * width + (xStart - 1)) * 4];
    }

    rowSumsCol[y] = rowSums;
  }

  const mWidth = width - size + 1;
  const mHeight = height - size + 1;
  const mean = new Array(mWidth * mHeight).fill(0);

  for (let x = 0; x < mWidth; x++) {
    // Set x, 0
    for (let y = 0; y < size; y++) {
      let prev = mean[x];
      mean[x] = prev + rowSumsCol[y][x];
    }
  }

  for (let x = 0; x < mWidth; x++) {
    for (let y = 1; y < mHeight; y++) {
      mean[x + y * mWidth] =
        mean[x + (y - 1) * mWidth] -
        rowSumsCol[y - 1][x] +
        rowSumsCol[y + size - 1][x];
    }
  }

  // Divide
  for (let i = 0; i < mean.length; i++) {
    mean[i] = Math.floor(mean[i] / (size * size));
  }

  return mean;
}

// export function localMean(
//   pixels: Uint8ClampedArray,
//   width: number,
//   height: number,
//   size: number
// ): Uint8ClampedArray {
//   const rowSumsCol: number[][] = [];

//   for (let y = 0; y < height; y++) {
//     const rowSums: number[] = new Array(width).fill(0);

//     for (let x = 0; x < size; x++) {
//       rowSums[0] += pixels[y * width + x];
//     }

//     for (let xEnd = size; xEnd < width; xEnd++) {
//       const xStart = xEnd - size + 1;
//       rowSums[xStart] =
//         rowSums[xStart - 1] +
//         pixels[y * width + xEnd] -
//         pixels[y * width + xStart - 1];
//     }

//     rowSumsCol[y] = rowSums;
//   }

//   const mWidth = width - size + 1;
//   const mHeight = height - size + 1;
//   const mean: Uint8ClampedArray = new Uint8ClampedArray(
//     mWidth * mHeight * 4
//   ).fill(0);

//   for (let x = 0; x < mWidth; x++) {
//     // Set x, 0
//     for (let y = 0; y < size; y++) {
//       const prev = mean[y * mWidth + x];
//       mean[y * mWidth + x] = prev + rowSumsCol[y][x];
//     }
//   }

//   for (let x = 0; x < mWidth; x++) {
//     for (let y = 1; y < mHeight; y++) {
//       const index = y * mWidth + x;
//       mean[index] =
//         mean[index - mWidth] -
//         rowSumsCol[y - 1][x] +
//         rowSumsCol[y + size - 1][x];
//     }
//   }

//   // Divide
//   for (let x = 0; x < mWidth; x++) {
//     for (let y = 0; y < mHeight; y++) {
//       const index = y * mWidth + x;
//       mean[index] /= size * size;
//     }
//   }

//   return mean;
// }

// function localMean2(
//   pixels: Uint8ClampedArray,
//   width: number,
//   height: number,
//   size: number
// ) {
//   // pixels is expected to be grayscaled
//   // Shakutori method!

//   let rowSumsCol = new Array(height);

//   for (let y = 0; y < height; y++) {
//     let rowSums = new Array(width).fill(0);
//     for (let x = 0; x < size; x++) {
//       rowSums[0] += pixels.get(x, y);
//     }
//     for (let xEnd = size; xEnd < width; xEnd++) {
//       let xStart = xEnd - size + 1;
//       rowSums[xStart] =
//         rowSums[xStart - 1] + pixels.get(xEnd, y) - pixels.get(xStart - 1, y);
//     }
//     rowSumsCol[y] = rowSums;
//   }

//   let mWidth = width - size + 1;
//   let mHeight = height - size + 1;
//   let mean = zeros([mWidth, mHeight]);
//   for (let x = 0; x < mWidth; x++) {
//     // Set x, 0
//     for (let y = 0; y < size; y++) {
//       let prev = mean.get(x, 0);
//       mean.set(x, 0, prev + rowSumsCol[y][x]);
//     }
//   }
//   for (let x = 0; x < mWidth; x++) {
//     for (let y = 1; y < mHeight; y++) {
//       mean.set(
//         x,
//         y,
//         mean.get(x, y - 1) - rowSumsCol[y - 1][x] + rowSumsCol[y + size - 1][x]
//       );
//     }
//   }

//   // Devide
//   for (let x = 0; x < mWidth; x++) {
//     for (let y = 0; y < mHeight; y++) {
//       mean.set(x, y, mean.get(x, y) / (size * size));
//     }
//   }
//   return mean;
// }
