import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading,
  Quote,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Code,
  Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  command: string;
  arg?: string;
}

const GROUPS: { title: string; buttons: ToolbarButton[] }[] = [
  {
    title: "Texto",
    buttons: [
      { icon: <Undo2 className="h-4 w-4" />, label: "Desfazer", command: "undo" },
      { icon: <Redo2 className="h-4 w-4" />, label: "Refazer", command: "redo" },
      { icon: <Bold className="h-4 w-4" />, label: "Negrito", command: "bold" },
      { icon: <Italic className="h-4 w-4" />, label: "Itálico", command: "italic" },
      { icon: <Underline className="h-4 w-4" />, label: "Sublinhado", command: "underline" },
      { icon: <Strikethrough className="h-4 w-4" />, label: "Tachado", command: "strikeThrough" },
    ],
  },
  {
    title: "Estrutura",
    buttons: [
      { icon: <Heading className="h-4 w-4" />, label: "Título H2", command: "formatBlock", arg: "H2" },
      { icon: <Quote className="h-4 w-4" />, label: "Citação", command: "formatBlock", arg: "BLOCKQUOTE" },
      { icon: <List className="h-4 w-4" />, label: "Lista", command: "insertUnorderedList" },
      { icon: <ListOrdered className="h-4 w-4" />, label: "Lista numerada", command: "insertOrderedList" },
      { icon: <Code className="h-4 w-4" />, label: "Bloco de código", command: "formatBlock", arg: "PRE" },
    ],
  },
  {
    title: "Mídia",
    buttons: [
      { icon: <LinkIcon className="h-4 w-4" />, label: "Inserir link", command: "createLink" },
      { icon: <ImageIcon className="h-4 w-4" />, label: "Inserir imagem", command: "image" },
      { icon: <Eraser className="h-4 w-4" />, label: "Limpar formatação", command: "removeFormat" },
    ],
  },
];

export function RichTextEditor({
  value,
  onChange,
  onInsertImage,
  placeholder = "Escreva a notícia aqui…",
}: {
  value: string;
  onChange: (html: string) => void;
  onInsertImage?: (url: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Sincroniza o HTML inicial uma única vez (mantém o foco do usuário depois).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value && !value) {
      ref.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    onChange(ref.current?.innerHTML ?? "");
  }

  function exec(command: string, arg?: string) {
    const el = ref.current;
    if (!el) return;
    el.focus();

    if (command === "createLink") {
      const url = window.prompt("URL do link:", "https://");
      if (url) document.execCommand("createLink", false, url);
    } else if (command === "image") {
      if (onInsertImage) {
        onInsertImage();
      } else {
        const url = window.prompt("URL da imagem:", "https://");
        if (url) document.execCommand("insertImage", false, url);
      }
    } else {
      document.execCommand(command, false, arg);
    }
    emit();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="sticky top-0 flex flex-wrap items-center gap-1 border-b border-border bg-surface px-2 py-2">
        {GROUPS.map((group, gi) => (
          <div key={group.title} className="flex items-center gap-0.5">
            {gi > 0 && <span className="mx-1 h-4 w-px bg-border" />}
            {group.buttons.map((b, i) => (
              <button
                key={i}
                type="button"
                title={b.label}
                aria-label={b.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec(b.command, b.arg)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {b.icon}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div
        ref={ref}
        contentEditable
        onInput={emit}
        data-placeholder={placeholder}
        className={cn(
          "min-h-[18rem] max-w-3xl space-y-4 px-4 py-3 text-base leading-7 outline-none",
          "[&_p]:my-2 [&_h2]:text-2xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline [&_img]:my-3 [&_img]:max-h-96 [&_img]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-sm",
        )}
        style={{ caretColor: "oklch(0.72 0.19 50)" }}
      />
    </div>
  );
}
