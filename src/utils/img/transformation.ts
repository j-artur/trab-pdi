import { Img } from ".";

export const transformations = {
  translate: "Translate",
  rotate: "Rotate",
  scale: "Scale",
  reflect: "Reflect",
  shear: "Shear",
} as const;

export type Transformation = keyof typeof transformations;

export type TransformationConfig = {
  onOutOfRange: "clamp" | "wrap";
  translate: {
    x: number;
    y: number;
  };
  rotate: {
    origin: {
      x: number;
      y: number;
    };
    angle: number;
  };
  scale: {
    x: number;
    y: number;
  };
  reflect: {
    x: boolean;
    y: boolean;
  };
  shear: {
    x: number;
    y: number;
  };
};

export async function transform(
  transformation: Transformation,
  img: Img,
  config: TransformationConfig
): Promise<Img> {
  let output: ImageData;

  if (transformation === "scale") {
    output = new ImageData(
      Math.round(img.width * config.scale.x),
      Math.round(img.height * config.scale.y)
    );
  } else if (transformation === "shear") {
    const widthOffset = Math.round(img.height * config.shear.x);
    const heightOffset = Math.round(img.width * config.shear.y);

    output = new ImageData(img.width + widthOffset, img.height + heightOffset);
  } else {
    output = new ImageData(img.width, img.height);
  }

  for (let y = 0; y < output.height; y++) {
    for (let x = 0; x < output.width; x++) {
      const i = y * output.width * 4 + x * 4;

      const pixel = transformPixel(transformation, img, x, y, config);

      output.data.set(pixel, i);
    }
  }

  const newImg = new Img(
    `${transformation}_${config.onOutOfRange}-${img.name}`,
    output.width,
    output.height,
    output.data
  );

  return newImg;
}

function transformPixel(
  transformation: Transformation,
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig
): Uint8ClampedArray {
  switch (transformation) {
    case "translate":
      return translatePixel(img, x, y, config);
    case "rotate":
      return rotatePixel(img, x, y, config);
    case "scale":
      return scalePixel(img, x, y, config);
    case "reflect":
      return reflectPixel(img, x, y, config);
    case "shear":
      return shearPixel(img, x, y, config);
    default:
      throw new Error("Not implemented");
  }
}

function translatePixel(
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig
): Uint8ClampedArray {
  let newX = x - config.translate.x;
  let newY = y - config.translate.y;

  if (newX < 0 || newX >= img.width) {
    if (config.onOutOfRange === "clamp") {
      return new Uint8ClampedArray([0, 0, 0, 0]);
    } else if (config.onOutOfRange === "wrap") {
      newX = newX % img.width;
    }
  }

  if (newY < 0 || newY >= img.height) {
    if (config.onOutOfRange === "clamp") {
      return new Uint8ClampedArray([0, 0, 0, 0]);
    } else if (config.onOutOfRange === "wrap") {
      newY = newY % img.height;
    }
  }

  const newIndex = newY * img.width * 4 + newX * 4;

  return img.pixels.slice(newIndex, newIndex + 4);
}

function rotatePixel(
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig
): Uint8ClampedArray {
  const radians = (config.rotate.angle * Math.PI) / 180;

  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  let newX = Math.round(
    config.rotate.origin.x +
      (x - config.rotate.origin.x) * cos -
      (y - config.rotate.origin.y) * sin
  );
  let newY = Math.round(
    config.rotate.origin.y +
      (x - config.rotate.origin.x) * sin +
      (y - config.rotate.origin.y) * cos
  );

  if (newX < 0 || newX >= img.width) {
    if (config.onOutOfRange === "clamp") {
      return new Uint8ClampedArray([0, 0, 0, 0]);
    } else if (config.onOutOfRange === "wrap") {
      newX = newX % img.width;
    }
  }

  if (newY < 0 || newY >= img.height) {
    if (config.onOutOfRange === "clamp") {
      return new Uint8ClampedArray([0, 0, 0, 0]);
    } else if (config.onOutOfRange === "wrap") {
      newY = newY % img.height;
    }
  }

  const newIndex = newY * img.width * 4 + newX * 4;

  return img.pixels.slice(newIndex, newIndex + 4);
}

function scalePixel(
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig
): Uint8ClampedArray {
  let newX = Math.round(x / config.scale.x);
  let newY = Math.round(y / config.scale.y);

  if (newX < 0 || newX >= img.width) {
    if (config.onOutOfRange === "clamp") {
      return new Uint8ClampedArray([0, 0, 0, 0]);
    } else if (config.onOutOfRange === "wrap") {
      newX = newX % img.width;
    }
  }

  if (newY < 0 || newY >= img.height) {
    if (config.onOutOfRange === "clamp") {
      return new Uint8ClampedArray([0, 0, 0, 0]);
    } else if (config.onOutOfRange === "wrap") {
      newY = newY % img.height;
    }
  }

  const newIndex = newY * img.width * 4 + newX * 4;

  return img.pixels.slice(newIndex, newIndex + 4);
}

function reflectPixel(
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig
): Uint8ClampedArray {
  let newX = x;
  let newY = y;

  if (config.reflect.x) {
    newX = img.width - x;
  }

  if (config.reflect.y) {
    newY = img.height - y;
  }

  if (newX < 0 || newX >= img.width) {
    if (config.onOutOfRange === "clamp") {
      return new Uint8ClampedArray([0, 0, 0, 0]);
    } else if (config.onOutOfRange === "wrap") {
      newX = newX % img.width;
    }
  }

  if (newY < 0 || newY >= img.height) {
    if (config.onOutOfRange === "clamp") {
      return new Uint8ClampedArray([0, 0, 0, 0]);
    } else if (config.onOutOfRange === "wrap") {
      newY = newY % img.height;
    }
  }

  const newIndex = newY * img.width * 4 + newX * 4;

  return img.pixels.slice(newIndex, newIndex + 4);
}

function shearPixel(
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig
): Uint8ClampedArray {
  let newX = Math.round(x + config.shear.x * y - img.width * config.shear.x);
  let newY = Math.round(y + config.shear.y * x - img.height * config.shear.y);

  if (newX < 0 || newX >= img.width) {
    if (config.onOutOfRange === "clamp") {
      return new Uint8ClampedArray([0, 0, 0, 0]);
    } else if (config.onOutOfRange === "wrap") {
      newX = newX % img.width;
    }
  }

  if (newY < 0 || newY >= img.height) {
    if (config.onOutOfRange === "clamp") {
      return new Uint8ClampedArray([0, 0, 0, 0]);
    } else if (config.onOutOfRange === "wrap") {
      newY = newY % img.height;
    }
  }

  const newIndex = newY * img.width * 4 + newX * 4;

  return img.pixels.slice(newIndex, newIndex + 4);
}
