import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { LANGUAGE_NAMES, researchAndSubmit } from "./ai";

export const Verdict = z.object({
  verdict: z.enum(["verified", "not_verified", "wrong"]),
  confidence: z.number().int().min(0).max(100),
  claim: z.string().describe("The main claim that was checked, in one sentence"),
  reason: z.string().describe("Why you reached this verdict, 1-3 short sentences"),
  evidence: z.string().describe("What trustworthy sources say, 1-3 short sentences"),
  action: z.string().describe("What the person should do now, e.g. do not forward, apply only on the official site"),
  sources: z.array(z.object({ name: z.string(), url: z.string().url() })).max(6),
  extracted: z.string().nullable().describe("Text read from an image or PDF, else null"),
});
export type VerdictResult = z.infer<typeof Verdict> & { checkedAt: string };

export type VerifyInput =
  | { mode: "text"; text: string }
  | { mode: "url"; url: string }
  | { mode: "file"; mime: string; base64: string; name: string };

const SYSTEM = `You are the fact-checker for Check Karo, a free service that helps people in India check WhatsApp forwards, news links and screenshots before they believe or share them.

Identify the main factual claim, then use web search to compare it with reliable sources: official government sites (.gov.in, PIB Fact Check), established news organisations and recognised fact-checkers.

Verdicts:
- verified: reliable sources clearly confirm the claim.
- wrong: reliable sources clearly contradict it, or it matches a known scam or hoax pattern (fake job offers, "free recharge" links, KYC/OTP requests, lottery wins, fake government scheme sign-ups).
- not_verified: evidence is missing or mixed. Prefer this over guessing.

Confidence reflects the strength of evidence. Always warn people never to share OTPs, Aadhaar numbers, bank details or pay "registration fees". Keep the language simple and calm.

When done, call submit_verdict exactly once.`;

export async function verify(input: VerifyInput, lang: string): Promise<VerdictResult> {
  const language = LANGUAGE_NAMES[lang] ?? "English";
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];

  if (input.mode === "file") {
    if (input.mime === "application/pdf") {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: input.base64 } });
    } else {
      content.push({
        type: "image",
        source: { type: "base64", media_type: input.mime as "image/png" | "image/jpeg" | "image/webp", data: input.base64 },
      });
    }
    content.push({ type: "text", text: "Check the claim shown in this screenshot or document. Put the text you read into `extracted`." });
  } else if (input.mode === "url") {
    content.push({
      type: "text",
      text: `Check this link and the claim it makes. Look at the domain itself too: is it an official or well-known site, a look-alike, or a known scam domain?\n\n<link>${input.url}</link>`,
    });
  } else {
    content.push({ type: "text", text: `Check this message:\n\n<message>\n${input.text}\n</message>` });
  }
  content.push({ type: "text", text: `Write reason, evidence, action and claim in ${language}.` });

  const result = await researchAndSubmit({
    system: SYSTEM,
    content,
    submit: { name: "submit_verdict", description: "Submit the fact-check result.", schema: Verdict },
    searches: 5,
    fetches: input.mode === "url" ? 2 : 0,
  });
  return { ...result, checkedAt: new Date().toISOString() };
}
