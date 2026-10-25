/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { marketplaceSources } from "@/lib/catalog/marketplace-sources";
import { isSupplementProduct } from "@/lib/catalog/product-kind";
import {
  Beef,
  Bot,
  Carrot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Fish,
  ImageOff,
  Milk,
  PackageSearch,
  Search,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
  Store,
  Wheat,
  X,
} from "lucide-react";

export type FoodCatalogFood = {
  id: string;
  user_id: string | null;
  name: string;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  price_per_100g: number | null;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  source_url: string | null;
  image_url: string | null;
  package_description: string | null;
  ingredients: string | null;
  allergen_statement: string | null;
  nutrition_serving_label: string | null;
  nutrition_raw: Record<string, string>;
  product_details: Record<string, string>;
  data_quality_status: "complete" | "partial" | "needs_review";
  catalog_source: string | null;
  catalog_metadata: Record<string, unknown>;
};

type FoodCatalogProps = {
  foods: FoodCatalogFood[];
  onAddToDiary: (foodId: string) => void;
  onAddToShopping: (food: FoodCatalogFood) => void;
  onCreateFood: (data: FormData) => void;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function CategoryArtwork({ category, compact = false }: { category: string | null; compact?: boolean }) {
  const normalized = (category ?? "").toLocaleLowerCase("pt-BR");
  const Icon = normalized.includes("açougue") ? Beef : normalized.includes("peix") ? Fish : normalized.includes("hort") ? Carrot : normalized.includes("padaria") ? Wheat : normalized.includes("refriger") ? Milk : PackageSearch;
  return <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_72%_25%,rgba(255,255,255,.8),transparent_26%),linear-gradient(145deg,#f5ede7,#d8c4ca)]" aria-hidden="true"><div className="absolute -bottom-8 -right-5 h-28 w-28 rounded-full border border-white/60 bg-white/20"/><Icon size={compact ? 38 : 62} strokeWidth={1.25} className="relative text-[#875d6b]"/><span className="absolute bottom-3 left-3 max-w-[80%] truncate text-[10px] font-bold uppercase tracking-[.12em] text-[#6f4d59]">{category || "Catálogo Brio"}</span></div>;
}

function ProductImage({ food, compact = false }: { food: FoodCatalogFood; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!food.image_url || failed) return <CategoryArtwork category={food.category} compact={compact} />;
  return <img src={food.image_url} alt={`Imagem de ${food.name}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="relative z-10 h-full w-full object-contain p-3" />;
}

function FoodCard({ food, onOpen }: { food: FoodCatalogFood; onOpen: () => void }) {
  const category = food.subcategory || food.category || "Sem categoria";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group min-w-[238px] max-w-[280px] flex-1 overflow-hidden rounded-[24px] border border-[#e5ded5] bg-white text-left shadow-[0_12px_30px_rgba(43,37,32,.05)] transition hover:-translate-y-0.5 hover:border-[#bda9ae]"
    >
      <div className="relative grid h-32 place-items-center overflow-hidden bg-[linear-gradient(145deg,#f6f1ec,#ebe6de)]">
        <ProductImage food={food} compact />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-[#6f6963] backdrop-blur">
          {food.user_id ? "Meu alimento" : "Catálogo"}
        </span>
      </div>
      <div className="p-4">
        <p className="truncate text-[11px] font-bold uppercase tracking-[.1em] text-[#8b5c6c]">{category}</p>
        <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-bold leading-5">{food.name}</h3>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] text-[#77716b]">Preço por 100 g</p>
            <p className="mt-0.5 font-serif text-xl">{food.price_per_100g == null ? "—" : money.format(food.price_per_100g)}</p>
          </div>
          <span className="rounded-full bg-[#f1ece6] p-2 transition group-hover:bg-black group-hover:text-white">
            <ChevronRight size={15} />
          </span>
        </div>
      </div>
    </button>
  );
}

function CatalogRail({ title, subtitle, foods, onOpen }: { title: string; subtitle: string; foods: FoodCatalogFood[]; onOpen: (food: FoodCatalogFood) => void }) {
  if (!foods.length) return null;
  const railId = `rail-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const scroll = (direction: number) => document.getElementById(railId)?.scrollBy({ left: direction * 520, behavior: "smooth" });
  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-4">
        <div><h3 className="font-serif text-2xl">{title}</h3><p className="mt-1 text-xs text-[#6f6963]">{subtitle}</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => scroll(-1)} aria-label={`Voltar em ${title}`} className="grid h-9 w-9 place-items-center rounded-full border bg-white"><ChevronLeft size={16} /></button>
          <button type="button" onClick={() => scroll(1)} aria-label={`Avançar em ${title}`} className="grid h-9 w-9 place-items-center rounded-full border bg-white"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div id={railId} className="mt-4 flex snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&>*]:snap-start">
        {foods.map((food) => <FoodCard key={food.id} food={food} onOpen={() => onOpen(food)} />)}
      </div>
    </section>
  );
}

function FoodDrawer({ food, onClose, onAddToDiary, onAddToShopping }: { food: FoodCatalogFood; onClose: () => void; onAddToDiary: () => void; onAddToShopping: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  const macros = [
    ["Energia", food.kcal_per_100g, "kcal"], ["Proteína", food.protein_per_100g, "g"],
    ["Carboidratos", food.carbs_per_100g, "g"], ["Gorduras", food.fat_per_100g, "g"],
  ] as const;
  const askClovis = () => window.dispatchEvent(new CustomEvent("brio:assistant:prompt", { detail: { prompt: `Analise o alimento “${food.name}” usando apenas os dados verificados do catálogo e explique como ele pode entrar na minha alimentação.` } }));
  const observedAt = typeof food.catalog_metadata.observed_at === "string" ? new Date(food.catalog_metadata.observed_at) : null;
  const observedLabel = observedAt && !Number.isNaN(observedAt.valueOf()) ? observedAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : null;
  const storeId = typeof food.catalog_metadata.store_id === "string" || typeof food.catalog_metadata.store_id === "number" ? String(food.catalog_metadata.store_id) : null;
  return (
    <div className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-[2px]" role="presentation" onMouseDown={onClose}>
      <aside role="dialog" aria-modal="true" aria-label={`Ficha de ${food.name}`} onMouseDown={(event) => event.stopPropagation()} className="absolute inset-y-0 right-0 w-full max-w-[560px] overflow-y-auto bg-[#faf9f6] p-5 shadow-2xl md:p-7">
        <div className="flex items-center justify-between"><p className="text-xs font-bold tracking-[.14em] text-[#8b5c6c]">FICHA DO ALIMENTO</p><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white" aria-label="Fechar ficha"><X size={18} /></button></div>
        <div className="mt-5 grid h-52 place-items-center overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#f0eae3,#e4ddd4)]">
          <ProductImage food={food} />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.1em] text-[#8b5c6c]">{food.brand || food.category || "Catálogo Brio"}</p>
        <h2 className="mt-2 font-serif text-3xl leading-tight">{food.name}</h2>
        {food.package_description && <p className="mt-2 text-sm text-[#6f6963]">{food.package_description}</p>}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {macros.map(([label, value, unit]) => <div key={label} className="rounded-2xl bg-white p-3"><p className="text-[10px] font-bold text-[#77716b]">{label}</p><p className="mt-2 text-lg font-bold">{value == null ? "—" : `${Number(value).toLocaleString("pt-BR")} ${unit}`}</p><p className="text-[9px] text-[#8b8580]">por 100 g</p></div>)}
        </div>
        {food.data_quality_status === "needs_review" && <div className="mt-4 rounded-2xl border border-[#d4aa77] bg-[#fff7e9] p-4 text-xs leading-5 text-[#755728]">A fonte publicou dados potencialmente inconsistentes. O Brio preservou a ficha original, mas não usa esses números em cálculos até revisão.</div>}
        <div className="mt-6 space-y-3">
          {food.ingredients && <Detail title="Ingredientes" text={food.ingredients} />}
          {food.allergen_statement && <Detail title="Alergênicos" text={food.allergen_statement} />}
          {food.nutrition_serving_label && <Detail title="Porção declarada" text={food.nutrition_serving_label} />}
          {Object.keys(food.nutrition_raw || {}).length > 0 && <div className="rounded-[22px] bg-white p-5"><h3 className="text-sm font-bold">Tabela publicada pela fonte</h3><div className="mt-3 divide-y divide-[#ece6df]">{Object.entries(food.nutrition_raw).map(([key, value]) => <div key={key} className="flex justify-between gap-4 py-2 text-xs"><span className="capitalize text-[#6f6963]">{key.replaceAll("_", " ")}</span><strong>{String(value)}</strong></div>)}</div></div>}
        </div>
        <div className="mt-6 rounded-[22px] bg-black p-5 text-white"><div className="flex items-center justify-between"><div><p className="text-xs text-white/60">Preço observado por 100 g</p><p className="mt-1 font-serif text-3xl">{food.price_per_100g == null ? "Indisponível" : money.format(food.price_per_100g)}</p></div><CheckCircle2 size={22} /></div>{(observedLabel || storeId) && <p className="mt-3 text-[10px] text-white/75">{observedLabel ? `Observado em ${observedLabel}` : "Data não informada"}{storeId ? ` · loja ${storeId}` : ""}</p>}<p className="mt-2 text-[10px] leading-4 text-white/60">Preço pode variar por loja, CEP, promoção e data. Confira a origem antes de comprar.</p></div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={onAddToDiary} className="rounded-2xl bg-[#c38d9e] px-4 py-3 text-sm font-bold">Registrar no diário</button><button type="button" onClick={onAddToShopping} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black px-4 py-3 text-sm font-bold"><ShoppingBasket size={17} /> Lista de compras</button><button type="button" onClick={askClovis} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d9d2ca] bg-white px-4 py-3 text-sm font-bold sm:col-span-2"><Bot size={17} /> Perguntar ao CLOVIS</button></div>
        {isSupplementProduct(food) && <div className="mt-5 rounded-[22px] border border-[#ddd5cc] bg-white p-4"><div className="flex items-center gap-2"><Store size={16}/><h3 className="text-sm font-bold">Comparar em marketplaces</h3></div><p className="mt-1 text-[11px] leading-4 text-[#6f6963]">Abre uma busca externa. Confira vendedor, composição, lote e registro antes de comprar.</p><div className="mt-3 flex flex-wrap gap-2">{marketplaceSources.map((source) => <a key={source.id} href={source.searchUrl(food.name)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold">{source.name}<ExternalLink size={12}/></a>)}</div></div>}
        {food.source_url && <a href={food.source_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#8b5c6c]">Abrir fonte original <ExternalLink size={13} /></a>}
      </aside>
    </div>
  );
}

function Detail({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[22px] bg-white p-5"><h3 className="text-sm font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#5e5a56]">{text}</p></div>;
}

function MarketplaceDiscovery() {
  const [query, setQuery] = useState("whey protein");
  const askClovis = () => window.dispatchEvent(new CustomEvent("brio:assistant:prompt", { detail: { prompt: `Quero escolher “${query}”. Mostre quais informações do rótulo e da minha rotina devo comparar, sem inventar preços nem fazer prescrição clínica.` } }));
  return <section className="mt-8 rounded-[28px] border border-[#ded7cf] bg-white p-5 md:p-6"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#8b5c6c]"><Store size={15}/> Fontes externas</div><h3 className="mt-2 font-serif text-2xl">Buscar suplementos em outras lojas</h3><p className="mt-2 max-w-2xl text-xs leading-5 text-[#6f6963]">O Brio abre a busca original para você validar vendedor, composição e preço. Resultados externos não entram automaticamente no diário.</p></div><label className="flex h-12 min-w-0 items-center gap-2 rounded-2xl border bg-[#faf9f6] px-3 lg:min-w-[340px]"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Whey, creatina, hipercalórico…" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label></div><div className="mt-4 flex flex-wrap gap-2">{marketplaceSources.map((source) => <a key={source.id} href={source.searchUrl(query || "suplementos")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white">Buscar no {source.name}<ExternalLink size={13}/></a>)}<button type="button" onClick={askClovis} className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold"><Bot size={14}/> Avaliar com CLOVIS</button></div></section>;
}

export function FoodCatalog({ foods, onAddToDiary, onAddToShopping, onCreateFood }: FoodCatalogProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [quality, setQuality] = useState("all");
  const [catalogKind, setCatalogKind] = useState<"all" | "food" | "supplement">("all");
  const [visibleCount, setVisibleCount] = useState(80);
  const [selected, setSelected] = useState<FoodCatalogFood | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const categories = useMemo(() => [...new Set(foods.map((food) => food.category).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "pt-BR")), [foods]);
  const filtered = useMemo(() => foods.filter((food) => {
    const haystack = `${food.name} ${food.brand || ""} ${food.category || ""} ${food.subcategory || ""}`.toLocaleLowerCase("pt-BR");
    const supplement = isSupplementProduct(food);
    return (!query || haystack.includes(query.toLocaleLowerCase("pt-BR"))) && (category === "all" || food.category === category) && (quality === "all" || food.data_quality_status === quality) && (catalogKind === "all" || (catalogKind === "supplement" ? supplement : !supplement));
  }), [foods, query, category, quality, catalogKind]);
  const complete = foods.filter((food) => food.data_quality_status === "complete").slice(0, 12);
  const priced = foods.filter((food) => food.price_per_100g != null).slice(0, 12);
  const official = foods.filter((food) => food.catalog_source === "extra_mercado_oficial").slice(0, 12);
  const supplements = foods.filter(isSupplementProduct).slice(0, 12);
  return (
    <div>
      <div className="rounded-[28px] bg-[#161513] p-5 text-white md:p-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-xs font-bold text-[#d5aaba]"><Sparkles size={15} /> CATÁLOGO BRIO</div><h2 className="mt-3 max-w-xl font-serif text-3xl md:text-4xl">Escolha com contexto, não só por calorias.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Produtos reais, origem visível e campos incompletos tratados como desconhecidos.</p></div><button type="button" onClick={() => setShowCreate((value) => !value)} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black">{showCreate ? "Fechar cadastro" : "Cadastrar alimento"}</button></div>
      </div>
      {showCreate && <form action={onCreateFood} className="mt-4 rounded-[24px] border border-[#e5ded5] bg-white p-5"><h3 className="font-serif text-2xl">Novo alimento pessoal</h3><p className="mt-1 text-xs text-[#6f6963]">Use o rótulo ou uma fonte confiável. Campos desconhecidos podem ficar vazios.</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><input name="name" required placeholder="Nome do alimento" className="h-11 rounded-xl border px-3 sm:col-span-2"/><input name="kcal" type="number" min="0" step="0.01" placeholder="kcal / 100 g" className="h-11 rounded-xl border px-3"/><input name="protein" type="number" min="0" step="0.01" placeholder="Proteína / 100 g" className="h-11 rounded-xl border px-3"/><input name="carbs" type="number" min="0" step="0.01" placeholder="Carboidratos / 100 g" className="h-11 rounded-xl border px-3"/><input name="fat" type="number" min="0" step="0.01" placeholder="Gorduras / 100 g" className="h-11 rounded-xl border px-3"/><input name="price" type="number" min="0" step="0.0001" placeholder="Preço por 100 g" className="h-11 rounded-xl border px-3 sm:col-span-2"/></div><button className="mt-4 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white">Salvar alimento</button></form>}
      <CatalogRail title="Ficha pronta para cálculo" subtitle="Preço e macronutrientes completos" foods={complete} onOpen={setSelected} />
      <CatalogRail title="Preço observado" subtitle="Valores reais do snapshot; confira data e origem" foods={priced} onOpen={setSelected} />
      <CatalogRail title="Extra oficial" subtitle="Fichas coletadas diretamente das páginas públicas" foods={official} onOpen={setSelected} />
      <CatalogRail title="Suplementos e alta proteína" subtitle="Whey, creatina e itens relacionados, sem misturar anúncio com prescrição" foods={supplements} onOpen={setSelected} />
      <MarketplaceDiscovery />
      <section className="mt-9">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h3 className="font-serif text-3xl">Todo o catálogo</h3><p className="mt-1 text-xs text-[#6f6963]">{filtered.length} de {foods.length} itens</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="flex h-11 min-w-[260px] items-center gap-2 rounded-2xl border bg-white px-3"><Search size={16} className="text-[#8b8580]"/><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(80); }} placeholder="Buscar alimento, marca…" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label><label className="flex h-11 items-center gap-2 rounded-2xl border bg-white px-3"><SlidersHorizontal size={15}/><select value={category} onChange={(event) => { setCategory(event.target.value); setVisibleCount(80); }} className="bg-transparent text-sm outline-none"><option value="all">Todas as categorias</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><select value={quality} onChange={(event) => { setQuality(event.target.value); setVisibleCount(80); }} className="h-11 rounded-2xl border bg-white px-3 text-sm"><option value="all">Todos os dados</option><option value="complete">Ficha completa</option><option value="partial">Ficha parcial</option><option value="needs_review">Requer revisão</option></select></div></div>
        <div className="mt-4 flex flex-wrap gap-2">{([['all','Tudo'],['food','Alimentos'],['supplement','Suplementos']] as const).map(([value,label]) => <button type="button" key={value} onClick={() => { setCatalogKind(value); setVisibleCount(80); }} className={`rounded-full px-4 py-2 text-xs font-bold ${catalogKind === value ? "bg-black text-white" : "border bg-white"}`}>{label}</button>)}</div>
        {filtered.length ? <><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{filtered.slice(0, visibleCount).map((food) => <FoodCard key={food.id} food={food} onOpen={() => setSelected(food)} />)}</div>{visibleCount < filtered.length && <div className="mt-6 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + 80)} className="rounded-full border border-black bg-white px-5 py-3 text-sm font-bold">Mostrar mais {Math.min(80, filtered.length - visibleCount)} itens</button></div>}</> : <div className="mt-5 rounded-[24px] border border-dashed p-10 text-center"><ImageOff className="mx-auto text-[#8b5c6c]"/><p className="mt-3 text-sm text-[#6f6963]">Nenhum item corresponde aos filtros.</p></div>}
      </section>
      {selected && <FoodDrawer food={selected} onClose={() => setSelected(null)} onAddToDiary={() => { onAddToDiary(selected.id); setSelected(null); }} onAddToShopping={() => onAddToShopping(selected)} />}
    </div>
  );
}
