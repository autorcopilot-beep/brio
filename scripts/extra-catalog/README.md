# Pipeline Extra → Brio

Este diretório recebe o snapshot produzido pelo coletor fornecido em
`extra_mercado_inspecao_dom_network_mcp.zip`. O coletor observa páginas públicas no navegador;
o Brio normaliza o resultado antes de qualquer importação.

## Fluxo

1. Execute o diagnóstico do coletor com navegador visível e selecione a região no próprio site.
2. Não contorne CAPTCHA, `403` ou `429`. Interrompa e retome em outro momento.
3. Rode a coleta em lotes pequenos e preserve `capturado_em_utc`, URL e textos originais.
4. Normalize o snapshot:

```powershell
npm run catalog:normalize -- "C:\caminho\saida\produtos.json"
```

O arquivo `.catalog-import/extra-normalized.json` separa preço observado, ficha estável e
proveniência. Campos ausentes continuam `null`; o normalizador nunca estima nutrientes.

## Catálogo amplo pela fonte observada no site

O cliente público do Extra carrega as vitrines através de
`https://api.vendas.gpa.digital/ex/search/category-page`. O endpoint foi confirmado com uma
requisição somente de leitura, sem cookie ou autenticação. Para percorrer apenas categorias-folha
de alimentos (bebidas ficam fora desta primeira base para não misturar bebidas alcoólicas):

```powershell
npm run catalog:fetch
```

Para uma amostra defensiva:

```powershell
$env:EXTRA_MAX_CATEGORIES=10
npm run catalog:fetch
```

O extrator usa uma requisição por vez, espera entre páginas, deduplica pelo ID do produto e para
imediatamente em `403` ou `429`. Preço, estoque e promoção são observações do `storeId` configurado,
não atributos permanentes do alimento.

## Regras de importação

- `source_product_id` identifica a página oficial (`extra-site-{id}`).
- Preços entram também em `food_price_observations`, pois variam por loja, CEP e data.
- A tabela nutricional bruta é preservada até que porção e unidade possam ser validadas.
- Produtos com inconsistências ficam como `needs_review` e não são usados pelo CLOVIS em cálculos.
- Ingredientes e alergênicos podem ser exibidos como referência, nunca como diagnóstico clínico.
