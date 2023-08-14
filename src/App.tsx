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
import { Thumbnail } from "./components/Thumbnail";
import { clx } from "./utils";
import { Img, createURL, getPixels } from "./utils/img";
import { ColorScheme, colorSchemes, splitColorspace } from "./utils/img/color";
import {
  Enhancement,
  EnhancementConfig,
  enhance,
  enhancements,
} from "./utils/img/enhancement";
import {
  Operation,
  OperationConfig,
  operate,
  operations,
} from "./utils/img/operation";
import {
  PseudoColorization,
  pseudoColorizations,
  pseudoColorize,
} from "./utils/img/pseudoColor";
import {
  Transformation,
  TransformationConfig,
  transform,
  transformations,
} from "./utils/img/transformation";
import { Zoom, ZoomConfig, zoom, zooms } from "./utils/img/zoom";

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
  const [enhancementCfg, setEnhancementCfg] = createStore<EnhancementConfig>({
    interval: {
      min: 0,
      max: 255,
    },
    multipleParts: [
      {
        from: { min: 0, max: 85 },
        to: { min: 0, max: 127 },
      },
      {
        from: { min: 85, max: 170 },
        to: { min: 128, max: 128 },
      },
      {
        from: { min: 170, max: 255 },
        to: { min: 129, max: 255 },
      },
    ],
    binary: {
      threshold: 127,
    },
  });
  const [selectedEnhancement, setSelectedEnhancement] =
    createSignal<Enhancement>("interval");

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

  createEffect(() => {
    if (primaryImage()) {
      if (primaryImage()! < 0 || primaryImage()! >= images().length) {
        setPrimaryImage(undefined);
      }
    }
  });

  createEffect(() => {
    if (secondaryImage()) {
      if (secondaryImage()! < 0 || secondaryImage()! >= images().length) {
        setSecondaryImage(undefined);
      }
    }
  });

  async function loadImages(files: File[]) {
    const canvas = document.createElement("canvas");

    const imgs = await Promise.all(files.map(file => getPixels(file, canvas)));

    setImages([...images(), ...imgs]);
  }

  return (
    <div class="p-2">
      <input
        type="file"
        multiple
        onInput={e => loadImages([...(e.currentTarget.files ?? [])])}
        accept="image/*,.pgm"
      />

      <Show when={images()}>
        {imgs => (
          <ul class="flex p-2 gap-2 flex-wrap max-w-full">
            <For each={[...imgs()]}>
              {img => (
                <li
                  class={clx("border-2 relative group p-1", {
                    "border-t-blue-500 border-l-blue-500":
                      imgs().indexOf(img) === primaryImage(),
                    "border-b-red-500 border-r-red-500":
                      imgs().indexOf(img) === secondaryImage(),
                  })}
                  onClick={e => {
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
                  <button
                    class="absolute top-0 right-0 py-1 px-2 border rounded bg-white text-red-500 font-bold hidden group-hover:block"
                    onClick={() => {
                      setOutputs(outputs().filter(i => i !== img));
                    }}
                  >
                    X
                  </button>
                  <Thumbnail img={img} />
                </li>
              )}
            </For>
          </ul>
        )}
      </Show>

      <div
        class="p-2 flex gap-2"
        onInput={e => {
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
      </div>
      <div
        class={clx({
          "opacity-50":
            primaryImage() === undefined || secondaryImage() === undefined,
        })}
      >
        <For each={Object.keys(operations) as Operation[]}>
          {op => (
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
        <div class="p-2 flex gap-2">
          <label>
            <input
              type="radio"
              name="on_out_of_range"
              value="clamp"
              onInput={e => {
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
              onInput={e => {
                setTransformCfg(
                  "onOutOfRange",
                  e.target.value as TransformationConfig["onOutOfRange"]
                );
              }}
              checked={transformCfg.onOutOfRange === "wrap"}
            />
            Wrap
          </label>
        </div>
        <div>
          <For each={Object.keys(transformations) as Transformation[]}>
            {tr => (
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

        <div>
          <Switch>
            <Match when={selectedTransformation() === "translate"}>
              <label>
                X:
                <input
                  type="number"
                  value={transformCfg.translate.x}
                  onInput={e => {
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
                  onInput={e => {
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
                  onInput={e => {
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
                  onInput={e => {
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
                  onInput={e => {
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
                  onInput={e => {
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
                  onInput={e => {
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
                  onInput={e => {
                    setTransformCfg("reflect", "x", e.currentTarget.checked);
                  }}
                />
              </label>
              <label>
                Y:
                <input
                  type="checkbox"
                  checked={transformCfg.reflect.y}
                  onInput={e => {
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
                  onInput={e => {
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
                  onInput={e => {
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
        </div>
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
      </div>

      <div
        class={clx({
          "opacity-50": primaryImage() === undefined,
        })}
      >
        <For each={Object.keys(zooms) as Zoom[]}>
          {z => (
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
      <div>
        <label>
          Amount:
          <input
            type="number"
            value={zoomCfg().amount}
            onInput={e => {
              setZoomCfg({
                amount: Number(e.currentTarget.value),
              });
            }}
          />
        </label>
      </div>

      <div
        class={clx({
          "opacity-50": primaryImage() === undefined,
        })}
      >
        <For each={Object.keys(colorSchemes) as ColorScheme[]}>
          {scheme => (
            <button
              class="border p-2"
              onClick={async () => {
                const imgs = await splitColorspace(
                  scheme,
                  images()[primaryImage()!]
                );

                setOutputs([...outputs(), ...imgs]);
              }}
              disabled={primaryImage() === undefined}
            >
              {colorSchemes[scheme]}
            </button>
          )}
        </For>
      </div>

      <div
        class={clx({
          "opacity-50": primaryImage() === undefined,
        })}
      >
        <For each={Object.keys(pseudoColorizations) as PseudoColorization[]}>
          {pseudoColor => (
            <button
              class="border p-2"
              onClick={async () => {
                const img = await pseudoColorize(
                  pseudoColor,
                  images()[primaryImage()!]
                );

                setOutputs([...outputs(), img]);
              }}
              disabled={primaryImage() === undefined}
            >
              Pseudo-colorization: {pseudoColorizations[pseudoColor]}
            </button>
          )}
        </For>
      </div>

      <div>
        <div>
          <For each={Object.keys(enhancements) as Enhancement[]}>
            {en => (
              <button
                class={clx("border p-2", {
                  "bg-blue-500": selectedEnhancement() === en,
                })}
                onClick={() => setSelectedEnhancement(en)}
              >
                {enhancements[en]}
              </button>
            )}
          </For>
        </div>

        <div>
          <Switch>
            <Match when={selectedEnhancement() === "interval"}>
              <label>
                Min:
                <input
                  type="number"
                  value={enhancementCfg.interval.min}
                  onInput={e => {
                    setEnhancementCfg(
                      "interval",
                      "min",
                      Number(e.currentTarget.value)
                    );
                  }}
                  min={0}
                  max={255}
                />
              </label>
              <label>
                Max:
                <input
                  type="number"
                  value={enhancementCfg.interval.max}
                  onInput={e => {
                    setEnhancementCfg(
                      "interval",
                      "max",
                      Number(e.currentTarget.value)
                    );
                  }}
                  min={0}
                  max={255}
                />
              </label>
            </Match>
            <Match when={selectedEnhancement() === "multiple-parts"}>
              <For each={enhancementCfg.multipleParts}>
                {(part, i) => (
                  <div>
                    <label>
                      F Min:
                      <input
                        type="number"
                        value={part.from.min}
                        onInput={e => {
                          setEnhancementCfg(
                            "multipleParts",
                            i(),
                            "from",
                            "min",
                            Number(e.currentTarget.value)
                          );
                        }}
                        min={0}
                        max={255}
                      />
                    </label>
                    <label>
                      F Max:
                      <input
                        type="number"
                        value={part.from.max}
                        onInput={e => {
                          setEnhancementCfg(
                            "multipleParts",
                            i(),
                            "from",
                            "max",
                            Number(e.currentTarget.value)
                          );
                        }}
                        min={0}
                        max={255}
                      />
                    </label>
                    <label>
                      G Min:
                      <input
                        type="number"
                        value={part.to.min}
                        onInput={e => {
                          setEnhancementCfg(
                            "multipleParts",
                            i(),
                            "to",
                            "min",
                            Number(e.currentTarget.value)
                          );
                        }}
                        min={0}
                        max={255}
                      />
                    </label>
                    <label>
                      G Max:
                      <input
                        type="number"
                        value={part.to.max}
                        onInput={e => {
                          setEnhancementCfg(
                            "multipleParts",
                            i(),
                            "to",
                            "max",
                            Number(e.currentTarget.value)
                          );
                        }}
                        min={0}
                        max={255}
                      />
                    </label>
                    <button
                      class="border p-2 bg-red-500 text-white rounded"
                      onClick={() => {
                        setEnhancementCfg(
                          "multipleParts",
                          enhancementCfg.multipleParts.filter(
                            (_, j) => j !== i()
                          )
                        );
                      }}
                    >
                      X
                    </button>
                  </div>
                )}
              </For>
              <button
                class="border p-2 bg-blue-500 text-white rounded"
                onClick={() => {
                  setEnhancementCfg("multipleParts", [
                    ...enhancementCfg.multipleParts,
                    {
                      from: {
                        min: enhancementCfg.multipleParts.reduce(
                          (acc, curr) => Math.max(acc, curr.from.max),
                          0
                        ),
                        max: 255,
                      },
                      to: {
                        min: enhancementCfg.multipleParts.reduce(
                          (acc, curr) => Math.max(acc, curr.to.max),
                          0
                        ),
                        max: 255,
                      },
                    },
                  ]);
                }}
              >
                Add part
              </button>
            </Match>
            <Match when={selectedEnhancement() === "binary"}>
              <label>
                Threshold:
                <input
                  type="number"
                  value={enhancementCfg.binary.threshold}
                  onInput={e => {
                    setEnhancementCfg(
                      "binary",
                      "threshold",
                      Number(e.currentTarget.value)
                    );
                  }}
                  min={0}
                  max={255}
                />
              </label>
            </Match>
          </Switch>
        </div>
        <div>
          <button
            class={clx("border p-2", {
              "opacity-50": primaryImage() === undefined,
            })}
            onClick={async () => {
              const img = await enhance(
                selectedEnhancement(),
                images()[primaryImage()!],
                enhancementCfg
              );

              setOutputs([...outputs(), img]);
            }}
            disabled={primaryImage() === undefined}
          >
            Aplicar
          </button>
        </div>
      </div>

      <Show when={outputs()}>
        {outputs => (
          <ul class="flex gap-2 p-2 flex-wrap max-w-full">
            <For each={[...outputs()]}>
              {img => (
                <li class="relative group" title={`${img.width}x${img.height}`}>
                  <button
                    class="absolute top-0 right-0 py-1 px-2 border rounded bg-white text-red-500 font-bold hidden group-hover:block"
                    onClick={() => {
                      setOutputs(outputs().filter(i => i !== img));
                    }}
                  >
                    X
                  </button>

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

export default App;
