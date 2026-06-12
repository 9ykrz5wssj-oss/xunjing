import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, SectionList,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { CollectionCard } from "../../components/CollectionCard";
import { EmptyState } from "../../components/EmptyState";
import { RARITY_COLORS } from "../../utils/constants";
import { getMyCollections } from "../../services/collection.api";
import { CollectionItem } from "../../types";

const RARITY_ORDER = ["典藏", "神秘", "限定", "高端", "普通", "常见"];

/** 每行最多3张卡片 */
function chunkRows(items: CollectionItem[]): CollectionItem[][] {
  const rows: CollectionItem[][] = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3));
  }
  return rows;
}

export function GalleryScreen({ navigation }: any) {
  const [grouped, setGrouped] = useState<Record<string, CollectionItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const listRef = useRef<SectionList>(null);

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

  // 构建 SectionList 数据：每个 section = 一种稀有度，data = 行数组（每行最多3个）
  const sections = RARITY_ORDER
    .filter((r) => grouped[r]?.length > 0)
    .map((rarity) => ({
      rarity,
      data: chunkRows(grouped[rarity]),
    }));

  const scrollToRarity = (rarity: string) => {
    setSelectedRarity(rarity);
    const idx = sections.findIndex((s) => s.rarity === rarity);
    if (idx >= 0 && listRef.current) {
      listRef.current.scrollToLocation({ sectionIndex: idx, itemIndex: 0, viewOffset: 0, animated: true });
    }
  };

  const totalCount = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>加载藏品中...</Text>
      </View>
    );
  }

  if (sections.length === 0) {
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
        <Text style={styles.headerSub}>共 {totalCount} 件藏品</Text>
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

      {/* ── 虚拟化列表（只渲染可见区域的卡片） ── */}
      <SectionList
        ref={listRef as any}
        sections={sections}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        keyExtractor={(row: CollectionItem[], idx) => `${row[0]?.collectionId || idx}-${idx}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        renderSectionHeader={({ section }) => {
          const color = RARITY_COLORS[section.rarity] || "#999";
          const count = grouped[section.rarity]?.length || 0;
          return (
            <View style={[styles.sectionHeader, { backgroundColor: color + "12", borderLeftColor: color }]}>
              <Text style={[styles.sectionTitle, { color }]}>
                {section.rarity === "神秘" ? "🌈 " : ""}{section.rarity}
              </Text>
              <Text style={styles.sectionCount}>{count} 件</Text>
            </View>
          );
        }}
        renderItem={({ item: row }) => (
          <View style={styles.row}>
            {row.map((item) => (
              <CollectionCard
                key={item.collectionId}
                name={item.name}
                imageUrl={item.imageUrl}
                thumbnailUrl={item.thumbnailUrl}
                rarity={item.rarity}
                count={item.count}
                onPress={() => navigation.navigate("ItemDetail", { item })}
              />
            ))}
            {/* 行尾补齐占位，保证卡片左对齐 */}
            {row.length < 3 && (
              <View style={{ width: row.length === 2 ? "31%" : "62%", marginBottom: 0 }} />
            )}
          </View>
        )}
        // 初始渲染足够的行以填满首屏（避免空白）
        initialNumToRender={12}
        maxToRenderPerBatch={9}
        windowSize={5}
        removeClippedSubviews={true}
      />
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
  list: { flex: 1, marginLeft: 36 },
  listContent: { padding: spacing.md, paddingBottom: 120 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: { ...typography.bodyBold, fontSize: 15 },
  sectionCount: { ...typography.caption, color: colors.textSecondary },
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
});
