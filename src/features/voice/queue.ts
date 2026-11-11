import { suggestTags, transcribeAudioFile } from "@/lib/api";
import { getState, update } from "@/lib/store";
import { acceptRoman } from "./transcript";

const retryCounts = new Map<string, number>();
let isProcessing = false;

export async function processPendingTranscripts(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const s = getState();
    // Audio never leaves the phone without the voice-to-text consent. Entries saved without it stay
    // "pending" and are transcribed only if the student turns voice-to-text on later.
    if (!s.consents.voice) return;
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
        // Crisis wording in a transcript is surfaced where the student will see it: the journal list and the
        // entry screen both run the classifier on transcript text and show the helpline line / crisis card.

        // Romanising Hindi is part of turning speech into readable text (voice consent). Feeling tags are the
        // separate "AI help in the journal" feature, so they are only kept when that consent is on.
        const tagResult = await suggestTags(raw);
        const roman = acceptRoman(raw, tagResult.roman);
        const allowTags = getState().consents.ai;
        if (!allowTags) {
          tagResult.feelings = [];
          tagResult.influences = [];
        }

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
