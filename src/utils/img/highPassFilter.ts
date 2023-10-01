import { Img } from ".";

export const highPassFilters = {
  h1: "h1",
  h2: "h2",
  M1: "M1",
  M2: "M2",
  M3: "M3",
  highBoost: "Alto-reforço",
};

export type HighPassFilter = keyof typeof highPassFilters;

export type HighPassFilterConfig = {
  boostFactor: number;
};

const highPassFilterMasks = {
  h1: [
    [+0, -1, +0],
    [-1, +4, -1],
    [+0, -1, +0],
  ],
  h2: [
    [-1, -1, -1],
    [-1, +8, -1],
    [-1, -1, -1],
  ],
  M1: [
    [-1, -1, -1],
    [-1, +9, -1],
    [-1, -1, -1],
  ],
  M2: [
    [+1, -2, +1],
    [-2, +5, -2],
    [+1, -2, +1],
  ],
  M3: [
    [-1, -1, -1],
    [-1, +5, -1],
    [-1, -1, -1],
  ],
};

export function highPassFilter(
  filter: HighPassFilter,
  img: Img,
  config: HighPassFilterConfig
): Img {
  if (filter === "highBoost") {
    return highBoost(img, config.boostFactor);
  }

  const output = new ImageData(img.width, img.height);

  const mask = highPassFilterMasks[filter];

  const halfSize = Math.floor(mask.length / 2);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const [r, g, b] = getPixel(img, i, mask, halfSize);

    output.data[i + 0] = r;
    output.data[i + 1] = g;
    output.data[i + 2] = b;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return new Img(
    `high-pass-filter-${filter}-${img.name}`,
    output.width,
    output.height,
    output.data
  );
}

function highBoost(img: Img, factor: HighPassFilterConfig["boostFactor"]): Img {
  const output = new ImageData(img.width, img.height);

  const mask = highPassFilterMasks["h2"];

  const halfSize = Math.floor(mask.length / 2);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const [r, g, b] = getPixel(img, i, mask, halfSize);

    const r2 = img.pixels[i + 0] - r;
    const g2 = img.pixels[i + 1] - g;
    const b2 = img.pixels[i + 2] - b;

    output.data[i + 0] = Math.max(0, Math.min(255, Math.round(r2 * factor + r)));
    output.data[i + 1] = Math.max(0, Math.min(255, Math.round(g2 * factor + g)));
    output.data[i + 2] = Math.max(0, Math.min(255, Math.round(b2 * factor + b)));
    output.data[i + 3] = img.pixels[i + 3];
  }

  return new Img(
    `high-pass-filter-highBoost-${img.name}`,
    output.width,
    output.height,
    output.data
  );
}

function getPixel(
  img: Img,
  i: number,
  mask: number[][],
  halfSize: number
): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      let index = i + x * 4 + y * img.width * 4;

      if (index < 0) {
        index = 0;
      } else if (index >= img.pixels.length) {
        index = img.pixels.length - 4;
      }

      const maskValue = mask[x + halfSize][y + halfSize];

      r += img.pixels[index + 0] * maskValue;
      g += img.pixels[index + 1] * maskValue;
      b += img.pixels[index + 2] * maskValue;
    }
  }

  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));

  return [r, g, b];
}
