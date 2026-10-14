import type { RiskLevel } from "./classifier";
import { groqChat, MODELS } from "../server/groq";

// Layer 2: a safety-tuned model catches indirect phrasing the patterns miss
// ("sab mere bina better rahenge"). It can only raise the level, never lower
// it, and any failure falls back to the deterministic result.

const POLICY = `You classify messages from college students to a wellbeing app for suicide and self-harm risk. Messages may be English, Hindi, or romanised Hinglish. You see the student's last few messages; judge the latest one in that context.
CRISIS: any sign, direct or indirect, of wanting to die, not wanting to exist or wake up, wanting to disappear forever, feeling others would be better off without them, being a burden, self-harm, a plan or means, saying goodbye or giving things away, or being in danger from someone. When unsure between CRISIS and DISTRESS, choose CRISIS.
DISTRESS: strong emotional pain (hopeless, panic, crying, cannot cope) without any of the above.
NONE: everything else, including idioms like "this exam is killing me".
Answer with exactly one word: CRISIS, DISTRESS or NONE.`;


export async function modelRisk(recentUserTexts: string[], key: string, timeoutMs = 3000): Promise<RiskLevel | null> {
  try {
    const res = await groqChat(
      {
        model: process.env.GROQ_SAFETY_MODEL ?? MODELS.safeguard,
        reasoning_effort: "low",
        max_completion_tokens: 300,
        messages: [
          { role: "system", content: POLICY },
          { role: "user", content: recentUserTexts.map((t, i) => (i === recentUserTexts.length - 1 ? `LATEST: ${t}` : `earlier: ${t}`)).join("\n") },
        ],
      },
      key,
      timeoutMs
    );
    if (!res.ok) return null;
    const word = String((await res.json())?.choices?.[0]?.message?.content ?? "").trim().toUpperCase();
    return word.startsWith("CRISIS") ? "crisis" : word.startsWith("DISTRESS") ? "distress" : word.startsWith("NONE") ? "none" : null;
  } catch {
    return null;
  }
}
