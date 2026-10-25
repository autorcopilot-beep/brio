import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

const appRoot = process.cwd();
const referencePath = path.join(appRoot, "references", "visuals", "prato-interativo-v1.html");
const publicRoot = path.join(appRoot, "public");
const studioDir = path.join(publicRoot, "plate-studio");
const vendorDir = path.join(publicRoot, "vendor");

await mkdir(studioDir, { recursive: true });
await mkdir(vendorDir, { recursive: true });

const source = await readFile(referencePath, "utf8");
const bridge = String.raw`
<style>
:root{--bg:#f4f1ec;--card:#fafaf7;--tx:#171717;--mut:#5e5a56;--ac:#8b5c6c;--line:#d9d2ca}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#f4f1ec;--card:#fafaf7;--tx:#171717;--mut:#5e5a56;--ac:#8b5c6c;--line:#d9d2ca}}
html,body{font-family:Arial,Helvetica,sans-serif}h1,h2{font-family:Georgia,"Times New Roman",serif}.card,.stage{box-shadow:0 14px 40px rgba(0,0,0,.055)}
</style>
<script>
(() => {
  const colorByCategory = { p: "#d47b6b", c: "#d9a740", v: "#6fa66f", f: "#8e78b7", o: "#bd7896", b: "#6e9fb8" };
  const classify = (food) => {
    const text = (food.name + " " + (food.category || "")).toLowerCase();
    if (/bebida|suco|leite|iogurte/.test(text)) return "b";
    if (/verdura|legume|fruta|hort|tomate|br[oó]col|salada|abacate/.test(text)) return "v";
    if (/azeite|castanha|amendoim|óleo/.test(text)) return "f";
    if (/carne|frango|peixe|ovo|whey|queijo|prote[ií]na/.test(text) || Number(food.protein) >= 15) return "p";
    if (/arroz|massa|p[aã]o|batata|cereal|feij[aã]o/.test(text) || Number(food.carbs) >= 20) return "c";
    return "o";
  };
  const shape = (food) => {
    const text = food.name.toLowerCase();
    if (/ovo/.test(text)) return "egg";
    if (/tomate/.test(text)) return "tom";
    if (/br[oó]col/.test(text)) return "broc";
    if (/abacate/.test(text)) return "avo";
    if (/batata|frita/.test(text)) return "sticks";
    return "mound";
  };
  const notify = () => parent.postMessage({
    type: "brio-plate-change",
    value: { items: S.plate.map((item) => ({ foodId: item.id, grams: item.g })) },
  }, location.origin);
  const hydrate = (payload) => {
    window.__BRIO_REAL_DATA__ = true;
    Object.keys(groups).forEach((id) => { sc.remove(groups[id]); delete groups[id]; });
    S.plate = []; S.sel = null; FOODS.splice(0, FOODS.length); Object.keys(FB).forEach((key) => delete FB[key]);
    (payload.foods || []).slice(0, 600).forEach((food, index) => {
      const cat = classify(food);
      const item = { i: index, id: food.id, nm: food.name, cat, k: Number(food.kcal), p: Number(food.protein), c: Number(food.carbs), f: Number(food.fat), fi: Number(food.fiber || 0), g0: 100, sh: shape(food), col: colorByCategory[cat], col2: "#f2d280" };
      FOODS.push(item); FB[item.id] = item;
    });
    if (payload.calorieGoal) document.getElementById("kd").value = String(Math.round(payload.calorieGoal));
    document.getElementById("auto").onclick = () => {
      const chosen = ["p", "c", "v"].flatMap((cat) => FOODS.filter((food) => food.cat === cat).slice(0, cat === "v" ? 2 : 1));
      S.plate = chosen.slice(0, 6).map((food) => ({ id: food.id, g: food.cat === "v" ? 100 : 120 }));
      S.plate.forEach((item) => S.fresh.add(item.id)); layout(); list(); notify();
    };
    document.getElementById("rnd").onclick = () => {
      const shuffled = [...FOODS].sort(() => Math.random() - .5).slice(0, 4);
      S.plate = shuffled.map((food) => ({ id: food.id, g: food.g0 }));
      S.plate.forEach((item) => S.fresh.add(item.id)); layout(); list(); notify();
    };
    pal(); diets(); layout(); list(); document.getElementById("ld").hidden = true;
  };
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.data?.type !== "brio-plate-data") return;
    hydrate(event.data.value || {});
  });
  document.addEventListener("input", () => queueMicrotask(notify));
  document.addEventListener("click", () => queueMicrotask(notify));
  window.addEventListener("load", () => parent.postMessage({ type: "brio-plate-ready" }, location.origin));
})();
</script>`;

const adapted = source
  .replace("<title>Prato interativo</title>", "<title>Brio · Prato 3D</title>")
  .replace("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", "/vendor/three.min.js")
  .replace("for(const id in REPL){const f=FB[id];f.model=id;", "for(const id in REPL){const f=FB[id];if(!f)continue;f.model=id;")
  .replace("EXTRA.forEach(a=>{", "if(!window.__BRIO_REAL_DATA__) EXTRA.forEach(a=>{")
  .replace("</body></html>", `${bridge}</body></html>`);

await writeFile(path.join(studioDir, "index.html"), adapted, "utf8");
await copyFile(path.join(appRoot, "node_modules", "three", "build", "three.min.js"), path.join(vendorDir, "three.min.js"));
console.log("Plate Studio asset generated from Brio plate reference v1.");
