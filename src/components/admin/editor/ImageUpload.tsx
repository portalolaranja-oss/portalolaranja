import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, X, Loader2, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadNewsImage, removeNewsImage } from "@/lib/news";

export function ImageUpload({
  cover,
  onCover,
  gallery,
  onGallery,
}: {
  cover: string;
  onCover: (url: string) => void;
  gallery: string[];
  onGallery: (urls: string[]) => void;
}) {
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null, kind: "cover" | "gallery") {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      if (kind === "cover") {
        const f = files[0];
        const { url, ok, error } = await uploadNewsImage(f, "cover");
        if (ok && url) onCover(url);
        if (error) toast.error("Falha no upload de capa", { description: error });
      } else {
        for (const f of Array.from(files)) {
          const { url, ok, error } = await uploadNewsImage(f, "gallery");
          if (ok && url) onGallery([...gallery, url]);
          if (error) toast.error("Falha no upload da galeria", { description: error });
        }
      }
    } finally {
      setUploading(false);
      if (coverRef.current) coverRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }

  function removeGalleryAt(i: number) {
    const url = gallery[i];
    onGallery(gallery.filter((_, idx) => idx !== i));
    if (url) removeNewsImage(url, "gallery");
  }

  return (
    <div className="space-y-4">
      {/* Capa */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Imagem de capa
          </label>
          {cover && (
            <button
              type="button"
              onClick={() => {
                removeNewsImage(cover, "cover");
                onCover("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Remover
            </button>
          )}
        </div>
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files, "cover")}
        />
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted">
            {cover ? (
              <img src={cover} alt="Capa" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => coverRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1.5 h-4 w-4" />}
              Escolher capa
            </Button>
          </div>
        </div>
      </div>

      {/* Galeria */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Images className="h-3.5 w-3.5" /> Galeria
          </label>
          <span className="text-xs text-muted-foreground">{gallery.length} imagem(ns)</span>
        </div>
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files, "gallery")}
        />
        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {gallery.map((url, i) => (
              <div key={url + i} className="group relative aspect-video overflow-hidden rounded-lg border border-border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryAt(i)}
                  aria-label="Remover da galeria"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => galleryRef.current?.click()}
          disabled={uploading}
        >
          <ImagePlus className="mr-1.5 h-4 w-4" /> Adicionar à galeria
        </Button>
      </div>
    </div>
  );
}
