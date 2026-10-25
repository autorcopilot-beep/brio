import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const CATEGORY_MAP = "https://www.extramercado.com.br/sitemap/mapa-de-categorias";
const API_URL = "https://api.vendas.gpa.digital/ex/search/category-page";
const OUTPUT = resolve(process.argv[2] || ".catalog-import/extra-api-catalog.json");
const STORE_ID = Number(process.env.EXTRA_STORE_ID || 483);
const MAX_CATEGORIES = Number(process.env.EXTRA_MAX_CATEGORIES || 0);
const WAIT_MS = Math.max(600, Number(process.env.EXTRA_WAIT_MS || 850));
const PAGE_SIZE = Math.min(100, Math.max(12, Number(process.env.EXTRA_PAGE_SIZE || 100)));
const categoryNames = {
  acougue: "Açougue", "alimentos-congelados": "Alimentos congelados",
  "alimentos-refrigerados": "Alimentos refrigerados", "basico-da-despensa": "Básico da despensa",
  cereais: "Cereais", "complemento-da-despensa": "Complemento da despensa",
  "doces-e-sobremesas": "Doces e sobremesas", hortifruti: "Hortifruti",
  "mercearia-salgada": "Mercearia salgada", padaria: "Padaria", peixaria: "Peixaria",
  rotisserie: "Rotisserie", "salgadinhos-e-aperitivos": "Salgadinhos e aperitivos",
};
const humanize = (value) => value ? value.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase()) : null;

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
const decode = (value) => value.replaceAll("&amp;", "&").replaceAll("&#xE7;", "ç").replaceAll("&#xE3;", "ã").replaceAll("&#xE1;", "á");
const parseGrams = (name) => {
  const match = String(name).match(/(\d+(?:[.,]\d+)?)\s*(kg|g)\b/i);
  if (!match) return null;
  const amount = Number(match[1].replace(",", "."));
  return match[2].toLowerCase() === "kg" ? amount * 1000 : amount;
};

async function fetchText(url) {
  const response = await fetch(url, { headers: { accept: "text/html" } });
  if (response.status === 403 || response.status === 429) throw new Error(`BLOCKED_${response.status}`);
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return response.text();
}

async function discoverLeafCategories() {
  const html = await fetchText(CATEGORY_MAP);
  const links = [...html.matchAll(/href="([^"]*\/categoria\/alimentos[^"]*)"/gi)]
    .map((match) => decode(match[1]).split("?")[0].replace(/\/$/, ""))
    .filter(Boolean);
  const unique = [...new Set(links)];
  return unique.filter((path) => !unique.some((other) => other !== path && other.startsWith(`${path}/`)));
}

async function fetchCategory(path, page) {
  const body = {
    partner: "linx", page, resultsPerPage: PAGE_SIZE,
    multiCategory: path.replace(/^\/categoria\//, "").split("/").join("|"),
    sortBy: "relevance", department: "ecom", storeId: STORE_ID,
    customerPlus: true, filters: null,
  };
  const response = await fetch(API_URL, { method: "POST", headers: { accept: "application/json", "content-type": "application/json", "x-origin": "CATALOG" }, body: JSON.stringify(body) });
  if (response.status === 403 || response.status === 429) throw new Error(`BLOCKED_${response.status}`);
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return response.json();
}

const categories = await discoverLeafCategories();
const selectedCategories = MAX_CATEGORIES > 0 ? categories.slice(0, MAX_CATEGORIES) : categories;
const products = new Map();
const failures = [];

for (let categoryIndex = 0; categoryIndex < selectedCategories.length; categoryIndex += 1) {
  const path = selectedCategories[categoryIndex];
  try {
    let page = 1;
    let totalPages = 1;
    do {
      const data = await fetchCategory(path, page);
      totalPages = Math.max(1, Number(data.totalPages || 1));
      for (const item of data.products || []) {
        const id = String(item.id || "");
        if (!id) continue;
        const previous = products.get(id);
        const grams = parseGrams(item.name);
        const price = Number.isFinite(Number(item.price)) ? Number(item.price) : null;
        const categoryPath = path.replace(/^\/categoria\//, "").split("/");
        products.set(id, {
          source_product_id: `extra-site-${id}`,
          catalog_source: "extra_mercado_oficial",
          external_code: item.sku ? String(item.sku) : null,
          name: item.name || previous?.name || null,
          brand: item.brand || previous?.brand || null,
          category: categoryNames[categoryPath[1]] || humanize(categoryPath[1] || categoryPath[0]),
          subcategory: categoryPath.slice(2).map(humanize).join(" · ") || null,
          category_paths: [...new Set([...(previous?.category_paths || []), path])],
          source_url: item.urlDetails || previous?.source_url || null,
          image_url: item.productImages?.[0] ? `https://static.extramercado.com.br${item.productImages[0]}` : previous?.image_url || null,
          package_grams: grams,
          package_description: grams ? `${grams >= 1000 ? grams / 1000 : grams} ${grams >= 1000 ? "kg" : "g"}` : null,
          price_brl: price,
          price_per_100g: price != null && grams ? Number((price / grams * 100).toFixed(4)) : null,
          promotion_price_brl: item.productPromotion?.unitPrice ?? null,
          promotion_text: item.productPromotion?.promotionPercentOff ? `${item.productPromotion.promotionPercentOff}% de desconto` : null,
          stock: item.stock === true,
          variable_weight: item.variableWeight === true,
          observed_at: new Date().toISOString(),
          store_id: STORE_ID,
        });
      }
      page += 1;
      await sleep(WAIT_MS);
    } while (page <= totalPages && page <= 200);
    console.log(`[${categoryIndex + 1}/${selectedCategories.length}] ${path} · ${products.size} produtos únicos`);
  } catch (error) {
    failures.push({ path, error: error instanceof Error ? error.message : String(error) });
    if (String(error).includes("BLOCKED_")) break;
  }
}

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, JSON.stringify({ generated_at: new Date().toISOString(), source: { category_map: CATEGORY_MAP, api_url: API_URL, store_id: STORE_ID }, categories_discovered: categories.length, categories_processed: selectedCategories.length - failures.length, products: [...products.values()], failures }, null, 2));
console.log(JSON.stringify({ categories_discovered: categories.length, categories_selected: selectedCategories.length, products: products.size, failures: failures.length, output: OUTPUT }));
