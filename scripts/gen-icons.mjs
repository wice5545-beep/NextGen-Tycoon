// Generate PNG icons + splash from public/icons/icon.svg.
// Requires `sharp`:  npm i -D sharp   then:  node scripts/gen-icons.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Install sharp first:  npm i -D sharp");
    process.exit(1);
  }
  const svg = await readFile(join(root, "public/icons/icon.svg"));
  await mkdir(join(root, "public/icons"), { recursive: true });

  for (const size of [192, 512]) {
    await sharp(svg).resize(size, size).png().toFile(join(root, `public/icons/icon-${size}.png`));
    console.log(`icon-${size}.png ✓`);
  }
  // splash (centered logo on dark bg)
  const splash = await sharp({
    create: { width: 1080, height: 1920, channels: 4, background: "#070a12" },
  })
    .composite([{ input: await sharp(svg).resize(420, 420).png().toBuffer(), gravity: "center" }])
    .png()
    .toBuffer();
  await writeFile(join(root, "public/icons/splash.png"), splash);
  console.log("splash.png ✓");
}
main();
