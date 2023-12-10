// @ts-ignore
export function invertColors(pixels) {
  for (var i = 0; i < pixels.length; i += 4) {
    pixels[i] = pixels[i] ^ 255; // Invert Red
    pixels[i + 1] = pixels[i + 1] ^ 255; // Invert Green
    pixels[i + 2] = pixels[i + 2] ^ 255; // Invert Blue
  }
}
