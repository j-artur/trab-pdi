import { Img } from ".";

export const corrections = {
  gammaCorrection: "Correção Gamma",
  histogramEqualization: "Equalização de Histograma",
};

export type Correction = keyof typeof corrections;

export type CorrectionConfig = {
  gammaFactor: number;
};

export async function correct(type: Correction, img: Img, config: CorrectionConfig) {
  let output: ImageData;

  switch (type) {
    case "gammaCorrection":
      output = gammaCorrection(img, config.gammaFactor);
      break;
    case "histogramEqualization":
      output = histogramEqualization(img);
      break;
  }

  const newImg = new Img(
    `correction-${type}_${img.name}`,
    output.width,
    output.height,
    output.data
  );

  return newImg;
}

function gammaCorrection(img: Img, gammaFactor: number) {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < output.data.length; i += 4) {
    output.data[i + 0] = Math.pow(img.pixels[i + 0] / 255, 1 / gammaFactor) * 255;
    output.data[i + 1] = Math.pow(img.pixels[i + 1] / 255, 1 / gammaFactor) * 255;
    output.data[i + 2] = Math.pow(img.pixels[i + 2] / 255, 1 / gammaFactor) * 255;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}

function histogramEqualization(img: Img) {
  const output = new ImageData(img.width, img.height);
  const histogram = new Array(256).fill(0);
  const cdf = new Array(256).fill(0);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const greyIntensity = (img.pixels[i + 0] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;
    histogram[Math.floor(greyIntensity)]++;
  }

  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
  }

  for (let i = 0; i < output.data.length; i += 4) {
    const greyIntensity = (img.pixels[i + 0] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;
    const newGreyIntensity = (cdf[Math.floor(greyIntensity)] / cdf[255]) * 255;

    output.data[i + 0] = newGreyIntensity;
    output.data[i + 1] = newGreyIntensity;
    output.data[i + 2] = newGreyIntensity;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}

export function generateHistogram(img: Img) {
  const histogram = new Array<number>(256).fill(0);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const greyIntensity = (img.pixels[i + 0] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;
    histogram[Math.floor(greyIntensity)]++;
  }

  return histogram;
}
