import { Img } from ".";

export type WatermarkConfig = {
  opacity: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: [number, number, number];
  rotate: number;
  x: number;
  y: number;
  img?: Img;
};

export function watermark(img: Img, config: WatermarkConfig): Img {
  const output = new ImageData(img.width, img.height);

  let watermarkImg: Img;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.globalAlpha = config.opacity;

  if (config.img) {
    const imageData = ctx.createImageData(config.img.width, config.img.height);
    imageData.data.set(config.img.pixels);
    ctx.putImageData(imageData, config.x, config.y);
  } else {
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    ctx.fillStyle = `rgb(${config.color[0]}, ${config.color[1]}, ${config.color[2]})`;
    ctx.rotate((config.rotate * Math.PI) / 180);
    ctx.fillText(config.text, config.x, config.y + config.fontSize);
  }
  const data = ctx!.getImageData(0, 0, img.width, img.height).data;

  watermarkImg = new Img("watermark", img.width, img.height, data);

  for (let i = 0; i < img.pixels.length; i += 4) {
    let opacity = watermarkImg.pixels[i + 3] / 255;

    if (config.img) {
      opacity *= config.opacity;
    }

    output.data[i + 0] = opacity * watermarkImg.pixels[i + 0] + (1 - opacity) * img.pixels[i + 0];
    output.data[i + 1] = opacity * watermarkImg.pixels[i + 1] + (1 - opacity) * img.pixels[i + 1];
    output.data[i + 2] = opacity * watermarkImg.pixels[i + 2] + (1 - opacity) * img.pixels[i + 2];
    output.data[i + 3] = Math.max(watermarkImg.pixels[i + 3], img.pixels[i + 3]);
  }

  return new Img(img.name, img.width, img.height, output.data);
}
