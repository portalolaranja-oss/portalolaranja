import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { SiteFooter } from "@/components/portal/SiteFooter";

/**
 * Marca visual do portal: cabeçalho + conteúdo + rodapé.
 * Reaproveita o header/footer existentes para manter a identidade.
 */
export function BrandPage({ children, breadcrumb = "Home" }: { children: ReactNode; breadcrumb?: string }) {
  return (
    <div className="min-h-screen">
      <Toaster position="top-center" />
      <SiteHeader />
      <div className="container-portal py-6 md:py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> {breadcrumb}
        </Link>
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
