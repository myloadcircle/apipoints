// Generate favicon PNG and ICO for APIPoints
// Dark rounded square with lime green dot (#a3e635)
const fs = require('fs');
const path = require('path');

// Create a 32x32 RGBA PNG manually (uncompressed)
function createPNG(width, height, pixels) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk('IHDR', ihdrData);

  // IDAT chunk (raw pixel data, unfiltered, uncompressed - deflate is complex)
  // For simplicity, we'll create a minimal valid PNG with IDAT
  // Actually let's use a simpler approach - create a BMP-like block
  
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const off = y * (1 + width * 4);
    raw[off] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const pi = (y * width + x) * 4;
      const po = off + 1 + x * 4;
      raw[po] = pixels[pi];     // R
      raw[po+1] = pixels[pi+1]; // G
      raw[po+2] = pixels[pi+2]; // B
      raw[po+3] = pixels[pi+3]; // A
    }
  }

  // Use zlib for proper deflate
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(raw);
  const idat = chunk('IDAT', compressed);

  // IEND chunk
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeB, data]);
  const crc = crc32(crcData);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate pixel data
function generateAPIPointsIcon(size, hasGlow) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const dotR = size * 0.22;
  const bgR = size * 0.38; // rounded square radius

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.sqrt(dx*dx + dy*dy);

      // Dark background (rounded square)
      const edgeDist = Math.max(Math.abs(dx), Math.abs(dy));
      const cornerR = size * 0.2;
      let bgAlpha = 1;
      if (edgeDist > cx - cornerR) {
        const cornerDx = Math.max(0, Math.abs(dx) - (cx - cornerR));
        const cornerDy = Math.max(0, Math.abs(dy) - (cy - cornerR));
        const cornerDist = Math.sqrt(cornerDx*cornerDx + cornerDy*cornerDy);
        bgAlpha = Math.min(1, Math.max(0, 1 - (cornerDist - cornerR * 0.7) / (cornerR * 0.3)));
      }

      pixels[i] = 10;   // R
      pixels[i+1] = 10; // G
      pixels[i+2] = 10; // B
      pixels[i+3] = Math.round(bgAlpha * 255);

      // Lime green dot
      if (dist < dotR) {
        const dotAlpha = Math.min(1, (dotR - dist) / dotR + 0.3);
        pixels[i] = 163;
        pixels[i+1] = 230;
        pixels[i+2] = 53;
        pixels[i+3] = Math.round(Math.min(1, bgAlpha) * dotAlpha * 255);
      }

      // Glow ring
      if (hasGlow && dist > dotR && dist < dotR * 1.3) {
        const glowAlpha = Math.max(0, 1 - (dist - dotR) / (dotR * 0.3)) * 0.3;
        if (glowAlpha > 0.01) {
          pixels[i] = Math.round(pixels[i] * (1 - glowAlpha) + 163 * glowAlpha);
          pixels[i+1] = Math.round(pixels[i+1] * (1 - glowAlpha) + 230 * glowAlpha);
          pixels[i+2] = Math.round(pixels[i+2] * (1 - glowAlpha) + 53 * glowAlpha);
        }
      }
    }
  }
  return pixels;
}

const sizes = [16, 32, 48, 64];
const outDir = path.join(__dirname, '..', 'assets');

// Generate PNGs
for (const size of sizes) {
  const pixels = generateAPIPointsIcon(size, false);
  const png = createPNG(size, size, pixels);
  fs.writeFileSync(path.join(outDir, `favicon-${size}.png`), png);
  console.log(`Created favicon-${size}.png`);
}

// Generate a larger version for apple-touch-icon
const applePixels = generateAPIPointsIcon(180, true);
const applePng = createPNG(180, 180, applePixels);
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), applePng);
console.log('Created apple-touch-icon.png');

// Generate ICO (contains 16, 32, 48)
function createICO(sizes) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // ICO type
  icoHeader.writeUInt16LE(sizes.length, 4); // image count

  const entries = [];
  const imageData = [];
  let offset = 6 + sizes.length * 16;

  for (const size of sizes) {
    const pixels = generateAPIPointsIcon(size, false);
    const png = createPNG(size, size, pixels);
    
    const entry = Buffer.alloc(16);
    entry[0] = size === 256 ? 0 : size; // width
    entry[1] = size === 256 ? 0 : size; // height
    entry[2] = 0; // colors
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    
    imageData.push(png);
    offset += png.length;
  }

  return Buffer.concat([icoHeader, ...entries, ...imageData]);
}

const ico = createICO([16, 32, 48]);
fs.writeFileSync(path.join(outDir, 'favicon.ico'), ico);
console.log('Created favicon.ico');

console.log('Done!');
