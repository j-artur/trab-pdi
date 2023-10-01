import { Component, For, createSignal } from "solid-js";
import { Img } from "../../utils/img";
import { Zoom, ZoomConfig, zoom, zooms } from "../../utils/img/zoom";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";
import { Input } from "../Input";

type Props = {
  image?: Img;
  onOutput: (img: Img) => void;
};

export const Zooms: Component<Props> = props => {
  const [zoomCfg, setZoomCfg] = createSignal<ZoomConfig>({
    amount: 1,
  });

  return (
    <Collapsible title="Zoom">
      <div class="flex gap-2 p-2">
        <Input
          int
          label="Quantidade"
          value={zoomCfg().amount}
          onInput={amount => setZoomCfg({ amount })}
        />
      </div>
      <div class="flex flex-col gap-1 p-2">
        <For each={Object.keys(zooms) as Zoom[]}>
          {z => (
            <Button
              class="w-full"
              onClick={() => {
                const img = zoom(z, props.image!, zoomCfg());
                props.onOutput(img);
              }}
              disabled={!props.image}
            >
              {zooms[z]}
            </Button>
          )}
        </For>
      </div>
    </Collapsible>
  );
};
