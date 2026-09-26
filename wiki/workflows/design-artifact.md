# Standalone Design Artifact

Purpose: define the canonical visual-design reference and the repeatable process for rendering a
Claude Design standalone HTML artifact.

Last updated: 2026-09-26

## Authority and handling

A user-provided Claude Design standalone HTML file is Split Slate's canonical visual source of
truth. UI implementation and review should use it for visual language, responsive composition,
component appearance, spacing, color, typography, and interaction intent. The artifact represents
the target UI; application source remains authoritative for what is currently implemented and for
domain behavior. See [[layout-architecture]] and [[product-roadmap]].

Treat the HTML as immutable input. Do not edit, reformat, or copy it into the repository unless the
user explicitly requests that. Use the absolute path supplied by the user rather than assuming a
permanent Downloads location or filename. The artifact previously validated was named
`Split Slate (Standalone).html` and identified itself as `Split Slate — Phase 1 Design`.

## Preferred render path

1. Confirm that the supplied file is readable.
2. If a desktop browser is connected to the session, open the absolute path with the browser file
   preview. Wait for the artifact's `Unpacking...` state to disappear before evaluating the UI.
3. Inspect rendered pixels with screenshots and use the accessibility snapshot or DOM text to find
   screens and controls. Pan, zoom, or navigate the design canvas as needed.
4. If the browser reports that no desktop browser is connected, do not retry it repeatedly. Use the
   Playwright fallback below.

Reading the outer HTML alone is insufficient: it is a bundle wrapper whose manifest and template
are unpacked by JavaScript at runtime.

## Playwright fallback

The repository includes `@playwright/test` and an installed Chromium build. From the repository
root, set `DESIGN_HTML` to the user-supplied absolute path and run:

```bash
DESIGN_HTML="/absolute/path/to/design.html" node --input-type=module <<'EOF'
import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});

page.on("pageerror", (error) => console.error("pageerror", error.message));
await page.goto(pathToFileURL(process.env.DESIGN_HTML).href, { waitUntil: "load" });
await page.waitForTimeout(8000);

console.log("title", await page.title());
const text = await page.locator("body").innerText();
console.log(
  text
    .split("\n")
    .filter((line) => /^\d{2} ·/.test(line))
    .join("\n"),
);

await page.screenshot({
  path: "/tmp/opencode/split-slate-design.png",
  fullPage: true,
});
await browser.close();
EOF
```

Open `/tmp/opencode/split-slate-design.png` with the file-reading or preview tool to inspect the
rendered pixels. A fixed or pannable design canvas may make a full-page screenshot show only its
current viewport; use DOM text to locate sections, then interact with or reposition the rendered
canvas for focused screenshots.

The artifact may log a failed `file://.../.design-canvas.state.json` fetch. This is benign when the
screens render and their text is present; it only means no adjacent saved canvas-state file was
available. React DevTools and in-browser Babel notices are also informational.

## Render validation

A successful render replaces the initial thumbnail/loading wrapper, exposes the design content in
the DOM, and produces a nonblank screenshot. The validated Phase 1 artifact contains these top-level
sections:

1. Design system
2. Dashboard / Home
3. Inside a group
4. Add / Edit expense
5. Contacts & members
6. Dark theme
7. Onboarding
8. Group creation
9. Categories & Tags
10. Settings
11. Import / Export
12. Empty, loading & edge states

Future artifact revisions may add, remove, or rename sections. Always inspect the rendered file
provided for the current task instead of assuming this inventory is unchanged.

## Related

- [[layout-architecture]] — current responsive shell and implemented navigation
- [[dashboard]] — current dashboard behavior and target sections
- [[main-screen]] — current group-detail UI workflows
- [[product-roadmap]] — committed product scope and implementation status
