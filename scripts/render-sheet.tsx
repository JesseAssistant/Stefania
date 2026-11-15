// Служебный скрипт: рисует контактные листы персонажей и предметов в PNG (для визуальной проверки без браузера).
import { renderToString } from 'react-dom/server';
let n = 0;
const renderToStaticMarkup = (el: unknown) => (renderToString as unknown as (e: unknown, o: { identifierPrefix: string }) => string)(el, { identifierPrefix: `c${n++}-` });
import sharp from 'sharp';
import { CHARACTERS } from '../src/game/data/characters';
import { ITEMS } from '../src/game/data/items';
import { Nanabo, layerView } from '../src/art/Nanabo';
import { ItemIcon, MANNEQUIN } from '../src/art/ItemIcon';
import type { Emotion, Layer } from '../src/game/types';

const out = process.argv[2] || '/tmp/art';
function place(svg: string, x: number, y: number, w: number, h: number) { return svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `); }
async function sheet(name: string, cells: string[], cols: number, cw: number, ch: number, bg = '#FFF8E7') {
  const rows = Math.ceil(cells.length / cols);
  const body = cells.map((c, i) => place(c, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch)).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cw}" height="${rows * ch}"><rect width="100%" height="100%" fill="${bg}"/>${body}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${out}/${name}.png`);
}
const emos: Emotion[] = ['happy', 'wink', 'surprised', 'love', 'sleepy', 'excited', 'sad'];
await sheet('characters', CHARACTERS.map((c, i) => renderToStaticMarkup(<Nanabo look={c.look} emotion={emos[i % emos.length]} animate={false} />)), 8, 170, 205);
const byLayer = (l: Layer) => ITEMS.filter((i) => i.layer === l);
for (const l of ['outfit', 'costume', 'hat', 'glasses', 'accessory', 'shoes', 'jewelry', 'effect'] as Layer[]) {
  const items = byLayer(l);
  // на нескольких разных персонажах — чтобы проверить якоря
  const looks = [CHARACTERS[0].look, CHARACTERS[2].look, CHARACTERS[3].look, CHARACTERS[1].look];
  const cells = items.map((it, i) => renderToStaticMarkup(<Nanabo look={looks[i % looks.length]} equipped={{ [l]: it.id }} animate={false} />));
  await sheet(`wear-${l}`, cells, 7, 170, 205);
}
await sheet('icons', ITEMS.map((it) => renderToStaticMarkup(<ItemIcon item={it} />)), 11, 110, 110, '#EEF2F7');
void layerView; void MANNEQUIN;
console.log('ok', out);
