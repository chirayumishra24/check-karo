import { FinishReason, ThinkingLevel, type Candidate, type Content } from "@google/genai";
import { z } from "zod";
import { aiConfigured, gemini, groundingOf, LANGUAGE_NAMES, thinkingFor, withModel } from "@/lib/ai";
import { bad, rateLimited } from "@/lib/http";
import { findSchemes } from "@/lib/store";

export const maxDuration = 300;

/** Separates the streamed reply from the trailing JSON with sources (ASCII record separator). */
const TRAILER = "\u001e";

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

Schemes from the Check Karo library that match the question are listed below; prefer them and link each as /schemes/<id>. Use Google Search for anything current or not in that list, and prefer official .gov.in sources.

Keep answers short, warm and practical, with simple words and short bullet lists. Never ask for or accept OTPs, Aadhaar numbers, bank or card details. Remind people that government schemes never charge a fee to "register" through WhatsApp links. If you are not sure, say so and point to the official source.`;

/** Saved schemes that share keywords with the question, most relevant first. */
async function libraryContext(question: string): Promise<string> {
  const words = question.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);
  if (!words.length) return "(none matched)";
  const all = await findSchemes({ profile: null, q: "", tags: [] });
  const ranked = all
    .map((s) => {
      const text = `${s.name.en} ${s.name.hi} ${s.desc.en} ${s.tags.join(" ")} ${s.stateKey ?? ""}`.toLowerCase();
      return { s, score: words.filter((w) => text.includes(w)).length };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.s.popularity - a.s.popularity)
    .slice(0, 6);
  if (!ranked.length) return "(none matched)";
  return ranked
    .map(({ s }) => `- id: ${s.id} | ${s.name.en} | benefits: ${s.benefits.en} | who: ${s.eligibility.en} | official site: ${s.url}`)
    .join("\n");
}

export async function POST(req: Request) {
  if (!aiConfigured()) return bad("AI is not configured on the server.", 503);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid chat");
  if (rateLimited(req, "chat", 40, 60 * 60_000)) return bad("Too many messages. Please try again later.", 429);

  const { messages, lang } = parsed.data;
  const language = LANGUAGE_NAMES[lang] ?? "English";
  const contents: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const lastQuestion = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const system = `${SYSTEM}\n\nReply in ${language}.\n\n<library>\n${await libraryContext(lastQuestion)}\n</library>`;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (t: string) => controller.enqueue(enc.encode(t));
      let wrote = false;
      let grounded: Candidate | undefined;
      let blocked = false;
      try {
        const stream = await withModel((model) =>
          gemini().models.generateContentStream({
            model,
            contents,
            config: {
              systemInstruction: system,
              tools: [{ googleSearch: {} }],
              thinkingConfig: thinkingFor(model, ThinkingLevel.LOW),
            },
          }),
        );
        for await (const chunk of stream) {
          const candidate = chunk.candidates?.[0];
          if (candidate?.groundingMetadata) grounded = candidate;
          if (candidate?.finishReason === FinishReason.SAFETY || candidate?.finishReason === FinishReason.PROHIBITED_CONTENT) {
            blocked = true;
          }
          const text = chunk.text;
          if (text) {
            wrote = true;
            send(text);
          }
        }
        if (blocked && !wrote) send("Sorry, I can't help with that request.");
      } catch (err) {
        console.error("chat failed", err);
        send(wrote ? "\n\n" : "");
        send("⚠️ The assistant could not finish its reply. Please try again.");
      } finally {
        send(TRAILER + JSON.stringify(groundingOf(grounded)));
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
