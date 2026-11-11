import { useRef } from "react";
import { showAlert } from "@/lib/dialog";
import { router } from "expo-router";
import { FlatList, Pressable, View } from "react-native";
import { deleteChat, startChat, update, useStore, type Chat } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, Page, T } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";

function formatDate(ms: number) {
  if (!ms) return "";
  const d = new Date(ms);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Chats() {
  const t = useTheme();
  const chats = useStore((s) => s.chats);
  const activeChatId = useStore((s) => s.activeChatId);

  const sorted = [...chats].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

  // one tap goes back once, however fast the row is tapped
  const leaving = useRef(false);
  const leave = () => {
    if (leaving.current) return;
    leaving.current = true;
    router.back();
  };
  const onNew = () => {
    if (leaving.current) return;
    startChat();
    leave();
  };

  const onSelect = (id: string) => {
    if (leaving.current) return;
    update(() => ({ activeChatId: id }));
    leave();
  };

  const onDelete = (chat: Chat) => {
    showAlert("Delete conversation?", `Delete "${chat.title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteChat(chat.id),
      },
    ]);
  };

  return (
    <Page>
      <View style={{ gap: space.md }}>
        <Button label="New conversation" icon="plus" onPress={onNew} />

        {sorted.length === 0 ? (
          <View style={{ paddingVertical: space.xl, alignItems: "center" }}>
            <T soft>No conversations yet.</T>
          </View>
        ) : (
          <View style={{ gap: space.sm }}>
            {sorted.map((c) => {
              const active = c.id === activeChatId;
              const last = c.messages.at(-1);
              const preview = last ? (last.kind === "crisis" ? "Crisis support" : last.text) : "Empty conversation";
              const time = formatDate(c.updatedAt || c.createdAt);

              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Conversation: ${c.title}`}
                  onPress={() => onSelect(c.id)}
                  onLongPress={() => onDelete(c)}
                  delayLongPress={500}
                  style={({ pressed }) => [
                    {
                      backgroundColor: active ? t.paper : t.paper,
                      borderColor: active ? t.ink : t.rule,
                      borderWidth: active ? 1.5 : 1,
                      borderRadius: radius.md,
                      padding: space.md,
                      gap: 4,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <T v="heading" style={{ flex: 1, flexShrink: 1, marginRight: space.sm }} numberOfLines={1}>
                      {c.title}
                    </T>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, flexShrink: 0 }}>
                      {time ? (
                        <T v="small" soft>
                          {time}
                        </T>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete conversation ${c.title}`}
                        hitSlop={10}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          onDelete(c);
                        }}
                        style={({ pressed }) => ({
                          padding: 4,
                          opacity: pressed ? 0.5 : 0.75,
                        })}>
                        <DoodleIcon name="trash" size={16} color={t.ink} />
                      </Pressable>
                    </View>
                  </View>
                  <T v="small" soft numberOfLines={2}>
                    {preview}
                  </T>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </Page>
  );
}
