import { Img } from ".";

export const zooms = {
  "in-replication": "Zoom In (Replication)",
  "in-interpolation": "Zoom In (Interpolation)",
  "out-exclusion": "Zoom Out (Exclusion)",
  "out-mean": "Zoom Out (Mean)",
} as const;

export type Zoom = keyof typeof zooms;

export type ZoomConfig = {
  amount: number;
};

export async function zoom(
  zoom: Zoom,
  img: Img,
  config: ZoomConfig
): Promise<Img> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  let output: ImageData;
  if (zoom.startsWith("in")) {
    output = ctx!.createImageData(
      Math.round(img.width * config.amount),
      Math.round(img.height * config.amount)
    );
  } else {
    output = ctx!.createImageData(
      Math.round(img.width / config.amount),
      Math.round(img.height / config.amount)
    );
  }

  for (let y = 0; y < output.height; y++) {
    for (let x = 0; x < output.width; x++) {
      const i = y * output.width * 4 + x * 4;

      const pixel = zoomPixel(zoom, img, x, y, config);

      output.data.set(pixel, i);
    }
  }

  const newImg = new Img(
    `zoom-${zoom}_${config.amount}-${img.name}`,
    output.width,
    output.height,
    output.data
  );

  return newImg;
}

function zoomPixel(
  zoom: Zoom,
  img: Img,
  x: number,
  y: number,
  config: ZoomConfig
): Uint8ClampedArray {
  switch (zoom) {
    case "in-replication":
      return zoomInReplicationPixel(img, x, y, config);
    case "in-interpolation":
      return zoomInInterpolationPixel(img, x, y, config);
    case "out-exclusion":
      return zoomOutExclusionPixel(img, x, y, config);
    case "out-mean":
      return zoomOutMeanPixel(img, x, y, config);
    default:
      throw new Error("Not implemented");
  }
}

function zoomInReplicationPixel(
  img: Img,
  x: number,
  y: number,
  config: ZoomConfig
): Uint8ClampedArray {
  const newX = Math.floor(x / config.amount);
  const newY = Math.floor(y / config.amount);

  const newIndex = newY * img.width * 4 + newX * 4;

  return img.pixels.slice(newIndex, newIndex + 4);
}

function zoomInInterpolationPixel(
  img: Img,
  x: number,
  y: number,
  config: ZoomConfig
): Uint8ClampedArray {
  const newX = x / config.amount;
  const newY = y / config.amount;

  let x1 = Math.floor(newX);
  let y1 = Math.floor(newY);
  let x2 = x1 + 1;
  let y2 = y1 + 1;

  let dx = (newX - x1) * config.amount;
  let dy = (newY - y1) * config.amount;

  if (x2 >= img.width) {
    dx += config.amount;
    x2 = x1;
    x1 -= 1;
  }
  if (y2 >= img.height) {
    dy += config.amount;
    y2 = y1;
    y1 -= 1;
  }

  const topLeft = img.pixels.slice(
    y1 * img.width * 4 + x1 * 4,
    y1 * img.width * 4 + x1 * 4 + 4
  );
  const topRight = img.pixels.slice(
    y1 * img.width * 4 + x2 * 4,
    y1 * img.width * 4 + x2 * 4 + 4
  );
  const bottomLeft = img.pixels.slice(
    y2 * img.width * 4 + x1 * 4,
    y2 * img.width * 4 + x1 * 4 + 4
  );
  const bottomRight = img.pixels.slice(
    y2 * img.width * 4 + x2 * 4,
    y2 * img.width * 4 + x2 * 4 + 4
  );

  const pixel = new Uint8ClampedArray(4);

  for (let i = 0; i < 4; i++) {
    const topLine =
      topLeft[i] + ((topRight[i] - topLeft[i]) / config.amount) * dx;

    const bottomLine =
      bottomLeft[i] + ((bottomRight[i] - bottomLeft[i]) / config.amount) * dx;

    pixel[i] = Math.round(
      topLine + ((bottomLine - topLine) / config.amount) * dy
    );
  }

  return pixel;
}

function zoomOutExclusionPixel(
  img: Img,
  x: number,
  y: number,
  config: ZoomConfig
): Uint8ClampedArray {
  const newX = Math.floor(x * config.amount);
  const newY = Math.floor(y * config.amount);

  const newIndex = newY * img.width * 4 + newX * 4;

  return img.pixels.slice(newIndex, newIndex + 4);
}

function zoomOutMeanPixel(
  img: Img,
  x: number,
  y: number,
  config: ZoomConfig
): Uint8ClampedArray {
  // take the mean of the pixels in the square
  const x1 = Math.floor(x * config.amount);
  const y1 = Math.floor(y * config.amount);
  const x2 = Math.floor((x + 1) * config.amount);
  const y2 = Math.floor((y + 1) * config.amount);

  const pixels = [0, 0, 0, 0];

  for (let i = y1; i < y2; i++) {
    for (let j = x1; j < x2; j++) {
      const index = i * img.width * 4 + j * 4;

      pixels[0] += img.pixels[index + 0];
      pixels[1] += img.pixels[index + 1];
      pixels[2] += img.pixels[index + 2];
      pixels[3] += img.pixels[index + 3];
    }
  }

  pixels[0] /= config.amount * config.amount;
  pixels[1] /= config.amount * config.amount;
  pixels[2] /= config.amount * config.amount;
  pixels[3] /= config.amount * config.amount;

  const pixel = new Uint8ClampedArray(4);

  for (let i = 0; i < 4; i++) {
    pixel[i] = Math.round(pixels[i]);
  }

  return pixel;
}
