import Feather from "@expo/vector-icons/Feather";
import { Redirect, Tabs } from "expo-router";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";

const tabs: { name: string; title: string; icon: keyof typeof Feather.glyphMap }[] = [
  { name: "index", title: "Today", icon: "sun" },
  { name: "talk", title: "Talk", icon: "message-circle" },
  { name: "journal", title: "Journal", icon: "book-open" },
  { name: "insights", title: "Insights", icon: "activity" },
  { name: "explore", title: "Explore", icon: "compass" },
];

export default function TabsLayout() {
  const t = useTheme();
  const onboarded = useStore((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.inkSoft,
        tabBarStyle: { backgroundColor: t.paper, borderTopColor: t.line },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        sceneStyle: { backgroundColor: t.bg },
      }}>
      {tabs.map((x) => (
        <Tabs.Screen
          key={x.name}
          name={x.name}
          options={{ title: x.title, tabBarIcon: ({ color, size }) => <Feather name={x.icon} color={color} size={size - 2} /> }}
        />
      ))}
    </Tabs>
  );
}
