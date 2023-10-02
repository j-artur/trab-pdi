import { Img, coordsInBounds, reverse } from ".";

export const segmentations = {
  dotDetection: "Detecção de Pontos",
  lineDetection: "Detecção de Retas",
  borderDetection: "Detecção de Bordas",
  regionGrowing: "Crescimento de Regiões",
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
  regionGrowing: {
    threshold: number;
    seeds: number;
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
    case "regionGrowing":
      return regionGrowing(img, config.regionGrowing);
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
      const newValue = Math.abs(applyMask(img, i, mask[j]));

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

function regionGrowing(img: Img, config: SegmentationConfig["regionGrowing"]): Img {
  const output = new ImageData(img.width, img.height);

  const seeds = Array.from({ length: config.seeds }, () => {
    const x = Math.floor(Math.random() * img.width);
    const y = Math.floor(Math.random() * img.height);

    const i = indexOf(img, x, y);
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const value = (r + g + b) / 3;

    const color = [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ];

    return { x, y, value, color };
  });

  const queue = [...seeds];

  const visited = new Set();

  while (queue.length) {
    const seed = queue.shift();

    if (!seed) continue;

    const neighbors = [
      { x: seed.x - 1, y: seed.y },
      { x: seed.x + 1, y: seed.y },
      { x: seed.x, y: seed.y - 1 },
      { x: seed.x, y: seed.y + 1 },
    ];

    for (const neighbor of neighbors) {
      if (visited.has(`${neighbor.x}-${neighbor.y}`)) continue;

      if (!coordsInBounds(img, 0, neighbor.x, neighbor.y)) continue;

      const i = indexOf(img, neighbor.x, neighbor.y);
      const r = img.pixels[i + 0];
      const g = img.pixels[i + 1];
      const b = img.pixels[i + 2];

      const value = (r + g + b) / 3;

      const foundSeed = seeds.find(seed => Math.abs(seed.value - value) < config.threshold);

      if (foundSeed) {
        output.data[i + 0] = foundSeed.color[0];
        output.data[i + 1] = foundSeed.color[1];
        output.data[i + 2] = foundSeed.color[2];

        queue.push({ x: neighbor.x, y: neighbor.y, value, color: foundSeed.color });
      } else {
        output.data[i + 0] = 0;
        output.data[i + 1] = 0;
        output.data[i + 2] = 0;
      }

      output.data[i + 3] = img.pixels[i + 3];

      visited.add(`${neighbor.x}-${neighbor.y}`);
    }
  }

  return new Img(`region-growing-${img.name}`, output.width, output.height, output.data);
}

function indexOf(img: Img, x: number, y: number) {
  return x * 4 + y * img.width * 4;
}
