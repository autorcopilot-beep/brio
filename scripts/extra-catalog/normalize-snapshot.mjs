import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const [, , inputArg, outputArg = ".catalog-import/extra-normalized.json"] = process.argv;
if (!inputArg) throw new Error("Uso: node scripts/extra-catalog/normalize-snapshot.mjs <produtos.json> [saida.json]");

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);
const raw = JSON.parse(await readFile(inputPath, "utf8"));
const entries = Array.isArray(raw) ? raw.map((item) => [item.origem || item.url, item]) : Object.entries(raw);

const clean = (value) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() || null : null;
const officialUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "www.extramercado.com.br" && /^\/produto\/\d+/.test(url.pathname) ? url.href.split("?")[0] : null;
  } catch { return null; }
};
const decimalPrice = (values) => {
  const first = (Array.isArray(values) ? values : []).find((value) => /^R\$\s*[\d.]+,\d{2}/.test(value));
  if (!first) return null;
  return Number(first.replace(/[^\d,]/g, "").replace(",", "."));
};
const packageGrams = (name, details = "") => {
  const text = `${name || ""} ${details || ""}`;
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(kg|g)\b/i);
  if (!match) return null;
  const amount = Number(match[1].replace(",", "."));
  return match[2].toLowerCase() === "kg" ? amount * 1000 : amount;
};

const normalized = [];
const rejected = [];
for (const [key, item] of entries) {
  const sourceUrl = officialUrl(item.origem || key);
  const name = clean(item.nome);
  if (!sourceUrl || !name) { rejected.push({ key, reason: "missing_official_url_or_name" }); continue; }
  const pageId = sourceUrl.match(/\/produto\/(\d+)/)?.[1];
  const priceBrl = decimalPrice(item.precos_exibidos_texto);
  const grams = packageGrams(name, item.caracteristicas_texto);
  normalized.push({
    source_product_id: `extra-site-${pageId}`,
    catalog_source: "extra_mercado_oficial",
    name,
    source_url: sourceUrl,
    external_code: clean(item.codigo_site),
    captured_at: item.capturado_em_utc || null,
    price_brl: priceBrl,
    price_per_100g: priceBrl != null && grams ? Number((priceBrl / grams * 100).toFixed(4)) : null,
    package_grams: grams,
    ingredients: clean(item.ingredientes_texto),
    allergen_statement: clean(item.alergenicos_declarados_site?.texto || item.alergenicos_texto),
    nutrition_raw_text: clean(item.nutricional_texto_original),
    product_details: {
      additional_information: clean(item.informacoes_adicionais_texto),
      characteristics: clean(item.caracteristicas_texto),
      storage: item.conservacao_declarada_site || {},
      preparation: clean(item.preparo_declarado_site),
      tables: Array.isArray(item.tabelas_html) ? item.tabelas_html : [],
    },
    data_quality_status: item.status_rotulo === "texto_publicado_na_pagina" ? "partial" : "needs_review",
  });
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify({ generated_at: new Date().toISOString(), source: inputPath, products: normalized, rejected }, null, 2));
console.log(JSON.stringify({ input: entries.length, normalized: normalized.length, rejected: rejected.length, output: outputPath }));
