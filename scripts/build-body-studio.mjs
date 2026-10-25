import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

const appRoot = process.cwd();
const referencePath = path.join(appRoot, "references", "visuals", "anatomia-3d-v2.html");
const publicRoot = path.join(appRoot, "public");
const studioDir = path.join(publicRoot, "body-studio");
const vendorDir = path.join(publicRoot, "vendor");

await mkdir(studioDir, { recursive: true });
await mkdir(vendorDir, { recursive: true });

const source = await readFile(referencePath, "utf8");
const bridge = String.raw`
<style>
:root{--bg:#f4f1ec;--card:#fafaf7;--tx:#171717;--mut:#5e5a56;--ac:#8b5c6c;--line:#d9d2ca}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#f4f1ec;--card:#fafaf7;--tx:#171717;--mut:#5e5a56;--ac:#8b5c6c;--line:#d9d2ca}}
html,body{font-family:Arial,Helvetica,sans-serif}.card,.stage{box-shadow:0 14px 40px rgba(0,0,0,.055)}h1,h2{font-family:Georgia,"Times New Roman",serif}.src{line-height:1.45}
</style>
<script>
(() => {
  const fields = ["h", "w", "f", "m"];
  const readState = () => ({
    ...Object.fromEntries(fields.map((id) => [id, Number(document.getElementById(id)?.value)])),
    tone, mode, autoRotate: auto, breathing: breathe,
    muscleLevels: Array.from(LV), fatOffsets: Array.from(FO),
  });
  const notify = () => parent.postMessage({ type: "brio-body-change", value: readState() }, location.origin);
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.data?.type !== "brio-body-settings") return;
    for (const id of fields) {
      const input = document.getElementById(id);
      const value = event.data.value?.[id];
      if (input && Number.isFinite(value)) {
        input.value = String(value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    const value = event.data.value || {};
    if (Number.isInteger(value.tone) && value.tone !== tone) document.querySelectorAll("#tones button")[value.tone]?.click();
    if (["pele", "musculo"].includes(value.mode) && value.mode !== mode) document.querySelector('[data-mode="' + value.mode + '"]')?.click();
    if (typeof value.autoRotate === "boolean" && value.autoRotate !== auto) document.getElementById("rot")?.click();
    if (typeof value.breathing === "boolean" && value.breathing !== breathe) document.getElementById("br")?.click();
    if (Array.isArray(value.muscleLevels)) value.muscleLevels.slice(0, LV.length).forEach((item, index) => { if (Number.isFinite(item)) LV[index] = item; });
    if (Array.isArray(value.fatOffsets)) value.fatOffsets.slice(0, FO.length).forEach((item, index) => { if (Number.isFinite(item)) FO[index] = item; });
    recompute(); sync(); paint();
  });
  document.addEventListener("input", () => queueMicrotask(notify));
  document.addEventListener("click", () => queueMicrotask(notify));
  window.addEventListener("load", () => { notify(); parent.postMessage({ type: "brio-body-ready" }, location.origin); });
})();
</script>`;

const adapted = source
  .replace("<title>Anatomia 3D</title>", "<title>Brio · Corpo 3D</title>")
  .replace("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", "/vendor/three.min.js")
  .replace("</body></html>", `${bridge}</body></html>`);

await writeFile(path.join(studioDir, "index.html"), adapted, "utf8");
await copyFile(path.join(appRoot, "node_modules", "three", "build", "three.min.js"), path.join(vendorDir, "three.min.js"));

console.log("Body Studio asset generated from Brio anatomy reference v2.");
