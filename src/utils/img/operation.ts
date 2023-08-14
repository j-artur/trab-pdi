import { Img } from ".";

export const operations = {
  add: "Add",
  subtract: "Subtract",
  multiply: "Multiply",
  divide: "Divide",
  and: "And",
  or: "Or",
  xor: "Xor",
} as const;

export type Operation = keyof typeof operations;

export type OperationConfig = {
  onOutOfRange: "clamp" | "wrap" | "normalize";
};

export async function operate(
  operation: Operation,
  img1: Img,
  img2: Img,
  config: OperationConfig
) {
  // center the smaller image in the bigger one
  if (img1.width !== img2.width || img1.height !== img2.height) {
    const width = Math.max(img1.width, img2.width);
    const height = Math.max(img1.height, img2.height);

    const x1 = Math.floor((width - img1.width) / 2);
    const y1 = Math.floor((height - img1.height) / 2);

    const x2 = Math.floor((width - img2.width) / 2);
    const y2 = Math.floor((height - img2.height) / 2);

    const pixels1 = new Uint8ClampedArray(width * height * 4);
    const pixels2 = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < img1.height; y++) {
      const i = (y + y1) * width * 4 + x1 * 4;
      const j = y * img1.width * 4;

      pixels1.set(img1.pixels.slice(j, j + img1.width * 4), i);
    }

    for (let y = 0; y < img2.height; y++) {
      const i = (y + y2) * width * 4 + x2 * 4;
      const j = y * img2.width * 4;

      pixels2.set(img2.pixels.slice(j, j + img2.width * 4), i);
    }

    img1.pixels = pixels1;
    img1.width = width;
    img1.height = height;

    img2.pixels = pixels2;
    img2.width = width;
    img2.height = height;
  }

  const output = new ImageData(img1.width, img1.height);

  const rawData = new Int16Array(img1.pixels.length);

  for (let i = 0; i < img1.pixels.length; i += 4) {
    rawData[i + 0] = operatePixels(
      operation,
      img1.pixels[i + 0],
      img2.pixels[i + 0]
    );
    rawData[i + 1] = operatePixels(
      operation,
      img1.pixels[i + 1],
      img2.pixels[i + 1]
    );
    rawData[i + 2] = operatePixels(
      operation,
      img1.pixels[i + 2],
      img2.pixels[i + 2]
    );
    rawData[i + 3] = operatePixels(
      "add",
      img1.pixels[i + 3],
      img2.pixels[i + 3]
    );
  }

  if (config.onOutOfRange === "clamp") {
    for (let i = 0; i < img1.pixels.length; i += 4) {
      output.data[i + 0] = Math.max(0, Math.min(255, rawData[i + 0]));
      output.data[i + 1] = Math.max(0, Math.min(255, rawData[i + 1]));
      output.data[i + 2] = Math.max(0, Math.min(255, rawData[i + 2]));
      output.data[i + 3] = Math.max(0, Math.min(255, rawData[i + 3]));
    }
  } else if (config.onOutOfRange === "wrap") {
    for (let i = 0; i < img1.pixels.length; i += 4) {
      output.data[i + 0] = rawData[i + 0] % 255;
      output.data[i + 1] = rawData[i + 1] % 255;
      output.data[i + 2] = rawData[i + 2] % 255;
      output.data[i + 3] = Math.max(0, Math.min(255, rawData[i + 3]));
    }
  } else if (config.onOutOfRange === "normalize") {
    const max = [0, 0, 0];
    const min = [255, 255, 255];

    for (let i = 0; i < img1.pixels.length; i += 4) {
      max[0] = Math.max(max[0], rawData[i + 0]);
      max[1] = Math.max(max[1], rawData[i + 1]);
      max[2] = Math.max(max[2], rawData[i + 2]);

      min[0] = Math.min(min[0], rawData[i + 0]);
      min[1] = Math.min(min[1], rawData[i + 1]);
      min[2] = Math.min(min[2], rawData[i + 2]);
    }

    const range = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];

    for (let i = 0; i < img1.pixels.length; i += 4) {
      output.data[i + 0] = ((rawData[i + 0] - min[0]) / range[0]) * 255;
      output.data[i + 1] = ((rawData[i + 1] - min[1]) / range[1]) * 255;
      output.data[i + 2] = ((rawData[i + 2] - min[2]) / range[2]) * 255;
      output.data[i + 3] = Math.max(0, Math.min(255, rawData[i + 3]));
    }
  }

  const newImg = new Img(
    `${operation}_${config.onOutOfRange}-${img1.name}-${img2.name}`,
    img1.width,
    img1.height,
    output.data
  );

  return newImg;
}

function operatePixels(operation: Operation, pixel1: number, pixel2: number) {
  switch (operation) {
    case "add":
      return pixel1 + pixel2;
    case "subtract":
      return pixel1 - pixel2;
    case "multiply":
      return pixel1 * pixel2;
    case "divide":
      return pixel1 / pixel2;
    case "and":
      return pixel1 & pixel2;
    case "or":
      return pixel1 | pixel2;
    case "xor":
      return pixel1 ^ pixel2;
  }
}
