import { Component, For, Show, createSignal } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { Img } from "../../utils/img";
import {
  HighPassFilter,
  HighPassFilterConfig,
  highPassFilter,
  highPassFilters,
} from "../../utils/img/highPassFilter";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";
import { Input } from "../Input";
import { Dynamic } from "solid-js/web";

type Props = {
  image?: Img;
  onOutput: (img: Img) => void;
};

export const HighPassFilters: Component<Props> = props => {
  const [highPassFilterCfg, setHighPassFilterCfg] = createStore<HighPassFilterConfig>({
    boostFactor: 1,
  });

  return (
    <Collapsible title="Filtro passa-alta">
      <div class="flex flex-col gap-1 p-2">
        <For each={Object.keys(highPassFilters) as HighPassFilter[]}>
          {f => (
            <Show
              when={f in highPassFilterComponents}
              fallback={
                <Button
                  onClick={() => {
                    const img = highPassFilter(f, props.image!, highPassFilterCfg);
                    props.onOutput(img);
                  }}
                  disabled={!props.image}
                >
                  {highPassFilters[f]}
                </Button>
              }
            >
              <div class="bg-slate-100 shadow">
                <Collapsible title={highPassFilters[f]}>
                  <div class="flex flex-col gap-2 p-2">
                    <Dynamic
                      component={
                        highPassFilterComponents[f as keyof typeof highPassFilterComponents]
                      }
                      cfg={highPassFilterCfg}
                      setCfg={setHighPassFilterCfg}
                    />
                    <Button
                      class="bg-blue-400 p-2 text-white hover:bg-blue-500"
                      onClick={() => {
                        const img = highPassFilter(f, props.image!, highPassFilterCfg);
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

type HighPassFilterComponentProps = {
  cfg: HighPassFilterConfig;
  setCfg: SetStoreFunction<HighPassFilterConfig>;
};

const highPassFilterComponents = {
  highBoost: (props: HighPassFilterComponentProps) => (
    <Input
      int
      label="Fator de Reforço"
      value={props.cfg.boostFactor}
      onInput={boostFactor => props.setCfg("boostFactor", boostFactor)}
    />
  ),
} as const satisfies Partial<Record<HighPassFilter, Component<HighPassFilterComponentProps>>>;
