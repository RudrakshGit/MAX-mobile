import React, { useState } from "react";
import { Chip } from "@/ui/sketch/Chip";
import { BUTTON_RADIUS } from "@/ui/sketch/Button";
import { View, StyleSheet, Pressable, Linking, ScrollView, Image } from "react-native";
import { Stack } from "expo-router";
import { resources, TOPIC_NAMES, type Resource } from "@/content/resources";
import { radius, space, useTheme } from "@/lib/theme";
import { Field, Page, T, openWebUrl } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { Frame } from "@/ui/sketch/Frame";

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return m ? m[1] : null;
}

export default function LibraryScreen() {
  const t = useTheme();
  const [mode, setMode] = useState<"video" | "article">("video");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Hindi and Hinglish together: most students here watch both.
  const [hindiOnly, setHindiOnly] = useState(false);

  const topics = [
    { label: "All topics", value: "all" },
    ...Object.entries(TOPIC_NAMES).map(([val, label]) => ({
      label,
      value: val,
    })),
  ];

  const okResources = resources.filter((r) => r.status === "ok");
  const videoCount = okResources.filter((r) => r.kind === "video").length;
  const articleCount = okResources.filter((r) => r.kind === "article").length;

  const q = searchQuery.trim().toLowerCase();
  const filteredResources = okResources.filter((r) => {
    if (r.kind !== mode) return false;
    if (selectedTopic !== "all" && r.topic !== selectedTopic) return false;
    if (hindiOnly && r.language === "en") return false;
    if (q.length > 0) {
      const topicName = TOPIC_NAMES[r.topic]?.toLowerCase() ?? "";
      const matchesTitle = r.title.toLowerCase().includes(q);
      const matchesCreator = r.creator.toLowerCase().includes(q);
      const matchesTopic = topicName.includes(q) || r.topic.toLowerCase().includes(q);
      const matchesLanguage = (q === "hindi" || q === "हिंदी") && r.language !== "en";
      return matchesTitle || matchesCreator || matchesTopic || matchesLanguage;
    }
    return true;
  });

  const openResource = (r: Resource) => {
    if (r.url.includes("youtube.com") || r.url.includes("youtu.be")) {
      Linking.openURL(r.url).catch(() => openWebUrl(r.url));
    } else {
      openWebUrl(r.url);
    }
  };

  const getHostname = (url: string) => {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return "web";
    }
  };

  return (
    <Page>
      <Stack.Screen options={{ title: "Watch & read" }} />

      <View style={{ gap: space.md, paddingBottom: space.xl }}>
        {/* Header Header Info */}
        <View style={{ gap: space.xs }}>
          <T v="title">Curated mental health library</T>
          <T soft>
            Vetted videos and evidence-based clinical articles from verified institutions (WHO, NHS, NIMHANS, Mind) and licensed clinicians.
          </T>
        </View>

        {/* Watch vs Read Segment Selector */}
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "video" }}
            accessibilityLabel={`Watch videos, ${videoCount} available`}
            onPress={() => setMode("video")}
            style={{ flex: 1 }}
          >
            <View
              style={[styles.tabButton, { borderRadius: BUTTON_RADIUS, borderWidth: 1.5, backgroundColor: mode === "video" ? t.ink : t.raised, borderColor: mode === "video" ? t.ink : t.rule }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <DoodleIcon name="play" size={16} color={mode === "video" ? t.inverseInk : t.ink} />
                <T v="heading" style={{ fontSize: 14, color: mode === "video" ? t.inverseInk : t.ink }}>{`Watch (${videoCount})`}</T>
              </View>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "article" }}
            accessibilityLabel={`Read articles, ${articleCount} available`}
            onPress={() => setMode("article")}
            style={{ flex: 1 }}
          >
            <View
              style={[styles.tabButton, { borderRadius: BUTTON_RADIUS, borderWidth: 1.5, backgroundColor: mode === "article" ? t.ink : t.raised, borderColor: mode === "article" ? t.ink : t.rule }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <DoodleIcon name="book" size={16} color={mode === "article" ? t.inverseInk : t.ink} />
                <T v="heading" style={{ fontSize: 14, color: mode === "article" ? t.inverseInk : t.ink }}>{`Read (${articleCount})`}</T>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Search Input */}
        <Field
          value={searchQuery}
          maxLength={80}
          onChangeText={setSearchQuery}
          placeholder={`Search ${mode === "video" ? "videos" : "articles"}`}
          accessibilityLabel="Search library"
        />

        {/* Language filter */}
        <View style={{ flexDirection: "row" }}>
          <Chip
            id="lang-hindi"
            label={hindiOnly ? "हिंदी / Hinglish ✓" : "हिंदी / Hinglish"}
            selected={hindiOnly}
            role="checkbox"
            onPress={() => setHindiOnly((v) => !v)}
          />
        </View>

        {/* Horizontal Topic Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {topics.map((item) => (
            <Chip
              key={item.value}
              id={`topic-${item.value}`}
              label={item.label}
              selected={selectedTopic === item.value}
              onPress={() => setSelectedTopic(item.value)}
            />
          ))}
        </ScrollView>

        {/* Resources Count */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <T v="small" soft>
            {`Showing ${filteredResources.length} ${mode === "video" ? "videos" : "articles"}`}
          </T>
          {searchQuery.trim().length > 0 || selectedTopic !== "all" || hindiOnly ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => {
                setSearchQuery("");
                setSelectedTopic("all");
                setHindiOnly(false);
              }}
            >
              <T v="small" style={{ color: t.ink, textDecorationLine: "underline" }}>
                Reset filters
              </T>
            </Pressable>
          ) : null}
        </View>

        {/* Empty State */}
        {filteredResources.length === 0 ? (
          <Frame
            id="lib-empty"
            fill
            fillColor={t.paper}
            strokeColor={t.rule}
            style={styles.emptyBox}
          >
            <DoodleIcon name="compass" size={28} color={t.ink2} />
            <T v="heading" style={{ textAlign: "center" }}>No results found</T>
            <T soft style={{ textAlign: "center" }}>
              Try searching with another keyword or pick &quot;All topics&quot;.
            </T>
          </Frame>
        ) : null}

        {/* Resource Cards */}
        <View style={{ gap: space.sm }}>
          {filteredResources.map((r) => {
            const ytId = getYouTubeId(r.url);
            const domain = getHostname(r.url);

            if (mode === "video") {
              return (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.title}, by ${r.creator}`}
                  onPress={() => openResource(r)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  <Frame
                    id={`lib-${r.id}`}
                    fill
                    fillColor={t.raised}
                    strokeColor={t.rule}
                    style={styles.videoCard}
                  >
                    {/* YouTube Video Thumbnail */}
                    {ytId ? (
                      <View style={[styles.thumbnailWrap, { backgroundColor: t.paper, borderColor: t.rule }]}>
                        <Image
                          source={{ uri: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` }}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                        <View style={[styles.playBadge, { backgroundColor: t.ink }]}>
                          <DoodleIcon name="play" size={16} color={t.paper} />
                        </View>
                        {r.minutes ? (
                          <View style={[styles.durationPill, { backgroundColor: t.ink }]}>
                            <T v="small" style={{ color: t.paper, fontSize: 10, fontWeight: "600" }}>
                              {`${r.minutes} min`}
                            </T>
                          </View>
                        ) : null}
                      </View>
                    ) : (
                      <View style={[styles.iconThumbnail, { backgroundColor: t.paper, borderColor: t.rule }]}>
                        <DoodleIcon name="play" size={32} color={t.ink} />
                        {r.minutes ? (
                          <View style={[styles.durationPill, { backgroundColor: t.ink }]}>
                            <T v="small" style={{ color: t.paper, fontSize: 10, fontWeight: "600" }}>
                              {`${r.minutes} min`}
                            </T>
                          </View>
                        ) : null}
                      </View>
                    )}

                    {/* Video Info */}
                    <View style={{ gap: 4, paddingHorizontal: space.xs, paddingBottom: space.xs }}>
                      <View style={{ flexDirection: "row", gap: space.xs, flexWrap: "wrap", alignItems: "center" }}>
                        <View style={[styles.badge, { borderColor: t.rule }]}>
                          <T v="small" soft style={{ fontSize: 10 }}>
                            {r.credential.toUpperCase()}
                          </T>
                        </View>
                        <View style={[styles.badge, { borderColor: t.rule }]}>
                          <T v="small" soft style={{ fontSize: 10 }}>
                            {r.language === "hi" ? "HINDI" : r.language === "hinglish" ? "HINGLISH" : "ENGLISH"}
                          </T>
                        </View>
                        <View style={[styles.badge, { borderColor: t.rule }]}>
                          <T v="small" soft style={{ fontSize: 10 }}>
                            {TOPIC_NAMES[r.topic] ?? r.topic}
                          </T>
                        </View>
                      </View>

                      <T v="heading" numberOfLines={2} style={{ fontSize: 15, lineHeight: 20 }}>
                        {r.title}
                      </T>
                      <T v="small" soft>{`By ${r.creator}`}</T>

                      <View style={[styles.cardFooter, { borderTopColor: t.rule }]}>
                        <T v="small" style={{ color: t.ink, fontWeight: "600" }}>
                          {ytId ? "Watch on YouTube" : `Watch on ${domain}`}
                        </T>
                        <DoodleIcon name="chevron-right" size={14} color={t.ink} />
                      </View>
                    </View>
                  </Frame>
                </Pressable>
              );
            }

            // Article Cards
            return (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                accessibilityLabel={`${r.title}, by ${r.creator}`}
                onPress={() => openResource(r)}
                style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
              >
                <Frame
                  id={`lib-${r.id}`}
                  fill
                  fillColor={t.raised}
                  strokeColor={t.rule}
                  style={styles.articleCard}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm }}>
                    <View style={[styles.iconBox, { backgroundColor: t.paper }]}>
                      <DoodleIcon name="book" size={20} color={t.ink} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: "row", gap: space.xs, flexWrap: "wrap", alignItems: "center" }}>
                        <View style={[styles.badge, { borderColor: t.rule }]}>
                          <T v="small" soft style={{ fontSize: 10 }}>
                            {r.credential.toUpperCase()}
                          </T>
                        </View>
                        <View style={[styles.badge, { borderColor: t.rule }]}>
                          <T v="small" soft style={{ fontSize: 10 }}>
                            {r.language === "hi" ? "HINDI" : r.language === "hinglish" ? "HINGLISH" : "ENGLISH"}
                          </T>
                        </View>
                        {r.minutes ? (
                          <T v="small" soft style={{ fontSize: 10 }}>{`${r.minutes} min read`}</T>
                        ) : null}
                      </View>

                      <T v="heading" numberOfLines={2} style={{ fontSize: 15, lineHeight: 20 }}>
                        {r.title}
                      </T>
                      <T v="small" soft>{`By ${r.creator}`}</T>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <T v="small" style={{ color: t.ink, fontWeight: "600" }}>
                          {`Read on ${domain}`}
                        </T>
                        <DoodleIcon name="chevron-right" size={14} color={t.ink} />
                      </View>
                    </View>
                  </View>
                </Frame>
              </Pressable>
            );
          })}
        </View>

        {/* Integrity note */}
        <Frame
          id="lib-note"
          fill
          fillColor={t.paper}
          strokeColor={t.rule}
          style={styles.noteBox}
        >
          <T v="small" soft>
            Every resource is clinician-reviewed and checked before release. If you find a broken or unhelpful link, report it to our college development team.
          </T>
        </Frame>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  videoCard: {
    padding: space.sm,
    gap: space.xs,
  },
  articleCard: {
    padding: space.md,
  },
  thumbnailWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.sm,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  iconThumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  playBadge: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.9,
  },
  durationPill: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    opacity: 0.9,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: space.xs,
    borderTopWidth: 1,
    marginTop: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  emptyBox: {
    padding: space.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
  },
  noteBox: {
    marginTop: space.lg,
    padding: space.md,
  },
});
