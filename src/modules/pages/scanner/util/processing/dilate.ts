// from https://github.com/processing/p5.js/blob/main/src/image/filters.js

import { getARGB, setPixels } from './helpers';

// @ts-ignore
export function dilate(pixels, width) {
  let currIdx = 0;
  const maxIdx = pixels.length ? pixels.length / 4 : 0;
  const out = new Int32Array(maxIdx);
  let currRowIdx, maxRowIdx, colOrig, colOut, currLum;

  let idxRight, idxLeft, idxUp, idxDown;
  let colRight, colLeft, colUp, colDown;
  let lumRight, lumLeft, lumUp, lumDown;

  while (currIdx < maxIdx) {
    currRowIdx = currIdx;
    maxRowIdx = currIdx + width;
    while (currIdx < maxRowIdx) {
      colOrig = colOut = getARGB(pixels, currIdx);
      idxLeft = currIdx - 1;
      idxRight = currIdx + 1;
      idxUp = currIdx - width;
      idxDown = currIdx + width;

      if (idxLeft < currRowIdx) {
        idxLeft = currIdx;
      }
      if (idxRight >= maxRowIdx) {
        idxRight = currIdx;
      }
      if (idxUp < 0) {
        idxUp = 0;
      }
      if (idxDown >= maxIdx) {
        idxDown = currIdx;
      }
      colUp = getARGB(pixels, idxUp);
      colLeft = getARGB(pixels, idxLeft);
      colDown = getARGB(pixels, idxDown);
      colRight = getARGB(pixels, idxRight);

      //compute luminance
      currLum =
        77 * ((colOrig >> 16) & 0xff) +
        151 * ((colOrig >> 8) & 0xff) +
        28 * (colOrig & 0xff);
      lumLeft =
        77 * ((colLeft >> 16) & 0xff) +
        151 * ((colLeft >> 8) & 0xff) +
        28 * (colLeft & 0xff);
      lumRight =
        77 * ((colRight >> 16) & 0xff) +
        151 * ((colRight >> 8) & 0xff) +
        28 * (colRight & 0xff);
      lumUp =
        77 * ((colUp >> 16) & 0xff) +
        151 * ((colUp >> 8) & 0xff) +
        28 * (colUp & 0xff);
      lumDown =
        77 * ((colDown >> 16) & 0xff) +
        151 * ((colDown >> 8) & 0xff) +
        28 * (colDown & 0xff);

      if (lumLeft > currLum) {
        colOut = colLeft;
        currLum = lumLeft;
      }
      if (lumRight > currLum) {
        colOut = colRight;
        currLum = lumRight;
      }
      if (lumUp > currLum) {
        colOut = colUp;
        currLum = lumUp;
      }
      if (lumDown > currLum) {
        colOut = colDown;
        currLum = lumDown;
      }
      out[currIdx++] = colOut;
    }
  }
  setPixels(pixels, out);
}
