import {
  For,
  Show,
  Suspense,
  createResource,
  createSignal,
  type Component,
} from "solid-js";
import { createStore } from "solid-js/store";
import { clx } from "./utils";

class Img {
  constructor(
    public name: string,
    public width: number,
    public height: number,
    public pixels: Uint8ClampedArray
  ) {}
}

async function getPixels(
  imageFile: File,
  canvas: HTMLCanvasElement
): Promise<Img> {
  if (imageFile.name.endsWith(".pgm")) {
    const text = await imageFile.text();
    const lines = text.split("\n");

    const [width, height] = lines[1].split(" ").map(Number);

    const pixels = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < height; i++) {
      const line = lines[i + 3];
      const values = line.split(" ").map(Number);

      for (let j = 0; j < width; j++) {
        const value = values[j];
        const index = i * width + j;

        pixels[index * 4 + 0] = value;
        pixels[index * 4 + 1] = value;
        pixels[index * 4 + 2] = value;
        pixels[index * 4 + 3] = 255;
      }
    }

    return new Img(imageFile.name, width, height, pixels);
  }

  return new Promise<Img>((resolve) => {
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx!.drawImage(img, 0, 0);

      const data = ctx!.getImageData(0, 0, img.width, img.height).data;

      resolve(new Img(imageFile.name, img.width, img.height, data));
    };
    img.src = URL.createObjectURL(imageFile);
  });
}

const App: Component = () => {
  const [images, setImages] = createSignal<Img[]>([]);
  const [opCfg, setOpCfg] = createSignal<OperationConfig>({
    onOutOfRange: "clamp",
    onDifferentSize: "center",
  });
  const [transformCfg, setTransformCfg] = createStore<TransformationConfig>({
    onOutOfRange: "clamp",
    translate: {
      x: 0,
      y: 0,
    },
    rotate: {
      origin: {
        x: 0,
        y: 0,
      },
      angle: 0,
    },
    scale: {
      x: 1,
      y: 1,
    },
    reflect: {
      x: false,
      y: false,
    },
    shear: {
      x: 0,
      y: 0,
    },
  });
  const [selectedTransformation, setSelectedTransformation] =
    createSignal<Transformation>("translate");
  const [outputs, setOutputs] = createSignal<Img[]>([]);

  const [primaryImage, setPrimaryImage] = createSignal<number>();
  const [secondaryImage, setSecondaryImage] = createSignal<number>();

  async function loadImages(files: File[]) {
    const canvas = document.createElement("canvas");

    const imgs = await Promise.all(
      files.map((file) => getPixels(file, canvas))
    );

    setImages(imgs);
  }

  return (
    <div class="p-2">
      <input
        type="file"
        multiple
        onInput={(e) => loadImages([...(e.currentTarget.files ?? [])])}
        accept="image/*,.pgm"
      />

      <Show when={images()}>
        {(imgs) => (
          <ul class="flex p-2 gap-2">
            <For each={[...imgs()]}>
              {(img) => (
                <li
                  class={clx("border-2", {
                    "border-t-blue-500 border-l-blue-500":
                      imgs().indexOf(img) === primaryImage(),
                    "border-b-red-500 border-r-red-500":
                      imgs().indexOf(img) === secondaryImage(),
                  })}
                  onClick={(e) => {
                    if (e.shiftKey) {
                      if (secondaryImage() === imgs().indexOf(img)) {
                        setSecondaryImage(undefined);
                      } else {
                        setSecondaryImage(imgs().indexOf(img));
                      }
                    } else {
                      if (primaryImage() === imgs().indexOf(img)) {
                        setPrimaryImage(undefined);
                      } else {
                        setPrimaryImage(imgs().indexOf(img));
                      }
                    }
                  }}
                >
                  <Thumbnail img={img} />
                </li>
              )}
            </For>
          </ul>
        )}
      </Show>

      <form
        class="p-2 flex gap-2"
        onInput={(e) => {
          setOpCfg({
            ...opCfg(),
            onOutOfRange: (e.target as HTMLInputElement)
              .value as OperationConfig["onOutOfRange"],
          });
        }}
      >
        <label>
          <input
            type="radio"
            name="on_out_of_range"
            value="clamp"
            checked={opCfg().onOutOfRange === "clamp"}
          />
          Clamp
        </label>
        <label>
          <input
            type="radio"
            name="on_out_of_range"
            value="wrap"
            checked={opCfg().onOutOfRange === "wrap"}
          />
          Wrap
        </label>
        <label>
          <input
            type="radio"
            name="on_out_of_range"
            value="normalize"
            checked={opCfg().onOutOfRange === "normalize"}
          />
          Normalize
        </label>
      </form>
      <div
        class={clx({
          "opacity-50":
            primaryImage() === undefined || secondaryImage() === undefined,
        })}
      >
        <For each={Object.values(Operation)}>
          {(op) => (
            <button
              class="border p-2"
              onClick={async () => {
                const img = await operate(
                  op,
                  images()[primaryImage()!],
                  images()[secondaryImage()!],
                  opCfg()
                );

                setOutputs([...outputs(), img]);
              }}
              disabled={
                primaryImage() === undefined || secondaryImage() === undefined
              }
            >
              {op}
            </button>
          )}
        </For>
      </div>

      <form class="p-2 flex gap-2">
        <label>
          <input
            type="radio"
            name="on_out_of_range"
            value="clamp"
            onInput={(e) => {
              setTransformCfg(
                "onOutOfRange",
                e.target.value as TransformationConfig["onOutOfRange"]
              );
            }}
            checked={transformCfg.onOutOfRange === "clamp"}
          />
          Clamp
        </label>
        <label>
          <input
            type="radio"
            name="on_out_of_range"
            value="wrap"
            onInput={(e) => {
              setTransformCfg(
                "onOutOfRange",
                e.target.value as TransformationConfig["onOutOfRange"]
              );
            }}
            checked={transformCfg.onOutOfRange === "wrap"}
          />
          Wrap
        </label>
      </form>
      <div>
        <For each={Object.values(Transformation)}>
          {(transformation) => (
            <button
              class={clx("border p-2", {
                "bg-blue-500": selectedTransformation() === transformation,
              })}
              onClick={() => setSelectedTransformation(transformation)}
            >
              {transformation}
            </button>
          )}
        </For>

        <button
          class={clx("border p-2", {
            "opacity-50": primaryImage() === undefined,
          })}
          onClick={async () => {
            const img = await transform(
              selectedTransformation(),
              images()[primaryImage()!],
              transformCfg
            );

            setOutputs([...outputs(), img]);
          }}
          disabled={primaryImage() === undefined}
        >
          Aplicar
        </button>
      </div>
      <Show when={selectedTransformation() === "translate"}>
        <form>
          <label>
            X:
            <input
              type="number"
              value={transformCfg.translate.x}
              onInput={(e) => {
                setTransformCfg(
                  "translate",
                  "x",
                  Number(e.currentTarget.value)
                );
              }}
            />
          </label>
          <label>
            Y:
            <input
              type="number"
              value={transformCfg.translate.y}
              onInput={(e) => {
                setTransformCfg(
                  "translate",
                  "y",
                  Number(e.currentTarget.value)
                );
              }}
            />
          </label>
        </form>
      </Show>
      <Show when={selectedTransformation() === "rotate"}>
        <form>
          <label>
            X:
            <input
              type="number"
              value={transformCfg.rotate.origin.x}
              onInput={(e) => {
                setTransformCfg(
                  "rotate",
                  "origin",
                  "x",
                  Number(e.currentTarget.value)
                );
              }}
            />
          </label>
          <label>
            Y:
            <input
              type="number"
              value={transformCfg.rotate.origin.y}
              onInput={(e) => {
                setTransformCfg(
                  "rotate",
                  "origin",
                  "y",
                  Number(e.currentTarget.value)
                );
              }}
            />
          </label>
          <label>
            Degrees:
            <input
              type="number"
              value={transformCfg.rotate.angle}
              onInput={(e) => {
                setTransformCfg(
                  "rotate",
                  "angle",
                  Number(e.currentTarget.value)
                );
              }}
            />
          </label>
        </form>
      </Show>

      <Show when={outputs()}>
        {(outputs) => (
          <ul class="flex gap-2 p-2">
            <For each={[...outputs()]}>
              {(img) => (
                <li>
                  <Thumbnail img={img} />
                </li>
              )}
            </For>
          </ul>
        )}
      </Show>
    </div>
  );
};

async function createThumbnail({ img }: { img: Img }) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const output = ctx!.createImageData(img.width, img.height);

  for (let i = 0; i < img.pixels.length; i += 4) {
    output.data[i + 0] = img.pixels[i + 0];
    output.data[i + 1] = img.pixels[i + 1];
    output.data[i + 2] = img.pixels[i + 2];
    output.data[i + 3] = img.pixels[i + 3];
  }

  canvas.width = img.width;
  canvas.height = img.height;
  ctx!.putImageData(output, 0, 0);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png")
  );

  return URL.createObjectURL(blob);
}

const Thumbnail = ({ img }: { img: Img }) => {
  const [src] = createResource({ img }, createThumbnail);

  return (
    <div class="w-60 flex flex-col items-center" title={img.name}>
      <div class="h-56 w-56 flex items-center justify-center">
        <Suspense>
          <img src={src()} class="object-contain max-w-full max-h-full" />
        </Suspense>
      </div>
      <p class="max-w-full truncate">{img.name}</p>
    </div>
  );
};

export default App;

const Operation = {
  add: "add",
  subtract: "subtract",
  multiply: "multiply",
  divide: "divide",
  and: "and",
  or: "or",
  xor: "xor",
} as const;

type Operation = keyof typeof Operation;

type OperationConfig = {
  onOutOfRange: "clamp" | "wrap" | "normalize";
  onDifferentSize: "center" | "stretch";
};

async function operate(
  operation: Operation,
  img1: Img,
  img2: Img,
  config: OperationConfig
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (img1.width !== img2.width || img1.height !== img2.height) {
    if (config.onDifferentSize === "center") {
      // center the smaller image in the bigger one

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
  }

  const output = ctx!.createImageData(img1.width, img1.height);

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
    `${operation}_${config.onOutOfRange}.png`,
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

const Transformation = {
  translate: "translate",
  rotate: "rotate",
  scale: "scale",
  reflect: "reflect",
  shear: "shear",
} as const;

type Transformation = keyof typeof Transformation;

type TransformationConfig = {
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

async function transform(
  transformation: Transformation,
  img: Img,
  config: TransformationConfig
): Promise<Img> {
  console.log(config);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const output = ctx!.createImageData(img.width, img.height);

  switch (transformation) {
    case "translate":
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const i = y * img.width * 4 + x * 4;

          const pixel = translatePixel(img, x, y, config);

          output.data.set(pixel, i);
        }
      }
      break;
    case "rotate": {
      const newImg = await transform("translate", img, {
        ...config,
        translate: {
          x: -config.rotate.origin.x,
          y: -config.rotate.origin.y,
        },
      });

      for (let y = 0; y < newImg.height; y++) {
        for (let x = 0; x < newImg.width; x++) {
          const i = y * newImg.width * 4 + x * 4;

          const pixel = rotatePixel(newImg, x, y, config);

          output.data.set(pixel, i);
        }
      }

      const newImg2 = await transform("translate", newImg, {
        ...config,
        translate: {
          x: config.rotate.origin.x,
          y: config.rotate.origin.y,
        },
      });

      return new Img(
        `${transformation}_${config.onOutOfRange}.png`,
        newImg2.width,
        newImg2.height,
        newImg2.pixels
      );
    }
  }

  const newImg = new Img(
    `${transformation}_${config.onOutOfRange}.png`,
    img.width,
    img.height,
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
    default:
      return rotatePixel(img, x, y, config);
  }
}

function translatePixel(
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig
): Uint8ClampedArray {
  let newX = x + config.translate.x;
  let newY = y + config.translate.y;

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

  let newX = Math.round(x * cos - y * sin);
  let newY = Math.round(x * sin + y * cos);

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
