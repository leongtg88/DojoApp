import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcCuadrado = resolve(root, 'public/assets/LogoCuadradoBlanco.svg');
const srcLogoSolo = resolve(root, 'public/assets/LogoSolo.svg');
const outDir = resolve(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

const bg = { r: 0, g: 0, b: 0, alpha: 1 };

async function emblem(src, size) {
  return sharp(src, { density: 300 }).resize(size, size).png().toBuffer();
}

async function composite(src, size, emblemSize, outPath) {
  const logo = await emblem(src, emblemSize);
  const offset = Math.round((size - emblemSize) / 2);
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toFile(outPath);
  console.log('generated', outPath);
}

const favicon = resolve(root, 'app/icon.png');

await composite(srcCuadrado, 192, 192, resolve(outDir, 'icon-192.png'));
await composite(srcCuadrado, 512, 512, resolve(outDir, 'icon-512.png'));
await composite(srcCuadrado, 180, 180, resolve(outDir, 'apple-touch-icon.png'));
await composite(srcCuadrado, 512, Math.round(512 * 0.62), resolve(outDir, 'icon-512-maskable.png'));
await composite(srcLogoSolo, 192, 192, favicon);