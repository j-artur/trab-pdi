import { Component, For, createSignal } from "solid-js";
import { Img } from "../../utils/img";
import {
  Operation,
  OperationConfig,
  operate,
  operationConfigs,
  operations,
} from "../../utils/img/operation";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";
import { RadioGroup } from "../RadioGroup";

type Props = {
  primaryImage?: Img;
  secondaryImage?: Img;
  onOutput: (img: Img) => void;
};

export const Operations: Component<Props> = props => {
  const [opCfg, setOpCfg] = createSignal<OperationConfig>({
    onOutOfRange: "clamp",
  });

  return (
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
                const img = await operate(op, props.primaryImage!, props.secondaryImage!, opCfg());
                props.onOutput(img);
              }}
              disabled={!props.primaryImage || !props.secondaryImage}
            >
              {operations[op]}
            </Button>
          )}
        </For>
      </div>
    </Collapsible>
  );
};
