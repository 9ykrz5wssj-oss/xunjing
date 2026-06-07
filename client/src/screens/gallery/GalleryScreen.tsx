import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Animated,
} from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { CollectionCard } from "../../components/CollectionCard";
import { EmptyState } from "../../components/EmptyState";
import { RARITY_COLORS } from "../../utils/constants";
import { getMyCollections } from "../../services/collection.api";
import { CollectionItem } from "../../types";

const RARITY_ORDER = ["典藏", "神秘", "限定", "高端", "普通", "常见"];

export function GalleryScreen({ navigation }: any) {
  const [grouped, setGrouped] = useState<Record<string, CollectionItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});

  const fetchCollections = useCallback(async () => {
    try {
      const res = await getMyCollections();
      if (res.success && res.data) {
        const g: Record<string, CollectionItem[]> = {};
        for (const item of res.data.collections) {
          if (!g[item.rarity]) g[item.rarity] = [];
          g[item.rarity].push(item);
        }
        setGrouped(g);
      }
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const onRefresh = () => { setRefreshing(true); fetchCollections(); };

  const scrollToRarity = (rarity: string) => {
    setSelectedRarity(rarity);
    // 简单滚动到顶部，后续可做精确滚动
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const availableRarities = RARITY_ORDER.filter((r) => grouped[r]?.length > 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>加载藏品中...</Text>
      </View>
    );
  }

  if (availableRarities.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState emoji="🏛️" title="展柜空空的" subtitle="去地图探索，开启宝箱获得藏品吧！" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── 顶部标题 ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏛️ 我的展柜</Text>
        <Text style={styles.headerSub}>共 {Object.values(grouped).reduce((s, arr) => s + arr.length, 0)} 件藏品</Text>
      </View>

      {/* ── 左侧浮动标签栏 ── */}
      <View style={styles.floatTabBar}>
        {RARITY_ORDER.map((rarity) => {
          const has = grouped[rarity]?.length > 0;
          const active = selectedRarity === rarity;
          const color = RARITY_COLORS[rarity] || "#999";
          return (
            <TouchableOpacity
              key={rarity}
              style={[styles.floatTab, active && { backgroundColor: color + "20" }]}
              onPress={() => scrollToRarity(rarity)}
              activeOpacity={0.7}
              disabled={!has}
            >
              <View style={[styles.floatTabDot, { backgroundColor: has ? color : colors.textHint, opacity: has ? 1 : 0.3 }]} />
              <Text style={[styles.floatTabText, { color: has ? color : colors.textHint, opacity: has ? 1 : 0.4 }]}>
                {rarity}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 主内容区 ── */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {RARITY_ORDER.map((rarity) => {
          const items = grouped[rarity];
          if (!items || items.length === 0) return null;
          const color = RARITY_COLORS[rarity] || "#999";

          return (
            <View key={rarity} style={styles.section}>
              {/* 分组标题 */}
              <View style={[styles.sectionHeader, { backgroundColor: color + "12", borderLeftColor: color }]}>
                <Text style={[styles.sectionTitle, { color }]}>
                  {rarity === "神秘" ? "🌈 " : ""}{rarity}
                </Text>
                <Text style={styles.sectionCount}>{items.length} 件</Text>
              </View>

              {/* 网格布局 */}
              <View style={styles.grid}>
                {items.map((item) => (
                  <CollectionCard
                    key={item.collectionId}
                    name={item.name}
                    imageUrl={item.imageUrl}
                    rarity={item.rarity}
                    count={item.count}
                    onPress={() => navigation.navigate("ItemDetail", { item })}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
  header: {
    paddingTop: 56,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  headerSub: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  floatTabBar: {
    position: "absolute",
    left: 4,
    top: "20%",
    zIndex: 20,
    backgroundColor: colors.surface + "F0",
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    gap: 2,
  },
  floatTab: {
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: 6,
    borderRadius: borderRadius.sm,
  },
  floatTabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 1,
  },
  floatTabText: {
    fontSize: 9,
    fontWeight: "700",
    writingDirection: "ltr",
  },
  scrollView: { flex: 1, marginLeft: 36 },
  scrollContent: { padding: spacing.md, paddingBottom: 120 },
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.bodyBold, fontSize: 15 },
  sectionCount: { ...typography.caption, color: colors.textSecondary },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: spacing.sm,
  },
});
