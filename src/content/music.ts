export type Need = "calm" | "anxiety" | "focus" | "sleep" | "noise" | "uplift";

export type Playlist = {
  id: string;
  need: Need;
  platform: "spotify" | "ytmusic" | "jiosaavn";
  title: string;
  url: string;
  language?: "en" | "hi" | "instrumental";
};

export const playlists: Playlist[] = [
  // --- Calm ---
  {
    id: "sp-calm-peaceful-piano",
    need: "calm",
    platform: "spotify",
    title: "Peaceful Piano",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
    language: "instrumental",
  },
  {
    id: "ytm-calm-classical",
    need: "calm",
    platform: "ytmusic",
    title: "Classical Calm & Focus",
    url: "https://music.youtube.com/playlist?list=RDCLAK5uy_kfd5Wn3L0Yg420KvhW-N90k3tE7rFzX2c",
    language: "instrumental",
  },
  {
    id: "jio-calm-lofi-india",
    need: "calm",
    platform: "jiosaavn",
    title: "Lofi India Hits",
    url: "https://www.jiosaavn.com/featured/lofi-india-hits/GgjOqTwtdqcZNLR,rP3WSg__",
    language: "hi",
  },

  // --- Focus ---
  {
    id: "sp-focus-deep",
    need: "focus",
    platform: "spotify",
    title: "Deep Focus",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ",
    language: "instrumental",
  },
  {
    id: "ytm-focus-ambient",
    need: "focus",
    platform: "ytmusic",
    title: "Deep Focus & Study",
    url: "https://music.youtube.com/playlist?list=RDCLAK5uy_kPxZfn8rL6R_u-QdJ5B7iT76aL47hWwI4",
    language: "instrumental",
  },
  {
    id: "jio-focus-ratta-maar",
    need: "focus",
    platform: "jiosaavn",
    title: "Ratta Maar: Study Mode On",
    url: "https://www.jiosaavn.com/featured/ratta-maar-study-mode-on-/rbL2nYJe0iYGSw2I1RxdhQ__",
    language: "hi",
  },

  // --- Sleep ---
  {
    id: "sp-sleep-night",
    need: "sleep",
    platform: "spotify",
    title: "Sleep",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp",
    language: "instrumental",
  },
  {
    id: "ytm-sleep-rain",
    need: "sleep",
    platform: "ytmusic",
    title: "Night Rain & Calm",
    url: "https://music.youtube.com/playlist?list=RDCLAK5uy_l2w7g7a9i8b3M0c7h6y8c3u9i3j8b2c1a",
    language: "instrumental",
  },
  {
    id: "jio-sleep-sound",
    need: "sleep",
    platform: "jiosaavn",
    title: "Sound Sleep",
    url: "https://www.jiosaavn.com/featured/sound-sleep/1d-Hwyu1PMg_",
    language: "instrumental",
  },

  // --- Anxiety / De-stress ---
  {
    id: "sp-anxiety-calm-vibes",
    need: "anxiety",
    platform: "spotify",
    title: "Calm Vibes",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX1s9knjP51Oa",
    language: "instrumental",
  },
  {
    id: "ytm-anxiety-lofi",
    need: "anxiety",
    platform: "ytmusic",
    title: "Chill Lofi Beats",
    url: "https://music.youtube.com/playlist?list=PL4fGSIFgk54UXn9lK3RfvE67n_8v-oXG1",
    language: "instrumental",
  },
  {
    id: "jio-anxiety-meditation",
    need: "anxiety",
    platform: "jiosaavn",
    title: "Meditation Mantra",
    url: "https://www.jiosaavn.com/featured/meditation-mantra/t4nL5GqrnmTwwwnaDll-Rw__",
    language: "hi",
  },

  // --- Uplift ---
  {
    id: "sp-uplift-mood-booster",
    need: "uplift",
    platform: "spotify",
    title: "Mood Booster",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0",
    language: "en",
  },
  {
    id: "ytm-uplift-morning",
    need: "uplift",
    platform: "ytmusic",
    title: "Gentle Morning Energy",
    url: "https://music.youtube.com/playlist?list=RDCLAK5uy_n3L5RkF6Z9W8p1e7Q3p0d9a6r2m5t8y1u",
    language: "en",
  },
  {
    id: "jio-uplift-chill-maaro",
    need: "uplift",
    platform: "jiosaavn",
    title: "Chill Maaro: Lo-Fi Mix",
    url: "https://www.jiosaavn.com/featured/chill-maaro-lo-fi-mix/mAA3xzx2Asqm0KYf4sgO,Q__",
    language: "hi",
  },

  // --- Noise ---
  {
    id: "sp-noise-white",
    need: "noise",
    platform: "spotify",
    title: "White Noise 10 Hours",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWUZ5bk6qqDSy",
    language: "instrumental",
  },
  {
    id: "ytm-noise-ambient",
    need: "noise",
    platform: "ytmusic",
    title: "Study Beats & White Noise",
    url: "https://music.youtube.com/playlist?list=PL4fGSIFgk54Vv_p6wA5b2Q3M8t0_k6k-d",
    language: "instrumental",
  },
  {
    id: "jio-noise-ambient-sleep",
    need: "noise",
    platform: "jiosaavn",
    title: "Ambient Sleep",
    url: "https://www.jiosaavn.com/featured/ambient-sleep/D6rHI8uAehtFo9wdEAzFBA__",
    language: "instrumental",
  },
];

export const NEED_LABELS: Record<Need, { title: string; hint: string }> = {
  calm: { title: "Calm & steady", hint: "Gentle instrumental melodies to soothe tension" },
  anxiety: { title: "Ease anxiety", hint: "Grounding rhythms to slow racing thoughts" },
  focus: { title: "Deep study focus", hint: "Distraction-free sounds for concentration" },
  sleep: { title: "Bedtime wind-down", hint: "Quiet frequencies to ease into restful sleep" },
  noise: { title: "Sound masks", hint: "Consistent noise to block out room & campus chatter" },
  uplift: { title: "Gentle uplift", hint: "Warm acoustic tracks to lighten low energy" },
};
