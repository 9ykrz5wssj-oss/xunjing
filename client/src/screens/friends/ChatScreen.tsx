import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Platform, Keyboard,
} from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { Avatar } from "../../components/Avatar";
import { MessageBubble } from "../../components/MessageBubble";
import { getPrivateChatHistory, sendPrivateMessage } from "../../services/chat.api";
import { getSocket, getCurrentSocket } from "../../socket/socketClient";
import { MessageData } from "../../types";
import { useAuthStore } from "../../store/authStore";

export function ChatScreen({ route, navigation }: any) {
  const { friend } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [inputText, setInputText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const EMOJIS = ["😊","😂","❤️","👍","🎉","🔥","😍","🤔","👋","💪","🙏","✨","🌟","💯","🥳"];
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef(getCurrentSocket());

  // 加载历史消息
  useEffect(() => {
    (async () => {
      try {
        const res = await getPrivateChatHistory(friend.id);
        if (res.success && res.data) setMessages(res.data.messages);
      } catch {} finally { setLoading(false); }
    })();
  }, [friend.id]);

  // Socket 监听新消息
  useEffect(() => {
    const setupSocket = async () => {
      const socket = await getSocket();
      if (!socket) return;
      socketRef.current = socket;

      const handleNewMessage = (data: any) => {
        if (data.conversationId && data.message.senderId !== (user?.id || user?._id)) {
          setMessages((prev) => [...prev, data.message]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      };

      socket.on("new_private_message", handleNewMessage);
      return () => { socket.off("new_private_message", handleNewMessage); };
    };
    setupSocket();
  }, []);

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

  // 发送消息
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    const msg: MessageData = {
      senderId: user?.id || user?._id || "",
      senderNickname: user?.nickname || "",
      senderAvatar: user?.avatar || "",
      content: text,
      contentType: "text",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, msg]);
    setInputText("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // REST API 发送（保证存储）
    try { await sendPrivateMessage(friend.id, text); } catch {}

    // Socket 推送（实时通知对方）
    if (socketRef.current?.connected) {
      const convId = [user?.id || user?._id, friend.id].sort().join("_");
      socketRef.current.emit("private_message", {
        conversationId: convId,
        receiverId: friend.id,
        content: text,
        contentType: "text",
      });
    }
  };

  // 标记已读
  useEffect(() => {
    const markRead = async () => {
      const socket = socketRef.current;
      if (!socket) return;
      const convId = [user?.id || user?._id, friend.id].sort().join("_");
      socket.emit("mark_read", { conversationId: convId, conversationType: "private" });
    };
    markRead();
  }, [messages.length]);

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
      {/* 顶栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Avatar uri={friend.avatar || undefined} size={36} emoji={friend.nickname?.charAt(0) || "?"} />
        <Text style={styles.headerName} numberOfLines={1}>{friend.nickname || "好友"}</Text>
        <TouchableOpacity
          style={styles.galleryBtn}
          onPress={() => navigation.navigate("UserGallery", { userId: friend.userId, nickname: friend.nickname })}
        >
          <Text style={styles.galleryBtnText}>🏛️</Text>
        </TouchableOpacity>
      </View>

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => `${item.senderId}-${index}-${item.createdAt}`}
        renderItem={renderMessage}
        contentContainerStyle={[styles.msgList, messages.length === 0 && styles.msgListEmpty]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>开始聊天吧！</Text>
          </View>
        }
      />

      {/* 输入栏 */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowEmoji(!showEmoji)}>
          <Text style={styles.emojiBtnText}>😊</Text>
        </TouchableOpacity>
        {showEmoji && (
          <View style={styles.emojiPicker}>
            {EMOJIS.map((e, i) => (
              <TouchableOpacity key={i} onPress={() => { setInputText((prev) => prev + e); setShowEmoji(false); }}>
                <Text style={styles.emojiItem}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
          activeOpacity={0.7}
        >
          <Text style={styles.sendBtnText}>发送</Text>
        </TouchableOpacity>
      </View>
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
  headerName: { ...typography.bodyBold, color: colors.textPrimary, flex: 1 },
  galleryBtn: { padding: spacing.sm },
  galleryBtnText: { fontSize: 22 },
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
  emojiBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  emojiBtnText: { fontSize: 24 },
  emojiPicker: { flexDirection: "row", flexWrap: "wrap", backgroundColor: colors.surface, padding: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, position: "absolute", bottom: 60, left: spacing.md, right: spacing.md, gap: spacing.xs, justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 6 },
  emojiItem: { fontSize: 28, padding: spacing.xs },
  textInput: {
    flex: 1, ...typography.body, backgroundColor: colors.background,
    borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    maxHeight: 100, color: colors.textPrimary,
  },
  sendBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { ...typography.bodyBold, color: "#FFF" },
});
