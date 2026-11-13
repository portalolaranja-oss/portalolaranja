// Remove a marca d'água do Lovable que o template injeta como flutuante
// fixo na home (e em outras páginas). Alvo por seletor conhecido do bundle
// do template + qualquer iframe/elemento com "lovable" no id/classe.

const SELECTORS = [
  "[id*='lovable' i]",
  "[data-lovable]",
  "[class*='lovable' i]",
  "iframe[src*='lovable' i]",
] as const;

function purge(): boolean {
  let removed = false;
  for (const sel of SELECTORS) {
    for (const el of Array.from(document.querySelectorAll(sel))) {
      el.remove();
      removed = true;
    }
  }
  return removed;
}

export function hideLovableWatermark(): void {
  if (typeof document === "undefined") return;
  purge();

  // O flutuante pode ser montado depois do boot (defer script). Um Mutation
  // observer enxuta novos nós que casarem com os seletores; se nada aparece
  // em 30s o observer é desligado para não custar nada.
  const observer = new MutationObserver(() => {
    if (purge()) {
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.setTimeout(() => {
    purge();
    observer.disconnect();
  }, 30_000);
}
