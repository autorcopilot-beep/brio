export const supplementPattern = /\b(whey|creatina|hipercal[oó]rico|albumina|bcaa|glutamina|suplemento|protein powder|pré[- ]?treino|pre[- ]?treino)\b/i;

export function isSupplementProduct(product: { name: string; category?: string | null; subcategory?: string | null }) {
  return supplementPattern.test(`${product.name} ${product.category ?? ""} ${product.subcategory ?? ""}`);
}
