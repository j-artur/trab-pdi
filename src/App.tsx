import {
  For,
  Show,
  Suspense,
  createResource,
  createSignal,
  type Component,
} from "solid-js";
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
    img.src = URL.createObjectURL(imageFile);
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx!.drawImage(img, 0, 0);

      const data = ctx!.getImageData(0, 0, img.width, img.height).data;

      resolve(new Img(imageFile.name, img.width, img.height, data));
    };
  });
}

type ArithmeticConfig = {
  onOutOfRange: "clamp" | "wrap" | "normalize";
  onDifferentSize: "center" | "stretch";
};

const App: Component = () => {
  const [images, setImages] = createSignal<Img[]>([]);
  const [config, setConfig] = createSignal<ArithmeticConfig>({
    onOutOfRange: "clamp",
    onDifferentSize: "center",
  });
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

      <form
        class="p-2 flex gap-2"
        onInput={(e) => {
          setConfig({
            ...config(),
            onOutOfRange: (e.target as HTMLInputElement)
              .value as ArithmeticConfig["onOutOfRange"],
          });
        }}
      >
        <label>
          <input
            type="radio"
            name="on_out_of_range"
            value="clamp"
            checked={config().onOutOfRange === "clamp"}
          />
          Clamp
        </label>
        <label>
          <input
            type="radio"
            name="on_out_of_range"
            value="wrap"
            checked={config().onOutOfRange === "wrap"}
          />
          Wrap
        </label>
        <label>
          <input
            type="radio"
            name="on_out_of_range"
            value="normalize"
            checked={config().onOutOfRange === "normalize"}
          />
          Normalize
        </label>
      </form>

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

      <Show
        when={primaryImage() !== undefined && secondaryImage() !== undefined}
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
                  config()
                );

                setOutputs([...outputs(), img]);
              }}
            >
              {op}
            </button>
          )}
        </For>
      </Show>

      <Show when={outputs()}>
        {(outputs) => (
          <ul>
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

async function operate(
  operation: Operation,
  img1: Img,
  img2: Img,
  config: ArithmeticConfig
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
