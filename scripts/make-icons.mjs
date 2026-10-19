// Génère les icônes PNG de l'app (favicon, Apple touch icon, icônes PWA)
// sans dépendance : un carré arrondi bleu, deux anneaux de radar et un point jaune.
// Usage : npm run icons

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const ACCENT = [0x2f, 0x55, 0xe4];
const WHITE = [0xff, 0xff, 0xff];
const SPARK = [0xf2, 0xb0, 0x1e];

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, rgba) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filtre "none"
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8 bits par canal
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Couleur (r, g, b, a) d'un point (x, y) en coordonnées 0..1. */
function sample(x, y, { fullBleed }) {
  const cx = x - 0.5;
  const cy = y - 0.5;

  // Carré arrondi (rayon 22 %) ou fond plein pour les icônes "maskable".
  if (!fullBleed) {
    const r = 0.22;
    const dx = Math.max(Math.abs(cx) - (0.5 - r), 0);
    const dy = Math.max(Math.abs(cy) - (0.5 - r), 0);
    if (Math.hypot(dx, dy) > r) return [0, 0, 0, 0];
  }

  let color = ACCENT;
  const d = Math.hypot(cx, cy);
  const stroke = 0.045;

  // Anneau extérieur, plein ; anneau intérieur, plus discret.
  if (Math.abs(d - 0.33) < stroke / 2) color = WHITE;
  else if (Math.abs(d - 0.2) < stroke / 2) color = mix(ACCENT, WHITE, 0.55);

  // Point jaune, légèrement décalé vers le haut à droite comme un écho radar.
  if (Math.hypot(cx - 0.11, cy + 0.11) < 0.075) color = SPARK;

  return [...color, 255];
}

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function render(size, options) {
  const ss = 4; // sur-échantillonnage 4×4 pour des bords lisses
  const out = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const [cr, cg, cb, ca] = sample((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size, options);
          r += cr * ca;
          g += cg * ca;
          b += cb * ca;
          a += ca;
        }
      }
      const i = (py * size + px) * 4;
      if (a > 0) {
        out[i] = Math.round(r / a);
        out[i + 1] = Math.round(g / a);
        out[i + 2] = Math.round(b / a);
      }
      out[i + 3] = Math.round(a / (ss * ss));
    }
  }
  return encodePng(size, out);
}

const targets = [
  { file: "src/app/icon.png", size: 64, fullBleed: false },
  { file: "src/app/apple-icon.png", size: 180, fullBleed: true },
  { file: "public/icons/icon-192.png", size: 192, fullBleed: false },
  { file: "public/icons/icon-512.png", size: 512, fullBleed: false },
  { file: "public/icons/icon-512-maskable.png", size: 512, fullBleed: true },
];

for (const { file, size, fullBleed } of targets) {
  const path = join(root, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, render(size, { fullBleed }));
  console.log(`✓ ${file} (${size}×${size})`);
}
