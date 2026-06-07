import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { getEventTypes } from "../../services/event.api";

export function ActivitySquareScreen({ navigation }: any) {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await getEventTypes(); if (res.success && res.data) setTypes(res.data); } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎪 活动广场</Text>
      </View>
      <FlatList
        data={types}
        keyExtractor={(t) => t._id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("ActivityTypeList", { typeId: item._id, typeName: item.name, typeColor: item.color || "#3498DB" })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: (item.color || "#3498DB") + "18" }]}>
              <Text style={styles.icon}>{item.iconUrl || "📋"}</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.subtitle}>点击查看招募中的{item.name}活动</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={{ color: colors.textHint }}>暂无活动类型</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  header: { paddingTop: 56, paddingBottom: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl, elevation: 4, gap: spacing.md },
  backBtn: { paddingHorizontal: spacing.xs },
  backText: { ...typography.h2, color: colors.primary },
  title: { ...typography.h2, color: colors.textPrimary },
  grid: { padding: spacing.md, gap: spacing.md },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: "center", margin: spacing.xs, elevation: 2 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: spacing.md },
  icon: { fontSize: 32 },
  name: { ...typography.bodyBold, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...typography.small, color: colors.textHint, textAlign: "center", marginTop: 4 },
  empty: { padding: 40, alignItems: "center" },
});
