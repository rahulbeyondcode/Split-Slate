import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const source = "src/assets/favicon.png";
const image = `data:image/png;base64,${(await readFile(source)).toString("base64")}`;
const browser = await chromium.launch();
const page = await browser.newPage();

try {
  for (const [name, size, maskable] of [
    ["app-icon-192.png", 192, false],
    ["app-icon-512.png", 512, false],
    ["app-icon-maskable-512.png", 512, true],
  ]) {
    const base64 = await page.evaluate(
      async ({ src, size, maskable }) => {
        const icon = new Image();
        icon.src = src;
        await icon.decode();
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable");
        if (maskable) {
          context.fillStyle = "#795ecb";
          context.fillRect(0, 0, size, size);
        }
        const inset = maskable ? 96 : 0;
        context.drawImage(icon, inset, inset, size - inset * 2, size - inset * 2);
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { src: image, size, maskable },
    );
    await writeFile(`public/${name}`, Buffer.from(base64, "base64"));
  }
} finally {
  await browser.close();
}
