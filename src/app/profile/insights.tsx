import { router, type Href } from "expo-router";
import { Pressable, View } from "react-native";
import { useStore } from "@/lib/store";
import { isTemplateLabel } from "@/lib/insights";
import { radius, space, useTheme } from "@/lib/theme";
import { Screen, Section, T } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { Max } from "@/components/max";

export default function InsightsHistory() {
  const t = useTheme();
  const insights = useStore((s) => s.insights);

  return (
    <Screen title="Past reflections">
      <T soft style={{ marginTop: -space.sm, marginBottom: space.md }}>
        Daily reflections generated from your check-ins and notes.
      </T>

      {insights.length === 0 ? (
        <View
          style={{
            padding: space.xl,
            borderRadius: radius.lg,
            backgroundColor: t.paper,
            borderWidth: 1,
            borderColor: t.rule,
            alignItems: "center",
            gap: space.sm,
            marginTop: space.md,
          }}>
          <Max state="empty" size={110} />
          <T v="heading">No reflections yet</T>
          <T soft style={{ textAlign: "center" }}>
            Daily reflections appear once you open Today's Insight on the Home screen.
          </T>
        </View>
      ) : (
        <View style={{ gap: space.sm, paddingBottom: space.xl }}>
          {insights.map((item) => {
            const formattedDate = new Date(item.date + "T12:00:00").toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <Pressable
                key={item.date}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${formattedDate}`}
                onPress={() => router.push(`/insight?date=${item.date}` as Href)}
                style={({ pressed }) => ({
                  padding: space.md,
                  borderRadius: radius.lg,
                  backgroundColor: pressed ? t.raised : t.paper,
                  borderWidth: 1,
                  borderColor: t.rule,
                  gap: 4,
                })}>
                <T soft v="small">
                  {formattedDate}
                </T>
                <T v="heading" style={{ fontSize: 17 }}>
                  {item.title}
                </T>
                {item.sections?.[0] && !isTemplateLabel(item.sections[0].heading) ? (
                  <T soft numberOfLines={1} style={{ fontSize: 13 }}>
                    {item.sections[0].heading}
                  </T>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
