"use client";

import { Bot, GraduationCap, MessageCircle, PiggyBank, Plus, Send, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { ExternalLink } from "./external-link";
import { Markdown } from "./markdown";
import { SearchSuggestions } from "./search-suggestions";
import { useI18n } from "./providers";

type Source = { name: string; url: string };
type Msg = {
  role: "user" | "assistant";
  content: string;
  /** Pages Google Search used for this answer, and Google's required suggestions snippet. */
  sources?: Source[];
  suggestionsHtml?: string | null;
};

/** The server appends this separator and a JSON trailer (sources) after the reply text. */
const TRAILER = "\u001e";
type Thread = { id: string; title: string; updatedAt: number; messages: Msg[] };

const STORE = "checkkaro.chats";

function loadThreads(): Thread[] {
  try {
    const list = JSON.parse(localStorage.getItem(STORE) ?? "[]");
    return Array.isArray(list) ? list.filter((t) => t && Array.isArray(t.messages)) : [];
  } catch {
    return [];
  }
}
function saveThreads(list: Thread[]) {
  try { localStorage.setItem(STORE, JSON.stringify(list.slice(0, 30))); } catch { /* full or private */ }
}
const newId = () => crypto.randomUUID?.() ?? `t${Date.now()}`;

export function Assistant() {
  const { t, lang } = useI18n();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [current, setCurrent] = useState<Thread>(() => ({ id: "", title: "", updatedAt: 0, messages: [] }));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Chat history only exists in this browser, so it can only be read after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThreads(loadThreads());
    setCurrent({ id: newId(), title: "", updatedAt: Date.now(), messages: [] });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [current.messages]);

  const persist = (thread: Thread) => {
    setThreads((prev) => {
      const next = [thread, ...prev.filter((x) => x.id !== thread.id)].sort((a, b) => b.updatedAt - a.updatedAt);
      saveThreads(next);
      return next;
    });
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    setInput("");
    const history: Msg[] = [...current.messages, { role: "user", content }];
    const title = current.title || (content.length > 48 ? `${content.slice(0, 48)}…` : content);
    let thread: Thread = { ...current, title, updatedAt: Date.now(), messages: [...history, { role: "assistant", content: "" }] };
    setCurrent(thread);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only the most recent turns are sent, to keep requests small.
        body: JSON.stringify({ lang, messages: history.slice(-20) }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += dec.decode(value, { stream: true });
        thread = { ...thread, messages: [...history, { role: "assistant", content: reply.split(TRAILER)[0] }] };
        setCurrent(thread);
      }
      const [text, trailer] = reply.split(TRAILER);
      if (!text.trim()) throw new Error();
      let meta: { sources?: Source[]; suggestionsHtml?: string | null } = {};
      try { meta = trailer ? JSON.parse(trailer) : {}; } catch { /* reply without sources */ }
      thread = {
        ...thread,
        messages: [...history, { role: "assistant", content: text, sources: meta.sources, suggestionsHtml: meta.suggestionsHtml }],
      };
      setCurrent(thread);
      persist(thread);
    } catch {
      setError(t("chat.error"));
      thread = { ...thread, messages: history };
      setCurrent(thread);
      persist(thread);
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) => {
    const next = threads.filter((x) => x.id !== id);
    setThreads(next);
    saveThreads(next);
    if (id === current.id) setCurrent({ id: newId(), title: "", updatedAt: Date.now(), messages: [] });
  };

  const suggestions: { key: DictKey; icon: typeof Bot }[] = [
    { key: "chat.suggest1", icon: ShieldAlert },
    { key: "chat.suggest2", icon: PiggyBank },
    { key: "chat.suggest3", icon: GraduationCap },
  ];

  return (
    <div className="container-page grid gap-6 pt-6 lg:grid-cols-[270px_1fr]">
      <aside className="panel hidden h-fit p-3 lg:block">
        <button
          type="button"
          onClick={() => setCurrent({ id: newId(), title: "", updatedAt: Date.now(), messages: [] })}
          className="btn-primary w-full py-2.5"
        >
          <Plus className="h-4 w-4" /> {t("chat.new")}
        </button>
        <p className="px-2 pt-5 pb-2 text-xs font-semibold text-muted-foreground">{t("chat.history")}</p>
        {threads.length === 0 ? (
          <p className="px-2 pb-2 text-xs text-muted-foreground">{t("chat.noHistory")}</p>
        ) : (
          <ul className="max-h-[55vh] space-y-1 overflow-y-auto">
            {threads.map((th) => (
              <li
                key={th.id}
                className={`group flex items-center gap-1 rounded-xl px-2 ${th.id === current.id ? "bg-primary-soft text-primary" : "hover:bg-muted"}`}
              >
                <MessageCircle className="h-4 w-4 shrink-0 opacity-60" />
                <button type="button" onClick={() => !busy && setCurrent(th)} className="flex-1 truncate py-2.5 text-left text-sm">
                  {th.title}
                </button>
                <button
                  type="button"
                  aria-label={t("chat.delete")}
                  onClick={() => remove(th.id)}
                  className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-danger focus:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="panel flex h-[calc(100dvh-13rem)] min-h-[480px] flex-col overflow-hidden lg:h-[calc(100dvh-9rem)]">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <span
            className="grid h-10 w-10 place-items-center rounded-2xl text-white"
            style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}
          >
            <Bot className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-bold">{t("chat.title")}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> {t("chat.online")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrent({ id: newId(), title: "", updatedAt: Date.now(), messages: [] })}
            aria-label={t("chat.new")}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border lg:hidden"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-muted/30 px-4 py-6 sm:px-6">
          {current.messages.length === 0 ? (
            <div className="animate-rise flex flex-col items-center px-2 py-8 text-center">
              <span className="icon-tile h-16 w-16 bg-primary-soft text-primary"><Sparkles className="h-8 w-8" /></span>
              <h1 className="mt-5 text-2xl font-extrabold tracking-tight">{t("chat.title")}</h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("chat.subtitle")}</p>
              <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                {suggestions.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => send(t(key))}
                    className="panel panel-hover flex flex-col items-start gap-3 p-4 text-left text-sm font-medium"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            current.messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div
                    className="max-w-[85%] rounded-3xl rounded-br-lg px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap text-white shadow-sm"
                    style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}
                  >
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="max-w-[85%] rounded-3xl rounded-tl-lg border border-border bg-card px-4 py-3 text-[15px] leading-relaxed shadow-sm">
                    {m.content ? (
                      <>
                        <Markdown text={m.content} />
                        {m.sources?.length ? (
                          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                            {m.sources.map((src) => (
                              <ExternalLink key={src.url} href={src.url} className="chip py-1 text-[11px]">{src.name}</ExternalLink>
                            ))}
                          </div>
                        ) : null}
                        <SearchSuggestions html={m.suggestionsHtml} />
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5 py-1 text-muted-foreground" aria-label={t("chat.thinking")}>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                </div>
              ),
            )
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border bg-card p-3 sm:p-4">
          {error ? <p className="mb-2 px-1 text-sm text-danger">{error}</p> : null}
          <form
            onSubmit={(e) => { e.preventDefault(); void send(input); }}
            className="flex items-end gap-2 rounded-3xl border border-border bg-background p-1.5 pl-4 focus-within:border-primary"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); }
              }}
              rows={1}
              maxLength={4000}
              placeholder={t("chat.placeholder")}
              className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-[15px] outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t("chat.send")}
              className="btn-primary h-11 w-11 shrink-0 rounded-2xl p-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="px-2 pt-2 text-center text-[11px] text-muted-foreground">{t("chat.disclaimer")}</p>
        </div>
      </section>
    </div>
  );
}
