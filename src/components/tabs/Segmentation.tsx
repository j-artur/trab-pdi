import { Component, For } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { Img } from "../../utils/img";
import {
  BorderDetectionType,
  LineDetectionDirection,
  Segmentation,
  SegmentationConfig,
  borderDetectionTypes,
  lineDetectionDirections,
  segment,
  segmentations,
} from "../../utils/img/segmentation";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";
import { Input } from "../Input";
import { RadioGroup } from "../RadioGroup";

type Props = {
  image?: Img;
  onOutput: (imgs: Img) => void;
};

export const Segmentations: Component<Props> = props => {
  const [segmentationCfg, setSegmentationCfg] = createStore<SegmentationConfig>({
    dotDetection: {
      threshold: 127,
    },
    lineDetection: {
      direction: "horizontal",
    },
    borderDetection: {
      type: "roberts",
    },
    regionGrowing: {
      threshold: 20,
      seeds: 20,
    },
  });

  return (
    <Collapsible title="Segmentação">
      <div class="flex flex-col gap-1 p-2">
        <For each={Object.keys(segmentations) as Segmentation[]}>
          {s => (
            <div class="bg-slate-100 shadow">
              <Collapsible title={segmentations[s]}>
                <div class="flex flex-col gap-2 p-2">
                  <Dynamic
                    component={segmentationComponents[s as keyof typeof segmentationComponents]}
                    cfg={segmentationCfg}
                    setCfg={setSegmentationCfg}
                  />
                  <Button
                    class="bg-blue-400 p-2 text-white hover:bg-blue-500"
                    onClick={() => {
                      const img = segment(s, props.image!, segmentationCfg);
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

type SegmentationComponentProps = {
  image?: Img;
  cfg: SegmentationConfig;
  setCfg: SetStoreFunction<SegmentationConfig>;
};

const segmentationComponents = {
  dotDetection: props => (
    <Input
      label="Limiar"
      int
      min={0}
      max={255}
      value={props.cfg.dotDetection.threshold}
      onInput={threshold => props.setCfg("dotDetection", "threshold", threshold)}
    />
  ),
  lineDetection: props => (
    <RadioGroup
      values={Object.keys(lineDetectionDirections) as LineDetectionDirection[]}
      selected={props.cfg.lineDetection.direction}
      onInput={direction => {
        props.setCfg("lineDetection", "direction", direction);
      }}
      label={direction => lineDetectionDirections[direction]}
    />
  ),
  borderDetection: props => (
    <RadioGroup
      values={Object.keys(borderDetectionTypes) as BorderDetectionType[]}
      selected={props.cfg.borderDetection.type}
      onInput={type => {
        props.setCfg("borderDetection", "type", type);
      }}
      label={type => borderDetectionTypes[type]}
    />
  ),
  regionGrowing: props => (
    <>
      <Input
        label="Limiar"
        int
        min={1}
        value={props.cfg.regionGrowing.threshold}
        onInput={threshold => props.setCfg("regionGrowing", "threshold", threshold)}
      />
      <Input
        label="Sementes"
        int
        min={2}
        value={props.cfg.regionGrowing.seeds}
        onInput={seeds => props.setCfg("regionGrowing", "seeds", seeds)}
      />
    </>
  ),
} as const satisfies Record<Segmentation, Component<SegmentationComponentProps>>;
