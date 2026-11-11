import React, { useEffect, useMemo, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { NEED_LABELS, playlists, type Need, type Playlist } from "@/content/music";
import { sounds } from "@/content/sounds";
import { musicNeeds } from "@/lib/music";
import { cleanLink, PLATFORM_LABELS } from "@/lib/my-music";
import { logMusicRecent, update, useStore, type MusicApp, type MyTrack } from "@/lib/store";
import { radius, space, useTheme, type Theme } from "@/lib/theme";
import { Button, Choice, Field, Page, T } from "@/lib/ui";
import { showAlert } from "@/lib/dialog";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import { Max } from "@/components/max";
import {
  dismissFocusDone,
  endFocus,
  next,
  playSound,
  playTracks,
  setTimer,
  startFocus,
  stopSound,
  togglePause,
  useSoundPlayer,
  type Track,
} from "@/features/sounds/player";
import { HelpedPrompt } from "@/components/HelpedPrompt";
import { NumberField, type WheelItem } from "@/ui/sketch/Wheel";
import { addLink, addTrackFromPhone, editTrack, lookUpTitle, removeTrack } from "@/features/sounds/my-music-files";

const oembedCache = new Map<string, string>();
const APP_LABELS: Record<MusicApp, string> = { spotify: "Spotify", ytmusic: "YouTube Music", jiosaavn: "JioSaavn" };
const NEED_ORDER: Need[] = ["calm", "focus", "sleep", "uplift", "anxiety", "noise"];
const NEED_SHORT: Record<Need, string> = { calm: "Calm", focus: "Focus", sleep: "Sleep", uplift: "Uplift", anxiety: "Anxiety", noise: "Noise" };

const fileTrack = (t: MyTrack): Track => ({ id: t.id, title: t.title, source: { uri: t.uri! }, loop: false });

const FOCUS_MINUTES: WheelItem<number>[] = Array.from({ length: 24 }, (_, i) => ({ label: `${(i + 1) * 5} min`, value: (i + 1) * 5 }));
const TIMER_MINUTES: WheelItem<number>[] = Array.from({ length: 24 }, (_, i) => ({ label: `${(i + 1) * 5} min`, value: (i + 1) * 5 }));

export default function SoundsScreen() {
  const t = useTheme();
  const state = useStore((s) => s);
  const myMusic = useStore((s) => s.myMusic);
  const musicApps = useStore((s) => s.musicApps);
  const player = useSoundPlayer();
  const { focus } = useLocalSearchParams<{ focus?: string }>();

  const needs = musicNeeds(state, new Date());
  const [need, setNeed] = useState<Need>(needs[0]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const files = myMusic.filter((m) => m.kind === "file");
  const shownApps: MusicApp[] = musicApps.length ? musicApps : ["spotify", "ytmusic", "jiosaavn"];

  const openLink = (id: string, url: string, spotify: boolean) => {
    logMusicRecent(id);
    Linking.openURL(spotify ? `${url}${url.includes("?") ? "&" : "?"}utm_campaign=com.eg18.max` : url).catch(() =>
      setNote("Couldn't open that link. Is the app or a browser installed?"),
    );
  };

  const playMine = (track: MyTrack) => {
    if (track.kind === "link" && track.url) return openLink(track.id, track.url, track.platform === "spotify");
    if (player.activeSoundId === track.id) return togglePause();
    logMusicRecent(track.id);
    const list = files.map(fileTrack);
    void playTracks(list, Math.max(0, list.findIndex((x) => x.id === track.id)));
  };

  const recent = (state.musicRecent ?? [])
    .map((r) => myMusic.find((m) => m.id === r.id) ?? playlists.find((p) => p.id === r.id))
    .filter((x): x is MyTrack | Playlist => !!x)
    .slice(0, 5);

  return (
    <Page>
      <Stack.Screen options={{ title: "Sounds & music" }} />
      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <View style={{ flex: 1, gap: space.xs }}>
            <T v="title">Sounds & music</T>
            <T soft>Calm sounds that play offline, your own songs and playlists, and picks for how you feel today.</T>
          </View>
          <Max state="sleep" size={72} />
        </View>

        <FocusSession t={t} highlight={focus === "1"} />
        {player.activeSoundId && !player.focusEndAt ? <NowPlaying t={t} /> : null}
        {note ? <T style={{ color: t.help }}>{note}</T> : null}

        {/* 1. The student's own music */}
        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
            <T v="heading">Your music</T>
            {files.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => {
                  logMusicRecent(files[0].id);
                  void playTracks(files.map(fileTrack), 0);
                }}>
                <T v="small" style={{ textDecorationLine: "underline" }}>{`Play all ${files.length}`}</T>
              </Pressable>
            ) : null}
          </View>
          {myMusic.length === 0 && !adding ? (
            <T v="small" soft>Add the songs or playlists that help you: a link from Spotify, YouTube Music or JioSaavn, or a song saved on this phone. They stay on this phone.</T>
          ) : null}

          {myMusic.map((m) =>
            editing === m.id ? (
              <EditTrack key={m.id} t={t} track={m} onDone={() => setEditing(null)} />
            ) : (
              <TrackRow
                key={m.id}
                t={t}
                track={m}
                active={player.activeSoundId === m.id}
                playing={player.activeSoundId === m.id && player.isPlaying}
                onPress={() => playMine(m)}
                onEdit={() => setEditing(m.id)}
              />
            ),
          )}

          {adding ? (
            <AddLink t={t} onDone={() => setAdding(false)} />
          ) : (
            <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
              <View style={{ flexGrow: 1, flexBasis: 140 }}>
                <Button kind="secondary" icon="plus" label="Add a link" onPress={() => setAdding(true)} />
              </View>
              <View style={{ flexGrow: 1, flexBasis: 140 }}>
                <Button
                  kind="secondary"
                  icon="music"
                  label="Add from phone"
                  onPress={async () => {
                    setNote("");
                    const r = await addTrackFromPhone();
                    if (!r.ok && r.reason === "too-big") setNote("That file is over 60 MB. Pick a smaller song.");
                    if (!r.ok && r.reason === "failed") setNote("Couldn't add that file. Try another one.");
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* 2. Built-in sounds */}
        <View style={{ gap: space.sm }}>
          <T v="heading">Calming sounds</T>
          <T v="small" soft>Made by MAX, no lyrics, play offline and with the screen locked.</T>
          {sounds.map((s) => {
            const active = player.activeSoundId === s.id;
            return (
              <Row
                key={s.id}
                t={t}
                icon={active && player.isPlaying ? "pause" : "play"}
                title={s.title}
                sub={s.description}
                active={active}
                onPress={() => (active ? togglePause() : playSound(s.id))}
                label={active && player.isPlaying ? `Pause ${s.title}` : `Play ${s.title}`}
              />
            );
          })}
        </View>

        {/* 3. Picks for today */}
        <View style={{ gap: space.sm }}>
          <T v="heading">For you right now</T>
          <T v="small" soft>Chosen from your recent check-ins and the time of day.</T>
          <Choice options={needs.map((n) => ({ label: NEED_SHORT[n], value: n }))} value={need} onChange={setNeed} />
          <T soft>{NEED_LABELS[need].hint}</T>
          {myMusic
            .filter((m) => m.need === need)
            .map((m) => (
              <TrackRow key={`for-${m.id}`} t={t} track={m} active={player.activeSoundId === m.id} playing={player.activeSoundId === m.id && player.isPlaying} onPress={() => playMine(m)} />
            ))}
          {sounds
            .filter((s) => s.need === need)
            .map((s) => (
              <Row key={`fs-${s.id}`} t={t} icon="play" title={s.title} sub="Built-in sound" active={player.activeSoundId === s.id} onPress={() => playSound(s.id)} label={`Play ${s.title}`} />
            ))}
          {shownApps.map((app) => (
            <PlatformPlaylists key={app} t={t} app={app} list={playlists.filter((p) => p.need === need && p.platform === app)} onOpen={(p) => openLink(p.id, p.url, p.platform === "spotify")} />
          ))}
        </View>

        {/* 4. Preference */}
        <View style={{ gap: space.sm }}>
          <T v="heading">Music apps I use</T>
          <T v="small" soft>Only playlists for these apps are shown. Nothing is linked to your account.</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {(Object.keys(APP_LABELS) as MusicApp[]).map((app) => {
              const on = musicApps.includes(app);
              return (
                <Pressable
                  key={app}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => update((s) => ({ musicApps: on ? s.musicApps.filter((a) => a !== app) : [...s.musicApps, app] }))}
                  style={[styles.toggle, { borderColor: on ? t.ink : t.rule, backgroundColor: on ? t.ink : t.paper }]}>
                  <T v="small" style={{ color: on ? t.paper : t.ink, fontWeight: "600" }}>{APP_LABELS[app]}</T>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 5. Recent */}
        {recent.length ? (
          <View style={{ gap: space.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <T v="heading">Recently played</T>
              <Pressable accessibilityRole="button" hitSlop={12} onPress={() => update(() => ({ musicRecent: [] }))}>
                <T v="small" soft style={{ textDecorationLine: "underline" }}>Clear</T>
              </Pressable>
            </View>
            {recent.map((r) =>
              "addedAt" in r ? (
                <TrackRow key={`r-${r.id}`} t={t} track={r} active={player.activeSoundId === r.id} playing={player.activeSoundId === r.id && player.isPlaying} onPress={() => playMine(r)} />
              ) : (
                <Row key={`r-${r.id}`} t={t} icon="music" title={r.title} sub={APP_LABELS[r.platform]} onPress={() => openLink(r.id, r.url, r.platform === "spotify")} label={`Open ${r.title}`} />
              ),
            )}
          </View>
        ) : null}

        <View style={[styles.footer, { borderColor: t.rule }]}>
          <T v="small" soft style={{ textAlign: "center" }}>
            Music can help you relax or focus; it isn't a replacement for care. Free 24×7 helpline: Tele-MANAS 14416.
          </T>
        </View>
      </View>
    </Page>
  );
}

const FOCUS_SOUNDS = sounds.map((s) => ({ label: s.title.replace(" Noise", ""), value: s.id }));

/** A study session: one calm sound for 25 or 50 minutes, then a soft bell and a break. */
function FocusSession({ t, highlight }: { t: Theme; highlight: boolean }) {
  const p = useSoundPlayer();
  const [minutes, setMinutes] = useState(25);
  const [sound, setSound] = useState("brown-noise");
  const left = p.focusRemaining ?? 0;

  if (p.focusDone) {
    return (
      <View style={[styles.card, { borderColor: t.ink, backgroundColor: t.raised, gap: space.sm }]}>
        <T v="heading">Session done. Nice work.</T>
        <T soft>Take a 5-minute break: stand up, stretch, drink some water. Then start another if you like.</T>
        <HelpedPrompt tool="focus" />
        <Button kind="quiet" label="Close" onPress={dismissFocusDone} />
      </View>
    );
  }
  if (p.focusEndAt) {
    return (
      <View style={[styles.card, { borderColor: t.ink, backgroundColor: t.raised, gap: space.sm }]}>
        <T v="small" soft>Focus session</T>
        <T v="display">{`${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}</T>
        <T soft>{`${p.activeTitle ?? "Sound"} · phone face down helps`}</T>
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button kind="secondary" label={p.isPlaying ? "Pause sound" : "Play sound"} onPress={togglePause} />
          </View>
          <View style={{ flex: 1 }}>
            <Button kind="quiet" label="End session" onPress={endFocus} />
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.card, { borderColor: highlight ? t.ink : t.rule, backgroundColor: t.raised, gap: space.sm }]}>
      <T v="heading">Focus session</T>
      <T v="small" soft>A calm sound while you study, then a soft bell. Works offline.</T>
      <NumberField label="Focus length" items={FOCUS_MINUTES} value={minutes} onChange={setMinutes} />
      <Choice fill options={FOCUS_SOUNDS} value={sound} onChange={setSound} />
      <Button label={`Start ${minutes} minutes`} onPress={() => void startFocus(minutes, sound)} />
    </View>
  );
}

function NowPlaying({ t }: { t: Theme }) {
  const p = useSoundPlayer();
  const remaining = p.remainingSeconds ? `${Math.floor(p.remainingSeconds / 60)}:${String(p.remainingSeconds % 60).padStart(2, "0")}` : null;
  return (
    <View style={[styles.card, { borderColor: t.ink, backgroundColor: t.raised, gap: space.sm }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="small" soft>{p.isPlaying ? "Now playing" : "Paused"}</T>
          <T v="heading" numberOfLines={1}>{p.activeTitle ?? "Sound"}</T>
        </View>
        <IconButton t={t} icon={p.isPlaying ? "pause" : "play"} label={p.isPlaying ? "Pause" : "Play"} onPress={togglePause} filled />
        {p.canNext ? <IconButton t={t} icon="arrow-right" label="Next track" onPress={() => void next()} /> : null}
        <IconButton t={t} icon="x" label="Stop" onPress={stopSound} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.xs }}>
        <T v="small" soft style={{ marginRight: 2 }}>Sleep timer</T>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Choice fill options={[{ label: "On", value: 1 }, { label: "Off", value: 0 }]} value={p.timerMinutes == null ? 0 : 1} onChange={(v) => setTimer(v ? 30 : null)} />
        </View>
        {remaining ? <T v="small" soft>{`fades out in ${remaining}`}</T> : null}
      </View>
      {p.timerMinutes != null ? (
        <NumberField label="Sleep timer" items={TIMER_MINUTES} value={p.timerMinutes} onChange={(m) => setTimer(m)} />
      ) : null}
    </View>
  );
}

function IconButton({ t, icon, label, onPress, filled }: { t: Theme; icon: DoodleIconName; label: string; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, { borderColor: t.rule, backgroundColor: filled ? t.ink : t.paper, opacity: pressed ? 0.7 : 1 }]}>
      <DoodleIcon name={icon} size={18} color={filled ? t.paper : t.ink} />
    </Pressable>
  );
}

function Row({
  t,
  icon,
  title,
  sub,
  active,
  onPress,
  onEdit,
  label,
}: {
  t: Theme;
  icon: DoodleIconName;
  title: string;
  sub?: string;
  active?: boolean;
  onPress: () => void;
  onEdit?: () => void;
  label: string;
}) {
  return (
    <View style={[styles.card, { flexDirection: "row", alignItems: "center", gap: space.sm, borderColor: active ? t.ink : t.rule, backgroundColor: t.raised }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <View style={[styles.iconBtn, { borderColor: t.rule, backgroundColor: active ? t.ink : t.paper }]}>
          <DoodleIcon name={icon} size={18} color={active ? t.paper : t.ink} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T numberOfLines={1} style={{ fontWeight: "600" }}>{title}</T>
          {sub ? <T v="small" soft numberOfLines={2}>{sub}</T> : null}
        </View>
      </Pressable>
      {onEdit ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${title}`} hitSlop={12} onPress={onEdit}>
          <DoodleIcon name="edit-3" size={16} color={t.ink2} />
        </Pressable>
      ) : null}
    </View>
  );
}

function TrackRow({ t, track, active, playing, onPress, onEdit }: { t: Theme; track: MyTrack; active: boolean; playing: boolean; onPress: () => void; onEdit?: () => void }) {
  const isLink = track.kind === "link";
  const sub = [isLink ? `Opens in ${PLATFORM_LABELS[track.platform ?? "other"]}` : "On this phone", track.need ? NEED_SHORT[track.need] : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <Row
      t={t}
      icon={isLink ? "share" : playing ? "pause" : "play"}
      title={track.title}
      sub={sub}
      active={active}
      onPress={onPress}
      onEdit={onEdit}
      label={isLink ? `Open ${track.title}` : playing ? `Pause ${track.title}` : `Play ${track.title}`}
    />
  );
}

function NeedPicker({ value, onChange }: { value?: Need; onChange: (n?: Need) => void }) {
  return (
    <Choice
      options={[{ label: "None", value: "none" as const }, ...NEED_ORDER.map((n) => ({ label: NEED_SHORT[n], value: n }))]}
      value={value ?? "none"}
      onChange={(v) => onChange(v === "none" ? undefined : (v as Need))}
    />
  );
}

function AddLink({ t, onDone }: { t: Theme; onDone: () => void }) {
  const [raw, setRaw] = useState("");
  const [title, setTitle] = useState("");
  const [need, setNeed] = useState<Need>();
  const [looking, setLooking] = useState(false);
  const url = useMemo(() => cleanLink(raw), [raw]);

  // Fill the title from Spotify / YouTube once a valid link is pasted (only if the student hasn't typed one).
  useEffect(() => {
    if (!url) return;
    let live = true;
    const cached = oembedCache.get(url);
    if (cached) {
      setTitle((cur) => cur || cached);
      return;
    }
    // wait until typing settles, so a link typed letter by letter is looked up once
    const timer = setTimeout(() => {
      setLooking(true);
      lookUpTitle(url).then((found) => {
        if (!live) return;
        setLooking(false);
        if (found) {
          oembedCache.set(url, found);
          setTitle((cur) => cur || found);
        }
      });
    }, 600);
    return () => {
      live = false;
      clearTimeout(timer);
      setLooking(false);
    };
  }, [url]);

  return (
    <View style={[styles.card, { borderColor: t.ink, backgroundColor: t.raised, gap: space.sm }]}>
      <T v="heading">Add a song or playlist link</T>
      <T v="small" soft>In Spotify, YouTube Music or JioSaavn tap Share → Copy link, then paste it here.</T>
      <Field value={raw} maxLength={500} onChangeText={setRaw} placeholder="Paste link" autoCapitalize="none" autoCorrect={false} autoComplete="off" spellCheck={false} keyboardType="url" accessibilityLabel="Link" />
      {raw.length > 5 && !url ? <T v="small" style={{ color: t.help }}>That doesn't look like a link yet.</T> : null}
      <Field value={title} onChangeText={setTitle} placeholder={looking ? "Finding the name…" : "Name (e.g. My study mix)"} maxLength={120} accessibilityLabel="Name" />
      <T v="small" soft>Good for (optional)</T>
      <NeedPicker value={need} onChange={setNeed} />
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            label="Save"
            disabled={!url}
            onPress={() => {
              if (!url) return;
              addLink(url, title, need);
              onDone();
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button kind="quiet" label="Cancel" onPress={onDone} />
        </View>
      </View>
    </View>
  );
}

function EditTrack({ t, track, onDone }: { t: Theme; track: MyTrack; onDone: () => void }) {
  const [title, setTitle] = useState(track.title);
  const [need, setNeed] = useState<Need | undefined>(track.need);
  return (
    <View style={[styles.card, { borderColor: t.ink, backgroundColor: t.raised, gap: space.sm }]}>
      <Field value={title} onChangeText={setTitle} maxLength={120} accessibilityLabel="Name" />
      <T v="small" soft>Good for</T>
      <NeedPicker value={need} onChange={setNeed} />
      <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
        <View style={{ flexGrow: 1, flexBasis: 90 }}>
          <Button
            label="Save"
            onPress={() => {
              editTrack(track.id, { title, need });
              onDone();
            }}
          />
        </View>
        <View style={{ flexGrow: 1, flexBasis: 90 }}>
          <Button
            kind="danger"
            icon="trash-2"
            label="Remove"
            onPress={() =>
              showAlert("Remove from your music?", track.kind === "file" ? "The copy MAX kept of this song is deleted. The original on your phone is not touched." : undefined, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Remove",
                  style: "destructive",
                  onPress: async () => {
                    if (track.kind === "file") stopSound();
                    await removeTrack(track.id);
                    onDone();
                  },
                },
              ])
            }
          />
        </View>
        <View style={{ flexGrow: 1, flexBasis: 90 }}>
          <Button kind="quiet" label="Cancel" onPress={onDone} />
        </View>
      </View>
    </View>
  );
}

function PlatformPlaylists({ t, app, list, onOpen }: { t: Theme; app: MusicApp; list: Playlist[]; onOpen: (p: Playlist) => void }) {
  const [covers, setCovers] = useState<Record<string, string>>({});
  useEffect(() => {
    if (app !== "spotify") return;
    let live = true;
    for (const p of list) {
      const hit = oembedCache.get(`cover:${p.url}`);
      if (hit) {
        setCovers((c) => ({ ...c, [p.id]: hit }));
        continue;
      }
      fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(p.url)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!live || !d?.thumbnail_url) return;
          oembedCache.set(`cover:${p.url}`, d.thumbnail_url);
          setCovers((c) => ({ ...c, [p.id]: d.thumbnail_url }));
        })
        .catch(() => {});
    }
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, list.map((p) => p.id).join(",")]);

  if (!list.length) return null;
  return (
    // Spotify content stays in its own row with the Spotify wording (Spotify design guidelines).
    <View style={{ gap: space.xs }}>
      <T v="small" soft style={{ fontWeight: "600", letterSpacing: 0.5 }}>{APP_LABELS[app].toUpperCase()}</T>
      {list.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={`${p.title}, open in ${APP_LABELS[app]}`}
          onPress={() => onOpen(p)}
          style={({ pressed }) => [styles.card, { flexDirection: "row", alignItems: "center", gap: space.sm, borderColor: t.rule, backgroundColor: t.paper, opacity: pressed ? 0.75 : 1 }]}>
          {covers[p.id] ? (
            <Image source={{ uri: covers[p.id] }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, { borderWidth: 1, borderColor: t.rule, alignItems: "center", justifyContent: "center" }]}>
              <DoodleIcon name="music" size={16} color={t.ink2} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <T numberOfLines={1} style={{ fontWeight: "600" }}>{p.title}</T>
            <T v="small" soft>{p.language === "hi" ? "Hindi" : p.language === "instrumental" ? "Instrumental" : "Playlist"}</T>
          </View>
          {app === "spotify" ? (
            <View style={[styles.spotify, { borderColor: t.ink }]}>
              <T v="small" style={{ fontSize: 10, fontWeight: "700" }}>PLAY ON SPOTIFY</T>
            </View>
          ) : (
            <DoodleIcon name="chevron-right" size={16} color={t.ink2} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.sm, borderRadius: radius.md, borderWidth: 1 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pill: { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1 },
  toggle: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill, borderWidth: 1 },
  cover: { width: 44, height: 44, borderRadius: 4 },
  spotify: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4, borderWidth: 1 },
  footer: { padding: space.md, borderRadius: radius.sm, borderWidth: 1 },
});
