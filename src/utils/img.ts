export class Img {
  constructor(
    public name: string,
    public width: number,
    public height: number,
    public pixels: Uint8ClampedArray,
  ) {}
}

export async function getPixels(
  imageFile: File,
  canvas: HTMLCanvasElement,
): Promise<Img> {
  if (imageFile.name.endsWith('.pgm')) {
    const text = await imageFile.text()
    const lines = text.split('\n')

    const [width, height] = lines[1].split(' ').map(Number)

    const pixels = new Uint8ClampedArray(width * height * 4)

    for (let i = 0; i < height; i++) {
      const line = lines[i + 3]
      const values = line.split(' ').map(Number)

      for (let j = 0; j < width; j++) {
        const value = values[j]
        const index = i * width + j

        pixels[index * 4 + 0] = value
        pixels[index * 4 + 1] = value
        pixels[index * 4 + 2] = value
        pixels[index * 4 + 3] = 255
      }
    }

    return new Img(imageFile.name, width, height, pixels)
  }

  return new Promise<Img>(resolve => {
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      ctx!.drawImage(img, 0, 0)

      const data = ctx!.getImageData(0, 0, img.width, img.height).data

      resolve(new Img(imageFile.name, img.width, img.height, data))
    }
    img.src = URL.createObjectURL(imageFile)
  })
}

export async function createURL(img: Img) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const output = ctx!.createImageData(img.width, img.height)

  for (let i = 0; i < img.pixels.length; i += 4) {
    output.data[i + 0] = img.pixels[i + 0]
    output.data[i + 1] = img.pixels[i + 1]
    output.data[i + 2] = img.pixels[i + 2]
    output.data[i + 3] = img.pixels[i + 3]
  }

  canvas.width = img.width
  canvas.height = img.height
  ctx!.putImageData(output, 0, 0)

  const blob = await new Promise<Blob>(resolve =>
    canvas.toBlob(b => resolve(b!), 'image/png'),
  )

  return URL.createObjectURL(blob)
}

export const operations = {
  add: 'Add',
  subtract: 'Subtract',
  multiply: 'Multiply',
  divide: 'Divide',
  and: 'And',
  or: 'Or',
  xor: 'Xor',
} as const

export type Operation = keyof typeof operations

export type OperationConfig = {
  onOutOfRange: 'clamp' | 'wrap' | 'normalize'
}

export async function operate(
  operation: Operation,
  img1: Img,
  img2: Img,
  config: OperationConfig,
) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // center the smaller image in the bigger one
  if (img1.width !== img2.width || img1.height !== img2.height) {
    const width = Math.max(img1.width, img2.width)
    const height = Math.max(img1.height, img2.height)

    const x1 = Math.floor((width - img1.width) / 2)
    const y1 = Math.floor((height - img1.height) / 2)

    const x2 = Math.floor((width - img2.width) / 2)
    const y2 = Math.floor((height - img2.height) / 2)

    const pixels1 = new Uint8ClampedArray(width * height * 4)
    const pixels2 = new Uint8ClampedArray(width * height * 4)

    for (let y = 0; y < img1.height; y++) {
      const i = (y + y1) * width * 4 + x1 * 4
      const j = y * img1.width * 4

      pixels1.set(img1.pixels.slice(j, j + img1.width * 4), i)
    }

    for (let y = 0; y < img2.height; y++) {
      const i = (y + y2) * width * 4 + x2 * 4
      const j = y * img2.width * 4

      pixels2.set(img2.pixels.slice(j, j + img2.width * 4), i)
    }

    img1.pixels = pixels1
    img1.width = width
    img1.height = height

    img2.pixels = pixels2
    img2.width = width
    img2.height = height
  }

  const output = ctx!.createImageData(img1.width, img1.height)

  const rawData = new Int16Array(img1.pixels.length)

  for (let i = 0; i < img1.pixels.length; i += 4) {
    rawData[i + 0] = operatePixels(
      operation,
      img1.pixels[i + 0],
      img2.pixels[i + 0],
    )
    rawData[i + 1] = operatePixels(
      operation,
      img1.pixels[i + 1],
      img2.pixels[i + 1],
    )
    rawData[i + 2] = operatePixels(
      operation,
      img1.pixels[i + 2],
      img2.pixels[i + 2],
    )
    rawData[i + 3] = operatePixels(
      'add',
      img1.pixels[i + 3],
      img2.pixels[i + 3],
    )
  }

  if (config.onOutOfRange === 'clamp') {
    for (let i = 0; i < img1.pixels.length; i += 4) {
      output.data[i + 0] = Math.max(0, Math.min(255, rawData[i + 0]))
      output.data[i + 1] = Math.max(0, Math.min(255, rawData[i + 1]))
      output.data[i + 2] = Math.max(0, Math.min(255, rawData[i + 2]))
      output.data[i + 3] = Math.max(0, Math.min(255, rawData[i + 3]))
    }
  } else if (config.onOutOfRange === 'wrap') {
    for (let i = 0; i < img1.pixels.length; i += 4) {
      output.data[i + 0] = rawData[i + 0] % 255
      output.data[i + 1] = rawData[i + 1] % 255
      output.data[i + 2] = rawData[i + 2] % 255
      output.data[i + 3] = Math.max(0, Math.min(255, rawData[i + 3]))
    }
  } else if (config.onOutOfRange === 'normalize') {
    const max = [0, 0, 0]
    const min = [255, 255, 255]

    for (let i = 0; i < img1.pixels.length; i += 4) {
      max[0] = Math.max(max[0], rawData[i + 0])
      max[1] = Math.max(max[1], rawData[i + 1])
      max[2] = Math.max(max[2], rawData[i + 2])

      min[0] = Math.min(min[0], rawData[i + 0])
      min[1] = Math.min(min[1], rawData[i + 1])
      min[2] = Math.min(min[2], rawData[i + 2])
    }

    const range = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]

    for (let i = 0; i < img1.pixels.length; i += 4) {
      output.data[i + 0] = ((rawData[i + 0] - min[0]) / range[0]) * 255
      output.data[i + 1] = ((rawData[i + 1] - min[1]) / range[1]) * 255
      output.data[i + 2] = ((rawData[i + 2] - min[2]) / range[2]) * 255
      output.data[i + 3] = Math.max(0, Math.min(255, rawData[i + 3]))
    }
  }

  const newImg = new Img(
    `${operation}_${config.onOutOfRange}.png`,
    img1.width,
    img1.height,
    output.data,
  )

  return newImg
}

function operatePixels(operation: Operation, pixel1: number, pixel2: number) {
  switch (operation) {
    case 'add':
      return pixel1 + pixel2
    case 'subtract':
      return pixel1 - pixel2
    case 'multiply':
      return pixel1 * pixel2
    case 'divide':
      return pixel1 / pixel2
    case 'and':
      return pixel1 & pixel2
    case 'or':
      return pixel1 | pixel2
    case 'xor':
      return pixel1 ^ pixel2
  }
}

export const transformations = {
  translate: 'Translate',
  rotate: 'Rotate',
  scale: 'Scale',
  reflect: 'Reflect',
  shear: 'Shear',
} as const

export type Transformation = keyof typeof transformations

export type TransformationConfig = {
  onOutOfRange: 'clamp' | 'wrap'
  translate: {
    x: number
    y: number
  }
  rotate: {
    origin: {
      x: number
      y: number
    }
    angle: number
  }
  scale: {
    x: number
    y: number
  }
  reflect: {
    x: boolean
    y: boolean
  }
  shear: {
    x: number
    y: number
  }
}

export async function transform(
  transformation: Transformation,
  img: Img,
  config: TransformationConfig,
): Promise<Img> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  let output: ImageData
  if (transformation === 'scale') {
    output = ctx!.createImageData(
      Math.round(img.width * config.scale.x),
      Math.round(img.height * config.scale.y),
    )
  } else if (transformation === 'shear') {
    const widthOffset = Math.round(img.height * config.shear.x)
    const heightOffset = Math.round(img.width * config.shear.y)

    output = ctx!.createImageData(
      img.width + widthOffset,
      img.height + heightOffset,
    )
  } else {
    output = ctx!.createImageData(img.width, img.height)
  }

  for (let y = 0; y < output.height; y++) {
    for (let x = 0; x < output.width; x++) {
      const i = y * output.width * 4 + x * 4

      const pixel = transformPixel(transformation, img, x, y, config)

      output.data.set(pixel, i)
    }
  }

  const newImg = new Img(
    `${transformation}_${config.onOutOfRange}.png`,
    output.width,
    output.height,
    output.data,
  )

  return newImg
}

function transformPixel(
  transformation: Transformation,
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig,
): Uint8ClampedArray {
  switch (transformation) {
    case 'translate':
      return translatePixel(img, x, y, config)
    case 'rotate':
      return rotatePixel(img, x, y, config)
    case 'scale':
      return scalePixel(img, x, y, config)
    case 'reflect':
      return reflectPixel(img, x, y, config)
    case 'shear':
      return shearPixel(img, x, y, config)
    default:
      throw new Error('Not implemented')
  }
}

function translatePixel(
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig,
): Uint8ClampedArray {
  let newX = x - config.translate.x
  let newY = y - config.translate.y

  if (newX < 0 || newX >= img.width) {
    if (config.onOutOfRange === 'clamp') {
      return new Uint8ClampedArray([0, 0, 0, 0])
    } else if (config.onOutOfRange === 'wrap') {
      newX = newX % img.width
    }
  }

  if (newY < 0 || newY >= img.height) {
    if (config.onOutOfRange === 'clamp') {
      return new Uint8ClampedArray([0, 0, 0, 0])
    } else if (config.onOutOfRange === 'wrap') {
      newY = newY % img.height
    }
  }

  const newIndex = newY * img.width * 4 + newX * 4

  return img.pixels.slice(newIndex, newIndex + 4)
}

function rotatePixel(
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig,
): Uint8ClampedArray {
  const radians = (config.rotate.angle * Math.PI) / 180

  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  let newX = Math.round(
    config.rotate.origin.x +
      (x - config.rotate.origin.x) * cos -
      (y - config.rotate.origin.y) * sin,
  )
  let newY = Math.round(
    config.rotate.origin.y +
      (x - config.rotate.origin.x) * sin +
      (y - config.rotate.origin.y) * cos,
  )

  if (newX < 0 || newX >= img.width) {
    if (config.onOutOfRange === 'clamp') {
      return new Uint8ClampedArray([0, 0, 0, 0])
    } else if (config.onOutOfRange === 'wrap') {
      newX = newX % img.width
    }
  }

  if (newY < 0 || newY >= img.height) {
    if (config.onOutOfRange === 'clamp') {
      return new Uint8ClampedArray([0, 0, 0, 0])
    } else if (config.onOutOfRange === 'wrap') {
      newY = newY % img.height
    }
  }

  const newIndex = newY * img.width * 4 + newX * 4

  return img.pixels.slice(newIndex, newIndex + 4)
}

function scalePixel(
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig,
): Uint8ClampedArray {
  let newX = Math.round(x / config.scale.x)
  let newY = Math.round(y / config.scale.y)

  if (newX < 0 || newX >= img.width) {
    if (config.onOutOfRange === 'clamp') {
      return new Uint8ClampedArray([0, 0, 0, 0])
    } else if (config.onOutOfRange === 'wrap') {
      newX = newX % img.width
    }
  }

  if (newY < 0 || newY >= img.height) {
    if (config.onOutOfRange === 'clamp') {
      return new Uint8ClampedArray([0, 0, 0, 0])
    } else if (config.onOutOfRange === 'wrap') {
      newY = newY % img.height
    }
  }

  const newIndex = newY * img.width * 4 + newX * 4

  return img.pixels.slice(newIndex, newIndex + 4)
}

function reflectPixel(
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig,
): Uint8ClampedArray {
  let newX = x
  let newY = y

  if (config.reflect.x) {
    newX = img.width - x
  }

  if (config.reflect.y) {
    newY = img.height - y
  }

  if (newX < 0 || newX >= img.width) {
    if (config.onOutOfRange === 'clamp') {
      return new Uint8ClampedArray([0, 0, 0, 0])
    } else if (config.onOutOfRange === 'wrap') {
      newX = newX % img.width
    }
  }

  if (newY < 0 || newY >= img.height) {
    if (config.onOutOfRange === 'clamp') {
      return new Uint8ClampedArray([0, 0, 0, 0])
    } else if (config.onOutOfRange === 'wrap') {
      newY = newY % img.height
    }
  }

  const newIndex = newY * img.width * 4 + newX * 4

  return img.pixels.slice(newIndex, newIndex + 4)
}

function shearPixel(
  img: Img,
  x: number,
  y: number,
  config: TransformationConfig,
): Uint8ClampedArray {
  let newX = Math.round(x + config.shear.x * y - img.width * config.shear.x)
  let newY = Math.round(y + config.shear.y * x - img.height * config.shear.y)

  if (newX < 0 || newX >= img.width) {
    if (config.onOutOfRange === 'clamp') {
      return new Uint8ClampedArray([0, 0, 0, 0])
    } else if (config.onOutOfRange === 'wrap') {
      newX = newX % img.width
    }
  }

  if (newY < 0 || newY >= img.height) {
    if (config.onOutOfRange === 'clamp') {
      return new Uint8ClampedArray([0, 0, 0, 0])
    } else if (config.onOutOfRange === 'wrap') {
      newY = newY % img.height
    }
  }

  const newIndex = newY * img.width * 4 + newX * 4

  return img.pixels.slice(newIndex, newIndex + 4)
}

export const zooms = {
  'in-replication': 'Zoom In (Replication)',
  'in-interpolation': 'Zoom In (Interpolation)',
  'out-exclusion': 'Zoom Out (Exclusion)',
  'out-mean': 'Zoom Out (Mean)',
} as const

export type Zoom = keyof typeof zooms

export type ZoomConfig = {
  amount: number
}

export async function zoom(
  zoom: Zoom,
  img: Img,
  config: ZoomConfig,
): Promise<Img> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  let output: ImageData
  if (zoom.startsWith('in')) {
    output = ctx!.createImageData(
      Math.round(img.width * config.amount),
      Math.round(img.height * config.amount),
    )
  } else {
    output = ctx!.createImageData(
      Math.round(img.width / config.amount),
      Math.round(img.height / config.amount),
    )
  }

  for (let y = 0; y < output.height; y++) {
    for (let x = 0; x < output.width; x++) {
      const i = y * output.width * 4 + x * 4

      const pixel = zoomPixel(zoom, img, x, y, config)

      output.data.set(pixel, i)
    }
  }

  const newImg = new Img(
    `${zoom}_${config.amount}.png`,
    output.width,
    output.height,
    output.data,
  )

  return newImg
}

function zoomPixel(
  zoom: Zoom,
  img: Img,
  x: number,
  y: number,
  config: ZoomConfig,
): Uint8ClampedArray {
  switch (zoom) {
    case 'in-replication':
      return zoomInReplicationPixel(img, x, y, config)
    case 'in-interpolation':
      return zoomInInterpolationPixel(img, x, y, config)
    case 'out-exclusion':
      return zoomOutExclusionPixel(img, x, y, config)
    case 'out-mean':
      return zoomOutMeanPixel(img, x, y, config)
    default:
      throw new Error('Not implemented')
  }
}

function zoomInReplicationPixel(
  img: Img,
  x: number,
  y: number,
  config: ZoomConfig,
): Uint8ClampedArray {
  const newX = Math.round(x / config.amount)
  const newY = Math.round(y / config.amount)

  const newIndex = newY * img.width * 4 + newX * 4

  return img.pixels.slice(newIndex, newIndex + 4)
}

function zoomInInterpolationPixel(
  img: Img,
  x: number,
  y: number,
  config: ZoomConfig,
): Uint8ClampedArray {
  const newX = x / config.amount
  const newY = y / config.amount

  const x1 = Math.floor(newX)
  const y1 = Math.floor(newY)
  const x2 = Math.ceil(newX)
  const y2 = Math.ceil(newY)

  const dx = newX - x1
  const dy = newY - y1

  const a = img.pixels.slice(
    y1 * img.width * 4 + x1 * 4,
    y1 * img.width * 4 + x2 * 4,
  )
  const b = img.pixels.slice(
    y2 * img.width * 4 + x1 * 4,
    y2 * img.width * 4 + x2 * 4,
  )

  const c = new Uint8ClampedArray(4)

  for (let i = 0; i < 4; i++) {
    c[i] = a[i] * (1 - dx) * (1 - dy) + b[i] * dx * dy
  }

  return c
}

function zoomOutExclusionPixel(
  img: Img,
  x: number,
  y: number,
  config: ZoomConfig,
): Uint8ClampedArray {
  const newX = Math.floor(x * config.amount)
  const newY = Math.floor(y * config.amount)

  const newIndex = newY * img.width * 4 + newX * 4

  return img.pixels.slice(newIndex, newIndex + 4)
}

function zoomOutMeanPixel(
  img: Img,
  x: number,
  y: number,
  config: ZoomConfig,
): Uint8ClampedArray {
  const newX = Math.round(x * config.amount)
  const newY = Math.round(y * config.amount)

  const x1 = Math.floor(newX)
  const y1 = Math.floor(newY)
  const x2 = Math.ceil(newX)
  const y2 = Math.ceil(newY)

  const a = img.pixels.slice(
    y1 * img.width * 4 + x1 * 4,
    y1 * img.width * 4 + x2 * 4,
  )
  const b = img.pixels.slice(
    y2 * img.width * 4 + x1 * 4,
    y2 * img.width * 4 + x2 * 4,
  )

  const c = new Uint8ClampedArray(4)

  for (let i = 0; i < 4; i++) {
    c[i] = Math.max(a[i], b[i])
  }

  return c
}
