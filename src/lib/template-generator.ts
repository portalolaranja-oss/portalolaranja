// Motor do Gerador de Templates Sociais do Portal O Laranja.
// Recebe uma notícia (título, subtítulo, categoria, imagem) e devolve
// artes em PNG para cada combinação de 3 formatos × 3 modelos, mantendo
// a identidade visual oficial: cor laranja, tipografia Archivo, logo do
// portal e rodapé com @ e data — tudo derivado da própria notícia.

import { brand } from "@/lib/brand";
import type { Article } from "@/data/demo";
import {
  SOCIAL_FORMATS,
  TEMPLATE_STYLES,
  type SocialFormatKey,
  type TemplateStyleKey,
} from "@/lib/template-presets";

export interface ArtOptions {
  article: Article;
  format: SocialFormatKey;
  style: TemplateStyleKey;
  // Campos editáveis antes do download
  title?: string;
  subtitle?: string;
  category?: string;
  image?: string;
  align?: "top" | "middle" | "bottom";
}

export interface GeneratedArt {
  id: string;
  width: number;
  height: number;
  dataUrl: string;
  formatKey: SocialFormatKey;
  styleKey: TemplateStyleKey;
  formatLabel: string;
  styleLabel: string;
}

/* ---------------------------------------------------------------- */
/* Utilitários                                                       */
/* ---------------------------------------------------------------- */

function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  } catch {
    return "";
  }
}

function slugOf(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function outlinedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, weight = 6, fill = "#fff") {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.lineWidth = weight * 2;
  ctx.strokeText(text, x, y);
  ctx.lineWidth = weight;
  ctx.strokeStyle = "rgba(0,0,0,0.9)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const t = current ? current + " " + w : w;
    if (ctx.measureText(t).width <= maxWidth) current = t;
    else {
      if (current) lines.push(current);
      current = w;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  while (lines.length > maxLines) lines.pop();
  if (lines.length === maxLines && lines.join(" ").length < text.length) {
    lines[lines.length - 1] = lines[lines.length - 1] + "…";
  }
  return lines.length ? lines : [text];
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  start: number,
  min: number,
  maxWidth: number,
  maxLines: number,
): number {
  let size = start;
  while (size >= min) {
    ctx.font = `800 ${size}px "Archivo", sans-serif`;
    const lines = wrapLines(ctx, text, maxWidth, maxLines);
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth)) return size;
    size -= Math.max(2, Math.round(start * 0.06));
  }
  return min;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    // tenta cross-origin primeiro; se bloquear, tenta sem (para blobs/dataURLs)
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => resolve(img2);
      img2.onerror = () => resolve(null);
      img2.src = src;
    };
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, photo: HTMLImageElement | null, w: number, h: number) {
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);
  if (!photo) {
    ctx.fillStyle = "#161616";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `400 ${Math.round(w * 0.04)}px "Archivo", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SEM IMAGEM", w / 2, h / 2);
    return;
  }
  try {
    const scale = Math.max(w / photo.width, h / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    ctx.drawImage(photo, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } catch {
    // imagem remota bloqueada (CORS) — mantém o fundo escuro
  }
}


/* ---------------------------------------------------------------- */
/* Primitivas de desenho                                           */
/* ---------------------------------------------------------------- */

function drawCoverInArea(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / photo.width, h / photo.height);
  const dw = photo.width * scale;
  const dh = photo.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(photo, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function drawFadeTop(ctx: CanvasRenderingContext2D, w: number, h: number, stop = 0.55) {
  const g = ctx.createLinearGradient(0, 0, 0, h * stop);
  g.addColorStop(0, "rgba(0,0,0,0.75)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h * stop);
}

function drawFadeBottom(ctx: CanvasRenderingContext2D, w: number, h: number, stop = 0.6) {
  const g = ctx.createLinearGradient(0, h * (1 - stop), 0, h);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.9)");
  ctx.fillStyle = g;
  ctx.fillRect(0, h * (1 - stop), w, h * stop);
}

function drawChip(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, accent: string, fontPx: number): number {
  ctx.font = `800 ${fontPx}px "Archivo", sans-serif`;
  const w = ctx.measureText(text.toUpperCase()).width + fontPx * 2.4;
  const h = fontPx * 1.9;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = "#0b0906";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text.toUpperCase(), x + fontPx * 1.2, y + h * 0.7);
  return w;
}

function drawFooter(ctx: CanvasRenderingContext2D, w: number, h: number, article: Article, accent: string) {
  const pad = Math.round(w * 0.05);
  const footSize = Math.round(w * 0.022);
  const y = h - pad * 0.9;

  ctx.font = `600 ${footSize}px "Archivo", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("@portalolaranja", pad, y);
  const right = "portalolaranja.com.br";
  const rightW = ctx.measureText(right).width;
  ctx.fillText(right, w - pad - rightW, y);

  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath();
  ctx.moveTo(pad, pad * 0.7);
  ctx.lineTo(w - pad, pad * 0.7);
  ctx.stroke();

  const d = formatDateLabel(article.publishedAt);
  if (d) {
    ctx.font = `500 ${footSize - 2}px "Source Sans 3", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(d, pad, pad * 0.65);
  }
}

async function drawLogoTop(ctx: CanvasRenderingContext2D, w: number) {
  const img = await loadImage(brand.logo);
  if (!img) return;
  const targetH = Math.round(w * 0.075);
  const targetW = targetH * (img.width / img.height || 1);
  const x = (w - targetW) / 2;
  const y = Math.round(w * 0.03);
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "rgba(8,7,5,0.55)";
  ctx.beginPath();
  ctx.roundRect(x - 10, y - 6, targetW + 20, targetH + 12, 12);
  ctx.fill();
  ctx.restore();
  try {
    ctx.drawImage(img, x, y, targetW, targetH);
  } catch {
    // img remota pode ser bloqueada (CORS); segue sem o logo
  }
}

/* ---------------------------------------------------------------- */
/* Modelos                                                          */
/* ---------------------------------------------------------------- */

interface CtxBase {
  ctx: CanvasRenderingContext2D;
  art: ArtOptions;
  photo: HTMLImageElement | null;
}

function styleOf(key: TemplateStyleKey) {
  return TEMPLATE_STYLES.find((s) => s.key === key)!;
}
function formatOf(key: SocialFormatKey) {
  return SOCIAL_FORMATS.find((f) => f.key === key)!;
}

function drawEditorial(base: CtxBase) {
  const { ctx, art, photo } = base;
  const fmt = formatOf(art.format);
  const stl = styleOf(art.style);
  const w = fmt.width;
  const h = fmt.height;

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, stl.bgTop);
  bg.addColorStop(1, stl.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // moldura interna
  const m = Math.round(w * 0.04);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = Math.max(2, w * 0.005);
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);

  // foto
  const photoH = Math.round(h * 0.44);
  const photoY = Math.round(h * 0.12);
  if (photo) {
    drawCoverInArea(ctx, photo, m + 12, photoY, w - (m + 12) * 2, photoH - 24);
  } else {
    ctx.fillStyle = "#1b1a17";
    ctx.fillRect(m + 12, photoY, w - (m + 12) * 2, photoH - 24);
  }

  // chip + título + subtítulo
  const textTop = photoY + photoH + Math.round(h * 0.05);
  const pad = m + Math.round(w * 0.03);

  const category = art.category || art.article.category || "";
  const title = art.title || art.article.title || "Título da notícia";
  const subtitle = art.subtitle || art.article.subtitle || art.article.excerpt || "";

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  if (category) {
    drawChip(ctx, category, pad, textTop, stl.accent, Math.round(w * 0.035));
  }
  const titleStartY = textTop + (category ? Math.round(w * 0.08) : 0);
  const maxSize = Math.round(w * 0.085);
  const size = fitFontSize(ctx, title, maxSize, Math.round(w * 0.05), w * 0.9, 3);
  ctx.font = `700 ${size}px "Archivo", sans-serif`;
  const lines = wrapLines(ctx, title, w * 0.9, 3);
  lines.forEach((l, i) => {
    outlinedText(ctx, l, pad, titleStartY + i * size * 1.15 + size, 5, "#ffffff");
  });

  if (subtitle) {
    ctx.font = `400 ${Math.round(w * 0.03)}px "Source Sans 3", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const subLines = wrapLines(ctx, subtitle, w * 0.85, 3);
    const subY = titleStartY + lines.length * size * 1.15 + size * 0.6;
    subLines.forEach((l, i) => ctx.fillText(l, pad, subY + i * Math.round(w * 0.038)));
  }

  drawFooter(ctx, w, h, art.article, stl.accent);
}

function drawModern(base: CtxBase) {
  const { ctx, art, photo } = base;
  const fmt = formatOf(art.format);
  const stl = styleOf(art.style);
  const w = fmt.width;
  const h = fmt.height;

  drawCover(ctx, photo, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, w, h);
  drawFadeBottom(ctx, w, h, 0.7);
  if (art.align === "top") drawFadeTop(ctx, w, h, 0.55);

  const pad = Math.round(w * 0.06);
  const title = art.title || art.article.title || "Título da notícia";
  const category = art.category || art.article.category || "";

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const anchor = art.align === "top" ? pad * 2 + (category ? Math.round(w * 0.08) : 0) : null;

  if (art.align === "top" || art.align === "middle") {
    if (category) drawChip(ctx, category, pad, anchor || pad * 2, stl.accent, Math.round(w * 0.038));
    const start = (anchor || pad * 2) + (category ? Math.round(w * 0.08) : 0) + 10;
    const size = fitFontSize(ctx, title, Math.round(w * 0.085), Math.round(w * 0.05), w * 0.85, 4);
    ctx.font = `800 ${size}px "Archivo", sans-serif`;
    const lines = wrapLines(ctx, title, w * 0.85, 4);
    lines.forEach((l, i) => outlinedText(ctx, l, pad, start + i * size * 1.1 + size, 6, "#ffffff"));
  } else {
    // bottom
    const size = fitFontSize(ctx, title, Math.round(w * 0.085), Math.round(w * 0.05), w * 0.85, 4);
    ctx.font = `800 ${size}px "Archivo", sans-serif`;
    const lines = wrapLines(ctx, title, w * 0.85, 4);
    const topY = h - pad - lines.length * size * 1.1 - size * 0.4 - Math.round(h * 0.03);
    if (category) {
      drawChip(ctx, category, pad, topY - Math.round(w * 0.06), stl.accent, Math.round(w * 0.038));
    }
    lines.forEach((l, i) => outlinedText(ctx, l, pad, topY + i * size * 1.1 + size, 6, "#ffffff"));
  }

  drawFooter(ctx, w, h, art.article, stl.accent);
}

function drawDestaque(base: CtxBase) {
  const { ctx, art, photo } = base;
  const fmt = formatOf(art.format);
  const stl = styleOf(art.style);
  const w = fmt.width;
  const h = fmt.height;

  drawCover(ctx, photo, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, w, h);

  // faixa laranja diagonal
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, h * 0.34);
  ctx.lineTo(w, h * 0.24);
  ctx.lineTo(w, h * 0.42);
  ctx.lineTo(0, h * 0.52);
  ctx.closePath();
  ctx.fillStyle = stl.accent;
  ctx.fill();
  ctx.restore();

  // faixa escura atrás do título
  const ty = h * 0.26;
  ctx.fillStyle = "rgba(11,9,6,0.88)";
  ctx.fillRect(0, ty, w, h * 0.26);

  const pad = Math.round(w * 0.05);
  const title = art.title || art.article.title || "Título da notícia";
  const category = art.category || art.article.category || "";

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  if (category) {
    drawChip(ctx, category, pad, ty + Math.round(h * 0.015), stl.accent, Math.round(w * 0.035));
  }

  const titleY = ty + (category ? Math.round(h * 0.055) : Math.round(h * 0.02));
  const size = fitFontSize(ctx, title, Math.round(w * 0.08), Math.round(w * 0.05), w * 0.85, 3);
  ctx.font = `900 ${size}px "Archivo", sans-serif`;
  const lines = wrapLines(ctx, title, w * 0.85, 3);
  lines.forEach((l, i) => outlinedText(ctx, l, pad, titleY + i * size * 1.1 + size, 6, "#ffffff"));

  drawFooter(ctx, w, h, art.article, stl.accent);
}

/* ---------------------------------------------------------------- */
/* Exportes                                                         */
/* ---------------------------------------------------------------- */

async function renderOne(opts: ArtOptions): Promise<GeneratedArt> {
  const fmt = formatOf(opts.format);
  const stl = styleOf(opts.style);
  const canvas = document.createElement("canvas");
  canvas.width = fmt.width;
  canvas.height = fmt.height;
  const ctx = canvas.getContext("2d")!;

  const photo = await loadImage(opts.image || opts.article.image || "");
  const base: CtxBase = { ctx, art: opts, photo };

  if (stl.key === "editorial") drawEditorial(base);
  else if (stl.key === "moderno") drawModern(base);
  else drawDestaque(base);

  await drawLogoTop(ctx, fmt.width);

  return {
    id: `${opts.format}-${opts.style}-${slugOf(opts.article.title)}`,
    width: fmt.width,
    height: fmt.height,
    dataUrl: canvas.toDataURL("image/png"),
    formatKey: opts.format,
    styleKey: opts.style,
    formatLabel: fmt.label,
    styleLabel: stl.name,
  };
}

export function generateOne(opts: ArtOptions): Promise<GeneratedArt> {
  return renderOne(opts);
}

export function generateAll(opts: Omit<ArtOptions, "format" | "style">): Promise<GeneratedArt[]> {
  return (async () => {
    const out: GeneratedArt[] = [];
    for (const f of SOCIAL_FORMATS) {
      for (const s of TEMPLATE_STYLES) {
        out.push(await renderOne({ ...opts, format: f.key, style: s.key }));
      }
    }
    return out;
  })();
}

export function downloadArt(art: GeneratedArt, base: string) {
  const a = document.createElement("a");
  a.href = art.dataUrl;
  a.download = `${base}-${art.formatKey}-${art.styleKey}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadAllArts(arts: GeneratedArt[], base: string) {
  arts.forEach((art, i) => {
    setTimeout(() => downloadArt(art, base), i * 120);
  });
}
