import { Img } from ".";

export const enhancements = {
  interval: "Intervalo",
  multipleParts: "Por partes",
  binary: "Binário",
  reverse: "Inverso",
  root: "Raiz quadrada",
  square: "Quadrado",
  log: "Logaritmo",
  exponential: "Exponencial",
} as const;

export type Enhancement = keyof typeof enhancements;

export type Interval = {
  min: number;
  max: number;
};

export type EnhancementConfig = {
  interval: Interval;
  multipleParts: { from: Interval; to: Interval }[];
  binary: {
    threshold: number;
  };
};

function getInterval(img: Img) {
  let fMin = 255;
  let fMax = 0;

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const greyscale = (r + g + b) / 3;

    if (greyscale < fMin) {
      fMin = greyscale;
    }

    if (greyscale > fMax) {
      fMax = greyscale;
    }
  }

  return [fMin, fMax];
}

export async function enhance(
  enchancement: Enhancement,
  img: Img,
  config: EnhancementConfig
): Promise<Img> {
  let output: ImageData;

  switch (enchancement) {
    case "interval":
      output = interval(img, config.interval.min, config.interval.max);
      break;
    case "multipleParts":
      output = multipleParts(img, config.multipleParts);
      break;
    case "reverse":
      output = reverse(img);
      break;
    case "binary":
      output = binary(img, config.binary.threshold);
      break;
    case "log":
      output = log(img);
      break;
    case "root":
      output = root(img);
      break;
    case "exponential":
      output = exponential(img);
      break;
    case "square":
      output = square(img);
      break;
  }

  const newImg = new Img(
    `enhancement-${enchancement}-${img.name}`,
    output.width,
    output.height,
    output.data
  );

  return newImg;
}

function interval(img: Img, gMin: number, gMax: number) {
  const output = new ImageData(img.width, img.height);

  const [fMin, fMax] = getInterval(img);

  const a = (gMax - gMin) / (fMax - fMin);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const greyscale = (r + g + b) / 3;

    const newGreyscale = a * (greyscale - fMin) + gMin;

    output.data[i + 0] = newGreyscale;
    output.data[i + 1] = newGreyscale;
    output.data[i + 2] = newGreyscale;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}

function multipleParts(img: Img, parts: EnhancementConfig["multipleParts"]) {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const greyscale = (r + g + b) / 3;

    let newGreyscale = greyscale;

    for (let j = 0; j < parts.length; j++) {
      const part = parts[j];

      if (greyscale >= part.from.min && greyscale <= part.from.max) {
        const a = (part.to.max - part.to.min) / (part.from.max - part.from.min);

        newGreyscale = a * (greyscale - part.from.min) + part.to.min;

        break;
      }
    }

    output.data[i + 0] = newGreyscale;
    output.data[i + 1] = newGreyscale;
    output.data[i + 2] = newGreyscale;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}

function reverse(img: Img) {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const greyscale = (r + g + b) / 3;

    const newGreyscale = 255 - greyscale;

    output.data[i + 0] = newGreyscale;
    output.data[i + 1] = newGreyscale;
    output.data[i + 2] = newGreyscale;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}

function binary(img: Img, threshold: number) {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const greyscale = (r + g + b) / 3;

    const newGreyscale = greyscale >= threshold ? 255 : 0;

    output.data[i + 0] = newGreyscale;
    output.data[i + 1] = newGreyscale;
    output.data[i + 2] = newGreyscale;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}

const LOG_A = 255 / Math.log(256);

function log(img: Img) {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const greyscale = (r + g + b) / 3;

    let newGreyscale = Math.round(LOG_A * Math.log(1 + greyscale));
    newGreyscale = Math.min(newGreyscale, 255);
    newGreyscale = Math.max(newGreyscale, 0);

    output.data[i + 0] = newGreyscale;
    output.data[i + 1] = newGreyscale;
    output.data[i + 2] = newGreyscale;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}

const ROOT_A = 255 / Math.sqrt(255);

function root(img: Img) {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const greyscale = (r + g + b) / 3;

    let newGreyscale = Math.round(ROOT_A * Math.sqrt(greyscale));
    newGreyscale = Math.min(newGreyscale, 255);
    newGreyscale = Math.max(newGreyscale, 0);

    output.data[i + 0] = newGreyscale;
    output.data[i + 1] = newGreyscale;
    output.data[i + 2] = newGreyscale;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}

const EXP_A = 255 / (Math.pow(Math.E, 255) + 1);

function exponential(img: Img) {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const greyscale = (r + g + b) / 3;

    let newGreyscale = Math.round(EXP_A * (Math.pow(Math.E, greyscale) + 1));
    newGreyscale = Math.min(newGreyscale, 255);
    newGreyscale = Math.max(newGreyscale, 0);

    output.data[i + 0] = newGreyscale;
    output.data[i + 1] = newGreyscale;
    output.data[i + 2] = newGreyscale;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}

const SQUARE_A = 1 / 255;

function square(img: Img) {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const greyscale = (r + g + b) / 3;

    let newGreyscale = Math.round(SQUARE_A * Math.pow(greyscale, 2));
    newGreyscale = Math.min(newGreyscale, 255);
    newGreyscale = Math.max(newGreyscale, 0);

    output.data[i + 0] = newGreyscale;
    output.data[i + 1] = newGreyscale;
    output.data[i + 2] = newGreyscale;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}
