import { Img } from ".";

export const lowPassFilters = {
  mean: "Média",
  median: "Mediana",
  maximum: "Máximo",
  minimum: "Mínimo",
  mode: "Moda",
  kawahara: "Kawahara",
  tomitaTsuji: "Tomita-Tsuji",
  nagaoMatsuyama: "Nagao-Matsuyama",
  somboonkaew: "Somboonkaew",
};

export type LowPassFilter = keyof typeof lowPassFilters;

export type LowPassFilterConfig = {
  halfSize: number;
};

export async function lowPassFilter(
  filter: LowPassFilter,
  img: Img,
  config: LowPassFilterConfig
): Promise<Img> {
  const output = new ImageData(img.width, img.height);

  let fn: (img: Img, i: number, halfSize: number) => [number, number, number];

  switch (filter) {
    case "mean":
      fn = getMean;
      break;
    case "median":
      fn = getMedian;
      break;
    case "maximum":
      fn = getMaximum;
      break;
    case "minimum":
      fn = getMinimum;
      break;
    case "mode":
      fn = getMode;
      break;
    case "kawahara":
      fn = getKawahara;
      break;
    case "tomitaTsuji":
      fn = getTomitaTsuji;
      break;
    case "nagaoMatsuyama":
      fn = getNagaoMatsuyama;
      break;
    case "somboonkaew":
      fn = getSomboonkaew;
      break;
  }

  for (let i = 0; i < img.pixels.length; i += 4) {
    const [r, g, b] = fn(img, i, config.halfSize);

    output.data[i + 0] = r;
    output.data[i + 1] = g;
    output.data[i + 2] = b;
    output.data[i + 3] = 255;
  }

  return new Img(`low-pass-filter-${filter}-${img.name}`, output.width, output.height, output.data);
}

function getMean(img: Img, i: number, halfSize: number): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      const index = i + x * 4 + y * img.width * 4;

      r += img.pixels[index + 0];
      g += img.pixels[index + 1];
      b += img.pixels[index + 2];
    }
  }

  const size = (halfSize * 2 + 1) ** 2;

  r /= size;
  g /= size;
  b /= size;

  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));

  return [r, g, b];
}

function getMedian(img: Img, i: number, halfSize: number): [number, number, number] {
  const values = [];

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      const index = i + x * 4 + y * img.width * 4;

      values.push(img.pixels[index + 0]);
      values.push(img.pixels[index + 1]);
      values.push(img.pixels[index + 2]);
    }
  }

  values.sort((a, b) => a - b);

  const r = values[Math.floor(values.length / 2) * 3 + 0];
  const g = values[Math.floor(values.length / 2) * 3 + 1];
  const b = values[Math.floor(values.length / 2) * 3 + 2];

  return [r, g, b];
}

function getMaximum(img: Img, i: number, halfSize: number): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      const index = i + x * 4 + y * img.width * 4;

      r = Math.max(r, img.pixels[index + 0]);
      g = Math.max(g, img.pixels[index + 1]);
      b = Math.max(b, img.pixels[index + 2]);
    }
  }

  return [r, g, b];
}

function getMinimum(img: Img, i: number, halfSize: number): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      const index = i + x * 4 + y * img.width * 4;

      r = Math.min(r, img.pixels[index + 0]);
      g = Math.min(g, img.pixels[index + 1]);
      b = Math.min(b, img.pixels[index + 2]);
    }
  }

  return [r, g, b];
}

function getMode(img: Img, i: number, halfSize: number): [number, number, number] {
  const values = [];

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      const index = i + x * 4 + y * img.width * 4;

      values.push(img.pixels[index + 0]);
      values.push(img.pixels[index + 1]);
      values.push(img.pixels[index + 2]);
    }
  }

  const counts: Record<number, number> = {};

  for (const value of values) {
    counts[value] = (counts[value] || 0) + 1;
  }

  let maxCount = 0;
  let maxValue = 0;

  for (const value in counts) {
    if (counts[value] > maxCount) {
      maxCount = counts[value];
      maxValue = Number(value);
    }
  }

  const r = maxValue;
  const g = maxValue;
  const b = maxValue;

  return [r, g, b];
}

function getKawahara(img: Img, i: number): [number, number, number] {
  const values = [];

  const halfSize = 2;

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      const index = i + x * 4 + y * img.width * 4;

      values.push(img.pixels[index + 0]);
      values.push(img.pixels[index + 1]);
      values.push(img.pixels[index + 2]);
    }
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;

  const standardDeviation = Math.sqrt(variance);

  const r = Math.max(0, Math.min(255, Math.round(mean + 0.4 * standardDeviation)));

  return [r, r, r];
}

function getTomitaTsuji(img: Img, i: number): [number, number, number] {
  const values = [];

  const halfSize = 2;

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      const index = i + x * 4 + y * img.width * 4;

      values.push(img.pixels[index + 0]);
      values.push(img.pixels[index + 1]);
      values.push(img.pixels[index + 2]);
    }
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;

  const standardDeviation = Math.sqrt(variance);

  const r = Math.max(0, Math.min(255, Math.round(mean + 0.4 * standardDeviation)));

  return [r, r, r];
}

function getNagaoMatsuyama(img: Img, i: number): [number, number, number] {
  const values = [];

  const halfSize = 2;

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      const index = i + x * 4 + y * img.width * 4;

      values.push(img.pixels[index + 0]);
      values.push(img.pixels[index + 1]);
      values.push(img.pixels[index + 2]);

      values.sort((a, b) => a - b);
    }
  }

  const r = values[Math.floor(values.length / 2) * 3 + 0];
  const g = values[Math.floor(values.length / 2) * 3 + 1];
  const b = values[Math.floor(values.length / 2) * 3 + 2];

  return [r, g, b];
}

function getSomboonkaew(img: Img, i: number): [number, number, number] {
  const values = [];

  const halfSize = 2;

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      const index = i + x * 4 + y * img.width * 4;

      values.push(img.pixels[index + 0]);
      values.push(img.pixels[index + 1]);
      values.push(img.pixels[index + 2]);
    }
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;

  const standardDeviation = Math.sqrt(variance);

  const r = Math.max(0, Math.min(255, Math.round(mean + 0.4 * standardDeviation)));

  return [r, r, r];
}
