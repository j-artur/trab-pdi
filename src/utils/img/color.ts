import { Img } from ".";

export const colorSchemes = {
  RGB: "RGB",
  CMY: "CMY",
  CMYK: "CMYK",
  HSL: "HSL",
  HSV: "HSV",
  YUV: "YUV",
  YIQ: "YIQ",
  YCbCr: "YCbCr",
  YPbPr: "YPbBr",
  greyscale: "Escala de cinza",
} as const;

export type ColorScheme = keyof typeof colorSchemes;

function rgbToCmy(r: number, g: number, b: number): [number, number, number] {
  const c = 255 - r;
  const m = 255 - g;
  const y = 255 - b;

  return [c, m, y];
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const [c, m, y] = rgbToCmy(r, g, b);

  const k = Math.min(c, m, y);

  if (k === 255) {
    return [0, 0, 0, 255];
  } else {
    const c_ = Math.round(((c - k) / (255 - k)) * 255);
    const m_ = Math.round(((m - k) / (255 - k)) * 255);
    const y_ = Math.round(((y - k) / (255 - k)) * 255);

    return [c_, m_, y_, k];
  }
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h: number;
  let s: number;
  const l = (max + min) / 2;

  if (max == min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        throw new Error("Invalid color");
    }

    h /= 6;
  }

  return [h, s, l];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h: number;
  let s: number;
  const v = max;

  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        throw new Error("Invalid color");
    }

    h /= 6;
  }

  return [h, s, v];
}

function hueToRgb(h: number): [number, number, number] {
  let r: number;
  let g: number;
  let b: number;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;

  switch (i % 6) {
    case 0:
      [r, g, b] = [1, f, 0];
      break;
    case 1:
      [r, g, b] = [1 - f, 1, 0];
      break;
    case 2:
      [r, g, b] = [0, 1, f];
      break;
    case 3:
      [r, g, b] = [0, 1 - f, 1];
      break;
    case 4:
      [r, g, b] = [f, 0, 1];
      break;
    case 5:
      [r, g, b] = [1, 0, 1 - f];
      break;
    default:
      throw new Error("Invalid color");
  }

  r = Math.round(r * 255);
  g = Math.round(g * 255);
  b = Math.round(b * 255);

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return [r, g, b];
}

function rgbToYuv(r: number, g: number, b: number): [number, number, number] {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const u = -0.14713 * r - 0.28886 * g + 0.436 * b;
  const v = 0.615 * r - 0.51499 * g - 0.132 * b;

  return [y, u, v];
}

function yuvToRgb(y: number, u: number, v: number): [number, number, number] {
  let r = 1 * y + 0 * u + 1.13983 * v;
  let g = 1 * y - 0.39465 * u - 0.5806 * v;
  let b = 1 * y + 2.03211 * u + 0 * v;

  r = Math.round(r);
  g = Math.round(g);
  b = Math.round(b);

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return [r, g, b];
}

function rgbToYiq(r: number, g: number, b: number): [number, number, number] {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const i = 0.596 * r - 0.274 * g - 0.322 * b;
  const q = 0.211 * r - 0.523 * g + 0.312 * b;

  return [y, i, q];
}

function yiqToRgb(y: number, i: number, q: number): [number, number, number] {
  const r = 1 * y + 0.956 * i + 0.621 * q;
  const g = 1 * y - 0.272 * i - 0.647 * q;
  const b = 1 * y - 1.106 * i + 1.703 * q;

  return [r, g, b];
}

function rgbToYCbCr(r: number, g: number, b: number): [number, number, number] {
  let y = 0.299 * r + 0.587 * g + 0.114 * b;
  let cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
  let cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128;

  return [y, cb, cr];
}

function yCbCrToRgb(y: number, cb: number, cr: number): [number, number, number] {
  let r = 1 * y + 0 * (cb - 128) + 1.402 * (cr - 128);
  let g = 1 * y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128);
  let b = 1 * y + 1.772 * (cb - 128) + 0 * (cr - 128);

  r = Math.round(r);
  g = Math.round(g);
  b = Math.round(b);

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return [r, g, b];
}

function rgbToYPbPr(r: number, g: number, b: number): [number, number, number] {
  let y = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  let pb = b - y;
  let pr = r - y;

  return [y, pb, pr];
}

function yPbPrToRgb(y: number, pb: number, pr: number): [number, number, number] {
  let r = pr + y;
  let b = pb + y;
  let g = (y - 0.2126 * r - 0.0722 * b) / 0.7152;

  r = Math.round(r);
  g = Math.round(g);
  b = Math.round(b);

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return [r, g, b];
}

function rgbToGreyscale(r: number, g: number, b: number): number {
  return (r + g + b) / 3;
}

export async function splitColorspace(scheme: ColorScheme, img: Img): Promise<Img[]> {
  switch (scheme) {
    case "RGB":
      return splitRGB(img);
    case "CMY":
      return splitCMY(img);
    case "CMYK":
      return splitCMYK(img);
    case "HSL":
      return splitHSL(img);
    case "HSV":
      return splitHSV(img);
    case "YUV":
      return splitYUV(img);
    case "YIQ":
      return splitYIQ(img);
    case "YCbCr":
      return splitYCbCr(img);
    case "YPbPr":
      return splitYPbPr(img);
    case "greyscale":
      return [greyscale(img)];
  }
}

function splitRGB(img: Img): Img[] {
  const r = new Img(
    `RGB_R-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const g = new Img(
    `RGB_G-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const b = new Img(
    `RGB_B-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = y * img.width * 4 + x * 4;

      r.pixels[i + 0] = img.pixels[i + 0];
      g.pixels[i + 1] = img.pixels[i + 1];
      b.pixels[i + 2] = img.pixels[i + 2];

      r.pixels[i + 3] = img.pixels[i + 3];
      g.pixels[i + 3] = img.pixels[i + 3];
      b.pixels[i + 3] = img.pixels[i + 3];
    }
  }

  return [r, g, b];
}

function splitCMY(img: Img): Img[] {
  const c = new Img(
    `CMY_C-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const m = new Img(
    `CMY_M-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const y = new Img(
    `CMY_Y-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );

  for (let y_ = 0; y_ < img.height; y_++) {
    for (let x = 0; x < img.width; x++) {
      const i = y_ * img.width * 4 + x * 4;

      const r = img.pixels[i + 0];
      const g = img.pixels[i + 1];
      const b = img.pixels[i + 2];

      const cmy = rgbToCmy(r, g, b);

      c.pixels[i + 0] = 255 - cmy[0];
      c.pixels[i + 1] = 255;
      c.pixels[i + 2] = 255;
      m.pixels[i + 0] = 255;
      m.pixels[i + 1] = 255 - cmy[1];
      m.pixels[i + 2] = 255;
      y.pixels[i + 0] = 255;
      y.pixels[i + 1] = 255;
      y.pixels[i + 2] = 255 - cmy[2];

      c.pixels[i + 3] = img.pixels[i + 3];
      m.pixels[i + 3] = img.pixels[i + 3];
      y.pixels[i + 3] = img.pixels[i + 3];
    }
  }

  return [c, m, y];
}

function splitCMYK(img: Img): Img[] {
  const c = new Img(
    `CMYK_C-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const m = new Img(
    `CMYK_M-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const y = new Img(
    `CMYK_Y-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const k = new Img(
    `CMYK_K-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );

  for (let y_ = 0; y_ < img.height; y_++) {
    for (let x = 0; x < img.width; x++) {
      const i = y_ * img.width * 4 + x * 4;

      const r = img.pixels[i + 0];
      const g = img.pixels[i + 1];
      const b = img.pixels[i + 2];

      const cmyk = rgbToCmyk(r, g, b);

      c.pixels[i + 0] = 255 - cmyk[0];
      c.pixels[i + 1] = 255;
      c.pixels[i + 2] = 255;
      m.pixels[i + 0] = 255;
      m.pixels[i + 1] = 255 - cmyk[1];
      m.pixels[i + 2] = 255;
      y.pixels[i + 0] = 255;
      y.pixels[i + 1] = 255;
      y.pixels[i + 2] = 255 - cmyk[2];
      k.pixels[i + 0] = 255 - cmyk[3];
      k.pixels[i + 1] = 255 - cmyk[3];
      k.pixels[i + 2] = 255 - cmyk[3];

      c.pixels[i + 3] = img.pixels[i + 3];
      m.pixels[i + 3] = img.pixels[i + 3];
      y.pixels[i + 3] = img.pixels[i + 3];
      k.pixels[i + 3] = img.pixels[i + 3];
    }
  }

  return [c, m, y, k];
}

function splitHSL(img: Img): Img[] {
  const h = new Img(
    `HSL_H-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const s = new Img(
    `HSL_S-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const l = new Img(
    `HSL_L-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );

  for (let y_ = 0; y_ < img.height; y_++) {
    for (let x = 0; x < img.width; x++) {
      const i = y_ * img.width * 4 + x * 4;

      const r = img.pixels[i + 0];
      const g = img.pixels[i + 1];
      const b = img.pixels[i + 2];

      const hsl = rgbToHsl(r, g, b);

      const h_ = hsl[0] * 255;
      const s_ = hsl[1] * 255;
      const l_ = hsl[2] * 255;

      const rgb = hueToRgb(hsl[0]);

      h.pixels[i + 0] = rgb[0];
      h.pixels[i + 1] = rgb[1];
      h.pixels[i + 2] = rgb[2];
      s.pixels[i + 0] = s_;
      s.pixels[i + 1] = s_;
      s.pixels[i + 2] = s_;
      l.pixels[i + 0] = l_;
      l.pixels[i + 1] = l_;
      l.pixels[i + 2] = l_;

      h.pixels[i + 3] = img.pixels[i + 3];
      s.pixels[i + 3] = img.pixels[i + 3];
      l.pixels[i + 3] = img.pixels[i + 3];
    }
  }

  return [h, s, l];
}

function splitHSV(img: Img): Img[] {
  const h = new Img(
    `HSV_H-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const s = new Img(
    `HSV_S-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const v = new Img(
    `HSV_V-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );

  for (let y_ = 0; y_ < img.height; y_++) {
    for (let x = 0; x < img.width; x++) {
      const i = y_ * img.width * 4 + x * 4;

      const r = img.pixels[i + 0];
      const g = img.pixels[i + 1];
      const b = img.pixels[i + 2];

      const hsv = rgbToHsv(r, g, b);

      const h_ = hsv[0] * 255;
      const s_ = hsv[1] * 255;
      const v_ = hsv[2] * 255;

      const rgb = hueToRgb(hsv[0]);

      h.pixels[i + 0] = rgb[0];
      h.pixels[i + 1] = rgb[1];
      h.pixels[i + 2] = rgb[2];
      s.pixels[i + 0] = s_;
      s.pixels[i + 1] = s_;
      s.pixels[i + 2] = s_;
      v.pixels[i + 0] = v_;
      v.pixels[i + 1] = v_;
      v.pixels[i + 2] = v_;

      h.pixels[i + 3] = img.pixels[i + 3];
      s.pixels[i + 3] = img.pixels[i + 3];
      v.pixels[i + 3] = img.pixels[i + 3];
    }
  }

  return [h, s, v];
}

function splitYUV(img: Img): Img[] {
  const y = new Img(
    `YUV_Y-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const u = new Img(
    `YUV_U-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const v = new Img(
    `YUV_V-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );

  for (let y_ = 0; y_ < img.height; y_++) {
    for (let x = 0; x < img.width; x++) {
      const i = y_ * img.width * 4 + x * 4;

      const r = img.pixels[i + 0];
      const g = img.pixels[i + 1];
      const b = img.pixels[i + 2];

      const yuv = rgbToYuv(r, g, b);

      const y__ = yuv[0];
      const u__ = yuv[1];
      const v__ = yuv[2];

      const rgbU = yuvToRgb(127, u__, 0);
      const rgbV = yuvToRgb(127, 0, v__);

      y.pixels[i + 0] = y__;
      y.pixels[i + 1] = y__;
      y.pixels[i + 2] = y__;
      u.pixels[i + 0] = rgbU[0];
      u.pixels[i + 1] = rgbU[1];
      u.pixels[i + 2] = rgbU[2];
      v.pixels[i + 0] = rgbV[0];
      v.pixels[i + 1] = rgbV[1];
      v.pixels[i + 2] = rgbV[2];

      y.pixels[i + 3] = img.pixels[i + 3];
      u.pixels[i + 3] = img.pixels[i + 3];
      v.pixels[i + 3] = img.pixels[i + 3];
    }
  }

  return [y, u, v];
}

function splitYIQ(img: Img): Img[] {
  const y = new Img(
    `YIQ_Y-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const i = new Img(
    `YIQ_I-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const q = new Img(
    `YIQ_Q-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );

  for (let y_ = 0; y_ < img.height; y_++) {
    for (let x = 0; x < img.width; x++) {
      const i_ = y_ * img.width * 4 + x * 4;

      const r = img.pixels[i_ + 0];
      const g = img.pixels[i_ + 1];
      const b = img.pixels[i_ + 2];

      const yiq = rgbToYiq(r, g, b);

      const y__ = yiq[0];
      const i__ = yiq[1];
      const q__ = yiq[2];

      const rgbI = yiqToRgb(127, i__, 0);
      const rgbQ = yiqToRgb(127, 0, q__);

      y.pixels[i_ + 0] = y__;
      y.pixels[i_ + 1] = y__;
      y.pixels[i_ + 2] = y__;
      i.pixels[i_ + 0] = rgbI[0];
      i.pixels[i_ + 1] = rgbI[1];
      i.pixels[i_ + 2] = rgbI[2];
      q.pixels[i_ + 0] = rgbQ[0];
      q.pixels[i_ + 1] = rgbQ[1];
      q.pixels[i_ + 2] = rgbQ[2];

      y.pixels[i_ + 3] = img.pixels[i_ + 3];
      i.pixels[i_ + 3] = img.pixels[i_ + 3];
      q.pixels[i_ + 3] = img.pixels[i_ + 3];
    }
  }

  return [y, i, q];
}

function splitYCbCr(img: Img): Img[] {
  const y = new Img(
    `YCbCr_Y-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const cb = new Img(
    `YCbCr_Cb-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const cr = new Img(
    `YCbCr_Cr-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );

  for (let y_ = 0; y_ < img.height; y_++) {
    for (let x = 0; x < img.width; x++) {
      const i = y_ * img.width * 4 + x * 4;

      const r = img.pixels[i + 0];
      const g = img.pixels[i + 1];
      const b = img.pixels[i + 2];

      const ycbcr = rgbToYCbCr(r, g, b);

      const y__ = ycbcr[0];
      const cb__ = ycbcr[1];
      const cr__ = ycbcr[2];

      const rgbCb = yCbCrToRgb(127, cb__, 127);
      const rgbCr = yCbCrToRgb(127, 127, cr__);

      y.pixels[i + 0] = y__;
      y.pixels[i + 1] = y__;
      y.pixels[i + 2] = y__;
      cb.pixels[i + 0] = rgbCb[0];
      cb.pixels[i + 1] = rgbCb[1];
      cb.pixels[i + 2] = rgbCb[2];
      cr.pixels[i + 0] = rgbCr[0];
      cr.pixels[i + 1] = rgbCr[1];
      cr.pixels[i + 2] = rgbCr[2];

      y.pixels[i + 3] = img.pixels[i + 3];
      cb.pixels[i + 3] = img.pixels[i + 3];
      cr.pixels[i + 3] = img.pixels[i + 3];
    }
  }

  return [y, cb, cr];
}

function splitYPbPr(img: Img): Img[] {
  const y = new Img(
    `YPbPr_Y-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const pb = new Img(
    `YPbPr_Pb-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );
  const pr = new Img(
    `YPbPr_Pr-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );

  for (let y_ = 0; y_ < img.height; y_++) {
    for (let x = 0; x < img.width; x++) {
      const i = y_ * img.width * 4 + x * 4;

      const r = img.pixels[i + 0];
      const g = img.pixels[i + 1];
      const b = img.pixels[i + 2];

      const ypbpr = rgbToYPbPr(r, g, b);

      const y__ = ypbpr[0];
      const pb__ = ypbpr[1];
      const pr__ = ypbpr[2];

      const rgbPb = yPbPrToRgb(127, pb__, 0);
      const rgbPr = yPbPrToRgb(127, 0, pr__);

      y.pixels[i + 0] = y__;
      y.pixels[i + 1] = y__;
      y.pixels[i + 2] = y__;
      pb.pixels[i + 0] = rgbPb[0];
      pb.pixels[i + 1] = rgbPb[1];
      pb.pixels[i + 2] = rgbPb[2];
      pr.pixels[i + 0] = rgbPr[0];
      pr.pixels[i + 1] = rgbPr[1];
      pr.pixels[i + 2] = rgbPr[2];

      y.pixels[i + 3] = img.pixels[i + 3];
      pb.pixels[i + 3] = img.pixels[i + 3];
      pr.pixels[i + 3] = img.pixels[i + 3];
    }
  }

  return [y, pb, pr];
}

function greyscale(img: Img): Img {
  const output = new Img(
    `greyscale-${img.name}`,
    img.width,
    img.height,
    new Uint8ClampedArray(img.pixels.length)
  );

  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i + 0];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    const greyscale = rgbToGreyscale(r, g, b);

    output.pixels[i + 0] = greyscale;
    output.pixels[i + 1] = greyscale;
    output.pixels[i + 2] = greyscale;
    output.pixels[i + 3] = img.pixels[i + 3];
  }

  return output;
}
