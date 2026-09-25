import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { aiConfigured, anthropic, FALLBACK, LANGUAGE_NAMES, MODEL, WEB_SEARCH } from "@/lib/ai";
import { bad, rateLimited } from "@/lib/http";
import { findSchemes } from "@/lib/store";

export const maxDuration = 300;

const Body = z.object({
  lang: z.string().max(5).default("en"),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(8000) }))
    .min(1)
    .max(40),
});

const SYSTEM = `You are the Check Karo assistant, a free helper for people in India. You help with two things:
1. Spotting misinformation and scams in forwards, links and messages.
2. Finding government schemes and benefits a person may qualify for, and how to apply.

Use search_saved_schemes first for scheme questions; those schemes are shown in the app, and you can link them as /schemes/<id>. Use web search for anything current or not in the saved list, and prefer official .gov.in sources.

Keep answers short, warm and practical, with simple words and short bullet lists. Never ask for or accept OTPs, Aadhaar numbers, bank or card details. Remind people that government schemes never charge a fee to "register" through WhatsApp links. If you are not sure, say so and point to the official source.`;

const SEARCH_TOOL: Anthropic.Beta.BetaTool = {
  name: "search_saved_schemes",
  description:
    "Search the Check Karo scheme database by keywords (scheme name, state, or topic such as farmer, pension, scholarship). Returns up to 8 schemes with id, name, benefits, eligibility and official URL.",
  input_schema: {
    type: "object",
    properties: { query: { type: "string", description: "Keywords, e.g. 'farmer bihar' or 'pension'" } },
    required: ["query"],
  },
};

async function runSearchTool(input: unknown): Promise<string> {
  const query = typeof (input as { query?: unknown })?.query === "string" ? (input as { query: string }).query : "";
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  // Match any keyword, then rank by how many matched.
  const all = await findSchemes({ profile: null, q: "", tags: [] });
  const ranked = all
    .map((s) => {
      const text = `${s.name.en} ${s.desc.en} ${s.tags.join(" ")} ${s.stateKey ?? ""}`.toLowerCase();
      return { s, score: words.filter((w) => text.includes(w)).length };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.s.popularity - a.s.popularity)
    .slice(0, 8)
    .map(({ s }) => ({
      id: s.id, name: s.name.en, level: s.level, state: s.stateKey,
      benefits: s.benefits.en, eligibility: s.eligibility.en, url: s.url,
    }));
  return JSON.stringify(ranked.length ? ranked : { note: "No saved schemes matched; try web search." });
}

export async function POST(req: Request) {
  if (!aiConfigured()) return bad("AI is not configured on the server.", 503);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid chat");
  if (rateLimited(req, "chat", 40, 60 * 60_000)) return bad("Too many messages. Please try again later.", 429);

  const language = LANGUAGE_NAMES[parsed.data.lang] ?? "English";
  const messages: Anthropic.Beta.BetaMessageParam[] = parsed.data.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (t: string) => controller.enqueue(enc.encode(t));
      let wroteText = false;
      try {
        for (let turn = 0; turn < 6; turn++) {
          const stream = anthropic().beta.messages.stream({
            ...FALLBACK,
            model: MODEL,
            max_tokens: 16000,
            thinking: { type: "adaptive" },
            output_config: { effort: "medium" },
            system: `${SYSTEM}\n\nReply in ${language}.`,
            tools: [WEB_SEARCH(3), SEARCH_TOOL],
            messages,
          });
          let turnText = false;
          stream.on("text", (t) => {
            if (!turnText && wroteText) send("\n\n");
            turnText = true;
            wroteText = true;
            send(t);
          });
          const msg = await stream.finalMessage();

          if (msg.stop_reason === "refusal") {
            send(wroteText ? "\n\n" : "");
            send("Sorry, I can't help with that request.");
            break;
          }
          messages.push({ role: "assistant", content: msg.content });
          if (msg.stop_reason === "pause_turn") continue;

          const calls = msg.content.filter(
            (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use",
          );
          if (msg.stop_reason !== "tool_use" || calls.length === 0) break;

          const results: Anthropic.Beta.BetaToolResultBlockParam[] = await Promise.all(
            calls.map(async (c) => ({
              type: "tool_result" as const,
              tool_use_id: c.id,
              content: c.name === SEARCH_TOOL.name ? await runSearchTool(c.input) : "Unknown tool",
              is_error: c.name !== SEARCH_TOOL.name,
            })),
          );
          messages.push({ role: "user", content: results });
        }
      } catch (err) {
        console.error("chat failed", err);
        send(wroteText ? "\n\n" : "");
        send("⚠️ The assistant could not finish its reply. Please try again.");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
