export class Img {
  constructor(
    public name: string,
    public width: number,
    public height: number,
    public pixels: Uint8ClampedArray
  ) {}
}

export async function getPixels(imageFile: File, canvas: HTMLCanvasElement): Promise<Img> {
  if (imageFile.name.endsWith(".pgm")) {
    const text = await imageFile.text();
    const lines = text.split("\n");

    const [width, height] = lines[1].split(" ").map(Number);

    const pixels = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < height; i++) {
      const line = lines[i + 3];
      const values = line.split(" ").map(Number);

      for (let j = 0; j < width; j++) {
        const value = values[j];
        const index = i * width + j;

        pixels[index * 4 + 0] = value;
        pixels[index * 4 + 1] = value;
        pixels[index * 4 + 2] = value;
        pixels[index * 4 + 3] = 255;
      }
    }

    return new Img(imageFile.name, width, height, pixels);
  }

  return new Promise<Img>(resolve => {
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx!.drawImage(img, 0, 0);

      const data = ctx!.getImageData(0, 0, img.width, img.height).data;

      resolve(new Img(imageFile.name, img.width, img.height, data));
    };
    img.src = URL.createObjectURL(imageFile);
  });
}

export async function createURL(img: Img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const output = ctx!.createImageData(img.width, img.height);

  for (let i = 0; i < img.pixels.length; i += 4) {
    output.data[i + 0] = img.pixels[i + 0];
    output.data[i + 1] = img.pixels[i + 1];
    output.data[i + 2] = img.pixels[i + 2];
    output.data[i + 3] = img.pixels[i + 3];
  }

  canvas.width = img.width;
  canvas.height = img.height;
  ctx!.putImageData(output, 0, 0);

  const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), "image/png"));

  return URL.createObjectURL(blob);
}

export function generateHistogram(img: Img) {
  const histogram = new Array<number>(256).fill(0);

  for (let i = 0; i < img.pixels.length; i += 4) {
    const greyIntensity = (img.pixels[i + 0] + img.pixels[i + 1] + img.pixels[i + 2]) / 3;
    histogram[Math.floor(greyIntensity)]++;
  }

  return histogram;
}

export function simplifyHistogram(histogram: number[]) {
  const newHistogram = new Array<number>(16).fill(0);

  for (let i = 0; i < histogram.length; i++) {
    newHistogram[Math.floor(i / 16)] += histogram[i];
  }

  return newHistogram;
}
