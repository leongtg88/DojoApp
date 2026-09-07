import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'public/assets/LogoCuadradoBlanco.svg');
const outDir = resolve(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

const bg = { r: 0, g: 0, b: 0, alpha: 1 };

async function emblem(size) {
  return sharp(src, { density: 300 }).resize(size, size).png().toBuffer();
}

async function composite(size, emblemSize, out) {
  const logo = await emblem(emblemSize);
  const offset = Math.round((size - emblemSize) / 2);
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toFile(resolve(outDir, out));
  console.log('generated', out);
}

await composite(192, 192, 'icon-192.png');
await composite(512, 512, 'icon-512.png');
await composite(180, 180, 'apple-touch-icon.png');
await composite(512, Math.round(512 * 0.62), 'icon-512-maskable.png');