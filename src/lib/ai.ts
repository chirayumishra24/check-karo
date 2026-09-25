import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

// Server-side refusal fallbacks: if the model declines a benign request, the
// API retries it on Anthropic's recommended fallback model inside the same call.
export const FALLBACK: Pick<Anthropic.Beta.MessageCreateParams, "betas" | "fallbacks"> = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

export const WEB_SEARCH = (maxUses: number): Anthropic.Beta.BetaToolUnion => ({
  type: "web_search_20260209",
  name: "web_search",
  max_uses: maxUses,
  user_location: { type: "approximate", country: "IN", timezone: "Asia/Kolkata" },
});

let client: Anthropic | null = null;
export function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export function aiConfigured(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export class AiError extends Error {}

export const LANGUAGE_NAMES: Record<string, string> = { en: "English", hi: "Hindi" };

/** Builds a client tool from a zod schema so the schema is defined once. */
export function submitTool(name: string, description: string, schema: z.ZodType): Anthropic.Beta.BetaTool {
  const json = z.toJSONSchema(schema, { target: "draft-7" }) as Record<string, unknown>;
  delete json.$schema;
  return {
    name,
    description,
    input_schema: json as Anthropic.Beta.BetaTool.InputSchema,
  };
}

/**
 * Runs a research turn (web search on Anthropic's servers) and returns the
 * input Claude passed to the named submit tool, validated against `schema`.
 * Resumes `pause_turn` so long searches are not cut short.
 */
export async function researchAndSubmit<T>(opts: {
  system: string;
  content: Anthropic.Beta.BetaContentBlockParam[];
  submit: { name: string; description: string; schema: z.ZodType<T> };
  searches: number;
  fetches?: number;
  effort?: "low" | "medium" | "high";
}): Promise<T> {
  const tools: Anthropic.Beta.BetaToolUnion[] = [
    WEB_SEARCH(opts.searches),
    ...(opts.fetches
      ? [{ type: "web_fetch_20260209", name: "web_fetch", max_uses: opts.fetches } as Anthropic.Beta.BetaToolUnion]
      : []),
    submitTool(opts.submit.name, opts.submit.description, opts.submit.schema),
  ];
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: opts.content }];

  for (let turn = 0; turn < 4; turn++) {
    const stream = anthropic().beta.messages.stream({
      ...FALLBACK,
      model: MODEL,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: { effort: opts.effort ?? "medium" },
      system: opts.system,
      tools,
      messages,
    });
    const msg = await stream.finalMessage();

    if (msg.stop_reason === "refusal") throw new AiError("The AI declined this request.");

    const call = msg.content.find(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === opts.submit.name,
    );
    if (call) {
      const parsed = opts.submit.schema.safeParse(call.input);
      if (parsed.success) return parsed.data;
      throw new AiError(`AI returned malformed data: ${parsed.error.message.slice(0, 300)}`);
    }

    if (msg.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: msg.content });
      continue;
    }
    // Finished without submitting: ask once more, explicitly.
    messages.push({ role: "assistant", content: msg.content });
    messages.push({
      role: "user",
      content: `Please call the ${opts.submit.name} tool now with your findings.`,
    });
  }
  throw new AiError("The AI did not return a result.");
}
