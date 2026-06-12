import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius } from "../theme";
import { Avatar } from "./Avatar";

interface MessageBubbleProps {
  content: string;
  isMine: boolean;
  senderNickname: string;
  senderAvatar: string;
  timestamp: string;
  showAvatar: boolean;
  isRevoked?: boolean;
}

export function MessageBubble({ content, isMine, senderNickname, senderAvatar, timestamp, showAvatar, isRevoked }: MessageBubbleProps) {
  const timeStr = new Date(timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.row, isMine && styles.rowMine]}>
      {/* 对方头像（左侧） */}
      {!isMine && (
        <View style={styles.avatarCol}>
          {showAvatar ? (
            <Avatar uri={senderAvatar || undefined} size={34} emoji={senderNickname?.charAt(0) || "?"} />
          ) : (
            <View style={styles.avatarSpacer} />
          )}
        </View>
      )}

      {/* 气泡 */}
      <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapMine : styles.bubbleWrapOther]}>
        {!isMine && showAvatar && (
          <Text style={styles.senderName}>{senderNickname || "用户"}</Text>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther, isRevoked && styles.bubbleRevoked]}>
          <Text style={[styles.text, isMine ? styles.textMine : styles.textOther, isRevoked && styles.textRevoked]}>
            {isRevoked ? "⏪ 消息已撤回" : content}
          </Text>
        </View>
        <Text style={[styles.time, isMine && styles.timeMine]}>{timeStr}</Text>
      </View>

      {/* 我的头像（右侧） */}
      {isMine && (
        <View style={styles.avatarCol}>
          {showAvatar ? (
            <Avatar uri={senderAvatar || undefined} size={34} emoji="👤" />
          ) : (
            <View style={styles.avatarSpacer} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  avatarCol: {
    width: 38,
    marginHorizontal: spacing.xs,
    alignItems: "center",
  },
  avatarSpacer: {
    width: 34,
  },
  bubbleWrap: {
    maxWidth: "68%",
    marginBottom: spacing.xs,
  },
  bubbleWrapMine: {
    alignItems: "flex-end",
  },
  bubbleWrapOther: {
    alignItems: "flex-start",
  },
  senderName: {
    ...typography.small,
    color: colors.textHint,
    marginBottom: 2,
    marginLeft: spacing.sm,
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 21,
  },
  textMine: {
    color: colors.textOnPrimary,
  },
  textOther: {
    color: colors.textPrimary,
  },
  time: {
    ...typography.small,
    color: colors.textHint,
    marginTop: 2,
    marginHorizontal: spacing.xs,
    fontSize: 10,
  },
  timeMine: {
    textAlign: "right",
  },
  bubbleRevoked: {
    backgroundColor: colors.surfaceAlt || colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderStyle: "dashed",
  },
  textRevoked: {
    color: colors.textHint,
    fontStyle: "italic",
    fontSize: 13,
  },
});
