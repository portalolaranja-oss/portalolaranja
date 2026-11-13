// Presets visuais do Gerador de Templates Sociais do Portal O Laranja.
// São 3 modelos × 3 formatos (Insta Feed, Story, Facebook Feed).
// Todos seguem a identidade: laranja oficial, tipografia Archivo,
// logo original do portal e leitura em fundo escuro.

export type SocialFormatKey = "ig-feed" | "ig-story" | "fb-feed";
export type TemplateStyleKey = "editorial" | "moderno" | "destaque";

export interface SocialFormat {
  key: SocialFormatKey;
  label: string;
  width: number;
  height: number;
  ratio: string;
  useCase: string;
}

export const SOCIAL_FORMATS: SocialFormat[] = [
  { key: "ig-feed", label: "Instagram Feed", width: 1080, height: 1350, ratio: "4:5", useCase: "Publicação no feed do Instagram." },
  { key: "ig-story", label: "Instagram Stories", width: 1080, height: 1920, ratio: "9:16", useCase: "Stories, Reels e capa do perfil." },
  { key: "fb-feed", label: "Facebook Feed", width: 1200, height: 630, ratio: "1.91:1", useCase: "Posts, anúncios e compartilhamento no Facebook." },
];

export interface TemplateStyle {
  key: TemplateStyleKey;
  name: string;
  tagline: string;
  accent: string; // cor de destaque complementar ao laranja oficial
  bgTop: string;
  bgBottom: string;
}

export const TEMPLATE_STYLES: TemplateStyle[] = [
  {
    key: "editorial",
    name: "Editorial",
    tagline: "Moldura clássica de jornal, manchete em caixa alta.",
    accent: "#ff7a1a",
    bgTop: "#1a1208",
    bgBottom: "#0b0906",
  },
  {
    key: "moderno",
    name: "Moderno",
    tagline: "Bloco escuro limpo, foto em destaque e chip de categoria.",
    accent: "#ffb703",
    bgTop: "#141821",
    bgBottom: "#05070b",
  },
  {
    key: "destaque",
    name: "Destaque",
    tagline: "Título gigante no topo com faixa laranja diagonal.",
    accent: "#ff5400",
    bgTop: "#22100a",
    bgBottom: "#0b0503",
  },
];

export function formatLabel(key: SocialFormatKey): string {
  return SOCIAL_FORMATS.find((f) => f.key === key)?.label ?? key;
}

export function styleLabel(key: TemplateStyleKey): string {
  return TEMPLATE_STYLES.find((s) => s.key === key)?.name ?? key;
}
