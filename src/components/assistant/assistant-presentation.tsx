"use client";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  ChartNoAxesCombined,
  Check,
  Database,
  Dumbbell,
  ShoppingBasket,
  Sparkles,
  Utensils,
  MessageSquareText,
} from "lucide-react";
import Link from "next/link";
import type {
  AssistantPresentation,
  PresentationChart,
  PresentationTable,
} from "@/lib/agent/presentation";

const contextIcon = {
  nutrition: Utensils,
  workout: Dumbbell,
  body: Activity,
  weekly: Sparkles,
  general: Database,
};
const configurableIcons = { Sparkles, Dumbbell, Utensils, Activity, Database, BarChart3, ChartNoAxesCombined, ShoppingBasket, MessageSquareText };
const contextUrl = {
  nutrition: "/alimentacao",
  workout: "/musculacao",
  body: "/musculacao/corpo",
  weekly: "/dashboard",
  general: "/assistente",
};
const metricTone = [
  "bg-[#f2e8e5]",
  "bg-[#edf0e7]",
  "bg-[#eee9f2]",
  "bg-[#f3eee4]",
];

function MiniChart({ chart }: { chart: PresentationChart }) {
  const values = chart.points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const coordinates = chart.points.map((point, index) => ({
    x:
      chart.points.length === 1
        ? 50
        : (index / (chart.points.length - 1)) * 100,
    y: 82 - ((point.value - min) / range) * 62,
    ...point,
  }));
  const path = coordinates
    .map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`)
    .join(" ");
  const area = `${path} L100,92 L0,92 Z`;
  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[#1d1c1b] p-5 text-white shadow-[0_20px_50px_rgba(28,24,20,.12)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[.14em] text-white/55">
            TENDÊNCIA
          </p>
          <h4 className="mt-1 font-serif text-2xl">{chart.label}</h4>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
          <BarChart3 size={16} />
        </span>
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="mt-4 h-36 w-full overflow-visible"
        aria-label={chart.label}
        role="img"
      >
        <defs>
          <linearGradient id="brio-chart" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e7a188" stopOpacity=".42" />
            <stop offset="1" stopColor="#e7a188" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#brio-chart)" />
        <path
          d={path}
          fill="none"
          stroke="#f1b29b"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coordinates.map((point) => (
          <circle
            key={`${point.label}-${point.x}`}
            cx={point.x}
            cy={point.y}
            r="1.8"
            fill="#fff"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[9px] text-white/45">
        <span>{chart.points[0]?.label}</span>
        <span className="text-white/80">
          {chart.points
            .at(-1)
            ?.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}{" "}
          {chart.unit}
        </span>
        <span>{chart.points.at(-1)?.label}</span>
      </div>
    </section>
  );
}

function DataTable({ table, style = "soft" }: { table: PresentationTable; style?: "soft" | "compact" | "striped" | "cards" }) {
  return (
    <section className="overflow-hidden rounded-[24px] bg-white/80 p-2 shadow-[0_18px_55px_rgba(38,31,25,.07)] ring-1 ring-black/[.04]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-y-1 text-left">
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-[9px] font-bold uppercase tracking-[.13em] text-[#8a837c]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={`group ${style === "striped" && rowIndex % 2 ? "bg-[#ece8e2]" : ""}`}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`${style === "cards" ? "border-y-4 border-white bg-[#f2eee9]" : style === "striped" ? "bg-transparent" : "bg-[#f5f3ef]"} px-4 ${style === "compact" ? "py-2" : "py-3"} text-xs group-hover:bg-[#efece7] ${cellIndex === 0 ? "rounded-l-xl font-semibold" : ""} ${cellIndex === row.length - 1 ? "rounded-r-xl" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AssistantPresentationCard({
  presentation,
  actionUrl,
  onSuggestion,
}: {
  presentation?: AssistantPresentation;
  actionUrl?: string;
  onSuggestion: (value: string) => void;
}) {
  if (
    !presentation ||
    (!presentation.metrics?.length &&
      !presentation.sections?.length &&
      !presentation.chart &&
      !presentation.table)
  )
    return null;
  const Icon = configurableIcons[presentation.responseStyle?.icon as keyof typeof configurableIcons] ?? contextIcon[presentation.context] ?? Sparkles;
  const destination = actionUrl ?? contextUrl[presentation.context];
  const style = presentation.responseStyle;
  const animationClass = style?.animation === "fade-up" ? "response-fade-up" : style?.animation === "stagger" ? "response-stagger" : "";
  return (
    <div className={`relative mt-7 ${animationClass}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[.15em] text-[#775a62]">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#eee8e4]">
            <Icon size={13} />
          </span>
          {presentation.label}
        </div>
        {style?.showSourceBadge !== false && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf1e9] px-2.5 py-1 text-[9px] font-bold text-[#617064]">
          <Check size={11} /> DADOS DO BRIO
        </span>}
      </div>

      {presentation.metrics?.length && style?.showMetrics !== false ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {presentation.metrics.map((metric, index) => (
            <article
              key={metric.label}
              className={`min-h-32 rounded-[22px] p-4 ${metricTone[index % metricTone.length]}`}
            >
              <p className="text-[9px] font-bold uppercase tracking-[.13em] text-[#786f68]">
                {metric.label}
              </p>
              <p className="mt-5 font-serif text-[28px] leading-none tracking-[-.025em]">
                {metric.value}
              </p>
              {metric.detail && (
                <p className="mt-3 text-[10px] leading-4 text-[#716963]">
                  {metric.detail}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : null}

      {(presentation.chart || presentation.table) && (
        <div
          className={`mt-3 grid gap-3 ${presentation.chart && presentation.table ? "xl:grid-cols-[.82fr_1.18fr]" : ""}`}
        >
          {presentation.chart && <MiniChart chart={presentation.chart} />}{" "}
          {presentation.table && <DataTable table={presentation.table} style={style?.tableStyle} />}
        </div>
      )}

      {presentation.sections?.length ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {presentation.sections.map((section, sectionIndex) => (
            <section
              key={`${section.title}-${sectionIndex}`}
              className={`rounded-[24px] p-5 shadow-[0_18px_50px_rgba(38,31,25,.06)] ${sectionIndex % 3 === 0 ? "bg-white" : sectionIndex % 3 === 1 ? "bg-[#f1eee8]" : "bg-[#eee8eb]"}`}
            >
              <h4 className="font-serif text-[22px] leading-tight">
                {section.title}
              </h4>
              <div className="mt-4 space-y-2">
                {section.items.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-2xl bg-white/65 px-3.5 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold leading-5">
                        {item.title}
                      </p>
                      {item.meta && (
                        <span className="shrink-0 rounded-full bg-black/[.06] px-2 py-1 text-[9px] font-bold text-[#665f59]">
                          {item.meta}
                        </span>
                      )}
                    </div>
                    {item.detail && (
                      <p className="mt-1.5 text-[10px] leading-4 text-[#77706a]">
                        {item.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={destination}
          className="inline-flex items-center gap-2 rounded-full bg-[#1b1a19] px-4 py-2.5 text-[11px] font-bold text-white shadow-sm"
        >
          Abrir no módulo <ArrowUpRight size={13} />
        </Link>
        {presentation.context === "nutrition" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#efece7] px-3 py-2 text-[10px] text-[#716b65]">
            <ShoppingBasket size={12} /> Catálogo conectado
          </span>
        )}
        {style?.interactionMode !== "none" && presentation.suggestions?.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestion(suggestion)}
            className="rounded-full bg-white px-3.5 py-2 text-[10px] font-semibold shadow-sm ring-1 ring-black/[.06] hover:bg-[#f2efea]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
