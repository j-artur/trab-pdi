import { Img, coordsInBounds, reverse } from ".";

export const segmentations = {
  dotDetection: "Detecção de Pontos",
  lineDetection: "Detecção de Retas",
  borderDetection: "Detecção de Bordas",
};

export type Segmentation = keyof typeof segmentations;

export const lineDetectionDirections = {
  horizontal: "Horizontal",
  vertical: "Vertical",
  diagonal: "Diagonal (45°)",
  antidiagonal: "Antidiagonal (135°)",
};

export type LineDetectionDirection = keyof typeof lineDetectionDirections;

export const borderDetectionTypes = {
  roberts: "Roberts",
  crossedRoberts: "Roberts Cruzado",
  prewitt: "Prewitt",
  sobel: "Sobel",
  kirsh: "Kirsh",
  robison: "Robison",
  freiChen: "Frei-Chen",
  laplacianH1: "Laplaciano H1",
  laplacianH2: "Laplaciano H2",
};

export type BorderDetectionType = keyof typeof borderDetectionTypes;

export type SegmentationConfig = {
  dotDetection: {
    threshold: number;
  };
  lineDetection: {
    direction: LineDetectionDirection;
  };
  borderDetection: {
    type: BorderDetectionType;
  };
};

const sqrt2 = Math.sqrt(2);

const masks = {
  dotDetection: [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ],
  lineDetection: {
    horizontal: [
      [-1, -1, -1],
      [2, 2, 2],
      [-1, -1, -1],
    ],
    vertical: [
      [-1, 2, -1],
      [-1, 2, -1],
      [-1, 2, -1],
    ],
    diagonal: [
      [2, -1, -1],
      [-1, 2, -1],
      [-1, -1, 2],
    ],
    antidiagonal: [
      [-1, -1, 2],
      [-1, 2, -1],
      [2, -1, -1],
    ],
  },
  borderDetection: {
    roberts: [
      [
        [1, 0],
        [-1, 0],
      ],
      [
        [1, -1],
        [0, 0],
      ],
    ],
    crossedRoberts: [
      [
        [1, 0],
        [0, -1],
      ],
      [
        [0, 1],
        [-1, 0],
      ],
    ],
    prewitt: [
      [
        [-1, 0, 1],
        [-1, 0, 1],
        [-1, 0, 1],
      ],
      [
        [-1, -1, -1],
        [0, 0, 0],
        [1, 1, 1],
      ],
    ],
    sobel: [
      [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
      ],
      [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1],
      ],
    ],
    kirsh: [
      [
        [5, -3, -3],
        [5, 0, -3],
        [5, -3, -3],
      ],
      [
        [-3, -3, -3],
        [5, 0, -3],
        [5, 5, -3],
      ],
      [
        [-3, -3, -3],
        [-3, 0, -3],
        [5, 5, 5],
      ],
      [
        [-3, -3, -3],
        [-3, 0, 5],
        [-3, 5, 5],
      ],
      [
        [-3, -3, 5],
        [-3, 0, 5],
        [-3, -3, 5],
      ],
      [
        [-3, 5, 5],
        [-3, 0, 5],
        [-3, -3, -3],
      ],
      [
        [5, 5, 5],
        [-3, 0, -3],
        [-3, -3, -3],
      ],
      [
        [5, 5, -3],
        [5, 0, -3],
        [-3, -3, -3],
      ],
    ],
    robison: [
      [
        [1, 0, -1],
        [2, 0, -2],
        [1, 0, -1],
      ],
      [
        [0, -1, -2],
        [1, 0, -1],
        [2, 1, 0],
      ],
      [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1],
      ],
      [
        [-2, -1, 0],
        [-1, 0, 1],
        [0, 1, 2],
      ],
      [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
      ],
      [
        [0, 1, 2],
        [-1, 0, 1],
        [-2, -1, 0],
      ],
      [
        [1, 2, 1],
        [0, 0, 0],
        [-1, -2, -1],
      ],
      [
        [2, 1, 0],
        [1, 0, -1],
        [0, -1, -2],
      ],
    ],
    freiChen: [
      [
        [1, sqrt2, 1],
        [0, 0, 0],
        [-1, -sqrt2, -1],
      ],
      [
        [1, 0, -1],
        [sqrt2, 0, -sqrt2],
        [1, 0, -1],
      ],
      [
        [0, -1, sqrt2],
        [1, 0, -1],
        [-sqrt2, 1, 0],
      ],
      [
        [sqrt2, -1, 0],
        [-1, 0, 1],
        [0, 1, -sqrt2],
      ],
    ],
    laplacianH1: [
      [
        [0, -1, 0],
        [-1, 4, -1],
        [0, -1, 0],
      ],
    ],
    laplacianH2: [
      [
        [-1, -4, -1],
        [-4, 20, -4],
        [-1, -4, -1],
      ],
    ],
  },
};

export function segment(segmentation: Segmentation, img: Img, config: SegmentationConfig): Img {
  switch (segmentation) {
    case "dotDetection":
      return reverse(dotDetection(img, config.dotDetection));
    case "lineDetection":
      return reverse(lineDetection(img, config.lineDetection));
    case "borderDetection":
      return reverse(borderDetection(img, config.borderDetection));
  }
}

function dotDetection(img: Img, config: SegmentationConfig["dotDetection"]): Img {
  const output = new ImageData(img.width, img.height);

  const threshold = config.threshold;

  for (let i = 0; i < img.pixels.length; i += 4) {
    const gray = applyMask(img, i, masks.dotDetection);

    const value = gray > threshold ? 255 : 0;

    output.data[i + 0] = value;
    output.data[i + 1] = value;
    output.data[i + 2] = value;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return new Img(`dot-detection-${img.name}`, output.width, output.height, output.data);
}

function lineDetection(img: Img, config: SegmentationConfig["lineDetection"]): Img {
  const output = new ImageData(img.width, img.height);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const gray = applyMask(img, i, masks.lineDetection[config.direction]);

    output.data[i + 0] = gray;
    output.data[i + 1] = gray;
    output.data[i + 2] = gray;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return new Img(
    `line-detection-${config.direction}-${img.name}`,
    output.width,
    output.height,
    output.data
  );
}

function borderDetection(img: Img, config: SegmentationConfig["borderDetection"]): Img {
  const output = new ImageData(img.width, img.height);

  const mask = masks.borderDetection[config.type];

  for (let i = 0; i < img.pixels.length; i += 4) {
    let value = 0;

    for (let j = 0; j < mask.length; j++) {
      const newValue = applyMask(img, i, mask[j]);

      switch (config.type) {
        case "roberts":
        case "crossedRoberts":
        case "prewitt":
        case "sobel":
        case "laplacianH1":
        case "laplacianH2":
          value += newValue;
          break;
        case "kirsh":
        case "robison":
        case "freiChen":
          value = Math.max(value, newValue);
          break;
      }
    }

    switch (config.type) {
      case "roberts":
      case "crossedRoberts":
      case "prewitt":
      case "sobel":
        value = Math.abs(value);
        break;
    }

    output.data[i + 0] = value;
    output.data[i + 1] = value;
    output.data[i + 2] = value;
    output.data[i + 3] = img.pixels[i + 3];
  }

  return new Img(
    `border-detection-${config.type}-${img.name}`,
    output.width,
    output.height,
    output.data
  );
}

function applyMask(img: Img, i: number, mask: number[][]) {
  let gray = 0;

  for (let y = 0; y < mask.length; y++) {
    for (let x = 0; x < mask[y].length; x++) {
      if (coordsInBounds(img, i, x, y)) {
        let index = i + x * 4 + y * img.width * 4;

        const maskValue = mask[y][x];

        const r = img.pixels[index + 0];
        const g = img.pixels[index + 1];
        const b = img.pixels[index + 2];

        gray += ((r + g + b) / 3) * maskValue;
      }
    }
  }

  return gray;
}
