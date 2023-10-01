import { Img } from ".";

export const pseudoColorizations = {
  densitySlicing: "Fatiamento por Densidade",
  redistribution: "Redistribuição",
} as const;

export type PseudoColorization = keyof typeof pseudoColorizations;

export type PseudoColorizationConfig = {
  slices: { min: number; max: number; color: [number, number, number] }[];
  redistribution: {
    brightness: number;
    color: [number, number, number];
  }[];
};

export function pseudoColorize(
  type: PseudoColorization,
  img: Img,
  config: PseudoColorizationConfig
): Img {
  let output: ImageData;

  switch (type) {
    case "densitySlicing":
      output = densitySlicing(img, config.slices);
      break;
    case "redistribution":
      output = redistribution(img, config.redistribution);
      break;
  }

  const newImg = new Img(
    `pseudoColor-${type}_${img.name}`,
    output.width,
    output.height,
    output.data
  );

  return newImg;
}

function densitySlicing(img: Img, config: PseudoColorizationConfig["slices"]) {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < output.data.length; i += 4) {
    const greyIntensity = (img.pixels[i + 0] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;

    for (const slice of config) {
      if (greyIntensity >= slice.min && greyIntensity <= slice.max) {
        output.data[i + 0] = slice.color[0];
        output.data[i + 1] = slice.color[1];
        output.data[i + 2] = slice.color[2];
        output.data[i + 3] = img.pixels[i + 3];
        break;
      }
    }
  }

  return output;
}

function redistribution(img: Img, config: PseudoColorizationConfig["redistribution"]) {
  const output = new ImageData(img.width, img.height);

  const slices = config
    .slice()
    .sort((a, b) => a.brightness - b.brightness)
    .map((s, _, arr) => {
      // mininum must be 0 if it's the first slice, otherwise it's 1 value above the previous slice
      const min = arr.indexOf(s) === 0 ? 0 : arr[arr.indexOf(s) - 1].brightness + 1;
      // maximum must be 255 if it's the last slice, otherwise it's 1 value below the next slice
      const max = arr.indexOf(s) === arr.length - 1 ? 255 : arr[arr.indexOf(s) + 1].brightness - 1;

      return {
        min,
        max,
        brightness: s.brightness,
        color: s.color,
      };
    });

  function newValue(brightness: number): [number, number, number] {
    const color: [number, number, number] = [0, 0, 0];

    for (const slice of slices) {
      if (brightness >= slice.min && brightness <= slice.max) {
        const diff =
          1 -
          (brightness > slice.brightness
            ? (brightness - slice.brightness) / (slice.max - slice.brightness)
            : (slice.brightness - brightness) / (slice.brightness - slice.min));

        color[0] += Math.round(slice.color[0] * diff);
        color[1] += Math.round(slice.color[1] * diff);
        color[2] += Math.round(slice.color[2] * diff);
      }
    }

    color[0] = Math.min(255, Math.max(0, color[0]));
    color[1] = Math.min(255, Math.max(0, color[1]));
    color[2] = Math.min(255, Math.max(0, color[2]));

    return color;
  }

  // equalize histogram in each channel
  // then use the brightness to redistribute the colors in accordance with the config
  for (let i = 0; i < output.data.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const [newR, newG, newB] = newValue((r + g + b) / 3);

    output.data[i + 0] = Math.min(255, Math.max(0, newR));
    output.data[i + 1] = Math.min(255, Math.max(0, newG));
    output.data[i + 2] = Math.min(255, Math.max(0, newB));
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}
