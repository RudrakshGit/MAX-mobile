// The student's own music list. Pure helpers (no native imports) so they run under `node --test`.
import type { MyTrack } from "./store";

export type LinkPlatform = NonNullable<MyTrack["platform"]>;

export const PLATFORM_LABELS: Record<LinkPlatform, string> = {
  spotify: "Spotify",
  ytmusic: "YouTube Music",
  youtube: "YouTube",
  jiosaavn: "JioSaavn",
  apple: "Apple Music",
  other: "Link",
};

/** Turns what a student pastes (often with extra text from a share sheet) into a clean https link, or null. */
export function cleanLink(input: string): string | null {
  const found = input.match(/https?:\/\/[^\s<>"']+/i)?.[0] ?? (/^[a-z0-9-]+(\.[a-z0-9-]+)+\/\S*$/i.test(input.trim()) ? `https://${input.trim()}` : null);
  if (!found) return null;
  try {
    const u = new URL(found.replace(/^http:\/\//i, "https://"));
    if (u.protocol !== "https:" || !u.hostname.includes(".")) return null;
    return u.toString().slice(0, 500);
  } catch {
    return null;
  }
}

export function detectPlatform(url: string): LinkPlatform {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "other";
  }
  if (host.endsWith("spotify.com") || host === "spotify.link") return "spotify";
  if (host === "music.youtube.com") return "ytmusic";
  if (host.endsWith("youtube.com") || host === "youtu.be") return "youtube";
  if (host.endsWith("jiosaavn.com") || host === "jiosaav.in") return "jiosaavn";
  if (host === "music.apple.com") return "apple";
  return "other";
}

/** oEmbed endpoint that can give a title for the link (public, no key), or null. */
export function oembedUrl(url: string): string | null {
  const p = detectPlatform(url);
  if (p === "spotify") return `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
  if (p === "youtube" || p === "ytmusic") {
    // YouTube's oEmbed doesn't know music.youtube.com; the same video/playlist id works on www.youtube.com
    const yt = url.replace("://music.youtube.com/", "://www.youtube.com/");
    return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(yt)}`;
  }
  return null;
}

/** "02 - Arijit Singh - Tum Hi Ho (128kbps).mp3" → "Arijit Singh - Tum Hi Ho" */
export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[a-z0-9]{2,5}$/i, "");
  const cleaned = base
    .replace(/[_]+/g, " ")
    .replace(/\(\s*\d+\s*kbps\s*\)|\[\s*\d+\s*kbps\s*\]/gi, "")
    .replace(/^\s*\d{1,3}\s*[-.)]\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return (cleaned || "My track").slice(0, 120);
}

export const newTrackId = () => `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
