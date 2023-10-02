import { Component, Show, createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { Img } from "../../utils/img";
import { WatermarkConfig, watermark } from "../../utils/img/watermark";
import { Button } from "../Button";
import { Collapsible } from "../Collapsible";
import { Input } from "../Input";
import { TextInput } from "../TextInput";

type Props = {
  primaryImage?: Img;
  secondaryImage?: Img;
  onOutput: (img: Img) => void;
};

export const Watermark: Component<Props> = props => {
  const [config, setConfig] = createStore<WatermarkConfig>({
    color: [0, 0, 0],
    fontFamily: "Arial",
    text: "watermark",
    fontSize: 32,
    opacity: 0.5,
    rotate: 0,
    x: 0,
    y: 0,
    img: props.secondaryImage,
  });

  createEffect(() => {
    setConfig("img", props.secondaryImage);
  });

  const apply = () => {
    if (!props.primaryImage) return;

    const output = watermark(props.primaryImage, config);
    props.onOutput(output);
  };

  return (
    <Collapsible title="Marca d'água">
      <div class="flex flex-col gap-1 p-2">
        <Show when={!config.img}>
          <TextInput
            label="Texto"
            value={config.text}
            onInput={text => setConfig("text", text)}
            style={{ "font-family": config.fontFamily }}
          />
          <div class="flex gap-1">
            <TextInput
              label="Fonte"
              value={config.fontFamily}
              onInput={fontFamily => setConfig("fontFamily", fontFamily)}
              style={{ "font-family": config.fontFamily }}
            />
            <Input
              label="Tamanho da Fonte"
              int
              value={config.fontSize}
              onInput={fontSize => setConfig("fontSize", fontSize)}
            />
          </div>
          <Input
            label="Rotação (graus)"
            int
            value={config.rotate}
            onInput={rotate => setConfig("rotate", rotate)}
            min={-180}
            max={180}
          />
          <div class="flex gap-1">
            <Input
              label="R"
              int
              value={config.color[0]}
              onInput={color => setConfig("color", 0, color)}
              min={0}
              max={255}
            />
            <Input
              label="G"
              int
              value={config.color[1]}
              onInput={color => setConfig("color", 1, color)}
              min={0}
              max={255}
            />
            <Input
              label="B"
              int
              value={config.color[2]}
              onInput={color => setConfig("color", 2, color)}
              min={0}
              max={255}
            />
          </div>
        </Show>
        <Input
          label="Opacidade"
          float
          value={config.opacity}
          onInput={opacity => setConfig("opacity", opacity)}
          min={0}
          max={1}
        />
        <div class="flex gap-1">
          <Input label="X" int value={config.x} onInput={x => setConfig("x", x)} />
          <Input label="Y" int value={config.y} onInput={y => setConfig("y", y)} />
        </div>
        <Button class="bg-blue-400 p-2 text-white hover:bg-blue-500" onClick={apply}>
          Apply
        </Button>
      </div>
    </Collapsible>
  );
};
