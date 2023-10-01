import { Img } from ".";

export const lowPassFilters = {
  mean: "Média",
  median: "Mediana",
  mode: "Moda",
  minimum: "Mínimo",
  maximum: "Máximo",
  kuwahara: "Kuwahara",
  tomitaTsuji: "Tomita & Tsuji",
  nagaoMatsuyama: "Nagao & Matsuyama",
  somboonkaew: "Somboonkaew",
};

export type LowPassFilter = keyof typeof lowPassFilters;

export type LowPassFilterConfig = {
  matrixSize: number;
};

export function lowPassFilter(filter: LowPassFilter, img: Img, config: LowPassFilterConfig): Img {
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
    case "kuwahara":
      fn = getKuwahara;
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

  const halfSize = Math.floor(config.matrixSize / 2);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const [r, g, b] = fn!(img, i, halfSize);

    output.data[i + 0] = r;
    output.data[i + 1] = g;
    output.data[i + 2] = b;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return new Img(`low-pass-filter-${filter}-${img.name}`, output.width, output.height, output.data);
}

function getMean(img: Img, i: number, halfSize: number): [number, number, number] {
  let v = 0;

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      let index = i + x * 4 + y * img.width * 4;

      if (index < 0) {
        index = 0;
      } else if (index >= img.pixels.length) {
        index = img.pixels.length - 4;
      }

      const r = img.pixels[index + 0];
      const g = img.pixels[index + 1];
      const b = img.pixels[index + 2];

      v += (r + g + b) / 3;
    }
  }

  const size = (halfSize * 2 + 1) ** 2;

  v /= size;

  v = Math.max(0, Math.min(255, Math.round(v)));

  return [v, v, v];
}

function getMedian(img: Img, i: number, halfSize: number): [number, number, number] {
  const values = [];

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      let index = i + x * 4 + y * img.width * 4;

      if (index < 0) {
        index = 0;
      } else if (index >= img.pixels.length) {
        index = img.pixels.length - 4;
      }

      const r = img.pixels[index + 0];
      const g = img.pixels[index + 1];
      const b = img.pixels[index + 2];

      const gray = Math.round((r + g + b) / 3);

      values.push(gray);
    }
  }

  values.sort((a, b) => a - b);

  const v = values[Math.floor(values.length / 2)];

  return [v, v, v];
}

function getMaximum(img: Img, i: number, halfSize: number): [number, number, number] {
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

      r = Math.max(r, img.pixels[index + 0]);
      g = Math.max(g, img.pixels[index + 1]);
      b = Math.max(b, img.pixels[index + 2]);
    }
  }

  return [r, g, b];
}

function getMinimum(img: Img, i: number, halfSize: number): [number, number, number] {
  let r = 255;
  let g = 255;
  let b = 255;

  for (let x = -halfSize; x <= halfSize; x++) {
    for (let y = -halfSize; y <= halfSize; y++) {
      let index = i + x * 4 + y * img.width * 4;

      if (index < 0) {
        index = 0;
      } else if (index >= img.pixels.length) {
        index = img.pixels.length - 4;
      }

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
      let index = i + x * 4 + y * img.width * 4;

      if (index < 0) {
        index = 0;
      } else if (index >= img.pixels.length) {
        index = img.pixels.length - 4;
      }

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

const minimalVariance = (values: number[]): number => {
  let min = values[0];
  let pos = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) {
      min = values[i];
      pos = i;
    }
  }
  return pos;
};

const variance = (values: number[]): number => {
  let sumation = 0;
  const avg = average(values);
  for (let i = 0; i < values.length; i++) {
    sumation += Math.pow(values[i] - avg, 2);
  }
  return sumation / values.length;
};

const average = (values: number[]): number => {
  let sumation = 0;
  for (let i = 0; i < values.length; i++) {
    sumation += values[i];
  }
  return sumation / values.length;
};

function get5x5(img: Img, i: number): Uint8ClampedArray[][] {
  const values = [];
  for (let y = -2; y <= 2; y++) {
    const row = [];
    for (let x = -2; x <= 2; x++) {
      const index = i + y * 4 + x * img.width * 4;
      row.push(img.pixels.slice(index, index + 3));
    }
    values.push(row);
  }
  return values;
}

function applyMasks(matrix: Uint8ClampedArray[][], masks: boolean[][][]): [number, number, number] {
  const results = masks.map(mask => {
    const r = [];
    const g = [];
    const b = [];

    for (let y = 0; y < mask.length; y++) {
      for (let x = 0; x < mask[y].length; x++) {
        if (mask[y][x]) {
          r.push(matrix[y][x][0]);
          g.push(matrix[y][x][1]);
          b.push(matrix[y][x][2]);
        }
      }
    }

    return [r, g, b] as const;
  });

  const variances = results.map(([r, g, b]) => [variance(r), variance(g), variance(b)] as const);

  const minVarianceIndex = minimalVariance(variances.map(([r, g, b]) => r + g + b));

  const [rR, gR, bR] = results[minVarianceIndex];

  const meanR = average(rR);
  const meanG = average(gR);
  const meanB = average(bR);

  const r = Math.max(0, Math.min(255, Math.round(meanR)));
  const g = Math.max(0, Math.min(255, Math.round(meanG)));
  const b = Math.max(0, Math.min(255, Math.round(meanB)));

  return [r, g, b];
}

const kuwaharaMasks = [
  ["11100", "11100", "11100", "00000", "00000"],
  ["00111", "00111", "00111", "00000", "00000"],
  ["00000", "00000", "11100", "11100", "11100"],
  ["00000", "00000", "00111", "00111", "00111"],
].map(mask => mask.map(row => row.split("").map(v => Boolean(Number(v)))));

function getKuwahara(img: Img, i: number): [number, number, number] {
  const matrix = get5x5(img, i);

  return applyMasks(matrix, kuwaharaMasks);
}

const tomitaTsujiMasks = [
  ["11100", "11100", "11100", "00000", "00000"],
  ["00111", "00111", "00111", "00000", "00000"],
  ["00000", "00000", "11100", "11100", "11100"],
  ["00000", "00000", "00111", "00111", "00111"],
  ["00000", "01110", "01110", "01110", "00000"],
].map(mask => mask.map(row => row.split("").map(v => Boolean(Number(v)))));

function getTomitaTsuji(img: Img, i: number): [number, number, number] {
  const matrix = get5x5(img, i);

  return applyMasks(matrix, tomitaTsujiMasks);
}

const nagaoMatsuyamaMasks = [
  ["00000", "01110", "01110", "01110", "00000"],
  ["01110", "01110", "00100", "00000", "00000"],
  ["00000", "00011", "00111", "00011", "00000"],
  ["00000", "00000", "00100", "01110", "01110"],
  ["00000", "11000", "11100", "11000", "00000"],
  ["11000", "11100", "01100", "00000", "00000"],
  ["00011", "00111", "00110", "00000", "00000"],
  ["00000", "00000", "00110", "00111", "00011"],
  ["00000", "00000", "01100", "11100", "11000"],
].map(mask => mask.map(row => row.split("").map(v => Boolean(Number(v)))));

function getNagaoMatsuyama(img: Img, i: number): [number, number, number] {
  const matrix = get5x5(img, i);

  return applyMasks(matrix, nagaoMatsuyamaMasks);
}

const somboonkaewMasks = [
  ["10000", "01010", "00100", "01010", "00001"],
  ["00001", "01010", "00100", "01010", "10000"],
  ["00000", "00100", "11111", "00100", "00000"],
  ["00100", "00100", "01110", "00100", "00100"],
  ["00000", "01110", "00100", "01110", "00000"],
  ["00000", "01010", "01110", "01010", "00000"],
  ["00000", "01100", "01110", "00110", "00000"],
  ["00000", "00110", "01110", "01100", "00000"],
  ["00000", "00100", "01110", "01110", "00000"],
  ["00000", "01100", "01110", "01100", "00000"],
  ["00000", "01110", "01110", "00100", "00000"],
  ["00000", "00110", "01110", "00110", "00000"],
].map(mask => mask.map(row => row.split("").map(v => Boolean(Number(v)))));

function getSomboonkaew(img: Img, i: number): [number, number, number] {
  const matrix = get5x5(img, i);

  return applyMasks(matrix, somboonkaewMasks);
}
