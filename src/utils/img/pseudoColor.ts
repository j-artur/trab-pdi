import { Img } from ".";

export const pseudoColorizations = {
  densitySlicing: "Fatiamento por Densidade",
  redistribution: "Redistribuição",
} as const;

export type PseudoColorization = keyof typeof pseudoColorizations;

export type PseudoColorizationConfig = {
  slices: { min: number; max: number; color: [number, number, number] }[];
};

export async function pseudoColorize(
  type: PseudoColorization,
  img: Img,
  config: PseudoColorizationConfig
) {
  let output: ImageData;

  switch (type) {
    case "densitySlicing":
      output = densitySlicing(img, config.slices);
      break;
    case "redistribution":
      output = redistribution(img);
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

function redistribution(img: Img) {
  const output = new ImageData(img.width, img.height);

  const min = {
    r: 255,
    g: 255,
    b: 255,
  };

  const max = {
    r: 0,
    g: 0,
    b: 0,
  };

  for (let i = 0; i < output.data.length; i += 4) {
    min.r = Math.min(min.r, img.pixels[i + 0]);
    min.g = Math.min(min.g, img.pixels[i + 1]);
    min.b = Math.min(min.b, img.pixels[i + 2]);

    max.r = Math.max(max.r, img.pixels[i + 0]);
    max.g = Math.max(max.g, img.pixels[i + 1]);
    max.b = Math.max(max.b, img.pixels[i + 2]);
  }

  for (let i = 0; i < output.data.length; i += 4) {
    output.data[i + 3] = img.pixels[i + 3];

    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    output.data[i + 0] = Math.min(
      255,
      Math.max(0, Math.round(((r - min.r) / (max.r - min.r)) * 255))
    );
    output.data[i + 1] = Math.min(
      255,
      Math.max(0, Math.round(((g - min.g) / (max.g - min.g)) * 255))
    );
    output.data[i + 2] = Math.min(
      255,
      Math.max(0, Math.round(((b - min.b) / (max.b - min.b)) * 255))
    );
    output.data[i + 3] = img.pixels[i + 3];
  }

  return output;
}
