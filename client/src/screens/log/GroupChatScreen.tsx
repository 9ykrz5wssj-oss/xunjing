import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Platform, Keyboard,
} from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { MessageBubble } from "../../components/MessageBubble";
import { getGroupChatHistory } from "../../services/chat.api";
import api from "../../services/api";
import { MessageData } from "../../types";
import { useAuthStore } from "../../store/authStore";

export function GroupChatScreen({ route, navigation }: any) {
  const { eventId } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [inputText, setInputText] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await getGroupChatHistory(eventId);
      if (res.success && res.data) setMessages(res.data.messages);
    } catch {}
  }, [eventId]);

  useEffect(() => { loadMessages(); const t = setInterval(loadMessages, 5000); return () => clearInterval(t); }, [loadMessages]);

  // 键盘避让：监听键盘高度，将输入框顶到键盘正上方
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e: any) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || readOnly) return;

    const msg: MessageData = {
      senderId: user?.id || user?._id || "",
      senderNickname: user?.nickname || "",
      senderAvatar: user?.avatar || "",
      content: text, contentType: "text",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setInputText("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try { await api.post(`/chat/group/${eventId}`, { content: text, contentType: "text" }); } catch {}
  };

  const renderMessage = ({ item, index }: { item: MessageData; index: number }) => {
    const isMine = String(item.senderId) === String(user?.id || user?._id || "");
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMsg || prevMsg.senderId !== item.senderId;

    return (
      <MessageBubble
        content={item.content}
        isMine={isMine}
        senderNickname={item.senderNickname}
        senderAvatar={item.senderAvatar}
        timestamp={item.createdAt}
        showAvatar={showAvatar}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: keyboardHeight }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>💬 临时会话</Text>
          {readOnly && <Text style={styles.readOnlyBadge}>只读</Text>}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => `gmsg-${index}`}
        renderItem={renderMessage}
        contentContainerStyle={[styles.msgList, messages.length === 0 && styles.msgListEmpty]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>暂无消息，发送第一条消息吧！</Text>
          </View>
        }
      />

      {!readOnly && (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="输入消息..."
            placeholderTextColor={colors.textHint}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendBtnText}>发送</Text>
          </TouchableOpacity>
        </View>
      )}

      {readOnly && (
        <View style={styles.readOnlyBar}>
          <Text style={styles.readOnlyText}>🔒 活动结束超24小时，会话已关闭</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 56, paddingBottom: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: colors.surface, flexDirection: "row", alignItems: "center",
    borderBottomLeftRadius: borderRadius.lg, borderBottomRightRadius: borderRadius.lg,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 4, zIndex: 10,
    gap: spacing.sm,
  },
  backBtn: { paddingHorizontal: spacing.xs },
  backText: { ...typography.h2, color: colors.primary },
  headerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerTitle: { ...typography.bodyBold, color: colors.textPrimary },
  readOnlyBadge: {
    ...typography.small, color: colors.warning, backgroundColor: colors.warning + "20",
    paddingHorizontal: spacing.sm, paddingVertical: 1, borderRadius: borderRadius.sm, overflow: "hidden",
  },
  msgList: { paddingVertical: spacing.md, flexGrow: 1 },
  msgListEmpty: { justifyContent: "center", alignItems: "center" },
  emptyChat: { alignItems: "center", paddingTop: 100 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.body, color: colors.textHint },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm,
  },
  textInput: {
    flex: 1, ...typography.body, backgroundColor: colors.background,
    borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    maxHeight: 100, color: colors.textPrimary,
  },
  sendBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { ...typography.bodyBold, color: "#FFF" },
  readOnlyBar: {
    backgroundColor: colors.warning + "15", paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderTopWidth: 1, borderTopColor: colors.warning + "30", alignItems: "center",
  },
  readOnlyText: { ...typography.caption, color: colors.warning, fontWeight: "600" },
});
