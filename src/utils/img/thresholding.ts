import { Img, coordsInBounds } from ".";

export const thresholdings = {
  global: "Global",
  localMean: "Local (Média)",
  localMedian: "Local (Mediana)",
  localMinMax: "Local (Média Mínimo e Máximo)",
  niblack: "Niblack",
};

export type Thresholding = keyof typeof thresholdings;

export type ThresholdingConfig = {
  global: number;
  windowSize: number;
  k: number;
};

export function threshold(thresholding: Thresholding, img: Img, config: ThresholdingConfig): Img {
  switch (thresholding) {
    case "global":
      return globalThreshold(img, config.global);
    case "localMean":
      return localMeanThreshold(img, config.windowSize);
    case "localMedian":
      return localMedianThreshold(img, config.windowSize);
    case "localMinMax":
      return localMinMaxThreshold(img, config.windowSize);
    case "niblack":
      return niblackThreshold(img, config.windowSize, config.k);
  }
}

function globalThreshold(img: Img, threshold: number): Img {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const gray = (r + g + b) / 3;

    const value = gray > threshold ? 255 : 0;

    output.data[i + 0] = value;
    output.data[i + 1] = value;
    output.data[i + 2] = value;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return new Img(`thresholding-global-${img.name}`, output.width, output.height, output.data);
}

function localMeanThreshold(img: Img, windowSize: number): Img {
  const output = new ImageData(img.width, img.height);

  const halfWindowSize = Math.floor(windowSize / 2);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const gray = (r + g + b) / 3;

    const value = gray > localMean(img, i, halfWindowSize) ? 255 : 0;

    output.data[i + 0] = value;
    output.data[i + 1] = value;
    output.data[i + 2] = value;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return new Img(
    `thresholding-local-mean-${windowSize}-${img.name}`,
    output.width,
    output.height,
    output.data
  );
}

function localMedianThreshold(img: Img, windowSize: number): Img {
  const output = new ImageData(img.width, img.height);

  const halfWindowSize = Math.floor(windowSize / 2);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const gray = (r + g + b) / 3;

    const value = gray > localMedian(img, i, halfWindowSize) ? 255 : 0;

    output.data[i + 0] = value;
    output.data[i + 1] = value;
    output.data[i + 2] = value;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return new Img(
    `thresholding-local-median-${windowSize}-${img.name}`,
    output.width,
    output.height,
    output.data
  );
}

function localMinMaxThreshold(img: Img, windowSize: number): Img {
  const output = new ImageData(img.width, img.height);

  const halfWindowSize = Math.floor(windowSize / 2);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const gray = (r + g + b) / 3;

    const value = gray > localMinMax(img, i, halfWindowSize) ? 255 : 0;

    output.data[i + 0] = value;
    output.data[i + 1] = value;
    output.data[i + 2] = value;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return new Img(
    `thresholding-local-min-max-${windowSize}-${img.name}`,
    output.width,
    output.height,
    output.data
  );
}

function niblackThreshold(img: Img, windowSize: number, k: number): Img {
  const output = new ImageData(img.width, img.height);

  const halfWindowSize = Math.floor(windowSize / 2);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const gray = (r + g + b) / 3;

    const value = gray > niblack(img, i, halfWindowSize, k) ? 255 : 0;

    output.data[i + 0] = value;
    output.data[i + 1] = value;
    output.data[i + 2] = value;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return new Img(
    `thresholding-niblack-${windowSize}-${k}-${img.name}`,
    output.width,
    output.height,
    output.data
  );
}

function localMean(img: Img, i: number, halfWindowSize: number): number {
  const window = [];

  for (let y = -halfWindowSize; y <= halfWindowSize; y++) {
    for (let x = -halfWindowSize; x <= halfWindowSize; x++) {
      if (coordsInBounds(img, i, x, y)) {
        let index = i + x * 4 + y * img.width * 4;

        const r = img.pixels[index + 0];
        const g = img.pixels[index + 1];
        const b = img.pixels[index + 2];

        window.push((r + g + b) / 3);
      }
    }
  }

  return window.reduce((acc, curr) => acc + curr, 0) / window.length;
}

function localMedian(img: Img, i: number, halfWindowSize: number): number {
  const window = [];

  for (let y = -halfWindowSize; y <= halfWindowSize; y++) {
    for (let x = -halfWindowSize; x <= halfWindowSize; x++) {
      if (coordsInBounds(img, i, x, y)) {
        let index = i + x * 4 + y * img.width * 4;

        const r = img.pixels[index + 0];
        const g = img.pixels[index + 1];
        const b = img.pixels[index + 2];

        window.push((r + g + b) / 3);
      }
    }
  }

  window.sort((a, b) => a - b);

  return window[Math.floor(window.length / 2)];
}

function localMinMax(img: Img, i: number, halfWindowSize: number): number {
  const window = [];

  for (let y = -halfWindowSize; y <= halfWindowSize; y++) {
    for (let x = -halfWindowSize; x <= halfWindowSize; x++) {
      if (coordsInBounds(img, i, x, y)) {
        let index = i + x * 4 + y * img.width * 4;

        const r = img.pixels[index + 0];
        const g = img.pixels[index + 1];
        const b = img.pixels[index + 2];

        window.push((r + g + b) / 3);
      }
    }
  }

  return (Math.min(...window) + Math.max(...window)) / 2;
}

function niblack(img: Img, i: number, halfWindowSize: number, k: number): number {
  const window = [];

  for (let y = -halfWindowSize; y <= halfWindowSize; y++) {
    for (let x = -halfWindowSize; x <= halfWindowSize; x++) {
      if (coordsInBounds(img, i, x, y)) {
        let index = i + x * 4 + y * img.width * 4;

        const r = img.pixels[index + 0];
        const g = img.pixels[index + 1];
        const b = img.pixels[index + 2];

        window.push((r + g + b) / 3);
      }
    }
  }

  const mean = window.reduce((acc, curr) => acc + curr, 0) / window.length;
  const std = Math.sqrt(
    window.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / window.length
  );

  return mean + k * std;
}
