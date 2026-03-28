#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const publicDir = path.join(root, 'public')
const appDir = path.join(root, 'src', 'app')
const sourcePath = path.join(publicDir, 'apple-touch-icon.png')

const sizes = [16, 32, 48, 180, 192, 512]

function parsePngChunks(buffer) {
  if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error('Expected PNG source image')
  }

  let offset = 8
  const chunks = []

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    offset += 4
    const type = buffer.subarray(offset, offset + 4).toString('ascii')
    offset += 4
    const data = buffer.subarray(offset, offset + length)
    offset += length
    offset += 4
    chunks.push({ type, data })
    if (type === 'IEND') {
      break
    }
  }

  return chunks
}

function decodePng(buffer) {
  const chunks = parsePngChunks(buffer)
  const ihdr = chunks.find((chunk) => chunk.type === 'IHDR')
  if (!ihdr) {
    throw new Error('Missing IHDR chunk')
  }

  const width = ihdr.data.readUInt32BE(0)
  const height = ihdr.data.readUInt32BE(4)
  const bitDepth = ihdr.data.readUInt8(8)
  const colorType = ihdr.data.readUInt8(9)

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`Unsupported PNG format: bitDepth=${bitDepth} colorType=${colorType}`)
  }

  const idat = Buffer.concat(chunks.filter((chunk) => chunk.type === 'IDAT').map((chunk) => chunk.data))
  const raw = zlib.inflateSync(idat)
  const bytesPerPixel = 4
  const stride = width * bytesPerPixel
  const pixels = Buffer.alloc(width * height * bytesPerPixel)
  let rawOffset = 0
  let prevRow = Buffer.alloc(stride)

  for (let y = 0; y < height; y += 1) {
    const filter = raw.readUInt8(rawOffset)
    rawOffset += 1
    const row = Buffer.from(raw.subarray(rawOffset, rawOffset + stride))
    rawOffset += stride

    for (let i = 0; i < stride; i += 1) {
      const left = i >= bytesPerPixel ? row[i - bytesPerPixel] : 0
      const up = prevRow[i]
      const upLeft = i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0

      if (filter === 1) {
        row[i] = (row[i] + left) & 0xff
      } else if (filter === 2) {
        row[i] = (row[i] + up) & 0xff
      } else if (filter === 3) {
        row[i] = (row[i] + Math.floor((left + up) / 2)) & 0xff
      } else if (filter === 4) {
        const prediction = left + up - upLeft
        const pa = Math.abs(prediction - left)
        const pb = Math.abs(prediction - up)
        const pc = Math.abs(prediction - upLeft)
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft
        row[i] = (row[i] + predictor) & 0xff
      }
    }

    row.copy(pixels, y * stride)
    prevRow = row
  }

  return { width, height, pixels }
}

function getPixel(image, x, y) {
  const offset = (y * image.width + x) * 4
  return image.pixels.subarray(offset, offset + 4)
}

function isDark(pixel, threshold = 90) {
  return pixel[0] < threshold && pixel[1] < threshold && pixel[2] < threshold && pixel[3] > 0
}

function findCrop(image, { xStart, xEnd, yStart, yEnd, threshold }) {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = -1
  let maxY = -1

  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const pixel = getPixel(image, x, y)
      if (isDark(pixel, threshold)) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < 0) {
    throw new Error('Unable to locate crop bounds in source artwork')
  }

  const squareSize = maxX - minX + 1
  return {
    x: minX,
    y: minY,
    size: squareSize,
    detectedHeight: maxY - minY + 1,
  }
}

function cropSquare(image, crop) {
  const cropped = Buffer.alloc(crop.size * crop.size * 4)

  for (let y = 0; y < crop.size; y += 1) {
    const sourceOffset = ((crop.y + y) * image.width + crop.x) * 4
    const targetOffset = y * crop.size * 4
    image.pixels.copy(cropped, targetOffset, sourceOffset, sourceOffset + crop.size * 4)
  }

  return {
    width: crop.size,
    height: crop.size,
    pixels: cropped,
  }
}

function resizeImage(image, targetSize) {
  const output = Buffer.alloc(targetSize * targetSize * 4)
  const scale = image.width / targetSize

  for (let y = 0; y < targetSize; y += 1) {
    for (let x = 0; x < targetSize; x += 1) {
      const sourceX = (x + 0.5) * scale - 0.5
      const sourceY = (y + 0.5) * scale - 0.5
      const x0 = Math.max(0, Math.floor(sourceX))
      const y0 = Math.max(0, Math.floor(sourceY))
      const x1 = Math.min(image.width - 1, x0 + 1)
      const y1 = Math.min(image.height - 1, y0 + 1)
      const tx = sourceX - x0
      const ty = sourceY - y0

      const p00 = getPixel(image, x0, y0)
      const p10 = getPixel(image, x1, y0)
      const p01 = getPixel(image, x0, y1)
      const p11 = getPixel(image, x1, y1)

      const targetOffset = (y * targetSize + x) * 4
      for (let channel = 0; channel < 4; channel += 1) {
        const top = p00[channel] * (1 - tx) + p10[channel] * tx
        const bottom = p01[channel] * (1 - tx) + p11[channel] * tx
        output[targetOffset + channel] = Math.round(top * (1 - ty) + bottom * ty)
      }
    }
  }

  return { width: targetSize, height: targetSize, pixels: output }
}

function createEmbeddedSvg(imageBuffer) {
  const encoded = imageBuffer.toString('base64')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">\n  <image href="data:image/png;base64,${encoded}" width="512" height="512"/>\n</svg>\n`
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const chunkType = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([chunkType, data])) >>> 0, 0)
  return Buffer.concat([length, chunkType, data, crc])
}

function crc32(buffer) {
  let crc = ~0
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return ~crc
}

async function writePng(filePath, image) {
  const stride = image.width * 4
  const raw = Buffer.alloc(image.height * (stride + 1))

  for (let y = 0; y < image.height; y += 1) {
    const rawOffset = y * (stride + 1)
    raw[rawOffset] = 0
    image.pixels.copy(raw, rawOffset + 1, y * stride, (y + 1) * stride)
  }

  const compressed = zlib.deflateSync(raw, { level: 9 })
  const header = Buffer.from('\x89PNG\r\n\x1a\n', 'binary')
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(image.width, 0)
  ihdr.writeUInt32BE(image.height, 4)
  ihdr.writeUInt8(8, 8)
  ihdr.writeUInt8(6, 9)
  ihdr.writeUInt8(0, 10)
  ihdr.writeUInt8(0, 11)
  ihdr.writeUInt8(0, 12)

  const png = Buffer.concat([
    header,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ])

  await fs.writeFile(filePath, png)
}

async function writeIco(targetPath, pngPaths) {
  const images = await Promise.all(pngPaths.map((pngPath) => fs.readFile(pngPath)))
  const count = images.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)

  let offset = 6 + count * 16
  const entries = []
  const payloads = []

  for (let index = 0; index < images.length; index += 1) {
    const size = Number(path.basename(pngPaths[index]).match(/(\d+)/)?.[1] ?? 0)
    const data = images[index]
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    payloads.push(data)
    offset += data.length
  }

  await fs.writeFile(targetPath, Buffer.concat([header, ...entries, ...payloads]))
}

async function main() {
  const sourceBuffer = await fs.readFile(sourcePath)
  const sourceImage = decodePng(sourceBuffer)

  const appCrop = findCrop(sourceImage, {
    xStart: 0,
    xEnd: 1400,
    yStart: 0,
    yEnd: 1000,
    threshold: 90,
  })
  const safariCrop = findCrop(sourceImage, {
    xStart: 1450,
    xEnd: sourceImage.width,
    yStart: 0,
    yEnd: 1000,
    threshold: 110,
  })

  const appSource = cropSquare(sourceImage, appCrop)
  const safariSource = cropSquare(sourceImage, safariCrop)

  for (const size of sizes) {
    await writePng(path.join(publicDir, `icon-${size}.png`), resizeImage(appSource, size))
  }

  await fs.copyFile(path.join(publicDir, 'icon-16.png'), path.join(publicDir, 'favicon-16x16.png'))
  await fs.copyFile(path.join(publicDir, 'icon-32.png'), path.join(publicDir, 'favicon-32x32.png'))

  const icon512Buffer = await fs.readFile(path.join(publicDir, 'icon-512.png'))
  const safari512 = resizeImage(safariSource, 512)
  const safari512Path = path.join(publicDir, 'echo-mark-512.png')
  await writePng(safari512Path, safari512)
  const safari512Buffer = await fs.readFile(safari512Path)

  await fs.writeFile(path.join(publicDir, 'favicon.svg'), createEmbeddedSvg(icon512Buffer), 'utf8')
  await fs.writeFile(path.join(publicDir, 'echo-mark.svg'), createEmbeddedSvg(safari512Buffer), 'utf8')
  await fs.writeFile(path.join(publicDir, 'safari-pinned-tab.svg'), createEmbeddedSvg(safari512Buffer), 'utf8')

  await writeIco(path.join(appDir, 'favicon.ico'), [
    path.join(publicDir, 'icon-16.png'),
    path.join(publicDir, 'icon-32.png'),
    path.join(publicDir, 'icon-48.png'),
  ])

  console.log(
    `brand assets generated from source artwork (app crop ${appCrop.x},${appCrop.y},${appCrop.size}; safari crop ${safariCrop.x},${safariCrop.y},${safariCrop.size})`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
