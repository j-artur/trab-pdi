import { Component, For } from "solid-js";
import { Img } from "../../utils/img";
import { ColorScheme, colorSchemes, splitColorspace } from "../../utils/img/color";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";

type Props = {
  image?: Img;
  onOutput: (imgs: Img[]) => void;
};

export const ColorSchemes: Component<Props> = props => {
  return (
    <Collapsible title="Esquemas de cores">
      <div class="flex flex-col gap-1 p-2">
        <For each={Object.keys(colorSchemes) as ColorScheme[]}>
          {scheme => (
            <Button
              class="w-full"
              onClick={() => {
                const imgs = splitColorspace(scheme, props.image!);
                props.onOutput(imgs);
              }}
              disabled={!props.image}
            >
              {colorSchemes[scheme]}
            </Button>
          )}
        </For>
      </div>
    </Collapsible>
  );
};
