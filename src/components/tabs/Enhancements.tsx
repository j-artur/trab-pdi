import { Component, For, Show } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { Img } from "../../utils/img";
import { Enhancement, EnhancementConfig, enhance, enhancements } from "../../utils/img/enhancement";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";
import { Input } from "../Input";

type Props = {
  image?: Img;
  onOutput: (img: Img) => void;
};

export const Enhancements: Component<Props> = props => {
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

  return (
    <Collapsible title="Realce">
      <div class="flex flex-col gap-1 p-2">
        <For each={Object.keys(enhancements) as Enhancement[]}>
          {en => (
            <Show
              when={en in enhancementComponents}
              fallback={
                <Button
                  onClick={async () => {
                    const img = await enhance(en, props.image!, enhancementCfg);
                    props.onOutput(img);
                  }}
                  disabled={!props.image}
                >
                  {enhancements[en]}
                </Button>
              }
            >
              <div class="bg-slate-100 shadow">
                <Collapsible title={enhancements[en]}>
                  <div class="flex flex-col gap-2 p-2">
                    <Dynamic
                      component={enhancementComponents[en as keyof typeof enhancementComponents]}
                      cfg={enhancementCfg}
                      setCfg={setEnhancementCfg}
                    />
                    <Button
                      class="bg-blue-400 p-2 text-white hover:bg-blue-500"
                      onClick={async () => {
                        const img = await enhance(en, props.image!, enhancementCfg);
                        props.onOutput(img);
                      }}
                      disabled={!props.image}
                    >
                      Aplicar
                    </Button>
                  </div>
                </Collapsible>
              </div>
            </Show>
          )}
        </For>
      </div>
    </Collapsible>
  );
};

type EnhancementComponentProps = {
  cfg: EnhancementConfig;
  setCfg: SetStoreFunction<EnhancementConfig>;
};

const enhancementComponents = {
  interval: props => (
    <>
      <Input
        int
        label="Min"
        value={props.cfg.interval.min}
        onInput={min => props.setCfg("interval", "min", min)}
        min={0}
        max={255}
      />
      <Input
        int
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
          <div class="flex flex-col gap-1 bg-slate-50 p-1 shadow">
            <div class="flex flex-row gap-1">
              <Input
                int
                label="F Min"
                value={part.from.min}
                onInput={min => props.setCfg("multipleParts", i(), "from", "min", min)}
                min={0}
                max={255}
              />
              <Input
                int
                label="F Max"
                value={part.from.max}
                onInput={max => props.setCfg("multipleParts", i(), "from", "max", max)}
                min={0}
                max={255}
              />
            </div>
            <div class="flex flex-row gap-1">
              <Input
                int
                label="G Min"
                value={part.to.min}
                onInput={min => props.setCfg("multipleParts", i(), "to", "min", min)}
                min={0}
                max={255}
              />
              <Input
                int
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
        class="bg-green-400 text-white hover:bg-green-500"
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
      int
      label="Limite"
      value={props.cfg.binary.threshold}
      onInput={threshold => props.setCfg("binary", "threshold", threshold)}
      min={0}
      max={255}
    />
  ),
} as const satisfies Partial<Record<Enhancement, Component<EnhancementComponentProps>>>;
