import { Dialog } from "@kobalte/core";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartData,
  ChartOptions,
  Legend,
  Tooltip,
} from "chart.js";
import { BarChartIcon, XIcon } from "lucide-solid";
import { Bar } from "solid-chartjs";
import { For, Show, createEffect, createSignal, onMount, type Component } from "solid-js";
import { Button } from "./components/Button";
import { Thumbnail } from "./components/Thumbnail";
import { ColorSchemes } from "./components/tabs/ColorSchemes";
import { Enhancements } from "./components/tabs/Enhancements";
import { LowPassFilters } from "./components/tabs/LowPassFilters";
import { Operations } from "./components/tabs/Operations";
import { PseudoColorizations } from "./components/tabs/PseudoColorizations";
import { Transformations } from "./components/tabs/Transformations";
import { Zooms } from "./components/tabs/Zoom";
import { clx } from "./utils";
import { Img, generateHistogram, getPixels, simplifyHistogram } from "./utils/img";

const App: Component = () => {
  const [images, setImages] = createSignal<Img[]>([]);
  const [outputs, setOutputs] = createSignal<Img[]>([]);

  const [primaryImage, setPrimaryImage] = createSignal<number>();
  const [secondaryImage, setSecondaryImage] = createSignal<number>();

  const [selectedHistogram, setSelectedHistogram] = createSignal<number[]>();
  const [showHistogram, setShowHistogram] = createSignal(false);

  createEffect(() => {
    if (primaryImage()) {
      if (primaryImage()! < 0 || primaryImage()! >= images().length) {
        setPrimaryImage(undefined);
      }
    }
  });

  createEffect(() => {
    if (secondaryImage()) {
      if (secondaryImage()! < 0 || secondaryImage()! >= images().length) {
        setSecondaryImage(undefined);
      }
    }
  });

  async function loadImages(files: File[]) {
    const canvas = document.createElement("canvas");

    const imgs = await Promise.all(files.map(file => getPixels(file, canvas)));

    setImages([...images(), ...imgs]);
  }

  let inputEl: HTMLInputElement | null = null;

  const primaryImg = () => (primaryImage() !== undefined ? images()[primaryImage()!] : undefined);
  const secondaryImg = () =>
    secondaryImage() !== undefined ? images()[secondaryImage()!] : undefined;

  function handleOutput(imgs: Img | Img[]) {
    if (Array.isArray(imgs)) {
      setOutputs([...outputs(), ...imgs]);
    } else {
      setOutputs([...outputs(), imgs]);
    }
  }

  onMount(() => {
    Chart.register(Tooltip, Legend, BarController, CategoryScale, BarElement);
  });

  const chartOptions: ChartOptions = {
    responsive: true,
    aspectRatio: 16 / 9,
  };

  const chartData: (h: number[]) => ChartData = h => ({
    labels: Array.from(h.keys()).map(i => i.toString()),
    datasets: [
      {
        label: "Número de pixels",
        data: h,
      },
    ],
  });

  return (
    <div class="flex h-full w-full flex-row">
      <aside class="flex w-96 flex-none flex-col gap-1 overflow-y-scroll bg-slate-200">
        <Operations
          primaryImage={primaryImg()}
          secondaryImage={secondaryImg()}
          onOutput={handleOutput}
        />
        <Transformations image={primaryImg()} onOutput={handleOutput} />
        <Zooms image={primaryImg()} onOutput={handleOutput} />
        <ColorSchemes image={primaryImg()} onOutput={handleOutput} />
        <PseudoColorizations image={primaryImg()} onOutput={handleOutput} />
        <Enhancements image={primaryImg()} onOutput={handleOutput} />
        <LowPassFilters image={primaryImg()} onOutput={handleOutput} />
      </aside>
      <div class="h-full w-full overflow-y-scroll bg-slate-100 p-2">
        <Dialog.Root open={showHistogram()} onOpenChange={setShowHistogram}>
          <Dialog.Portal>
            <Dialog.Overlay class="absolute inset-0 bg-black opacity-20" />
            <Dialog.Content
              class="absolute inset-0 flex h-full w-full items-center justify-center"
              onClick={e => {
                if (e.currentTarget === e.target) {
                  setShowHistogram(false);
                }
              }}
            >
              <div class="flex flex-col items-center justify-center rounded bg-white p-2">
                <Dialog.CloseButton class="self-end">
                  <XIcon class="text-red-500" />
                </Dialog.CloseButton>
                <Show when={selectedHistogram()}>
                  {h => (
                    <Bar data={chartData(h())} options={chartOptions} width={1200} height={600} />
                  )}
                </Show>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
          <div class="flex min-h-[50%] flex-col gap-2">
            <div>
              <input
                type="file"
                multiple
                onInput={e => {
                  loadImages([...(e.currentTarget.files ?? [])]);
                  e.currentTarget.value = "";
                }}
                accept="image/*,.pgm"
                hidden
                ref={ref => (inputEl = ref)}
              />
              <Button
                class="self-start bg-blue-400 text-white hover:bg-blue-500"
                onClick={e => {
                  e.preventDefault();
                  inputEl?.click();
                }}
              >
                Adicionar Imagens
              </Button>
            </div>
            <ul class="flex h-full max-w-full flex-row flex-wrap items-start gap-2 p-2">
              <For each={images()}>
                {img => (
                  <li
                    class={clx("group relative rounded border-2 border-transparent", {
                      "border-blue-500": images().indexOf(img) === primaryImage(),
                      "border-orange-500": images().indexOf(img) === secondaryImage(),
                      "border-b-orange-500 border-l-blue-500 border-r-orange-500 border-t-blue-500":
                        images().indexOf(img) === primaryImage() &&
                        images().indexOf(img) === secondaryImage(),
                    })}
                    onClick={e => {
                      if (e.ctrlKey) {
                        if (secondaryImage() === images().indexOf(img)) {
                          setSecondaryImage(undefined);
                        } else {
                          setSecondaryImage(images().indexOf(img));
                        }
                      } else {
                        if (primaryImage() === images().indexOf(img)) {
                          setPrimaryImage(undefined);
                        } else {
                          setPrimaryImage(images().indexOf(img));
                        }
                      }
                    }}
                  >
                    <div class="absolute right-0 top-0 hidden p-1 group-hover:block">
                      <Button onClick={() => setImages(images().filter(i => i !== img))}>
                        <XIcon class="text-red-500" />
                      </Button>
                    </div>
                    <div class="absolute left-0 top-0 hidden p-1 group-hover:block">
                      <Button
                        onClick={() => {
                          console.log(img);
                          setSelectedHistogram(generateHistogram(img));
                          setShowHistogram(true);
                        }}
                      >
                        <BarChartIcon class="text-blue-500" />
                      </Button>
                    </div>
                    <Thumbnail img={img} />
                  </li>
                )}
              </For>
            </ul>
          </div>
          <div class="flex min-h-[50%] flex-col gap-2">
            <div>
              <h2 class="p-2 text-xl font-bold text-slate-900">Saídas</h2>
            </div>
            <ul class="flex h-full max-w-full flex-row flex-wrap items-start gap-2 p-2">
              <For each={outputs()}>
                {img => (
                  <li class="group relative">
                    <div class="absolute right-0 top-0 hidden p-1 group-hover:block">
                      <Button onClick={() => setOutputs(outputs().filter(i => i !== img))}>
                        <XIcon class="text-red-500" />
                      </Button>
                    </div>
                    <div class="absolute left-0 top-0 hidden p-1 group-hover:block">
                      <Button
                        onClick={() => {
                          console.log(img);
                          setSelectedHistogram(generateHistogram(img));
                          setShowHistogram(true);
                        }}
                      >
                        <BarChartIcon class="text-blue-500" />
                      </Button>
                    </div>
                    <Thumbnail img={img} />
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Dialog.Root>
      </div>
    </div>
  );
};

export default App;
