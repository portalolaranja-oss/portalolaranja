import { brand, categories } from "@/lib/brand";
import { SocialLinks } from "./SocialLinks";

const institutional = ["Quem somos", "Expediente", "Fale conosco", "Anuncie"];
const legal = ["Política de privacidade", "Termos de uso"];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="container-portal grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <img src={brand.logo} alt={brand.name} className="h-20 w-auto" />
          <p className="text-sm text-muted-foreground">
            O Portal O Laranja leva a você as notícias de Nova Iguaçu, da Baixada Fluminense e do Rio de Janeiro com agilidade e responsabilidade.
          </p>
          <SocialLinks whatsapp={false} />
        </div>
        <div>
          <p className="mb-3 font-display text-sm font-bold uppercase tracking-wide">Categorias</p>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {categories.slice(1).map((c) => <li key={c}><a href="#" className="hover:text-primary">{c}</a></li>)}
          </ul>
        </div>
        <div>
          <p className="mb-3 font-display text-sm font-bold uppercase tracking-wide">Institucional</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[...institutional, ...legal].map((l) => <li key={l}><a href="#" className="hover:text-primary">{l}</a></li>)}
          </ul>
        </div>
        <div>
          <p className="mb-3 font-display text-sm font-bold uppercase tracking-wide">Contato comercial</p>
          <p className="text-sm text-muted-foreground">Anuncie para toda a Baixada.</p>
          <a href={`mailto:${brand.commercialEmail}`} className="mt-2 block break-all text-sm font-semibold text-primary hover:underline">{brand.commercialEmail}</a>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{brand.city}</p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {brand.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
