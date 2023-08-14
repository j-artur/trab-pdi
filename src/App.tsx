import {
  For,
  Match,
  Show,
  Suspense,
  Switch,
  createEffect,
  createResource,
  createSignal,
  type Component,
} from "solid-js";
import { createStore } from "solid-js/store";
import { clx } from "./utils";
import {
  Img,
  Operation,
  OperationConfig,
  Transformation,
  TransformationConfig,
  Zoom,
  ZoomConfig,
  createURL,
  getPixels,
  operate,
  operations,
  transform,
  transformations,
  zoom,
  zooms,
} from "./utils/img";

const App: Component = () => {
  const [images, setImages] = createSignal<Img[]>([]);
  const [opCfg, setOpCfg] = createSignal<OperationConfig>({
    onOutOfRange: "clamp",
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
  const [zoomCfg, setZoomCfg] = createSignal<ZoomConfig>({
    amount: 1,
  });

  const [outputs, setOutputs] = createSignal<Img[]>([]);

  const [primaryImage, setPrimaryImage] = createSignal<number>();
  const [secondaryImage, setSecondaryImage] = createSignal<number>();

  createEffect(() => {
    const primaryImg = images()[primaryImage()!];

    if (primaryImg) {
      setTransformCfg("translate", "x", primaryImg.width / 2);
      setTransformCfg("translate", "y", primaryImg.height / 2);
      setTransformCfg("rotate", "origin", "x", primaryImg.width / 2);
      setTransformCfg("rotate", "origin", "y", primaryImg.height / 2);
    }
  });

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
          <ul class="flex p-2 gap-2 flex-wrap max-w-full">
            <For each={[...imgs()]}>
              {(img) => (
                <li
                  class={clx("border-2 p-1", {
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
                  title={`${img.width}x${img.height}`}
                >
                  <Thumbnail img={img} />
                  <p class="max-w-full p-1 truncate">{img.name}</p>
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
        <For each={Object.keys(operations) as Operation[]}>
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
              {operations[op]}
            </button>
          )}
        </For>
      </div>

      <div>
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
          <For each={Object.keys(transformations) as Transformation[]}>
            {(tr) => (
              <button
                class={clx("border p-2", {
                  "bg-blue-500": selectedTransformation() === tr,
                })}
                onClick={() => setSelectedTransformation(tr)}
              >
                {transformations[tr]}
              </button>
            )}
          </For>
        </div>

        <form>
          <Switch>
            <Match when={selectedTransformation() === "translate"}>
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
                  min={-images()[primaryImage()!]?.width}
                  max={images()[primaryImage()!]?.width}
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
                  min={-images()[primaryImage()!]?.height}
                  max={images()[primaryImage()!]?.height}
                />
              </label>
            </Match>
            <Match when={selectedTransformation() === "rotate"}>
              <label>
                Origin X:
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
                  min={0}
                  max={images()[primaryImage()!]?.width}
                />
              </label>
              <label>
                Origin Y:
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
                  min={0}
                  max={images()[primaryImage()!]?.height}
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
                  min={0}
                  max={360}
                />
              </label>
            </Match>
            <Match when={selectedTransformation() === "scale"}>
              <label>
                X:
                <input
                  type="number"
                  value={transformCfg.scale.x}
                  onInput={(e) => {
                    setTransformCfg(
                      "scale",
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
                  value={transformCfg.scale.y}
                  onInput={(e) => {
                    setTransformCfg(
                      "scale",
                      "y",
                      Number(e.currentTarget.value)
                    );
                  }}
                />
              </label>
            </Match>
            <Match when={selectedTransformation() === "reflect"}>
              <label>
                X:
                <input
                  type="checkbox"
                  checked={transformCfg.reflect.x}
                  onInput={(e) => {
                    setTransformCfg("reflect", "x", e.currentTarget.checked);
                  }}
                />
              </label>
              <label>
                Y:
                <input
                  type="checkbox"
                  checked={transformCfg.reflect.y}
                  onInput={(e) => {
                    setTransformCfg("reflect", "y", e.currentTarget.checked);
                  }}
                />
              </label>
            </Match>
            <Match when={selectedTransformation() === "shear"}>
              <label>
                X:
                <input
                  type="number"
                  value={transformCfg.shear.x}
                  onInput={(e) => {
                    setTransformCfg(
                      "shear",
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
                  value={transformCfg.shear.y}
                  onInput={(e) => {
                    setTransformCfg(
                      "shear",
                      "y",
                      Number(e.currentTarget.value)
                    );
                  }}
                />
              </label>
            </Match>
          </Switch>
          <div>
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
        </form>
      </div>

      <div
        class={clx({
          "opacity-50": primaryImage() === undefined,
        })}
      >
        <For each={Object.keys(zooms) as Zoom[]}>
          {(z) => (
            <button
              class="border p-2"
              onClick={async () => {
                const img = await zoom(z, images()[primaryImage()!], zoomCfg());

                setOutputs([...outputs(), img]);
              }}
              disabled={primaryImage() === undefined}
            >
              {zooms[z]}
            </button>
          )}
        </For>
      </div>
      <form>
        <label>
          Amount:
          <input
            type="number"
            value={zoomCfg().amount}
            onInput={(e) => {
              setZoomCfg({
                amount: Number(e.currentTarget.value),
              });
            }}
          />
        </label>
      </form>

      <Show when={outputs()}>
        {(outputs) => (
          <ul class="flex gap-2 p-2 flex-wrap max-w-full">
            <For each={[...outputs()]}>
              {(img) => (
                <li title={`${img.width}x${img.height}`}>
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

const Thumbnail = ({ img }: { img: Img }) => {
  const [url] = createResource(img, createURL);

  return (
    <div class="h-56 w-56 flex items-center justify-center">
      <Suspense>
        <img src={url()} class="object-contain border max-w-full max-h-full" />
      </Suspense>
    </div>
  );
};

export default App;
