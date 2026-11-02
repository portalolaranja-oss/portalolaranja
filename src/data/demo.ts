// Dados DEMONSTRATIVOS. Formato pensado para futura conexão ao banco de dados.
import cidade from "@/assets/demo/cidade.jpg";
import esporte from "@/assets/demo/esporte.jpg";
import politica from "@/assets/demo/politica.jpg";
import show from "@/assets/demo/show.jpg";

export interface Article {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  publishedAt: string; // ISO
  author: string;
  views?: number;
}

export interface Ad {
  id: string;
  advertiser: string;
  title: string;
  image?: string;
  href: string;
}

export const demoArticles: Article[] = [
  { id: "1", slug: "exemplo-centro", category: "Nova Iguaçu", title: "[Exemplo] Movimento intenso no centro de Nova Iguaçu marca o fim de tarde", excerpt: "Notícia demonstrativa para visualizar a manchete principal do portal, com imagem grande e resumo.", image: cidade, publishedAt: "2026-11-02T17:30:00-03:00", author: "Redação O Laranja", views: 4820 },
  { id: "2", slug: "exemplo-camara", category: "Política", title: "[Exemplo] Sessão na Câmara discute projetos para a cidade", excerpt: "Texto de exemplo para o destaque secundário de política.", image: politica, publishedAt: "2026-11-02T15:10:00-03:00", author: "Redação O Laranja", views: 3120 },
  { id: "3", slug: "exemplo-classico", category: "Esportes", title: "[Exemplo] Clássico carioca movimenta torcedores da Baixada", excerpt: "Texto de exemplo para o destaque secundário de esportes.", image: esporte, publishedAt: "2026-11-02T14:00:00-03:00", author: "Equipe de Esportes", views: 2950 },
  { id: "4", slug: "exemplo-festival", category: "Entretenimento", title: "[Exemplo] Festival de música reúne milhares de pessoas na Baixada", excerpt: "Publicação demonstrativa do feed. O resumo aparece aqui para convidar o leitor a abrir a matéria completa.", image: show, publishedAt: "2026-11-02T12:45:00-03:00", author: "Redação O Laranja", views: 2210 },
  { id: "5", slug: "exemplo-onibus", category: "Baixada", title: "[Exemplo] Linhas de ônibus terão mudanças de itinerário", excerpt: "Publicação demonstrativa do feed sobre mobilidade urbana na região.", image: cidade, publishedAt: "2026-11-02T11:20:00-03:00", author: "Redação O Laranja", views: 1870 },
  { id: "6", slug: "exemplo-alerj", category: "Rio de Janeiro", title: "[Exemplo] Assembleia estadual vota pauta de interesse regional", excerpt: "Publicação demonstrativa do feed com notícia estadual.", image: politica, publishedAt: "2026-11-02T10:05:00-03:00", author: "Agência parceira", views: 1340 },
  { id: "7", slug: "exemplo-campeonato", category: "Esportes", title: "[Exemplo] Time da cidade se prepara para decisão no fim de semana", excerpt: "Publicação demonstrativa do feed de esportes.", image: esporte, publishedAt: "2026-11-02T09:00:00-03:00", author: "Equipe de Esportes", views: 990 },
];

export const demoAds = {
  central: { id: "ad-1", advertiser: "Espaço disponível", title: "Anuncie no Portal O Laranja e fale com toda Nova Iguaçu", href: "#" } as Ad,
  sidebar: { id: "ad-2", advertiser: "Espaço disponível", title: "Sua marca aqui", href: "#" } as Ad,
};

export const demoWeather = { city: "Nova Iguaçu", temp: 28, condition: "Parcialmente nublado", min: 21, max: 31 };

export const demoLottery = [
  { name: "Mega-Sena", contest: "0000", numbers: [4, 12, 23, 35, 41, 58] },
  { name: "Quina", contest: "0000", numbers: [7, 19, 33, 52, 70] },
];

export const demoMatches = [
  { home: "Flamengo", away: "Vasco", score: "2 × 1", info: "Encerrado" },
  { home: "Fluminense", away: "Botafogo", score: "— × —", info: "Domingo, 16h" },
];

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}
