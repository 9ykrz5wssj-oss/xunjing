import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { RarityBadge } from "../../components/RarityBadge";
import { RARITY_COLORS } from "../../utils/constants";
import { fixImageUrl } from "../../services/api";

export function ItemDetailScreen({ route, navigation }: any) {
  const { item } = route.params;
  const rarityColor = RARITY_COLORS[item.rarity] || "#999";
  const isMythic = item.rarity === "神秘";

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 大图展示 */}
        <View style={[styles.imageContainer, { borderColor: rarityColor + "30", backgroundColor: rarityColor + "08" }]}>
          {isMythic && <View style={styles.rainbowOverlay} />}
          {item.imageUrl ? (
            <Image source={{ uri: fixImageUrl(item.imageUrl) }} style={styles.image} resizeMode="contain" />
          ) : (
            <Text style={styles.placeholderText}>🎁</Text>
          )}
        </View>

        {/* 稀有度标识 */}
        <View style={styles.raritySection}>
          <RarityBadge rarity={item.rarity} size="lg" />
        </View>

        {/* 藏品名称 */}
        <Text style={styles.itemName}>{item.name}</Text>

        {/* 持有数量 */}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>持有数量：x{item.count}</Text>
        </View>

        {/* 详情描述 */}
        {item.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descTitle}>📋 藏品描述</Text>
            <Text style={styles.descText}>{item.description}</Text>
          </View>
        ) : (
          <View style={styles.descCard}>
            <Text style={styles.descTitle}>📋 藏品描述</Text>
            <Text style={styles.descEmpty}>暂无描述</Text>
          </View>
        )}

        {/* 获得时间 */}
        <Text style={styles.acquiredTime}>
          首次获得：{new Date(item.acquiredAt).toLocaleDateString("zh-CN")}
        </Text>
        <Text style={styles.acquiredTime}>
          最近获得：{new Date(item.lastAcquiredAt).toLocaleDateString("zh-CN")}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 56,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
  },
  backBtn: { width: 60 },
  backText: { ...typography.body, color: colors.primary, fontWeight: "600" },
  headerTitle: { ...typography.bodyBold, color: colors.textPrimary, flex: 1, textAlign: "center" },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: 120 },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  rainbowOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: "transparent",
  },
  image: { width: "75%", height: "75%" },
  placeholderText: { fontSize: 80 },
  raritySection: { alignItems: "center", marginBottom: spacing.md },
  itemName: { ...typography.h2, color: colors.textPrimary, textAlign: "center", marginBottom: spacing.md },
  countBadge: {
    alignSelf: "center",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xxl,
  },
  countText: { ...typography.bodyBold, color: colors.textPrimary },
  descCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  descTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.md },
  descText: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  descEmpty: { ...typography.body, color: colors.textHint, fontStyle: "italic" },
  acquiredTime: { ...typography.caption, color: colors.textHint, textAlign: "center", marginTop: spacing.sm },
});
