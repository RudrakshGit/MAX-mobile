import { suggestTags, transcribeAudioFile } from "@/lib/api";
import { getState, update } from "@/lib/store";
import { classifyRisk } from "@/safety/classifier";
import { acceptRoman } from "./transcript";

const retryCounts = new Map<string, number>();
let isProcessing = false;

export async function processPendingTranscripts(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const s = getState();
    const pending = s.entries.filter(
      (e) => e.audio?.uri && e.transcript?.status === "pending"
    );

    for (const entry of pending) {
      if (!entry.audio?.uri) continue;

      const attempts = retryCounts.get(entry.id) ?? 0;
      if (attempts >= 3) {
        update((state) => ({
          entries: state.entries.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  transcript: {
                    raw: e.transcript?.raw,
                    roman: e.transcript?.roman,
                    status: "failed",
                  },
                }
              : e
          ),
        }));
        continue;
      }

      retryCounts.set(entry.id, attempts + 1);

      const rawTranscript = await transcribeAudioFile(entry.audio.uri);
      if (rawTranscript) {
        const raw = rawTranscript.trim();
        // Run safety check
        classifyRisk(raw);

        // Fetch tags and potential Romanisation
        const tagResult = await suggestTags(raw);
        const roman = acceptRoman(raw, tagResult.roman);

        update((state) => ({
          entries: state.entries.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  transcript: {
                    raw,
                    roman,
                    status: "done",
                  },
                  feelings: Array.from(
                    new Set([...e.feelings, ...tagResult.feelings])
                  ).slice(0, 3),
                  influences: Array.from(
                    new Set([...e.influences, ...tagResult.influences])
                  ).slice(0, 2),
                }
              : e
          ),
        }));
      } else if (attempts + 1 >= 3) {
        // Mark as failed after 3 attempts
        update((state) => ({
          entries: state.entries.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  transcript: {
                    raw: e.transcript?.raw,
                    roman: e.transcript?.roman,
                    status: "failed",
                  },
                }
              : e
          ),
        }));
      }
    }
  } finally {
    isProcessing = false;
  }
}

export function retryEntryTranscription(entryId: string): void {
  retryCounts.delete(entryId);
  update((state) => ({
    entries: state.entries.map((e) =>
      e.id === entryId
        ? {
            ...e,
            transcript: {
              raw: e.transcript?.raw,
              roman: e.transcript?.roman,
              status: "pending",
            },
          }
        : e
    ),
  }));
  processPendingTranscripts();
}
