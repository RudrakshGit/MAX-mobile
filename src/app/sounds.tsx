import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Linking, Image } from "react-native";
import { Stack } from "expo-router";
import {
  playlists,
  NEED_LABELS,
  type Need,
  type Playlist,
} from "@/content/music";
import { sounds, type Sound } from "@/content/sounds";
import { musicNeeds } from "@/lib/music";
import { useStore, logMusicRecent, update } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Page, T } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { Max } from "@/components/max";
import {
  useSoundPlayer,
  playSound,
  stopSound,
  setTimer,
} from "@/features/sounds/player";

const oembedCache = new Map<string, { title: string; thumb?: string }>();

export default function SoundsScreen() {
  const t = useTheme();
  const state = useStore((s) => s);
  const player = useSoundPlayer();
  const [covers, setCovers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const p of playlists) {
      const cached = oembedCache.get(p.url);
      if (cached?.thumb) {
        initial[p.id] = cached.thumb;
      }
    }
    return initial;
  });

  const needs = musicNeeds(state, new Date());

  // Fetch Spotify oEmbed covers in background
  useEffect(() => {
    let mounted = true;
    const spotifyPlaylists = playlists.filter(
      (p) => p.platform === "spotify" && !oembedCache.has(p.url)
    );

    for (const p of spotifyPlaylists) {
      fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(p.url)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!mounted || !data) return;
          oembedCache.set(p.url, { title: data.title, thumb: data.thumbnail_url });
          if (data.thumbnail_url) {
            setCovers((prev) => ({ ...prev, [p.id]: data.thumbnail_url }));
          }
        })
        .catch(() => {
          // fallback to catalogue data
        });
    }

    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenPlaylist = (p: Playlist) => {
    logMusicRecent(p.id);
    const targetUrl = p.platform === "spotify"
      ? `${p.url}?utm_campaign=com.eg18.max`
      : p.url;
    Linking.openURL(targetUrl).catch(() => {});
  };

  const handleClearRecent = () => {
    update(() => ({ musicRecent: [] }));
  };

  const formatTimeRemaining = (seconds: number | null) => {
    if (!seconds || seconds <= 0) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const recentItems = (state.musicRecent ?? [])
    .map((rec) => {
      const pl = playlists.find((p) => p.id === rec.id);
      return pl ? { ...pl, openedAt: rec.at } : null;
    })
    .filter((x): x is (Playlist & { openedAt: number }) => Boolean(x));

  return (
    <Page>
      <Stack.Screen options={{ title: "Sounds & music" }} />

      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        {/* Header Intro */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
          <View style={{ flex: 1, gap: space.xs }}>
            <T v="title">Built-in sounds & curated music</T>
            <T soft>
              Play ambient noise offline with a sleep timer, or open evidence-aligned focus and calm playlists in Spotify, YouTube Music, and JioSaavn.
            </T>
          </View>
          <Max state="sleep" size={78} />
        </View>

        {/* 1. Built-in Offline Sounds */}
        <View style={{ gap: space.sm }}>
          <T v="heading">Offline ambient sounds</T>
          <T v="small" soft>
            Generated noise without loops or lyrics. Keeps playing when your screen is locked.
          </T>

          <View style={{ gap: space.sm }}>
            {sounds.map((s) => {
              const isActive = player.activeSoundId === s.id && player.isPlaying;

              return (
                <View
                  key={s.id}
                  style={[
                    styles.soundCard,
                    {
                      backgroundColor: isActive ? t.paper : t.raised,
                      borderColor: isActive ? t.ink : t.rule,
                    },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flex: 1, paddingRight: space.sm, gap: 2 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                        <T v="heading">{s.title}</T>
                        {isActive ? (
                          <View style={[styles.activePill, { backgroundColor: t.ink }]}>
                            <T v="small" style={{ color: t.paper, fontSize: 10, fontWeight: "600" }}>PLAYING</T>
                          </View>
                        ) : null}
                      </View>
                      <T v="small" soft>{s.description}</T>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        if (isActive) {
                          stopSound();
                        } else {
                          playSound(s.id);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.playButton,
                        {
                          backgroundColor: isActive ? t.ink : t.paper,
                          borderColor: t.rule,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                    >
                      <DoodleIcon
                        name={isActive ? "pause" : "play"}
                        size={20}
                        color={isActive ? t.paper : t.ink}
                      />
                    </Pressable>
                  </View>

                  {/* Sleep Timer Bar if this sound is active */}
                  {isActive ? (
                    <View style={[styles.timerRow, { borderTopColor: t.rule }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <T v="small" soft style={{ fontWeight: "600" }}>
                          Sleep timer:
                        </T>
                        {player.remainingSeconds ? (
                          <T v="small" style={{ color: t.ink, fontWeight: "600" }}>
                            Fading in {formatTimeRemaining(player.remainingSeconds)}
                          </T>
                        ) : null}
                      </View>

                      <View style={{ flexDirection: "row", gap: space.xs, marginTop: 4 }}>
                        {[
                          { label: "Off", mins: null },
                          { label: "15m", mins: 15 },
                          { label: "30m", mins: 30 },
                          { label: "60m", mins: 60 },
                        ].map((opt) => {
                          const isSel = player.timerMinutes === opt.mins;
                          return (
                            <Pressable
                              key={opt.label}
                              onPress={() => setTimer(opt.mins)}
                              style={({ pressed }) => [
                                styles.timerPill,
                                {
                                  backgroundColor: isSel ? t.ink : t.paper,
                                  borderColor: t.rule,
                                  opacity: pressed ? 0.75 : 1,
                                },
                              ]}
                            >
                              <T
                                v="small"
                                style={{
                                  color: isSel ? t.paper : t.ink,
                                  fontSize: 11,
                                  fontWeight: isSel ? "600" : "400",
                                }}
                              >
                                {opt.label}
                              </T>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* 2. Personalized Need Recommendations */}
        <View style={{ gap: space.md }}>
          <View style={{ gap: 2 }}>
            <T v="heading">For you right now</T>
            <T v="small" soft>
              Selected based on your recent check-ins and screener answers.
            </T>
          </View>

          {needs.map((need) => {
            const info = NEED_LABELS[need];
            const needPlaylists = playlists.filter((p) => p.need === need);
            const spotifyList = needPlaylists.filter((p) => p.platform === "spotify");
            const ytmList = needPlaylists.filter((p) => p.platform === "ytmusic");
            const jioList = needPlaylists.filter((p) => p.platform === "jiosaavn");

            return (
              <View key={need} style={[styles.needSection, { borderColor: t.rule, backgroundColor: t.raised }]}>
                <View style={{ gap: 2 }}>
                  <T v="heading">{info.title}</T>
                  <T v="small" soft>{info.hint}</T>
                </View>

                {/* Spotify Row (Strictly separated per Spotify guidelines) */}
                {spotifyList.length > 0 ? (
                  <View style={{ gap: space.xs, marginTop: space.xs }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <DoodleIcon name="music" size={14} color={t.ink} />
                      <T v="small" soft style={{ fontWeight: "600", fontSize: 11 }}>SPOTIFY</T>
                    </View>

                    {spotifyList.map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() => handleOpenPlaylist(p)}
                        style={({ pressed }) => [
                          styles.playlistCard,
                          {
                            backgroundColor: t.paper,
                            borderColor: t.rule,
                            opacity: pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        {covers[p.id] ? (
                          <Image
                            source={{ uri: covers[p.id] }}
                            style={styles.coverThumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.coverThumb, { backgroundColor: t.paper, alignItems: "center", justifyContent: "center" }]}>
                            <DoodleIcon name="music" size={18} color={t.ink2} />
                          </View>
                        )}

                        <View style={{ flex: 1, gap: 2 }}>
                          <T v="body" style={{ fontWeight: "600" }}>{p.title}</T>
                          <T v="small" soft>Editorial playlist · {p.language}</T>
                        </View>

                        <View style={[styles.spotifyButton, { borderColor: t.ink }]}>
                          <T v="small" style={{ fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>PLAY ON SPOTIFY</T>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {/* YouTube Music Row */}
                {ytmList.length > 0 ? (
                  <View style={{ gap: space.xs, marginTop: space.xs }}>
                    <T v="small" soft style={{ fontWeight: "600", fontSize: 11 }}>YOUTUBE MUSIC</T>

                    {ytmList.map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() => handleOpenPlaylist(p)}
                        style={({ pressed }) => [
                          styles.playlistCard,
                          {
                            backgroundColor: t.paper,
                            borderColor: t.rule,
                            opacity: pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        <View style={[styles.coverThumb, { backgroundColor: t.paper, alignItems: "center", justifyContent: "center" }]}>
                          <DoodleIcon name="play" size={16} color={t.ink} />
                        </View>

                        <View style={{ flex: 1, gap: 2 }}>
                          <T v="body" style={{ fontWeight: "600" }}>{p.title}</T>
                          <T v="small" soft>Opens in YouTube Music</T>
                        </View>

                        <DoodleIcon name="chevron-right" size={16} color={t.ink2} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {/* JioSaavn Row */}
                {jioList.length > 0 ? (
                  <View style={{ gap: space.xs, marginTop: space.xs }}>
                    <T v="small" soft style={{ fontWeight: "600", fontSize: 11 }}>JIOSAAVN</T>

                    {jioList.map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() => handleOpenPlaylist(p)}
                        style={({ pressed }) => [
                          styles.playlistCard,
                          {
                            backgroundColor: t.paper,
                            borderColor: t.rule,
                            opacity: pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        <View style={[styles.coverThumb, { backgroundColor: t.paper, alignItems: "center", justifyContent: "center" }]}>
                          <DoodleIcon name="compass" size={16} color={t.ink} />
                        </View>

                        <View style={{ flex: 1, gap: 2 }}>
                          <T v="body" style={{ fontWeight: "600" }}>{p.title}</T>
                          <T v="small" soft>Opens in JioSaavn</T>
                        </View>

                        <DoodleIcon name="chevron-right" size={16} color={t.ink2} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* 3. Recently Opened from MAX */}
        {recentItems.length > 0 ? (
          <View style={{ gap: space.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <T v="heading">Recently opened from MAX</T>
              <Pressable onPress={handleClearRecent}>
                <T v="small" soft style={{ textDecorationLine: "underline" }}>Clear history</T>
              </Pressable>
            </View>

            <View style={{ gap: space.xs }}>
              {recentItems.slice(0, 5).map((item) => (
                <Pressable
                  key={`${item.id}-${item.openedAt}`}
                  onPress={() => handleOpenPlaylist(item)}
                  style={({ pressed }) => [
                    styles.playlistCard,
                    {
                      backgroundColor: t.raised,
                      borderColor: t.rule,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="body" style={{ fontWeight: "600" }}>{item.title}</T>
                    <T v="small" soft>
                      {item.platform === "spotify" ? "Spotify" : item.platform === "ytmusic" ? "YouTube Music" : "JioSaavn"}
                    </T>
                  </View>
                  <DoodleIcon name="chevron-right" size={16} color={t.ink2} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Footer Support */}
        <View style={[styles.footerCard, { borderColor: t.rule, backgroundColor: t.paper }]}>
          <T v="small" soft style={{ textAlign: "center" }}>
            Music and sounds are for relaxation and study support, not a replacement for clinical care. Free 24×7 crisis helpline: Tele-MANAS (14416).
          </T>
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  soundCard: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.sm,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timerRow: {
    paddingTop: space.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  timerPill: {
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  needSection: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.sm,
  },
  playlistCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: space.sm,
  },
  coverThumb: {
    width: 44,
    height: 44,
    borderRadius: 4, // 4px per Spotify guidelines
  },
  spotifyButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
  },
  footerCard: {
    padding: space.md,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
});
