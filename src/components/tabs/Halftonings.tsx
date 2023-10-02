import { Component, For } from "solid-js";
import { Img } from "../../utils/img";
import { Halftoning, halftone, halftonings } from "../../utils/img/halftoning";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";

type Props = {
  image?: Img;
  onOutput: (img: Img) => void;
};

export const Halftonings: Component<Props> = props => {
  return (
    <Collapsible title="Meios-tons">
      <div class="flex flex-col gap-1 p-2">
        <For each={Object.keys(halftonings) as Halftoning[]}>
          {ht => (
            <Button
              class="w-full"
              onClick={() => {
                const img = halftone(ht, props.image!);
                props.onOutput(img);
              }}
              disabled={!props.image}
            >
              {halftonings[ht]}
            </Button>
          )}
        </For>
      </div>
    </Collapsible>
  );
};
