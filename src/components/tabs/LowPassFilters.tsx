import { Component, For } from "solid-js";
import { createStore } from "solid-js/store";
import { Img } from "../../utils/img";
import {
  LowPassFilter,
  LowPassFilterConfig,
  lowPassFilter,
  lowPassFilters,
} from "../../utils/img/lowPassFilter";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";
import { Input } from "../Input";

type Props = {
  image?: Img;
  onOutput: (img: Img) => void;
};

export const LowPassFilters: Component<Props> = props => {
  const [lowPassFilterCfg, setLowPassFilterCfg] = createStore<LowPassFilterConfig>({
    matrixSize: 3,
  });

  return (
    <Collapsible title="Filtros passa-baixa">
      <div class="flex gap-2 p-2">
        <Input
          int
          label="Tamanho da Matriz"
          value={lowPassFilterCfg.matrixSize}
          onInput={matrixSize => setLowPassFilterCfg("matrixSize", matrixSize)}
          min={1}
        />
      </div>
      <div class="flex flex-col gap-1 p-2">
        <For each={Object.keys(lowPassFilters) as LowPassFilter[]}>
          {f => (
            <Button
              class="w-full"
              onClick={() => {
                const img = lowPassFilter(f, props.image!, lowPassFilterCfg);
                props.onOutput(img);
              }}
              disabled={!props.image}
            >
              {lowPassFilters[f]}
            </Button>
          )}
        </For>
      </div>
    </Collapsible>
  );
};
