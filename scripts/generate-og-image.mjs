import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateOgImage() {
  const width = 1200;
  const height = 630;

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data: height rows, each: filter byte 0 + width * 4 bytes
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);

  // Brand colors:
  // #0f0a24 -> rgb(15, 10, 36)
  // #241b47 -> rgb(36, 27, 71)
  // #c9b6ff -> rgb(201, 182, 255)
  // #ffe9a8 -> rgb(255, 233, 168)
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter None

    const tY = y / height;
    for (let x = 0; x < width; x++) {
      const tX = x / width;
      const pixelOffset = rowOffset + 1 + x * 4;

      // Radial dark purple gradient towards center
      const dx = (x - width * 0.5) / (width * 0.5);
      const dy = (y - height * 0.5) / (height * 0.5);
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = Math.round(36 * (1 - dist * 0.4));
      let g = Math.round(27 * (1 - dist * 0.4));
      let b = Math.round(71 * (1 - dist * 0.3));

      // Clamp
      r = Math.max(15, Math.min(60, r));
      g = Math.max(10, Math.min(45, g));
      b = Math.max(36, Math.min(95, b));

      // Add border glow around canvas
      if (x < 12 || x > width - 12 || y < 12 || y > height - 12) {
        r = 201;
        g = 182;
        b = 255;
      }

      raw[pixelOffset] = r;
      raw[pixelOffset + 1] = g;
      raw[pixelOffset + 2] = b;
      raw[pixelOffset + 3] = 255; // full alpha
    }
  }

  const deflated = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const pngBuffer = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);

  const outDir = path.resolve('public');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, 'og-image.png'), pngBuffer);
  console.log('Generated public/og-image.png (1200x630)');
}

generateOgImage();
