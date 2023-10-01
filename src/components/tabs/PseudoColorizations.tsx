import { Component, For } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { Img } from "../../utils/img";
import {
  PseudoColorization,
  PseudoColorizationConfig,
  pseudoColorizations,
  pseudoColorize,
} from "../../utils/img/pseudoColor";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";
import { Input } from "../Input";

type Props = {
  image?: Img;
  onOutput: (img: Img) => void;
};

export const PseudoColorizations: Component<Props> = props => {
  const [pseudoColorCfg, setPseudoColorCfg] = createStore<PseudoColorizationConfig>({
    slices: [
      { min: 0, max: 85, color: [255, 0, 0] },
      { min: 85, max: 170, color: [0, 255, 0] },
      { min: 170, max: 255, color: [0, 0, 255] },
    ],
    redistribution: [
      { brightness: 255, color: [255, 0, 0] },
      { brightness: 127, color: [0, 255, 0] },
      { brightness: 0, color: [0, 0, 255] },
    ],
  });

  return (
    <Collapsible title="Pseudo-coloração">
      <div class="flex flex-col gap-1 p-2">
        <For each={Object.keys(pseudoColorizations) as PseudoColorization[]}>
          {pseudoColor => (
            <div class="bg-slate-100 shadow">
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
                    class="bg-blue-400 p-2 text-white hover:bg-blue-500"
                    onClick={() => {
                      const img = pseudoColorize(pseudoColor, props.image!, pseudoColorCfg);
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

type PseudoColorizationComponentProps = {
  cfg: PseudoColorizationConfig;
  setCfg: SetStoreFunction<PseudoColorizationConfig>;
};

const pseudoColorComponents = {
  densitySlicing: props => (
    <>
      <For each={props.cfg.slices}>
        {(slice, i) => (
          <div class="flex flex-col gap-1 bg-slate-50 p-1 shadow">
            <div class="flex flex-row gap-1">
              <Input
                int
                label="Min"
                value={slice.min}
                onInput={min => props.setCfg("slices", i(), "min", min)}
                min={0}
                max={255}
              />
              <Input
                int
                label="Max"
                value={slice.max}
                onInput={max => props.setCfg("slices", i(), "max", max)}
                min={0}
                max={255}
              />
            </div>
            <div class="flex flex-row gap-1">
              <Input
                int
                label="R"
                value={slice.color[0]}
                onInput={r => props.setCfg("slices", i(), "color", 0, r)}
                min={0}
                max={255}
              />
              <Input
                int
                label="G"
                value={slice.color[1]}
                onInput={g => props.setCfg("slices", i(), "color", 1, g)}
                min={0}
                max={255}
              />
              <Input
                int
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
        class="bg-green-400 text-white hover:bg-green-500"
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
  redistribution: props => (
    <>
      <For each={props.cfg.redistribution}>
        {(redistribution, i) => (
          <div class="flex flex-col gap-1 bg-slate-50 p-1 shadow">
            <div class="flex flex-row gap-1">
              <Input
                int
                label="Brilho"
                value={redistribution.brightness}
                onInput={br => props.setCfg("redistribution", i(), "brightness", br)}
                min={0}
                max={255}
              />
            </div>
            <div class="flex flex-row gap-1">
              <Input
                int
                label="R"
                value={redistribution.color[0]}
                onInput={r => props.setCfg("redistribution", i(), "color", 0, r)}
                min={0}
                max={255}
              />
              <Input
                int
                label="G"
                value={redistribution.color[1]}
                onInput={g => props.setCfg("redistribution", i(), "color", 1, g)}
                min={0}
                max={255}
              />
              <Input
                int
                label="B"
                value={redistribution.color[2]}
                onInput={b => props.setCfg("redistribution", i(), "color", 2, b)}
                min={0}
                max={255}
              />
            </div>
            <Button
              class="bg-red-400 p-2 text-white hover:bg-red-500"
              onClick={() => {
                props.setCfg(
                  "redistribution",
                  props.cfg.redistribution.filter((_, j) => j !== i())
                );
              }}
            >
              Remover substituição
            </Button>
          </div>
        )}
      </For>
      <Button
        class="bg-green-400 text-white hover:bg-green-500"
        onClick={() => {
          props.setCfg("redistribution", [
            ...props.cfg.redistribution,
            {
              brightness: props.cfg.redistribution.reduce(
                (acc, curr) => Math.max(acc, curr.brightness),
                0
              ),
              color: [0, 0, 0],
            },
          ]);
        }}
      >
        Adicionar substituição
      </Button>
    </>
  ),
} as const satisfies Record<PseudoColorization, Component<PseudoColorizationComponentProps>>;
