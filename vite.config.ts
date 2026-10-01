import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const iconRoot = path.resolve(__dirname, "public/emoji-icons");
const icons = readdirSync(iconRoot, { withFileTypes: true }).flatMap((folder) =>
  folder.isDirectory()
    ? readdirSync(path.join(iconRoot, folder.name))
        .filter((name) => name.endsWith(".png"))
        .map((name) => {
          const file = `${folder.name}/${name}`;
          return {
            file,
            sha256: createHash("sha256")
              .update(readFileSync(path.join(iconRoot, file)))
              .digest("hex"),
          };
        })
    : [],
);
const defaultIcons = ["profile-pic/fox-3d.png", "travel-and-places/airplane-3d.png"];

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    {
      name: "icon-inventory",
      apply: "build",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "icon-inventory.json",
          source: JSON.stringify(icons),
        });
      },
    },
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/features/pwa/utils",
      filename: "service-worker.ts",
      manifest: false,
      injectRegister: null,
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,woff2,webp,png,webmanifest}"],
        globIgnores: ["emoji-icons/**/*.png"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        additionalManifestEntries: defaultIcons.map((file) => ({
          url: `emoji-icons/${file}`,
          revision: icons.find((icon) => icon.file === file)!.sha256,
        })),
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
