import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { CollectionCard } from "../../components/CollectionCard";
import { EmptyState } from "../../components/EmptyState";
import { RARITY_COLORS } from "../../utils/constants";
import { getUserCollections } from "../../services/collection.api";

const RARITY_ORDER = ["典藏", "神秘", "限定", "高端", "普通", "常见"];

export function UserGalleryScreen({ route, navigation }: any) {
  const { userId, nickname } = route.params;
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await getUserCollections(userId);
        if (res.success && res.data) {
          const g: Record<string, any[]> = {};
          (res.data.collections || []).forEach((item: any) => {
            if (!g[item.rarity]) g[item.rarity] = [];
            g[item.rarity].push(item);
          });
          setGrouped(g);
          setTotal(res.data.collections?.length || 0);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [userId]);

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const available = RARITY_ORDER.filter((r) => grouped[r]?.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← 返回</Text></TouchableOpacity>
        <Text style={styles.title}>{nickname || "好友"} 的展柜</Text>
        <Text style={styles.subtitle}>共 {total} 件藏品</Text>
      </View>

      {available.length === 0 ? (
        <EmptyState emoji="🏛️" title="TA还没有藏品" subtitle="好友还没开始收集藏品" />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {RARITY_ORDER.map((rarity) => {
            const items = grouped[rarity];
            if (!items || items.length === 0) return null;
            return (
              <View key={rarity} style={styles.section}>
                <View style={[styles.sectionHeader, { borderLeftColor: RARITY_COLORS[rarity] || "#999", backgroundColor: (RARITY_COLORS[rarity] || "#999") + "12" }]}>
                  <Text style={[styles.sectionTitle, { color: RARITY_COLORS[rarity] || "#999" }]}>{rarity}</Text>
                  <Text style={styles.sectionCount}>{items.length} 件</Text>
                </View>
                <View style={styles.grid}>
                  {items.map((item: any, idx: number) => (
                    <CollectionCard key={idx} name={item.name} imageUrl={item.imageUrl} rarity={item.rarity} count={item.count} disabled />
                  ))}
                </View>
              </View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  header: {
    paddingTop: 56, paddingBottom: spacing.md, paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface, borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 6, zIndex: 10,
  },
  backText: { ...typography.body, color: colors.primary, fontWeight: "600", marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, borderLeftWidth: 4, marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.bodyBold, fontSize: 15 },
  sectionCount: { ...typography.caption, color: colors.textSecondary },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", gap: spacing.sm },
});
