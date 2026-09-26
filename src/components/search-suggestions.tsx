"use client";

/**
 * Google's "search suggestions" chip for answers grounded with Google Search.
 * Google's terms require showing it next to grounded results. It is HTML/CSS
 * provided by Google, so it is isolated in a sandboxed frame (no scripts, no
 * access to the page); its links open in a new tab.
 */
export function SearchSuggestions({ html }: { html: string | null | undefined }) {
  if (!html) return null;
  const doc = `<!doctype html><html><head><base target="_blank"><style>body{margin:0;background:transparent}</style></head><body>${html}</body></html>`;
  return (
    <iframe
      title="Google Search suggestions"
      srcDoc={doc}
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      className="mt-3 h-[72px] w-full rounded-xl border-0"
      loading="lazy"
    />
  );
}
