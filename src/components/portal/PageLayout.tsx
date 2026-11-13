import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { SiteFooter } from "@/components/portal/SiteFooter";

export function PageLayout({ children, breadcrumb = "Voltar para a home" }: { children: React.ReactNode; breadcrumb?: string }) {
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
