import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { fetchDailyInsight } from "@/lib/api";
import { hasRecentCrisis, insightSignals, isTemplateLabel } from "@/lib/insights";
import { today, update, useStore, type Insight } from "@/lib/store";
import { font, radius, space, useTheme } from "@/lib/theme";
import { Stack } from "expo-router";
import { Button, call, Screen, Section, T } from "@/lib/ui";
import { INSIGHT_THEMES } from "@/server/insightThemes";
import { pickTheme } from "@/server/pickTheme";
import { Frame } from "@/ui/sketch/Frame";

export default function InsightScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ date?: string }>();
  const currentDate = params.date || today();
  const state = useStore((s) => s);
  const existing = state.insights.find((i) => i.date === currentDate);

  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState<Insight | null>(null);
  const isCrisis = hasRecentCrisis(state);

  useEffect(() => {
    if (existing || isCrisis) return;

    let mounted = true;
    setLoading(true);

    async function load() {
      const signals = insightSignals(state, currentDate);
      let article: Insight | null = null;

      // The reflection uses only check-in averages and test ranges (never journal text): the same data the
      // student agreed Max may use in onboarding ("What your companion knows" in Settings).
      if (state.shareContext) {
        article = await fetchDailyInsight(signals);
      }
      const fromAi = !!article;

      // Offline or switched off: a written article chosen from the student's own numbers.
      if (!article) {
        const avoid = new Set(signals.avoidTitles);
        const eligible = INSIGHT_THEMES.filter((th) => !avoid.has(th.title));
        const theme = pickTheme(signals, eligible.length ? eligible : INSIGHT_THEMES);
        article = {
          date: currentDate,
          title: theme.title,
          sections: [...theme.sections],
        };
      }

      if (mounted && article) {
        // Replace {name} placeholder
        const name = state.displayName?.trim() || "";
        const cleanArticle: Insight = {
          date: currentDate,
          title: article.title,
          sections: article.sections.map((s) => ({
            tag: s.tag,
            heading: s.heading,
            body: s.body.replace(/\{name\}/g, name),
          })),
        };

        if (fromAi) {
          update((s) => {
            const list = [cleanArticle, ...s.insights.filter((i) => i.date !== currentDate)].slice(0, 60);
            return { ...s, insights: list };
          });
        } else {
          // not saved, so the personal version is fetched next time the student is online
          setFallback(cleanArticle);
        }
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [currentDate, existing, isCrisis]);

  const article = existing ?? fallback;

  const rightButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Past reflections"
      onPress={() => router.push("/profile/insights" as Href)}
      style={{
        paddingHorizontal: space.sm,
        paddingVertical: space.xs,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: t.rule,
        backgroundColor: t.raised,
      }}>
      <T v="small">History</T>
    </Pressable>
  );

  if (isCrisis) {
    return (
      <Screen title="Support first" right={rightButton}>
        <Stack.Screen options={{ title: "Support first" }} />
        <Frame
          id="insight-crisis-card"
          fill
          fillColor={t.paper}
          strokeColor={t.help}
          strokeWidth={2}
          style={{
            marginTop: space.md,
            padding: space.lg,
            gap: space.md,
          }}>
          <T v="heading">Talk to someone today</T>
          <T soft>
            You have been carrying something heavy recently. A personal insight article isn't what is needed
            right now. You don't have to carry this alone.
          </T>
          <View style={{ gap: space.sm, marginTop: space.sm }}>
            <Button
              kind="danger"
              icon="phone"
              label="Call Tele-MANAS (14416)"
              onPress={() => call("14416")}
            />
            <Button
              kind="quiet"
              label="Campus & urgent resources"
              onPress={() => router.push("/help")}
            />
          </View>
        </Frame>
      </Screen>
    );
  }

  return (
    <Screen
      title={article ? article.title : "Daily insight"}
      right={rightButton}>
      <Stack.Screen options={{ title: article ? "Read" : "Daily insight" }} />
      <T soft style={{ marginTop: -space.sm, marginBottom: space.md }}>
        {new Date(currentDate + "T12:00:00").toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </T>

      {loading && !article ? (
        <View style={{ padding: space.xl, alignItems: "center" }}>
          <T soft>Gathering your daily reflection...</T>
        </View>
      ) : null}

      {article ? (
        <View style={{ gap: space.lg, paddingBottom: space.xl }}>
          {article.sections.map((sec, idx) => (
            <Frame
              key={idx}
              id={`insight-sec-${idx}`}
              fill
              fillColor={t.paper}
              strokeColor={t.rule}
              style={{
                padding: space.md,
                gap: space.sm,
              }}>
              <View
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: space.xs + 2,
                  paddingVertical: 2,
                  borderRadius: radius.sm,
                  backgroundColor: t.raised,
                  borderWidth: 1,
                  borderColor: t.hair,
                }}>
                <T v="small" soft style={{ textTransform: "uppercase", fontSize: 11 }}>
                  {sec.tag}
                </T>
              </View>
              {!isTemplateLabel(sec.heading) ? (
                <T v="heading" style={{ fontSize: 17 }}>
                  {sec.heading}
                </T>
              ) : null}
              <T style={{ lineHeight: 22 }}>
                {sec.body}
              </T>
            </Frame>
          ))}

          <View style={{ marginTop: space.md, alignItems: "center" }}>
            <Button
              kind="quiet"
              label="View all past reflections"
              onPress={() => router.push("/profile/insights" as Href)}
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
