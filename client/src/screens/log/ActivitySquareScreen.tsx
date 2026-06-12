import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TextInput, ScrollView,
} from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { listEvents, getEventTypes, getMyEvents } from "../../services/event.api";

// ── 常量 ──
const EMPTY_EVENTS: any[] = [];

// ═══════════════════════════════════════════════════════════
//  eventStyles — EventList 专用（定义在前，组件引用）
// ═══════════════════════════════════════════════════════════
const eventStyles = StyleSheet.create({
  listContent: { padding: spacing.md, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  typeBar: { width: 4 },
  cardBody: { flex: 1, padding: spacing.md, gap: spacing.xs },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeName: {
    ...typography.small,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  statusBadge: {
    ...typography.caption,
    fontWeight: "700",
  },
  title: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  cardMeta: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metaItem: {
    ...typography.caption,
    color: colors.textHint,
  },
  emptyWrapper: { flex: 1 },
  emptyInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxxl,
  },
  goPublishBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  goPublishText: {
    ...typography.bodyBold,
    color: "#FFF",
  },
});

// ═══════════════════════════════════════════════════════════
//  chipStyles — ScrollableChips 专用
// ═══════════════════════════════════════════════════════════
const chipStyles = StyleSheet.create({
  scrollContent: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  emoji: { fontSize: 14 },
  label: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});

// ═══════════════════════════════════════════════════════════
//  EventList（memo 隔离，防止列表数据变化引起搜索栏重渲染）
// ═══════════════════════════════════════════════════════════
const EventList = memo(function EventList({
  events, refreshing, onRefresh, onPressEvent, keyword, selectedTypeId, onNavigatePublish,
}: {
  events: any[];
  refreshing: boolean;
  onRefresh: () => void;
  onPressEvent: (id: string) => void;
  keyword: string;
  selectedTypeId: string | null;
  onNavigatePublish: () => void;
}) {
  const renderEventCard = useCallback(({ item }: { item: any }) => {
    const typeInfo = item.typeId || {};
    const typeColor = typeInfo.color || colors.primary;
    return (
      <TouchableOpacity
        style={eventStyles.card}
        onPress={() => onPressEvent(item._id)}
        activeOpacity={0.7}
      >
        <View style={[eventStyles.typeBar, { backgroundColor: typeColor }]} />
        <View style={eventStyles.cardBody}>
          <View style={eventStyles.cardTop}>
            <Text style={eventStyles.typeName}>{typeInfo.iconUrl || "📋"} {typeInfo.name || "活动"}</Text>
            <Text style={[eventStyles.statusBadge, {
              color: item.status === "recruiting" ? colors.success :
                     item.status === "ongoing" ? colors.info : colors.warning
            }]}>
              {item.status === "recruiting" ? "🟢 招募中" :
               item.status === "waiting" ? "⏳ 等待开始" :
               item.status === "ongoing" ? "🔵 进行中" : item.status}
            </Text>
          </View>
          <Text style={eventStyles.title} numberOfLines={1}>{item.title || "未命名活动"}</Text>
          <View style={eventStyles.cardMeta}>
            <Text style={eventStyles.metaItem}>📍 {item.locationText || "待定"}</Text>
            <Text style={eventStyles.metaItem}>👤 {item.currentParticipants || 0}/{item.capacity || "∞"}</Text>
          </View>
          <Text style={eventStyles.metaItem}>
            🕐 {item.startTime ? new Date(item.startTime).toLocaleString("zh-CN", {
              month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"
            }) : "待定"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [onPressEvent]);

  // 空列表 — 用 ScrollView 包住以支持下拉刷新，同时避免 FlatList contentContainerStyle 突变
  if (events.length === 0) {
    return (
      <ScrollView
        style={eventStyles.emptyWrapper}
        contentContainerStyle={eventStyles.emptyInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        <Text style={{ fontSize: 48 }}>📭</Text>
        <Text style={{ color: colors.textHint, marginTop: spacing.md }}>
          {keyword || selectedTypeId ? "没有匹配的活动" : "暂无招募中的活动"}
        </Text>
        <TouchableOpacity
          style={eventStyles.goPublishBtn}
          onPress={onNavigatePublish}
          activeOpacity={0.7}
        >
          <Text style={eventStyles.goPublishText}>📝 去发布一个吧</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // 有数据时用 FlatList，contentContainerStyle 固定不变，避免回流
  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item._id}
      renderItem={renderEventCard}
      contentContainerStyle={eventStyles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
      keyboardShouldPersistTaps="always"
    />
  );
});

// ═══════════════════════════════════════════════════════════
//  ScrollableChips — 横向滚动分类标签（修复：包裹 ScrollView）
// ═══════════════════════════════════════════════════════════
const ScrollableChips = memo(function ScrollableChips({
  items, selectedId, onSelect,
}: {
  items: any[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={chipStyles.scrollContent}
      keyboardShouldPersistTaps="always"
    >
      {items.map((t: any) => {
        const id = t._id ?? null;
        const active = selectedId === id;
        const chipColor = t.color || "#666";
        return (
          <TouchableOpacity
            key={id ?? "__all"}
            style={[chipStyles.chip, active && { backgroundColor: chipColor + "20", borderColor: chipColor }]}
            onPress={() => onSelect(id)}
            activeOpacity={0.7}
          >
            <Text style={chipStyles.emoji}>{t.iconUrl || "📋"}</Text>
            <Text style={[chipStyles.label, active && { color: chipColor, fontWeight: "800" }]}>
              {t.name || "全部"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

// ═══════════════════════════════════════════════════════════
//  MyEventsView — "我参与的"双区域视图（活跃 + 历史）
// ═══════════════════════════════════════════════════════════
const myViewStyles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionCount: {
    ...typography.caption,
    color: colors.textHint,
  },
  sectionBar: {
    height: 3,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 2,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  historyCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.divider,
    opacity: 0.7,
  },
  typeBar: { width: 4 },
  cardBody: { flex: 1, padding: spacing.md, gap: spacing.xs },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeName: { ...typography.small, fontWeight: "700", color: colors.textSecondary },
  statusBadge: { ...typography.caption, fontWeight: "700" },
  title: { ...typography.bodyBold, color: colors.textPrimary },
  cardMeta: { flexDirection: "row", gap: spacing.md },
  metaItem: { ...typography.caption, color: colors.textHint },
  emptyWrapper: { flex: 1 },
  emptyInner: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xxxl },
});

const MyEventsView = memo(function MyEventsView({
  events, refreshing, onRefresh, onPressEvent, onNavigatePublish,
}: {
  events: any[];
  refreshing: boolean;
  onRefresh: () => void;
  onPressEvent: (id: string) => void;
  onNavigatePublish: () => void;
}) {
  // 拆分：正在参与 = 未结束的活动（recruiting/waiting/ongoing）
  const activeEvents = events.filter(
    (e: any) => e.status !== "finished" && e.status !== "cancelled"
  );
  const historyEvents = events.filter(
    (e: any) => e.status === "finished" || e.status === "cancelled"
  );

  const renderCard = (item: any, isActive: boolean) => {
    const typeInfo = item.typeId || {};
    const typeColor = typeInfo.color || colors.primary;
    return (
      <TouchableOpacity
        key={item._id}
        style={[myViewStyles.card, isActive ? myViewStyles.activeCard : myViewStyles.historyCard]}
        onPress={() => onPressEvent(item._id)}
        activeOpacity={0.7}
      >
        <View style={myViewStyles.cardBody}>
          <View style={myViewStyles.cardTop}>
            <Text style={myViewStyles.typeName}>{typeInfo.iconUrl || "📋"} {typeInfo.name || "活动"}</Text>
            <Text style={[myViewStyles.statusBadge, {
              color: item.status === "recruiting" ? colors.success :
                     item.status === "ongoing" ? colors.info :
                     item.status === "finished" ? colors.textHint : colors.warning
            }]}>
              {item.status === "recruiting" ? "🟢 招募中" :
               item.status === "waiting" ? "⏳ 等待开始" :
               item.status === "ongoing" ? "🔵 进行中" :
               item.status === "finished" ? "✅ 已结束" :
               item.status === "cancelled" ? "❌ 已取消" : item.status}
            </Text>
          </View>
          <Text style={myViewStyles.title} numberOfLines={1}>{item.title || "未命名活动"}</Text>
          <View style={myViewStyles.cardMeta}>
            <Text style={myViewStyles.metaItem}>📍 {item.locationText || "待定"}</Text>
            <Text style={myViewStyles.metaItem}>👤 {item.currentParticipants || 0}/{item.capacity || "∞"}</Text>
          </View>
          <Text style={myViewStyles.metaItem}>
            🕐 {item.startTime ? new Date(item.startTime).toLocaleString("zh-CN", {
              month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"
            }) : "待定"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 全空
  if (events.length === 0) {
    return (
      <ScrollView
        style={myViewStyles.emptyWrapper}
        contentContainerStyle={myViewStyles.emptyInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <Text style={{ fontSize: 48 }}>📭</Text>
        <Text style={{ color: colors.textHint, marginTop: spacing.md }}>暂无参与的活动</Text>
        <TouchableOpacity
          style={{ marginTop: spacing.xl, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.lg }}
          onPress={onNavigatePublish}
          activeOpacity={0.7}
        >
          <Text style={{ ...typography.bodyBold, color: "#FFF" }}>📝 去发布一个吧</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={myViewStyles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {/* ── 正在参与 ── */}
      {activeEvents.length > 0 && (
        <>
          <View style={myViewStyles.sectionHeader}>
            <Text style={myViewStyles.sectionEmoji}>🔥</Text>
            <Text style={myViewStyles.sectionTitle}>正在参与</Text>
            <Text style={myViewStyles.sectionCount}>{activeEvents.length} 个</Text>
          </View>
          <View style={[myViewStyles.sectionBar, { backgroundColor: colors.success }]} />
          {activeEvents.map((e: any) => renderCard(e, true))}
        </>
      )}

      {/* ── 历史记录 ── */}
      {historyEvents.length > 0 && (
        <>
          <View style={[myViewStyles.sectionHeader, activeEvents.length === 0 && { paddingTop: spacing.md }]}>
            <Text style={myViewStyles.sectionEmoji}>📋</Text>
            <Text style={myViewStyles.sectionTitle}>历史记录</Text>
            <Text style={myViewStyles.sectionCount}>{historyEvents.length} 个</Text>
          </View>
          <View style={[myViewStyles.sectionBar, { backgroundColor: colors.divider }]} />
          {historyEvents.map((e: any) => renderCard(e, false))}
        </>
      )}
    </ScrollView>
  );
});

// ═══════════════════════════════════════════════════════════
//  styles — 主组件样式
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  header: {
    paddingTop: 56,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    elevation: 4,
    zIndex: 10,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  headerSub: { ...typography.caption, color: colors.textHint, marginTop: 2 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  searchBtnText: { ...typography.bodyBold, color: "#FFF" },
  typeFilter: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  // ── 分段控件 ──
  segmentRow: {
    flexDirection: "row",
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: 3,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentTabActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: "#FFF",
    fontWeight: "800",
  },
});

// ═══════════════════════════════════════════════════════════
//  ActivitySquareScreen — 主组件
// ═══════════════════════════════════════════════════════════
export function ActivitySquareScreen({ navigation }: any) {
  const [events, setEvents] = useState<any[]>(EMPTY_EVENTS);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inputText, setInputText] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [showMyEvents, setShowMyEvents] = useState(false);
  const [myEvents, setMyEvents] = useState<any[]>(EMPTY_EVENTS);
  const [myEventsLoading, setMyEventsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ref 持有最新值，避免防抖闭包拿到过期 state
  const latestRef = useRef({ keyword: "", selectedTypeId: null as string | null });
  const mountedRef = useRef(true);
  // IME 组合输入标记：中文输入法进行中时置 true，阻止受控 value 覆盖中断 composition
  const isComposingRef = useRef(false);
  const composingTextRef = useRef("");

  const doFetch = useCallback(async (kw: string, tid: string | null, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else if (events.length === 0) setLoading(true);
    try {
      const res = await listEvents({
        keyword: kw.trim() || undefined,
        typeId: tid || undefined,
        limit: 50,
      });
      if (!mountedRef.current) return;
      if (res.success && res.data) {
        setEvents(res.data.events);
        setTotal(res.data.total);
      }
    } catch {} finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [events.length]);

  // 初始化
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const [typesRes] = await Promise.all([
          getEventTypes(),
          doFetch("", null),
        ]);
        if (!mountedRef.current) return;
        if (typesRes.success && typesRes.data) setTypes(typesRes.data);
      } catch {}
    })();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(() => {
    doFetch(latestRef.current.keyword, latestRef.current.selectedTypeId, true);
  }, [doFetch]);

  // IME 组合开始：标记 composition 状态，后续 onChangeText 不更新 state
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  // IME 组合结束：一次性提交最终文本，然后走防抖搜索
  const handleCompositionEnd = useCallback((e: any) => {
    isComposingRef.current = false;
    const text = e.nativeEvent?.text ?? composingTextRef.current;
    composingTextRef.current = "";
    setInputText(text);
    // 启动防抖搜索
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setKeyword(text);
      latestRef.current = { keyword: text, selectedTypeId: latestRef.current.selectedTypeId };
      doFetch(text, latestRef.current.selectedTypeId);
    }, 500);
  }, [doFetch]);

  const handleChangeText = useCallback((text: string) => {
    // IME 组合输入期间：只记录到 ref，不更新 state，避免受控 value 打断 composition
    if (isComposingRef.current) {
      composingTextRef.current = text;
      return;
    }
    setInputText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setKeyword(text);
      latestRef.current = { keyword: text, selectedTypeId: latestRef.current.selectedTypeId };
      doFetch(text, latestRef.current.selectedTypeId);
    }, 500);
  }, [doFetch]);

  const handleSubmitSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setKeyword(inputText);
    latestRef.current = { keyword: inputText, selectedTypeId: latestRef.current.selectedTypeId };
    doFetch(inputText, latestRef.current.selectedTypeId);
  }, [doFetch, inputText]);

  const handleSelectType = useCallback((typeId: string | null) => {
    setSelectedTypeId(typeId);
    latestRef.current = { keyword: latestRef.current.keyword, selectedTypeId: typeId };
    doFetch(latestRef.current.keyword, typeId);
  }, [doFetch]);

  const handlePressEvent = useCallback((eventId: string) => {
    navigation.navigate("EventDetail", { eventId });
  }, [navigation]);

  const handleNavigatePublish = useCallback(() => {
    navigation.navigate("PublishTab");
  }, [navigation]);

  // 获取"我参与的"活动
  const fetchMyEvents = useCallback(async () => {
    setMyEventsLoading(true);
    try {
      const res = await getMyEvents();
      if (!mountedRef.current) return;
      if (res.success && res.data) {
        setMyEvents(res.data);
      }
    } catch {} finally {
      if (mountedRef.current) setMyEventsLoading(false);
    }
  }, []);

  // 全屏首屏加载
  if (loading && events.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎪 活动广场</Text>
        {/* 分段控件 */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentTab, !showMyEvents && styles.segmentTabActive]}
            onPress={() => { setShowMyEvents(false); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, !showMyEvents && styles.segmentTextActive]}>🎪 活动广场</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentTab, showMyEvents && styles.segmentTabActive]}
            onPress={() => {
              setShowMyEvents(true);
              if (myEvents.length === 0) fetchMyEvents();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, showMyEvents && styles.segmentTextActive]}>🤝 我参与的</Text>
          </TouchableOpacity>
        </View>
        {!showMyEvents && (
          <Text style={styles.headerSub}>{total > 0 ? `共 ${total} 个活动` : ""}</Text>
        )}
      </View>

      {/* 搜索栏（仅在广场模式显示） */}
      {!showMyEvents && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 搜索活动名称、地点..."
            placeholderTextColor={colors.textHint}
            value={inputText}
            onChangeText={handleChangeText}
            // @ts-expect-error onCompositionStart/End 运行时支持（Web+Native），但 RN 0.85 类型声明尚未收录
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {inputText !== "" && (
            <TouchableOpacity style={styles.searchBtn} onPress={handleSubmitSearch} activeOpacity={0.7}>
              <Text style={styles.searchBtnText}>搜索</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 分类筛选（仅在广场模式显示） */}
      {!showMyEvents && (
        <View style={styles.typeFilter}>
          <ScrollableChips
            items={[
              { _id: null, name: "全部", iconUrl: "🎯", color: "#666" },
              ...types,
            ]}
            selectedId={selectedTypeId}
            onSelect={handleSelectType}
          />
        </View>
      )}

      {/* 我参与的：双区域视图 */}
      {showMyEvents && (
        <MyEventsView
          events={myEvents}
          refreshing={myEventsLoading}
          onRefresh={fetchMyEvents}
          onPressEvent={handlePressEvent}
          onNavigatePublish={handleNavigatePublish}
        />
      )}

      {/* 活动列表（仅在广场模式显示） */}
      {!showMyEvents && (
        <EventList
          events={events}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onPressEvent={handlePressEvent}
          keyword={keyword}
          selectedTypeId={selectedTypeId}
          onNavigatePublish={handleNavigatePublish}
        />
      )}
    </View>
  );
}
