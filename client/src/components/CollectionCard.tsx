import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius } from "../theme";
import { RARITY_COLORS } from "../utils/constants";
import { fixImageUrl } from "../services/api";

interface CollectionCardProps {
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  rarity: string;
  count: number;
  onPress?: () => void;
  disabled?: boolean;
}

export function CollectionCard({ name, imageUrl, thumbnailUrl, rarity, count, onPress, disabled }: CollectionCardProps) {
  const rarityColor = RARITY_COLORS[rarity] || "#999";
  // 缩略图加载失败时降级为原图（兼容旧图片无缩略图的情况）
  const [thumbFailed, setThumbFailed] = useState(false);
  const displayUrl = (!thumbFailed && thumbnailUrl) ? thumbnailUrl : imageUrl;

  const card = (
    <View style={[styles.card, { borderColor: rarityColor + "40" }]}>
      {/* 数量角标 */}
      <View style={[styles.countBadge, { backgroundColor: rarityColor }]}>
        <Text style={styles.countText}>x{count}</Text>
      </View>

      {/* 图片 — 优先用缩略图快速展示 */}
      <View style={styles.imageWrap}>
        {displayUrl ? (
          <Image
            source={{ uri: fixImageUrl(displayUrl) }}
            style={styles.image}
            resizeMode="contain"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <Text style={styles.placeholderEmoji}>🎁</Text>
        )}
      </View>

      {/* 名称 */}
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>

      {/* 稀有度 */}
      <View style={[styles.rarityLine, { backgroundColor: rarityColor + "20" }]}>
        <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
        <Text style={[styles.rarityText, { color: rarityColor }]}>{rarity}</Text>
      </View>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
        {card}
      </TouchableOpacity>
    );
  }

  return <View style={styles.touchable}>{card}</View>;
}

const styles = StyleSheet.create({
  touchable: {
    width: "31%",
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    padding: spacing.sm,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  countBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 1,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFF",
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    overflow: "hidden",
  },
  image: {
    width: "80%",
    height: "80%",
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  name: {
    ...typography.small,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  rarityLine: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
