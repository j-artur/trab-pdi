import { Img } from ".";

export const pseudoColorizations = {
  densitySlicing: "Fatiamento por Densidade",
  redistribution: "Redistribuição",
} as const;

export type PseudoColorization = keyof typeof pseudoColorizations;

export async function pseudoColorize(type: PseudoColorization, img: Img) {
  let output: ImageData;

  switch (type) {
    case "densitySlicing":
      output = densitySlicing(img);
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

function densitySlicing(img: Img) {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < output.data.length; i += 4) {
    const greyIntensity = (img.pixels[i + 0] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;

    if (greyIntensity <= 85) {
      output.data[i + 0] = 255;
      output.data[i + 1] = 0;
      output.data[i + 2] = 0;
      output.data[i + 3] = img.pixels[i + 3];
    } else if (greyIntensity <= 170) {
      output.data[i + 0] = 0;
      output.data[i + 1] = 255;
      output.data[i + 2] = 0;
      output.data[i + 3] = img.pixels[i + 3];
    } else {
      output.data[i + 0] = 0;
      output.data[i + 1] = 0;
      output.data[i + 2] = 255;
      output.data[i + 3] = img.pixels[i + 3];
    }
  }

  return output;
}

function redistribution(img: Img) {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < output.data.length; i += 4) {
    output.data[i + 3] = img.pixels[i + 3];

    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const max = Math.max(r, g, b);

    if (max === r && r === g && g === b) {
      output.data[i + 0] = r;
      output.data[i + 1] = g;
      output.data[i + 2] = b;
      continue;
    }

    if (max === r && r === g) {
      output.data[i + 0] = r;
      output.data[i + 1] = g;
      output.data[i + 2] = b / 2;
      continue;
    }

    if (max === r && r === b) {
      output.data[i + 0] = r;
      output.data[i + 1] = g / 2;
      output.data[i + 2] = b;
      continue;
    }

    if (max === g && g === b) {
      output.data[i + 0] = r / 2;
      output.data[i + 1] = g;
      output.data[i + 2] = b;
      continue;
    }

    if (max === r) {
      output.data[i + 0] = r;
      output.data[i + 1] = g / 2;
      output.data[i + 2] = b / 2;
      continue;
    }

    if (max === g) {
      output.data[i + 1] = g;
      output.data[i + 0] = r / 2;
      output.data[i + 2] = b / 2;
      continue;
    }

    if (max === b) {
      output.data[i + 0] = r / 2;
      output.data[i + 1] = g / 2;
      output.data[i + 2] = b;
    }
  }

  return output;
}
