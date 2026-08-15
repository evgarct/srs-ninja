#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const publicDir = path.join(root, 'public')
const appDir = path.join(root, 'src', 'app')
const appIconSource = path.join(publicDir, 'echo-app-icon.svg')
const maskableSource = path.join(publicDir, 'echo-maskable.svg')
const sizes = [16, 32, 48, 180, 192, 512]

async function render(source, target, size) {
  await sharp(source, { density: 384 })
    .resize(size, size, { fit: 'contain' })
    .png({ compressionLevel: 9, palette: false })
    .toFile(target)
}

async function writeIco(targetPath, pngPaths) {
  const images = await Promise.all(pngPaths.map((pngPath) => fs.readFile(pngPath)))
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = 6 + images.length * 16
  const entries = []

  for (let index = 0; index < images.length; index += 1) {
    const size = Number(path.basename(pngPaths[index]).match(/(\d+)/)?.[1] ?? 0)
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(images[index].length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += images[index].length
  }

  await fs.writeFile(targetPath, Buffer.concat([header, ...entries, ...images]))
}

async function main() {
  for (const size of sizes) {
    await render(appIconSource, path.join(publicDir, `icon-${size}.png`), size)
  }
  await render(maskableSource, path.join(publicDir, 'icon-maskable-512.png'), 512)
  await fs.copyFile(path.join(publicDir, 'icon-180.png'), path.join(publicDir, 'apple-touch-icon.png'))
  await fs.copyFile(path.join(publicDir, 'icon-16.png'), path.join(publicDir, 'favicon-16x16.png'))
  await fs.copyFile(path.join(publicDir, 'icon-32.png'), path.join(publicDir, 'favicon-32x32.png'))
  await writeIco(path.join(appDir, 'favicon.ico'), [
    path.join(publicDir, 'icon-16.png'),
    path.join(publicDir, 'icon-32.png'),
    path.join(publicDir, 'icon-48.png'),
  ])
  console.log('Echo brand assets generated from vector sources')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
