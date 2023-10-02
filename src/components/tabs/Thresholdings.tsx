import { Component, For } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { Img } from "../../utils/img";
import {
  Thresholding,
  ThresholdingConfig,
  threshold,
  thresholdings,
} from "../../utils/img/thresholding";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";
import { Input } from "../Input";

type Props = {
  image?: Img;
  onOutput: (imgs: Img) => void;
};

export const Thresholdings: Component<Props> = props => {
  const [thresholdingCfg, setThresholdingCfg] = createStore<ThresholdingConfig>({
    global: 127,
    windowSize: 3,
    k: 0.5,
  });

  return (
    <Collapsible title="Limiarização">
      <div class="flex flex-col gap-1 p-2">
        <For each={Object.keys(thresholdings) as Thresholding[]}>
          {s => (
            <div class="bg-slate-100 shadow">
              <Collapsible title={thresholdings[s]}>
                <div class="flex flex-col gap-2 p-2">
                  <Dynamic
                    component={thresholdingComponents[s as keyof typeof thresholdingComponents]}
                    cfg={thresholdingCfg}
                    setCfg={setThresholdingCfg}
                  />
                  <Button
                    class="bg-blue-400 p-2 text-white hover:bg-blue-500"
                    onClick={() => {
                      const img = threshold(s, props.image!, thresholdingCfg);
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

type ThresholdingComponentProps = {
  cfg: ThresholdingConfig;
  setCfg: SetStoreFunction<ThresholdingConfig>;
};

const thresholdingComponents = {
  global: props => (
    <Input
      label="Limiar"
      int
      min={0}
      max={255}
      value={props.cfg.global}
      onInput={global => props.setCfg("global", global)}
    />
  ),
  localMean: props => (
    <Input
      label="Tamanho da janela"
      int
      min={2}
      value={props.cfg.windowSize}
      onInput={windowSize => props.setCfg("windowSize", windowSize)}
    />
  ),
  localMedian: props => (
    <Input
      label="Tamanho da janela"
      int
      min={2}
      value={props.cfg.windowSize}
      onInput={windowSize => props.setCfg("windowSize", windowSize)}
    />
  ),
  localMinMax: props => (
    <Input
      label="Tamanho da janela"
      int
      min={2}
      value={props.cfg.windowSize}
      onInput={windowSize => props.setCfg("windowSize", windowSize)}
    />
  ),
  niblack: props => (
    <>
      <Input
        label="Tamanho da janela"
        int
        min={2}
        value={props.cfg.windowSize}
        onInput={windowSize => props.setCfg("windowSize", windowSize)}
      />
      <Input
        label="k"
        float
        min={0}
        max={1}
        value={props.cfg.k}
        onInput={k => props.setCfg("k", k)}
      />
    </>
  ),
} as const satisfies Record<Thresholding, Component<ThresholdingComponentProps>>;
