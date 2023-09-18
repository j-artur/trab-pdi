import { Component, For, createEffect } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { Img } from "../../utils/img";
import {
  Transformation,
  TransformationConfig,
  transform,
  transformationConfigs,
  transformations,
} from "../../utils/img/transformation";
import { Button } from "../Button";
import { Checkbox } from "../Checkbox";
import { Collapsible } from "../Collapsible";
import { Input } from "../Input";
import { RadioGroup } from "../RadioGroup";

type Props = {
  image?: Img;
  onOutput: (img: Img) => void;
};

export const Transformations: Component<Props> = props => {
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

  createEffect(() => {
    if (props.image) {
      setTransformCfg("translate", "x", Math.floor(props.image.width / 2));
      setTransformCfg("translate", "y", Math.floor(props.image.height / 2));
      setTransformCfg("rotate", "origin", "x", Math.floor(props.image.width / 2));
      setTransformCfg("rotate", "origin", "y", Math.floor(props.image.height / 2));
    }
  });

  return (
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
            <div class="bg-slate-100 shadow">
              <Collapsible title={transformations[tr]}>
                <div class="flex flex-col gap-2 p-2">
                  <Dynamic
                    component={transformationComponents[tr]}
                    cfg={transformCfg}
                    setCfg={setTransformCfg}
                    primaryImage={props.image!}
                  />
                  <Button
                    class="bg-blue-400 p-2 text-white hover:bg-blue-500"
                    onClick={async () => {
                      const img = await transform(tr, props.image!, transformCfg);
                      props.onOutput(img);
                    }}
                    disabled={!props.image}
                  >
                    Aplicar
                  </Button>
                </div>
              </Collapsible>
            </div>
          )}
        </For>
      </div>
    </Collapsible>
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
        int
        label="X"
        value={props.cfg.translate.x}
        onInput={x => props.setCfg("translate", "x", x)}
        min={-props.primaryImage?.width!}
        max={props.primaryImage?.width}
      />
      <Input
        int
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
        int
        label="X Origem"
        value={props.cfg.rotate.origin.x}
        onInput={x => props.setCfg("rotate", "origin", "x", x)}
        min={0}
        max={props.primaryImage?.width}
      />
      <Input
        int
        label="Y Origem"
        value={props.cfg.rotate.origin.y}
        onInput={y => props.setCfg("rotate", "origin", "y", y)}
        min={0}
        max={props.primaryImage?.height}
      />
      <Input
        float
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
      <Input
        float
        label="X"
        value={props.cfg.scale.x}
        onInput={x => props.setCfg("scale", "x", x)}
      />
      <Input
        float
        label="Y"
        value={props.cfg.scale.y}
        onInput={y => props.setCfg("scale", "y", y)}
      />
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
      <Input
        float
        label="X"
        value={props.cfg.shear.x}
        onInput={x => props.setCfg("shear", "x", x)}
        min={-1}
        max={1}
      />
      <Input
        float
        label="Y"
        value={props.cfg.shear.y}
        onInput={y => props.setCfg("shear", "y", y)}
        min={-1}
        max={1}
      />
    </>
  ),
} as const satisfies Record<Transformation, Component<TransformationComponentProps>>;
