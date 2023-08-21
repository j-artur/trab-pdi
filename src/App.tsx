import { XIcon } from "lucide-solid";
import { For, Match, Show, Switch, createEffect, createSignal, type Component } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { Button } from "./components/Button";
import { Checkbox } from "./components/Checkbox";
import { Collapsible } from "./components/Collapsible";
import { Input } from "./components/Input";
import { RadioGroup } from "./components/RadioGroup";
import { Thumbnail } from "./components/Thumbnail";
import { clx } from "./utils";
import { Img, getPixels } from "./utils/img";
import { ColorScheme, colorSchemes, splitColorspace } from "./utils/img/color";
import { Enhancement, EnhancementConfig, enhance, enhancements } from "./utils/img/enhancement";
import {
  Operation,
  OperationConfig,
  operate,
  operationConfigs,
  operations,
} from "./utils/img/operation";
import {
  PseudoColorization,
  PseudoColorizationConfig,
  pseudoColorizations,
  pseudoColorize,
} from "./utils/img/pseudoColor";
import {
  Transformation,
  TransformationConfig,
  transform,
  transformationConfigs,
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
  const [pseudoColorCfg, setPseudoColorCfg] = createStore<PseudoColorizationConfig>({
    slices: [
      { min: 0, max: 85, color: [255, 0, 0] },
      { min: 85, max: 170, color: [0, 255, 0] },
      { min: 170, max: 255, color: [0, 0, 255] },
    ],
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

  let inputEl: HTMLInputElement | null = null;

  return (
    <div class="flex h-full w-full flex-row">
      <aside class="flex w-96 flex-none flex-col gap-1 overflow-y-auto bg-slate-200">
        <Collapsible title="Operações">
          <div class="p-2">
            <RadioGroup
              values={Object.keys(operationConfigs) as OperationConfig["onOutOfRange"][]}
              selected={opCfg().onOutOfRange}
              onInput={onOutOfRange => setOpCfg({ onOutOfRange })}
              label={onOutOfRange => operationConfigs[onOutOfRange]}
            />
          </div>
          <div class="flex flex-col gap-1 p-2">
            <For each={Object.keys(operations) as Operation[]}>
              {op => (
                <Button
                  class="w-full"
                  onClick={async () => {
                    const img = await operate(
                      op,
                      images()[primaryImage()!],
                      images()[secondaryImage()!],
                      opCfg()
                    );
                    setOutputs([...outputs(), img]);
                  }}
                  disabled={primaryImage() === undefined || secondaryImage() === undefined}
                >
                  {operations[op]}
                </Button>
              )}
            </For>
          </div>
        </Collapsible>
        <Collapsible title="Transformações">
          <div class="p-2">
            <RadioGroup
              values={Object.keys(transformationConfigs) as TransformationConfig["onOutOfRange"][]}
              selected={transformCfg.onOutOfRange}
              onInput={onOutOfRange => {
                setTransformCfg("onOutOfRange", onOutOfRange);
              }}
              label={onOutOfRange => transformationConfigs[onOutOfRange]}
            />
          </div>
          <div class="flex flex-col gap-1 p-2">
            <For each={Object.keys(transformations) as Transformation[]}>
              {tr => (
                <Collapsible title={transformations[tr]}>
                  <div class="flex flex-col gap-2 p-2">
                    <Dynamic
                      component={transformationComponents[tr]}
                      cfg={transformCfg}
                      setCfg={setTransformCfg}
                      primaryImage={images()[primaryImage()!]}
                    />
                    <Button
                      onClick={async () => {
                        const img = await transform(tr, images()[primaryImage()!], transformCfg);
                        setOutputs([...outputs(), img]);
                      }}
                      disabled={primaryImage() === undefined}
                    >
                      Aplicar
                    </Button>
                  </div>
                </Collapsible>
              )}
            </For>
          </div>
        </Collapsible>
        <Collapsible title="Zoom">
          <div class="flex gap-2 p-2">
            <Input
              label="Quantidade"
              value={zoomCfg().amount}
              onInput={amount => setZoomCfg({ amount })}
            />
          </div>
          <div class="flex flex-col gap-1 p-2">
            <For each={Object.keys(zooms) as Zoom[]}>
              {z => (
                <Button
                  class="w-full"
                  onClick={async () => {
                    const img = await zoom(z, images()[primaryImage()!], zoomCfg());
                    setOutputs([...outputs(), img]);
                  }}
                  disabled={primaryImage() === undefined}
                >
                  {zooms[z]}
                </Button>
              )}
            </For>
          </div>
        </Collapsible>
        <Collapsible title="Esquemas de cores">
          <div class="flex flex-col gap-1 p-2">
            <For each={Object.keys(colorSchemes) as ColorScheme[]}>
              {scheme => (
                <Button
                  class="w-full"
                  onClick={async () => {
                    const imgs = await splitColorspace(scheme, images()[primaryImage()!]);
                    setOutputs([...outputs(), ...imgs]);
                  }}
                  disabled={primaryImage() === undefined}
                >
                  {colorSchemes[scheme]}
                </Button>
              )}
            </For>
          </div>
        </Collapsible>
        <Collapsible title="Pseudo-colorização">
          <div class="flex flex-col gap-1 p-2">
            <For each={Object.keys(pseudoColorizations) as PseudoColorization[]}>
              {pseudoColor => (
                <Show
                  when={pseudoColor in pseudoColorComponents}
                  fallback={
                    <Button
                      onClick={async () => {
                        const img = await pseudoColorize(
                          pseudoColor,
                          images()[primaryImage()!],
                          pseudoColorCfg
                        );
                        setOutputs([...outputs(), img]);
                      }}
                      disabled={primaryImage() === undefined}
                    >
                      {pseudoColorizations[pseudoColor]}
                    </Button>
                  }
                >
                  <Collapsible title={pseudoColorizations[pseudoColor]}>
                    <div class="flex flex-col gap-2 p-2">
                      <Dynamic
                        component={
                          pseudoColorComponents[pseudoColor as keyof typeof pseudoColorComponents]
                        }
                        cfg={pseudoColorCfg}
                        setCfg={setPseudoColorCfg}
                      />
                      <Button
                        onClick={async () => {
                          const img = await pseudoColorize(
                            pseudoColor,
                            images()[primaryImage()!],
                            pseudoColorCfg
                          );
                          setOutputs([...outputs(), img]);
                        }}
                        disabled={primaryImage() === undefined}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </Collapsible>
                </Show>
              )}
            </For>
          </div>
        </Collapsible>
        <Collapsible title="Realce">
          <div class="flex flex-col gap-1 p-2">
            <For each={Object.keys(enhancements) as Enhancement[]}>
              {en => (
                <Show
                  when={en in enhancementComponents}
                  fallback={
                    <Button
                      onClick={async () => {
                        const img = await enhance(en, images()[primaryImage()!], enhancementCfg);
                        setOutputs([...outputs(), img]);
                      }}
                      disabled={primaryImage() === undefined}
                    >
                      {enhancements[en]}
                    </Button>
                  }
                >
                  <Collapsible title={enhancements[en]}>
                    <div class="flex flex-col gap-2 p-2">
                      <Dynamic
                        component={enhancementComponents[en as keyof typeof enhancementComponents]}
                        cfg={enhancementCfg}
                        setCfg={setEnhancementCfg}
                      />
                      <Button
                        onClick={async () => {
                          const img = await enhance(en, images()[primaryImage()!], enhancementCfg);
                          setOutputs([...outputs(), img]);
                        }}
                        disabled={primaryImage() === undefined}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </Collapsible>
                </Show>
              )}
            </For>
          </div>
        </Collapsible>
      </aside>
      <div class="h-full w-full overflow-y-scroll bg-slate-100 p-2">
        <div class="flex min-h-[50%] flex-col gap-2">
          <div>
            <input
              type="file"
              multiple
              onInput={e => {
                loadImages([...(e.currentTarget.files ?? [])]);
                e.currentTarget.value = "";
              }}
              accept="image/*,.pgm"
              hidden
              ref={ref => (inputEl = ref)}
            />

            <button
              class="self-start rounded border p-2"
              onClick={e => {
                e.preventDefault();
                inputEl?.click();
              }}
            >
              Adicionar Imagens
            </button>
          </div>
          <ul class="flex h-full max-w-full flex-row flex-wrap items-start gap-2 p-2">
            <For each={images()}>
              {img => (
                <li
                  class={clx("group relative rounded border-2 border-transparent", {
                    "border-blue-500": images().indexOf(img) === primaryImage(),
                    "border-orange-500": images().indexOf(img) === secondaryImage(),
                    "border-b-orange-500 border-l-blue-500 border-r-orange-500 border-t-blue-500":
                      images().indexOf(img) === primaryImage() &&
                      images().indexOf(img) === secondaryImage(),
                  })}
                  onClick={e => {
                    if (e.ctrlKey) {
                      if (secondaryImage() === images().indexOf(img)) {
                        setSecondaryImage(undefined);
                      } else {
                        setSecondaryImage(images().indexOf(img));
                      }
                    } else {
                      if (primaryImage() === images().indexOf(img)) {
                        setPrimaryImage(undefined);
                      } else {
                        setPrimaryImage(images().indexOf(img));
                      }
                    }
                  }}
                  title={`${img.width}x${img.height}`}
                >
                  <div class="absolute right-0 top-0 hidden p-1 group-hover:block">
                    <Button onClick={() => setImages(images().filter(i => i !== img))}>
                      <XIcon class="text-red-500" />
                    </Button>
                  </div>
                  <Thumbnail img={img} />
                </li>
              )}
            </For>
          </ul>
        </div>
        <div class="flex min-h-[50%] flex-col gap-2">
          <div>
            <h2 class="p-2 text-xl font-bold text-slate-900">Saídas</h2>
          </div>
          <ul class="flex h-full max-w-full flex-row flex-wrap items-start gap-2 p-2">
            <For each={outputs()}>
              {img => (
                <li class="group relative" title={`${img.width}x${img.height}`}>
                  <div class="absolute right-0 top-0 hidden p-1 group-hover:block">
                    <Button onClick={() => setOutputs(outputs().filter(i => i !== img))}>
                      <XIcon class="text-red-500" />
                    </Button>
                  </div>

                  <Thumbnail img={img} />
                </li>
              )}
            </For>
          </ul>
        </div>
      </div>
    </div>
  );
};

type TransformationComponentProps = {
  primaryImage?: Img;
  cfg: TransformationConfig;
  setCfg: SetStoreFunction<TransformationConfig>;
};

const transformationComponents = {
  translate: props => (
    <>
      <Input
        label="X"
        value={props.cfg.translate.x}
        onInput={x => props.setCfg("translate", "x", x)}
        min={-props.primaryImage?.width!}
        max={props.primaryImage?.width}
      />
      <Input
        label="Y"
        value={props.cfg.translate.y}
        onInput={y => props.setCfg("translate", "y", y)}
        min={-props.primaryImage?.height!}
        max={props.primaryImage?.height}
      />
    </>
  ),
  rotate: props => (
    <>
      <Input
        label="X Origem"
        value={props.cfg.rotate.origin.x}
        onInput={x => props.setCfg("rotate", "origin", "x", x)}
        min={0}
        max={props.primaryImage?.width}
      />
      <Input
        label="Y Origem"
        value={props.cfg.rotate.origin.y}
        onInput={y => props.setCfg("rotate", "origin", "y", y)}
        min={0}
        max={props.primaryImage?.height}
      />
      <Input
        label="Ângulo"
        value={props.cfg.rotate.angle}
        onInput={angle => props.setCfg("rotate", "angle", angle)}
        min={0}
        max={360}
      />
    </>
  ),
  scale: props => (
    <>
      <Input label="X" value={props.cfg.scale.x} onInput={x => props.setCfg("scale", "x", x)} />
      <Input label="Y" value={props.cfg.scale.y} onInput={y => props.setCfg("scale", "y", y)} />
    </>
  ),
  reflect: props => (
    <>
      <Checkbox
        label="X"
        checked={props.cfg.reflect.x}
        onInput={x => props.setCfg("reflect", "x", x)}
      />
      <Checkbox
        label="Y"
        checked={props.cfg.reflect.y}
        onInput={y => props.setCfg("reflect", "y", y)}
      />
    </>
  ),
  shear: props => (
    <>
      <Input label="X" value={props.cfg.shear.x} onInput={x => props.setCfg("shear", "x", x)} />
      <Input label="Y" value={props.cfg.shear.y} onInput={y => props.setCfg("shear", "y", y)} />
    </>
  ),
} as const satisfies Record<Transformation, Component<TransformationComponentProps>>;

type PseudoColorizationComponentProps = {
  cfg: PseudoColorizationConfig;
  setCfg: SetStoreFunction<PseudoColorizationConfig>;
};

const pseudoColorComponents = {
  densitySlicing: props => (
    <>
      <For each={props.cfg.slices}>
        {(slice, i) => (
          <div class="flex flex-col gap-1 p-1">
            <div class="flex flex-row gap-1">
              <Input
                label="Min"
                value={slice.min}
                onInput={min => props.setCfg("slices", i(), "min", min)}
                min={0}
                max={255}
              />
              <Input
                label="Max"
                value={slice.max}
                onInput={max => props.setCfg("slices", i(), "max", max)}
                min={0}
                max={255}
              />
            </div>
            <div class="flex flex-row gap-1">
              <Input
                label="R"
                value={slice.color[0]}
                onInput={r => props.setCfg("slices", i(), "color", 0, r)}
                min={0}
                max={255}
              />
              <Input
                label="G"
                value={slice.color[1]}
                onInput={g => props.setCfg("slices", i(), "color", 1, g)}
                min={0}
                max={255}
              />
              <Input
                label="B"
                value={slice.color[2]}
                onInput={b => props.setCfg("slices", i(), "color", 2, b)}
                min={0}
                max={255}
              />
            </div>
            <Button
              class="bg-red-400 p-2 text-white hover:bg-red-500"
              onClick={() => {
                props.setCfg(
                  "slices",
                  props.cfg.slices.filter((_, j) => j !== i())
                );
              }}
            >
              Remover fatia
            </Button>
          </div>
        )}
      </For>
      <Button
        class="bg-blue-400 p-2 text-white hover:bg-blue-500"
        onClick={() => {
          props.setCfg("slices", [
            ...props.cfg.slices,
            {
              min: props.cfg.slices.reduce((acc, curr) => Math.max(acc, curr.max), 0),
              max: 255,
              color: [0, 0, 0],
            },
          ]);
        }}
      >
        Adicionar fatia
      </Button>
    </>
  ),
} as const satisfies Partial<
  Record<PseudoColorization, Component<PseudoColorizationComponentProps>>
>;

type EnhancementComponentProps = {
  cfg: EnhancementConfig;
  setCfg: SetStoreFunction<EnhancementConfig>;
};

const enhancementComponents = {
  interval: props => (
    <>
      <Input
        label="Min"
        value={props.cfg.interval.min}
        onInput={min => props.setCfg("interval", "min", min)}
        min={0}
        max={255}
      />
      <Input
        label="Max"
        value={props.cfg.interval.max}
        onInput={max => props.setCfg("interval", "max", max)}
        min={0}
        max={255}
      />
    </>
  ),
  multipleParts: props => (
    <>
      <For each={props.cfg.multipleParts}>
        {(part, i) => (
          <div class="flex flex-col gap-1 p-1">
            <div class="flex flex-row gap-1">
              <Input
                label="F Min"
                value={part.from.min}
                onInput={min => props.setCfg("multipleParts", i(), "from", "min", min)}
                min={0}
                max={255}
              />
              <Input
                label="G Min"
                value={part.to.min}
                onInput={min => props.setCfg("multipleParts", i(), "to", "min", min)}
                min={0}
                max={255}
              />
            </div>
            <div class="flex flex-row gap-1">
              <Input
                label="F Max"
                value={part.from.max}
                onInput={max => props.setCfg("multipleParts", i(), "from", "max", max)}
                min={0}
                max={255}
              />
              <Input
                label="G Max"
                value={part.to.max}
                onInput={max => props.setCfg("multipleParts", i(), "to", "max", max)}
                min={0}
                max={255}
              />
            </div>
            <Button
              class="bg-red-400 p-2 text-white hover:bg-red-500"
              onClick={() => {
                props.setCfg(
                  "multipleParts",
                  props.cfg.multipleParts.filter((_, j) => j !== i())
                );
              }}
            >
              Remover parte
            </Button>
          </div>
        )}
      </For>
      <Button
        class="bg-blue-400 p-2 text-white hover:bg-blue-500"
        onClick={() => {
          props.setCfg("multipleParts", [
            ...props.cfg.multipleParts,
            {
              from: {
                min: props.cfg.multipleParts.reduce((acc, curr) => Math.max(acc, curr.from.max), 0),
                max: 255,
              },
              to: {
                min: props.cfg.multipleParts.reduce((acc, curr) => Math.max(acc, curr.to.max), 0),
                max: 255,
              },
            },
          ]);
        }}
      >
        Adicionar parte
      </Button>
    </>
  ),
  binary: props => (
    <Input
      label="Limite"
      value={props.cfg.binary.threshold}
      onInput={threshold => props.setCfg("binary", "threshold", threshold)}
      min={0}
      max={255}
    />
  ),
} as const satisfies Partial<Record<Enhancement, Component<EnhancementComponentProps>>>;

export default App;
