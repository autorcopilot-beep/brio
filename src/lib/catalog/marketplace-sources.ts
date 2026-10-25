export type MarketplaceSource = {
  id: "mercado_livre" | "shopee" | "shein";
  name: string;
  searchUrl: (query: string) => string;
  integration: "official_api_requires_credentials" | "external_search";
};

export const marketplaceSources: MarketplaceSource[] = [
  {
    id: "mercado_livre",
    name: "Mercado Livre",
    searchUrl: (query) => `https://lista.mercadolivre.com.br/${encodeURIComponent(query).replaceAll("%20", "-")}`,
    integration: "official_api_requires_credentials",
  },
  {
    id: "shopee",
    name: "Shopee",
    searchUrl: (query) => `https://shopee.com.br/search?keyword=${encodeURIComponent(query)}`,
    integration: "external_search",
  },
  {
    id: "shein",
    name: "SHEIN",
    searchUrl: (query) => `https://br.shein.com/pdsearch/${encodeURIComponent(query)}/`,
    integration: "external_search",
  },
];
