import qrcode from "qrcode-generator";

// Renders text as a QR code PNG, entirely in-Worker. Email clients can't show
// SVG, and Workers have no canvas, so this encodes the module matrix straight
// into a 1-bit PNG by hand. Pixel-exact module blocks (no anti-aliasing) keep
// the code scannable at any display size.

const MODULE_PX = 8;
// The QR spec's minimum quiet zone is 4 modules of blank border all round.
const QUIET_ZONE_MODULES = 4;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  // The CRC covers the type and data, not the length.
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

// PNG's IDAT payload is a zlib stream, which is exactly what the runtime's
// "deflate" CompressionStream produces ("deflate-raw" would omit the zlib
// header and checksum PNG requires).
async function zlibDeflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function qrPng(text: string): Promise<Uint8Array> {
  const qr = qrcode(0, "M"); // type 0 = smallest version that fits; M = ~15% error correction
  qr.addData(text);
  qr.make();

  const modules = qr.getModuleCount();
  const size = (modules + QUIET_ZONE_MODULES * 2) * MODULE_PX;
  const rowBytes = Math.ceil(size / 8);

  // 1-bit grayscale: 0 = black, 1 = white; each scanline is prefixed with a
  // filter-type byte (0 = none).
  const raw = new Uint8Array((rowBytes + 1) * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (rowBytes + 1);
    const moduleRow = Math.floor(y / MODULE_PX) - QUIET_ZONE_MODULES;
    raw.fill(0xff, rowStart + 1, rowStart + 1 + rowBytes);
    if (moduleRow < 0 || moduleRow >= modules) continue;
    for (let x = 0; x < size; x++) {
      const moduleCol = Math.floor(x / MODULE_PX) - QUIET_ZONE_MODULES;
      if (moduleCol < 0 || moduleCol >= modules || !qr.isDark(moduleRow, moduleCol)) continue;
      raw[rowStart + 1 + (x >> 3)] &= ~(0x80 >> (x & 7));
    }
  }

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, size);
  ihdrView.setUint32(4, size);
  ihdr[8] = 1; // bit depth
  ihdr[9] = 0; // colour type: grayscale
  // bytes 10-12: compression, filter, interlace — all 0

  const parts = [
    new Uint8Array(PNG_SIGNATURE),
    chunk("IHDR", ihdr),
    chunk("IDAT", await zlibDeflate(raw)),
    chunk("IEND", new Uint8Array(0)),
  ];
  const png = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}
