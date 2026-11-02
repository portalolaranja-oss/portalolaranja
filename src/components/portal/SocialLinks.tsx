import { Facebook, Instagram, MessageCircle } from "lucide-react";
import { brand } from "@/lib/brand";

export function SocialLinks({ whatsapp = true }: { whatsapp?: boolean }) {
  const items = [
    { href: brand.social.instagram, label: "Instagram", Icon: Instagram },
    { href: brand.social.facebook, label: "Facebook", Icon: Facebook },
    ...(whatsapp ? [{ href: brand.social.whatsapp, label: "WhatsApp", Icon: MessageCircle }] : []),
  ];
  return (
    <div className="flex items-center gap-1">
      {items.map(({ href, label, Icon }) => (
        <a key={label} href={href} aria-label={label} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary">
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
