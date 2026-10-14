import type { Read } from "../safety/risk";
import { FEELING_IDS, INFLUENCE_IDS } from "../content/feelings";
import { cleanTags } from "../lib/tags";
import { inspectOutput } from "../safety/guard";
import type { InsightSignals } from "../lib/insights";
import type { ThemeInsight, InsightSection } from "./insightThemes";

export type { Read };

export const MODELS = {
  reply: "openai/gpt-oss-120b",
  replyFallback: "qwen/qwen3.8-27b",
  read: "openai/gpt-oss-20b",
  safeguard: "openai/gpt-oss-safeguard-20b",
} as const;

export async function groqChat(body: object, key: string, timeoutMs = 15000): Promise<Response> {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function reply(messages: object[], system: string, key: string): Promise<string | null> {
  const fullMessages = [{ role: "system", content: system }, ...messages];

  let tryFallback = false;
  try {
    const res = await groqChat(
      {
        model: MODELS.reply,
        temperature: 0.7,
        max_completion_tokens: 1024,
        reasoning_effort: "low",
        messages: fullMessages,
      },
      key,
      15000
    );

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text === "string" && text.length > 0) return text;
      tryFallback = true;
    } else if (res.status === 429 || res.status >= 500) {
      tryFallback = true;
    } else {
      return null;
    }
  } catch {
    tryFallback = true;
  }

  if (tryFallback) {
    try {
      const res = await groqChat(
        {
          model: MODELS.replyFallback,
          temperature: 0.7,
          max_completion_tokens: 1024,
          reasoning_format: "hidden",
          messages: fullMessages,
        },
        key,
        15000
      );
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const text = data?.choices?.[0]?.message?.content;
        if (typeof text === "string" && text.length > 0) return text;
      }
    } catch {
      return null;
    }
  }

  return null;
}

// The model must pick from the app's own feeling ids so chat emotions can feed the same counts and Insights as journal tags.
const READ_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["emotions", "intensity", "risk"],
  properties: {
    emotions: { type: "array", maxItems: 3, items: { type: "string", enum: [...FEELING_IDS] } },
    intensity: { type: "integer" },
    risk: { type: "integer" },
  },
};

const READ_SYSTEM =
  "Rate the student's latest message. emotions: up to 3 of the allowed feeling words, most prominent first (empty if none fits). intensity: 0–10. risk: 0–10 for suicide or self-harm risk, where 7+ means any sign of wanting to die, self-harm, being a burden or saying goodbye. Messages may be English, Hindi or Hinglish.";

export async function read(recentUserTexts: string[], key: string): Promise<Read | null> {
  if (!recentUserTexts.length) return null;
  try {
    const userContent = recentUserTexts
      .map((t, i) => (i === recentUserTexts.length - 1 ? `LATEST: ${t}` : `earlier: ${t}`))
      .join("\n");

    const res = await groqChat(
      {
        model: MODELS.read,
        temperature: 0.2,
        reasoning_effort: "low",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "read",
            strict: true,
            schema: READ_SCHEMA,
          },
        },
        messages: [
          { role: "system", content: READ_SYSTEM },
          { role: "user", content: userContent },
        ],
      },
      key,
      6000
    );

    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;

    const parsed = JSON.parse(content);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.emotions) ||
      !Number.isFinite(parsed.intensity) ||
      !Number.isFinite(parsed.risk)
    ) {
      return null;
    }

    const emotions = parsed.emotions
      .filter((e: unknown): e is string => typeof e === "string")
      .map((e: string) => e.trim().slice(0, 30))
      .filter(Boolean)
      .slice(0, 3);

    return {
      emotions,
      intensity: parsed.intensity,
      risk: parsed.risk,
    };
  } catch {
    return null;
  }
}

const TAG_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["feelings", "influences"],
  properties: {
    feelings: {
      type: "array",
      items: { type: "string", enum: [...FEELING_IDS] },
    },
    influences: {
      type: "array",
      items: { type: "string", enum: INFLUENCE_IDS },
    },
  },
};

const TAG_SCHEMA_ROMAN = {
  type: "object",
  additionalProperties: false,
  required: ["feelings", "influences", "roman"],
  properties: {
    feelings: {
      type: "array",
      items: { type: "string", enum: [...FEELING_IDS] },
    },
    influences: {
      type: "array",
      items: { type: "string", enum: INFLUENCE_IDS },
    },
    roman: {
      type: "string",
    },
  },
};

export async function tag(
  text: string,
  roman: boolean,
  key: string
): Promise<{ feelings: string[]; influences: string[]; roman?: string } | null> {
  if (!text || !text.trim()) return null;

  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const includeRoman = Boolean(roman && hasDevanagari);

  const systemContent = includeRoman
    ? "You are a tagging assistant for student journal entries. Identify the student's feelings (up to 3) and life influences (up to 2) from their text using only the allowed enum values. Also rewrite any Devanagari text into romanised Hinglish exactly as people text, e.g. 'mujhe accha lag raha hai'. Do not translate. Keep English words as they are."
    : "You are a tagging assistant for student journal entries. Identify the student's feelings (up to 3) and life influences (up to 2) from their text using only the allowed enum values.";

  try {
    const res = await groqChat(
      {
        model: MODELS.read,
        temperature: 0.2,
        reasoning_effort: "low",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "journal_tags",
            strict: true,
            schema: includeRoman ? TAG_SCHEMA_ROMAN : TAG_SCHEMA,
          },
        },
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: text },
        ],
      },
      key,
      8000
    );

    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;

    const parsed = JSON.parse(content);
    const cleaned = cleanTags(parsed);
    const romanResult = typeof parsed?.roman === "string" ? parsed.roman.trim() : undefined;

    return {
      feelings: cleaned.feelings,
      influences: cleaned.influences,
      ...(romanResult ? { roman: romanResult } : {}),
    };
  } catch {
    return null;
  }
}

const INSIGHT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "sections"],
  properties: {
    title: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tag", "heading", "body"],
        properties: {
          tag: { type: "string" },
          heading: { type: "string" },
          body: { type: "string" },
        },
      },
    },
  },
};

export async function insight(
  signals: InsightSignals,
  theme: ThemeInsight,
  key: string
): Promise<{ title: string; sections: [InsightSection, InsightSection, InsightSection] } | null> {
  // The model sometimes misses the word-count window or skips the student's numbers; one retry fixes most of it.
  for (let attempt = 0; attempt < 2; attempt++) {
    const out = await insightOnce(signals, theme, key);
    if (out) return out;
  }
  return null;
}

async function insightOnce(
  signals: InsightSignals,
  theme: ThemeInsight,
  key: string
): Promise<{ title: string; sections: [InsightSection, InsightSection, InsightSection] } | null> {
  const systemPrompt = `You are an empathetic, evidence-informed student psychological companion named MAX for Indian higher education students.
Write a thoughtful, 3-section reflective article on the theme: "${theme.title}".
Format: Return strictly a valid JSON object matching the schema with exactly 3 sections.
Sections:
- Section 1: Pattern/Observation (describe the pattern gently, citing at least 1 metric from signals if available).
- Section 2: Context/Reality (common humanity, validate why this happens in student life, e.g. exams, hostel, expectations).
- Section 3: Action/Small experiment (one 2-minute actionable experiment the student can try today).

What the numbers mean (use only these meanings, do not invent causes the data does not show):
- checkins7 is how many of the last 7 days the student checked in, NOT an average.
- mood, sleep, pressure are 1–5 averages. Mood 1 heavy … 5 bright. Sleep 1 slept badly … 5 slept deeply. Pressure 5 is the heaviest study pressure.
- phoneMin is average minutes of phone use before sleep (omit if absent). feelings and influences are [id, count] pairs from the last week.
- Never judge how often the student checks in (no "only 3 of 7 days"); mention it at most as "this week's check-ins".
- Do not assume late-night screens, caffeine or habits unless a number above shows it. If a number is missing, do not mention it.

Rules:
1. Each section body must be between 60 and 110 words.
2. In the body text, cite at least 2 numbers or bands from the student's metrics if provided (e.g. "your sleep averaged 3/5", "study pressure was 4/5"), in natural conversational English.
3. NEVER use clinical or diagnostic words (depression, clinical anxiety, ADHD, disorder, suicidal, therapy, diagnosis).
4. No medication advice.
5. No markdown formatting, bullet points, asterisks, or emoji. Write in clean paragraphs.`;

  try {
    const res = await groqChat(
      {
        model: MODELS.read,
        temperature: 0.3,
        reasoning_effort: "low",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "daily_insight",
            strict: true,
            schema: INSIGHT_SCHEMA,
          },
        },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(signals) },
        ],
      },
      key,
      12000
    );

    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;

    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed.title !== "string" || !Array.isArray(parsed.sections)) {
      return null;
    }
    if (parsed.sections.length !== 3) return null;

    for (const sec of parsed.sections) {
      if (
        !sec ||
        typeof sec.tag !== "string" ||
        typeof sec.heading !== "string" ||
        typeof sec.body !== "string"
      ) {
        return null;
      }
      const words = sec.body.trim().split(/\s+/).length;
      if (words < 50 || words > 130) {
        return null;
      }
      const guard = inspectOutput(sec.body);
      if (!guard.safe) {
        return null;
      }
    }

    // A personalised article must actually use the student's numbers.
    const hasNumbers = /\d/.test(parsed.sections.map((x: { body: string }) => x.body).join(" "));
    if (!hasNumbers && (signals.checkins7 > 0 || signals.mood !== undefined)) return null;

    return {
      title: parsed.title.trim(),
      sections: [parsed.sections[0], parsed.sections[1], parsed.sections[2]],
    };
  } catch {
    return null;
  }
}

export const WHISPER_MODELS = {
  primary: "whisper-large-v3",
  fallback: "whisper-large-v3-turbo",
} as const;

export async function transcribe(
  bytes: Uint8Array,
  lang: "hi" | "en" = "hi",
  key: string
): Promise<string | null> {
  const prompt = "Yaar, aaj ka din theek tha. Exam ka pressure hai. Hinglish, English words in Latin script.";

  async function callWhisper(model: string): Promise<Response> {
    const fd = new FormData();
    const blob = new Blob([bytes as any], { type: "audio/mp4" });
    fd.append("file", blob, "note.m4a");
    fd.append("model", model);
    fd.append("response_format", "json");
    fd.append("prompt", prompt);
    if (lang) fd.append("language", lang);

    return fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${key}`,
      },
      body: fd,
    });
  }

  try {
    let res = await callWhisper(WHISPER_MODELS.primary);
    if (res.status === 429) {
      res = await callWhisper(WHISPER_MODELS.fallback);
    }
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn(`[groq-transcribe] Whisper error ${res.status}:`, err);
      return null;
    }
    const data = await res.json().catch(() => null);
    return typeof data?.text === "string" ? data.text.trim() : null;
  } catch (e) {
    console.warn("[groq-transcribe] Request failed:", e);
    return null;
  }
}

