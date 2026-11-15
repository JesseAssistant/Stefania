// Генерирует иконки приложения из SVG-рисунка Pip (запуск: npm run icons). Результат хранится в public/icons.
import { renderToString } from 'react-dom/server';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { Nanabo } from '../src/art/Nanabo';
import { CHARACTERS } from '../src/game/data/characters';

const out = new URL('../public/icons/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const pip = CHARACTERS.find((c) => c.id === 'pip')!;
const body = (renderToString as unknown as (e: unknown, o: { identifierPrefix: string }) => string)(<Nanabo look={pip.look} equipped={{ hat: 'party-hat' }} emotion="excited" animate={false} shadow={false} />, { identifierPrefix: 'ic-' })
  .replace('<svg ', '<svg x="%X%" y="%Y%" width="%W%" height="%H%" ');
function icon(size: number, scale: number, rounded: boolean) {
  const w = size * scale, x = (size - w) / 2, y = (size - w * 1.2) / 2 - size * 0.02;
  const inner = body.replace('%X%', String(x)).replace('%Y%', String(y)).replace('%W%', String(w)).replace('%H%', String(w * 1.2));
  const bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD3FF"/><stop offset="1" stop-color="#FFF1B8"/></linearGradient></defs><rect width="${size}" height="${size}" ${rounded ? `rx="${size * 0.22}"` : ''} fill="url(#g)"/><ellipse cx="${size / 2}" cy="${size * 1.02}" rx="${size * 0.7}" ry="${size * 0.26}" fill="#8ED081"/>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}${inner}</svg>`);
}
await sharp(icon(180, 0.68, false)).png().toFile(out + 'apple-touch-icon.png');   // iOS скругляет сам
await sharp(icon(192, 0.68, true)).png().toFile(out + 'icon-192.png');
await sharp(icon(512, 0.68, true)).png().toFile(out + 'icon-512.png');
await sharp(icon(512, 0.56, false)).png().toFile(out + 'icon-maskable-512.png'); // безопасная зона для maskable
console.log('icons ok');
