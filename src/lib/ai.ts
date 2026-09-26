import {
  ApiError, FinishReason, GoogleGenAI, ThinkingLevel, type Candidate, type GenerateContentResponse, type Part,
  type ThinkingConfig,
} from "@google/genai";
import { z } from "zod";

// gemini-2.5-flash is the preferred model, but Google now serves it only to
// projects that already used it. If the key cannot use it, the app switches to
// the fallback model once and stays on it for the life of the server instance.
const PREFERRED_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.8-flash";
let activeModel = PREFERRED_MODEL;

function apiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

export function aiConfigured(): boolean {
  return !!apiKey();
}

let client: GoogleGenAI | null = null;
export function gemini(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: apiKey() });
  return client;
}

export class AiError extends Error {}

export const LANGUAGE_NAMES: Record<string, string> = { en: "English", hi: "Hindi" };

/** Gemini 3 models can combine Google Search with JSON output in one call; older ones cannot. */
function isGemini3(model: string): boolean {
  return /^gemini-3/.test(model);
}

/** Thinking is set by level on Gemini 3; older models think dynamically by default. */
export function thinkingFor(model: string, level: ThinkingLevel): ThinkingConfig | undefined {
  return isGemini3(model) ? { thinkingLevel: level } : undefined;
}

function modelUnavailable(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  return err.status === 404 || ((err.status === 400 || err.status === 403) && /model/i.test(err.message));
}

/** Runs `fn` with the active model, switching to the fallback model if Google rejects it. */
export async function withModel<T>(fn: (model: string) => Promise<T>): Promise<T> {
  try {
    return await fn(activeModel);
  } catch (err) {
    if (activeModel === FALLBACK_MODEL || !modelUnavailable(err)) throw err;
    console.warn(`Gemini model ${activeModel} is not available for this key; switching to ${FALLBACK_MODEL}.`);
    activeModel = FALLBACK_MODEL;
    return fn(activeModel);
  }
}

export type Source = { name: string; url: string };

/**
 * Sources Google Search returned for a grounded answer, plus the "search
 * suggestions" snippet. Google's terms require showing that snippet wherever a
 * grounded answer is shown to people.
 */
export type Grounding = { sources: Source[]; suggestionsHtml: string | null };

export function groundingOf(candidate: Candidate | undefined): Grounding {
  const meta = candidate?.groundingMetadata;
  const seen = new Set<string>();
  const sources: Source[] = [];
  for (const chunk of meta?.groundingChunks ?? []) {
    const url = chunk.web?.uri;
    if (!url) continue;
    const name = chunk.web?.title || url;
    if (seen.has(name)) continue;
    seen.add(name);
    sources.push({ name, url });
  }
  return { sources: sources.slice(0, 8), suggestionsHtml: meta?.searchEntryPoint?.renderedContent ?? null };
}

const BLOCKED = new Set<FinishReason | undefined>([
  FinishReason.SAFETY, FinishReason.PROHIBITED_CONTENT, FinishReason.BLOCKLIST, FinishReason.SPII,
]);

function checkBlocked(res: GenerateContentResponse) {
  if (res.promptFeedback?.blockReason || BLOCKED.has(res.candidates?.[0]?.finishReason)) {
    throw new AiError("The AI declined this request.");
  }
}

/** JSON Schema for Gemini's structured output, generated from the zod schema so it is defined once. */
function jsonSchemaOf(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

function parseJson<T>(text: string | undefined, schema: z.ZodType<T>): T {
  if (!text) throw new AiError("The AI did not return a result.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new AiError("AI returned malformed data.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new AiError(`AI returned malformed data: ${parsed.error.message.slice(0, 300)}`);
  return parsed.data;
}

/**
 * Grounded research that returns JSON matching `schema`. Gemini searches
 * Google (and reads URLs in the prompt when `readUrls` is set). On Gemini 3
 * this is one call; older models get a search call followed by a formatting
 * call, because they cannot use tools and structured output together.
 */
export async function researchJson<T>(opts: {
  system: string;
  parts: Part[];
  schema: z.ZodType<T>;
  readUrls?: boolean;
  thinking?: ThinkingLevel;
}): Promise<{ data: T; grounding: Grounding }> {
  const tools = [{ googleSearch: {} }, ...(opts.readUrls ? [{ urlContext: {} }] : [])];
  const level = opts.thinking ?? ThinkingLevel.MEDIUM;

  return withModel(async (model) => {
    if (isGemini3(model)) {
      const res = await gemini().models.generateContent({
        model,
        contents: [{ role: "user", parts: opts.parts }],
        config: {
          systemInstruction: opts.system,
          tools,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchemaOf(opts.schema),
          thinkingConfig: thinkingFor(model, level),
        },
      });
      checkBlocked(res);
      return { data: parseJson(res.text, opts.schema), grounding: groundingOf(res.candidates?.[0]) };
    }

    const research = await gemini().models.generateContent({
      model,
      contents: [{ role: "user", parts: opts.parts }],
      config: {
        systemInstruction: `${opts.system}\n\nWrite your findings as clear notes. Quote exact official URLs, figures and any text you read from attached files.`,
        tools,
      },
    });
    checkBlocked(research);
    const notes = research.text;
    if (!notes) throw new AiError("The AI did not return a result.");

    const task = opts.parts.map((p) => p.text).filter(Boolean).join("\n");
    const formatted = await gemini().models.generateContent({
      model,
      contents: [{
        role: "user",
        parts: [{
          text: `Turn these research notes into JSON for the task below. Use only facts from the notes; never invent URLs.\n\n<task>\n${task}\n</task>\n\n<notes>\n${notes}\n</notes>`,
        }],
      }],
      config: {
        systemInstruction: opts.system,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchemaOf(opts.schema),
      },
    });
    checkBlocked(formatted);
    return { data: parseJson(formatted.text, opts.schema), grounding: groundingOf(research.candidates?.[0]) };
  });
}

/**
 * True when a URL answers at all. Used to drop links the model may have made
 * up before they are saved or shown. Some government sites reject HEAD or
 * bots, so any HTTP response counts; only network failures and 404/410 fail.
 */
export async function urlResolves(url: string): Promise<boolean> {
  const attempt = async (method: "HEAD" | "GET") => {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CheckKaroLinkCheck/1.0)" },
    });
    return res.status !== 404 && res.status !== 410;
  };
  try {
    return await attempt("HEAD");
  } catch {
    try {
      return await attempt("GET");
    } catch {
      return false;
    }
  }
}
