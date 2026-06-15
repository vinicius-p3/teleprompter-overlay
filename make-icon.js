// Gera build/icon.png e build/icon.ico (sem dependências de imagem nativas).
// Desenha um ícone de "teleprompter": fundo escuro arredondado com linhas de
// texto, uma delas destacada em azul (a linha de leitura atual).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const pngToIco = require('png-to-ico');

// ---- Encoder PNG mínimo (RGBA, 8 bits) ----
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filtro: nenhum
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- Desenho ----
function makeIcon(size) {
  const rgba = Buffer.alloc(size * size * 4, 0); // transparente
  const s = size / 256;

  function px(x, y, r, g, b, a) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    const sa = a / 255;
    const da = (rgba[i + 3] / 255) * (1 - sa);
    const oa = sa + da;
    if (oa <= 0) return;
    rgba[i]     = Math.round((r * sa + rgba[i]     * da) / oa);
    rgba[i + 1] = Math.round((g * sa + rgba[i + 1] * da) / oa);
    rgba[i + 2] = Math.round((b * sa + rgba[i + 2] * da) / oa);
    rgba[i + 3] = Math.round(oa * 255);
  }

  function roundRect(x0, y0, w, h, rad, col) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let inside = true;
        if ((x < rad || x >= w - rad) && (y < rad || y >= h - rad)) {
          const cx = x < rad ? rad : w - rad - 1;
          const cy = y < rad ? rad : h - rad - 1;
          const dx = x - cx, dy = y - cy;
          if (dx * dx + dy * dy > rad * rad) inside = false;
        }
        if (inside) px(x0 + x, y0 + y, col[0], col[1], col[2], col[3] == null ? 255 : col[3]);
      }
    }
  }

  // Fundo
  roundRect(0, 0, size, size, 48 * s, [27, 30, 38, 255]);

  // Linhas de "texto" (a 2ª é a linha de leitura ativa, em azul)
  const bars = [
    { x: 56, w: 144, c: [206, 212, 224] },
    { x: 56, w: 118, c: [79, 157, 255] },
    { x: 56, w: 150, c: [206, 212, 224] },
    { x: 56, w: 96,  c: [150, 157, 170] },
  ];
  const barH = 18, gap = 24, startY = 56;
  bars.forEach((b, i) => {
    const y = startY + i * (barH + gap);
    roundRect(b.x * s, y * s, b.w * s, barH * s, (barH / 2) * s, b.c);
  });

  return rgba;
}

// ---- Saída ----
const outDir = path.join(__dirname, 'build');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [256, 128, 64, 48, 32, 16];
const buffers = sizes.map((sz) => encodePNG(sz, makeIcon(sz)));
fs.writeFileSync(path.join(outDir, 'icon.png'), buffers[0]); // 256x256

pngToIco(buffers)
  .then((ico) => {
    fs.writeFileSync(path.join(outDir, 'icon.ico'), ico);
    console.log('Ícone gerado: build/icon.ico e build/icon.png');
  })
  .catch((err) => {
    console.error('Falha ao gerar .ico:', err);
    process.exit(1);
  });
