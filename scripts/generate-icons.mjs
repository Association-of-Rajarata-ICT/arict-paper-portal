import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// Adapt the existing wordmark into a legible square; preserve its letter shapes.
// The two extracts exclude the tiny association tagline beneath the source logo.
const ar = await sharp("public/logo.png")
  .extract({ left: 43, top: 37, width: 291, height: 109 })
  .resize(288, 108, { fit: "contain", background: "#ffffff" }).png().toBuffer();
const ict = await sharp("public/logo.png")
  .extract({ left: 344, top: 37, width: 302, height: 109 })
  .resize(288, 104, { fit: "contain", background: "#ffffff" }).png().toBuffer();
const master = await sharp({ create: { width: 384, height: 384, channels: 4, background: "#ffffff" } })
  .composite([{ input: ar, left: 48, top: 72 }, { input: ict, left: 48, top: 204 }])
  .png().toBuffer();

for (const [size, file] of [
  [48, "public/favicon-48x48.png"],
  [192, "public/favicon-192x192.png"],
  [180, "public/apple-touch-icon.png"],
]) {
  await sharp(master).resize(size, size).png().toFile(file);
  console.log(`${file}: ${size}x${size}`);
}

// ICO containers support embedded PNG images. Include common browser sizes.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((size) => sharp(master).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
pngs.forEach((png, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile("src/app/favicon.ico", Buffer.concat([header, ...pngs]));
console.log("src/app/favicon.ico: 16x16, 32x32, 48x48");
