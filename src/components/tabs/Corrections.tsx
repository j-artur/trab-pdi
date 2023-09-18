import { Component, For, Setter, Show } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { Img } from "../../utils/img";
import { Correction, CorrectionConfig, correct, corrections } from "../../utils/img/correction";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";
import { Input } from "../Input";

type Props = {
  image?: Img;
  onOutput: (img: Img) => void;
};

export const Corrections: Component<Props> = props => {
  const [correctionCfg, setCorrectionCfg] = createStore<CorrectionConfig>({
    gammaFactor: 1,
  });

  return (
    <Collapsible title="Correções">
      <div class="flex flex-col gap-1 p-2">
        <For each={Object.keys(corrections) as Correction[]}>
          {cr => (
            <Show
              when={cr in correctionComponents}
              fallback={
                <Button
                  onClick={async () => {
                    const img = await correct(cr, props.image!, correctionCfg);
                    props.onOutput(img);
                  }}
                  disabled={!props.image}
                >
                  {corrections[cr]}
                </Button>
              }
            >
              <div class="bg-slate-100 shadow">
                <Collapsible title={corrections[cr]}>
                  <div class="flex flex-col gap-2 p-2">
                    <Dynamic
                      component={correctionComponents[cr as keyof typeof correctionComponents]}
                      cfg={correctionCfg}
                      setCfg={setCorrectionCfg}
                    />
                    <Button
                      class="bg-blue-400 p-2 text-white hover:bg-blue-500"
                      onClick={async () => {
                        const img = await correct(cr, props.image!, correctionCfg);
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

type CorrectionComponentProps = {
  cfg: CorrectionConfig;
  setCfg: SetStoreFunction<CorrectionConfig>;
};

const correctionComponents = {
  gammaCorrection: props => (
    <>
      <Input
        float
        label="Fator Gama"
        value={props.cfg.gammaFactor}
        onInput={gammaFactor => props.setCfg("gammaFactor", gammaFactor)}
        min={0}
      />
    </>
  ),
} as const satisfies Partial<Record<Correction, Component<CorrectionComponentProps>>>;
