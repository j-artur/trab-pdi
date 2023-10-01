import { Img } from ".";

export const halftonings = {
  orderedDithering2x2: "Pontilhado Ordenado 2x2",
  orderedDithering3x3: "Pontilhado Ordenado 3x3",
  orderedDithering3x2: "Pontilhado Ordenado 3x2",
  rogers: "Matriz Rogers",
  floydSteinberg: "Matriz Floyd & Steinberg",
  jarvisJudiceNinke: "Matriz Jarvis, Judice & Ninke",
  stucki: "Matriz Stucki",
};

export type Halftoning = keyof typeof halftonings;

const haltoningMasks = {
  orderedDithering2x2: [
    [0, 2],
    [3, 1],
  ],
  orderedDithering3x3: [
    [6, 8, 4],
    [1, 0, 3],
    [5, 2, 7],
  ],
  orderedDithering3x2: [
    [3, 0, 4],
    [5, 2, 1],
  ],
  rogers: [
    [1, 0, 3 / 8],
    [0, 1, 3 / 8],
    [1, 1, 2 / 8],
  ],
  floydSteinberg: [
    [1, 0, 7 / 16],
    [-1, 1, 3 / 16],
    [0, 1, 5 / 16],
    [1, 1, 1 / 16],
  ],
  jarvisJudiceNinke: [
    [1, 0, 7 / 48],
    [2, 0, 5 / 48],
    [-2, 1, 3 / 48],
    [-1, 1, 5 / 48],
    [0, 1, 7 / 48],
    [1, 1, 5 / 48],
    [2, 1, 3 / 48],
    [-2, 2, 1 / 48],
    [-1, 2, 3 / 48],
    [0, 2, 5 / 48],
    [1, 2, 3 / 48],
    [2, 2, 1 / 48],
  ],
  stucki: [
    [1, 0, 8 / 42],
    [2, 0, 4 / 42],
    [-2, 1, 2 / 42],
    [-1, 1, 4 / 42],
    [0, 1, 8 / 42],
    [1, 1, 4 / 42],
    [2, 1, 2 / 42],
    [-2, 2, 1 / 42],
    [-1, 2, 2 / 42],
    [0, 2, 4 / 42],
    [1, 2, 2 / 42],
    [2, 2, 1 / 42],
  ],
};

export function halftone(halftoning: Halftoning, img: Img): Img {
  const output = new ImageData(img.width, img.height);

  const mask = haltoningMasks[halftoning];

  switch (halftoning) {
    case "orderedDithering2x2":
    case "orderedDithering3x3":
    case "orderedDithering3x2": {
      for (let i = 0; i < img.pixels.length; i += 4) {
        const x = (i / 4) % img.width;
        const y = Math.floor(i / 4 / img.width);

        const gray = (img.pixels[i + 0] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;

        const threshold =
          (mask[y % mask.length][x % mask[0].length] * 255) / (mask.length * mask[0].length);

        const value = gray > threshold ? 255 : 0;

        output.data[i + 0] = value;
        output.data[i + 1] = value;
        output.data[i + 2] = value;
        output.data[i + 3] = img.pixels[i + 3];
      }

      break;
    }
    case "rogers":
    case "floydSteinberg":
    case "jarvisJudiceNinke":
    case "stucki": {
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const i = x * 4 + y * img.width * 4;

          const r = output.data[i + 0];
          const g = output.data[i + 1];
          const b = output.data[i + 2];

          const newR = r > 127 ? 255 : 0;
          const newG = g > 127 ? 255 : 0;
          const newB = b > 127 ? 255 : 0;

          output.data[i + 0] = newR;
          output.data[i + 1] = newG;
          output.data[i + 2] = newB;
          output.data[i + 3] = img.pixels[i + 3];

          const errR = r - newR;
          const errG = g - newG;
          const errB = b - newB;

          for (const [dx, dy, v] of mask) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < img.width && ny >= 0 && ny < img.height) {
              const ni = nx * 4 + ny * img.width * 4;

              const r = img.pixels[ni + 0];
              const g = img.pixels[ni + 1];
              const b = img.pixels[ni + 2];

              output.data[ni + 0] = Math.max(0, Math.min(255, r + errR * v));
              output.data[ni + 1] = Math.max(0, Math.min(255, g + errG * v));
              output.data[ni + 2] = Math.max(0, Math.min(255, b + errB * v));
              output.data[ni + 3] = img.pixels[ni + 3];
            }
          }
        }
      }

      break;
    }
  }

  return new Img(`halftoning-${halftoning}-${img.name}`, output.width, output.height, output.data);
}
