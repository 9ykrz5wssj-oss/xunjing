import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Image, Platform, ScrollView, Pressable } from "react-native";
import * as Location from "expo-location";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

let WebView: any = () => null;
let NativeModules: any = null;
let DeviceEventEmitter: any = null;
if (Platform.OS !== "web") {
  try { const rn = require("react-native"); NativeModules = rn.NativeModules; DeviceEventEmitter = rn.DeviceEventEmitter; } catch {}
  try { WebView = require("react-native-webview").WebView; } catch {}
}
import { colors, typography, spacing, borderRadius } from "../../theme";
import { Campus, CAMPUS_NAMES, CAMPUS_BOUNDS } from "../../utils/constants";
import { getActiveChests } from "../../services/chest.api";
import { getActiveNotes } from "../../services/note.api";
import { getSocket, getCurrentSocket } from "../../socket/socketClient";
import api, { fixImageUrl } from "../../services/api";
import {
  getCachedLocation,
  setCachedLocation,
  getCachedChests,
  setCachedChests,
  getCachedEvents,
  setCachedEvents,
  getCachedBounds,
  setCachedBounds,
  CampusBoundData,
} from "../../utils/mapCache";

const CAMPUS_CENTERS: Record<Campus, { lng: number; lat: number; zoom: number }> = {
  gulou: { lng: 118.7750, lat: 32.0575, zoom: 16 },
  xianlin: { lng: 118.9500, lat: 32.1170, zoom: 15 },
  suzhou: { lng: 120.5230, lat: 31.3230, zoom: 15 },
};

export function MapScreen() {
  const navigation = useNavigation<any>();
  const [campus, setCampus] = useState<Campus>(Campus.GULOU);
  const [chests, setChests] = useState<any[]>([]);
  const [cooldowns, setCooldowns] = useState<{normal:number,advanced:number}>({normal:0,advanced:0});
  const [events, setEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteResult, setNoteResult] = useState<any>(null);
  const [showNoteResult, setShowNoteResult] = useState(false);
  const [mapState, setMapState] = useState<"loading" | "ready" | "failed">("loading");
  const [gpsLabel, setGpsLabel] = useState("");
  // 弹窗状态
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogData, setDialogData] = useState<{ type: "normalChest" | "advancedChest" | "event"; data: any } | null>(null);
  // 用户位置 & 开箱
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [unlockingChestId, setUnlockingChestId] = useState<string | null>(null);
  const [openResult, setOpenResult] = useState<{ success: boolean; error?: string; item?: any; rarity?: string } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [nearbyCounts, setNearbyCounts] = useState<Record<string, number>>({});
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [bounds, setBounds] = useState<Record<string, CampusBoundData>>(CAMPUS_BOUNDS);
  const socketRef = useRef<any>(null);

  // 从服务器获取校区边界
  useEffect(() => {
    (async () => {
      try { const cached = await getCachedBounds(); if (cached) { setBounds(cached); return; } } catch {}
      try {
        const res = await api.get("/map/campus-bounds");
        if ((res as any).success && (res as any).data) {
          const map: Record<string, CampusBoundData> = { ...CAMPUS_BOUNDS };
          ((res as any).data).forEach((c: any) => { map[c.campus] = { minLat: c.minLat, maxLat: c.maxLat, minLng: c.minLng, maxLng: c.maxLng }; });
          setBounds(map); setCachedBounds(map).catch(() => {});
        }
      } catch {}
    })();
  }, []);
  const wv = useRef<WebView>(null);
  const isFirstFocusRef = useRef(true);

  // ═══ 预加载缓存 ═══
  useEffect(() => {
    (async () => {
      const loc = await getCachedLocation();
      if (loc) {
        if (loc.campus !== Campus.GULOU) setCampus(loc.campus);
        // 不用缓存位置，等GPS新数据
      }
      // 预载宝箱和活动缓存
      const campusKey = loc?.campus || Campus.GULOU;
      const [ch, ev] = await Promise.all([
        getCachedChests(campusKey),
        getCachedEvents(campusKey),
      ]);
      if (ch) { setChests(ch.data.chests); setCooldowns(ch.data.cooldowns); }
      if (ev) { setEvents(ev.data); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WGS-84 → GCJ-02 坐标转换（与网页版MapScreen.tsx完全一致）
  const wgs84ToGcj02 = (lat: number, lng: number) => {
    const PI = Math.PI, A = 6378245, EE = 0.00669342162296594323;
    const tLat = (x: number, y: number): number => { let r = -100 + 2*x + 3*y + 0.2*y*y + 0.1*x*y + 0.2*Math.sqrt(Math.abs(x)); r += (20*Math.sin(6*x*PI)+20*Math.sin(2*x*PI))*2/3; r += (20*Math.sin(y*PI)+40*Math.sin(y/3*PI))*2/3; r += (160*Math.sin(y/12*PI)+320*Math.sin(y*PI/30))*2/3; return r; };
    const tLng = (x: number, y: number): number => { let r = 300 + x + 2*y + 0.1*x*x + 0.1*x*y + 0.1*Math.sqrt(Math.abs(x)); r += (20*Math.sin(6*x*PI)+20*Math.sin(2*x*PI))*2/3; r += (20*Math.sin(x*PI)+40*Math.sin(x/3*PI))*2/3; r += (150*Math.sin(x/12*PI)+300*Math.sin(x/30*PI))*2/3; return r; };
    const dLat = tLat(lng-105, lat-35); const dLng = tLng(lng-105, lat-35);
    const rad = lat/180*PI; let m = Math.sin(rad); m = 1-EE*m*m; const s = Math.sqrt(m);
    return { lat: lat+(dLat*180)/((A*(1-EE))/(m*s)*PI), lng: lng+(dLng*180)/(A/s*Math.cos(rad)*PI) };
  };

  // GPS定位：AMap原生（返回GCJ02）→ expo-location兜底（WGS84转GCJ02）
  useEffect(() => {
    let dead = false;
    let amapSub: any = null;
    let expoWatch: any = null;

    const update = (lat: number, lng: number) => {
      if (dead) return;
      setGpsLabel(`📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setUserLocation({ lat, lng });
      setCachedLocation({ lat, lng, campus });
      wv.current?.postMessage(JSON.stringify({ type: "userLoc", lat, lng }));
      const s = getCurrentSocket();
      if (s?.connected) s.emit("location_update", { lat, lng, campus });
    };

    // 高德原生模块（中国安卓最优方案，返回GCJ02无需转换）
    try {
      const { NativeModules: NM, DeviceEventEmitter: DEE } = require("react-native");
      if (NM.AMapLocationModule) {
        amapSub = DEE.addListener("AMapLocation", (data: any) => update(data.latitude, data.longitude));
        NM.AMapLocationModule.start();
      }
    } catch {}

    // expo-location兜底（iOS及无AMap设备）
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (dead || status !== "granted") return;
        setGpsLabel("📍 正在获取位置...");
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, timeout: 15000 });
        if (!dead && pos?.coords) {
          const gcj = wgs84ToGcj02(pos.coords.latitude, pos.coords.longitude);
          update(gcj.lat, gcj.lng);
        }
        expoWatch = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
          (pos: any) => { if (!dead && pos?.coords) { const gcj = wgs84ToGcj02(pos.coords.latitude, pos.coords.longitude); update(gcj.lat, gcj.lng); } }
        );
      } catch {}
    })();

    return () => { dead = true; if (amapSub) amapSub.remove(); if (expoWatch) expoWatch.remove(); try { const { NativeModules: NM } = require("react-native"); NM.AMapLocationModule?.stop(); } catch {} };
  }, []);

  // 缓存位置就绪后，若 WebView 已就绪 → 直接定位
  useEffect(() => {
    if (initialCenter && wv.current && mapState === "ready") {
      wv.current.postMessage(JSON.stringify({
        type: "moveTo",
        lat: initialCenter.lat,
        lng: initialCenter.lng,
        zoom: initialCenter.zoom,
      }));
    }
  }, [initialCenter, mapState]);

  const fetchAll = useCallback(async () => {
    try {
      const [cR, eR, nR] = await Promise.all([getActiveChests(campus), api.get("/map/activity-pins", { params: { campus } }), getActiveNotes(campus)]);
      const chestData = cR.data || [];
      const cooldownData = (cR as any).cooldowns || { normal: 0, advanced: 0 };
      const eventData = (eR as any)?.data || [];
      const noteData = nR.data || [];

      if (cR.success && cR.data) { setChests(chestData); setCooldowns(cooldownData);
        setCachedChests(campus, { chests: chestData, cooldowns: cooldownData });
      }
      if (eR && (eR as any).success) { setEvents(eventData);
        setCachedEvents(campus, eventData);
      }
      if (nR.success) setNotes(noteData);
      if (wv.current && mapState === "ready") {
        wv.current.postMessage(JSON.stringify({ type: "updateMarkers", chests: chestData, events: eventData, notes: noteData }));
      }
    } catch {}
  }, [campus, mapState]);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 20000); return () => clearInterval(t); }, [fetchAll]);

  // ═══ Tab 切回优化 ═══
  useFocusEffect(useCallback(() => {
    if (isFirstFocusRef.current) { isFirstFocusRef.current = false; return; }
    (async () => {
      const cachedCh = await getCachedChests(campus);
      const cachedEv = await getCachedEvents(campus);
      const now = Date.now();
      const fresh = (cachedCh && (now - cachedCh.timestamp) < 30000) &&
                    (cachedEv && (now - cachedEv.timestamp) < 30000);
      if (fresh) return;
      if (cachedCh) {
        setChests(cachedCh.data.chests);
        setCooldowns(cachedCh.data.cooldowns);
      }
      if (cachedEv) { setEvents(cachedEv.data); }
      if (wv.current && mapState === "ready") {
        wv.current.postMessage(JSON.stringify({
          type: "updateMarkers",
          chests: cachedCh?.data.chests || [],
          events: cachedEv?.data || [],
        }));
      }
      fetchAll();
    })();
  }, [campus, fetchAll, mapState]));

  // Socket 监听：开箱结果 & 附近人数
  useEffect(() => {
    (async () => {
      const s = await getSocket();
      if (!s) return;
      socketRef.current = s;
      s.on("chest_open_result", (data: any) => {
        setUnlockingChestId(null);
        if (data.success) {
          setOpenResult({ success: true, item: data.item, rarity: data.item?.rarity });
        } else {
          setOpenResult({ success: false, error: data.error });
        }
        setShowResultModal(true);
      });
      s.on("chest_player_count", (data: any) => {
        setNearbyCounts((prev) => ({ ...prev, [data.chestId]: data.currentCount }));
      });
      s.on("pickup_note_result", (d: any) => { if (d.success) { setNoteResult(d.data); setShowNoteResult(true); } else { setOpenResult({ success: false, error: d.error }); setShowResultModal(true); } });
      s.on("note_removed", (d: any) => { setNotes(p => { const n2 = p.filter(n => n._id !== d.noteId); fetchAll(); return n2; }); });
    })();
    return () => {
      const s = socketRef.current;
      if (s) { s.off("chest_open_result"); s.off("chest_player_count"); s.off("pickup_note_result"); s.off("note_removed"); }
    };
  }, []);

  const switchCampus = (c: Campus) => {
    setCampus(c);
    if (wv.current && mapState === "ready") {
      const b = bounds[c];
      wv.current.postMessage(JSON.stringify({ type: "fitBounds", minLat: b.minLat, minLng: b.minLng, maxLat: b.maxLat, maxLng: b.maxLng }));
    }
  };

  const handleMsg = (e: any) => {
    try {
      const d = JSON.parse(e.nativeEvent.data);
      if (d.type === "mapReady") { setMapState("ready"); const b = bounds[campus]; wv.current?.postMessage(JSON.stringify({ type: "init", minLat: b.minLat, minLng: b.minLng, maxLat: b.maxLat, maxLng: b.maxLng, chests, events, notes })); }
      if (d.type === "mapError") setMapState("failed");
      if (d.type === "chestClick") { const c = chests.find((x: any) => x._id === d.chestId); if (c) { setDialogData({ type: c.type === "advanced" ? "advancedChest" : "normalChest", data: { ...c, label: d.label } }); setDialogVisible(true); } }
      if (d.type === "eventClick") { const ev = events.find((x: any) => x._id === d.eventId); if (ev) { setDialogData({ type: "event", data: ev }); setDialogVisible(true); } }
      if (d.type === "noteClick") { const n = notes.find((x: any) => x._id === d.noteId); if (n) { setDialogData({ type: "note", data: n }); setDialogVisible(true); } }
      if (d.type === "userCoords") {
        setGpsLabel(`📍 ${d.lat.toFixed(6)}, ${d.lng.toFixed(6)}`);
        setUserLocation({ lat: d.lat, lng: d.lng });
        setCachedLocation({ lat: d.lat, lng: d.lng, campus });
        const s = getCurrentSocket();
        if (s?.connected) s.emit("location_update", { lat: d.lat, lng: d.lng, campus });
      }
      if (d.type === "geoError") { setGpsLabel(`⚠️ ${d.msg}`); }
    } catch {}
  };

  const nc = chests.filter((c: any) => c.type === "normal"); const ac = chests.filter((c: any) => c.type === "advanced");

  // 距离计算 (Haversine)
  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; const dLat = (lat2 - lat1) * Math.PI / 180; const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // 发起开箱请求
  const handleUnlockChest = async (chestId: string) => {
    const s = socketRef.current || await getSocket();
    if (!s?.connected) { setOpenResult({ success: false, error: "未连接到服务器" }); setShowResultModal(true); return; }
    if (!userLocation) { setOpenResult({ success: false, error: "无法获取您的位置" }); setShowResultModal(true); return; }
    setUnlockingChestId(chestId);
    setDialogVisible(false);
    // 先上报位置
    s.emit("location_update", { lat: userLocation.lat, lng: userLocation.lng, campus });
    // 发送开箱请求
    setTimeout(() => s.emit("chest_open_request", { chestId }), 300);
  };

  // 弹窗内容渲染
  const closeDialog = () => setDialogVisible(false);
  const renderNormalChestDialog = (chest: any) => {
    const dist = userLocation ? getDistance(userLocation.lat, userLocation.lng, chest.coordinates.lat, chest.coordinates.lng) : null;
    const inRange = dist != null && dist <= 20;
    return (
    <>
      <Text style={dlStyles.emoji}>📦</Text>
      <Text style={dlStyles.title}>{chest.label || "普通宝箱"}</Text>
      <View style={dlStyles.tagRow}>
        <View style={[dlStyles.tag, { backgroundColor: colors.success + "18" }]}>
          <Text style={[dlStyles.tagText, { color: colors.success }]}>🧑 单人</Text>
        </View>
        <View style={[dlStyles.tag, { backgroundColor: inRange ? colors.success + "18" : colors.info + "18" }]}>
          <Text style={[dlStyles.tagText, { color: inRange ? colors.success : colors.info }]}>{inRange ? "✅ 20米内可解锁" : "📡 20米内可解锁"}</Text>
        </View>
      </View>
      {dist != null && <Text style={dlStyles.distText}>📍 距离你 {dist}m</Text>}
      <Text style={dlStyles.desc}>靠近宝箱20米范围内即可解锁开启</Text>
      <Text style={dlStyles.hint}>开启后随机获得一件数字藏品</Text>
      {cooldowns.normal > 0 ? (
        <View style={{ backgroundColor: colors.warning + "15", borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, width: "100%", alignItems: "center" }}>
          <Text style={{ color: colors.warning, fontWeight: "700" }}>⏳ 冷却中 · {Math.floor(cooldowns.normal / 60)}分{cooldowns.normal % 60}秒后解锁</Text>
        </View>
      ) : inRange ? (
        <T style={dlStyles.unlockBtn} onPress={() => handleUnlockChest(chest._id)} activeOpacity={0.7}>
          <Text style={dlStyles.unlockBtnText}>🎁 解锁宝箱</Text>
        </T>
      ) : (
        <T style={dlStyles.primaryBtn} onPress={closeDialog} activeOpacity={0.7}>
          <Text style={dlStyles.primaryBtnText}>知道了</Text>
        </T>
      )}
    </>
  );};
  const renderAdvancedChestDialog = (chest: any) => {
    const dist = userLocation ? getDistance(userLocation.lat, userLocation.lng, chest.coordinates.lat, chest.coordinates.lng) : null;
    const inRange = dist != null && dist <= 20;
    const nCount = nearbyCounts[chest._id] ?? (chest.nearbyPlayers || 0);
    const needed = chest.requiredPlayers || 3;
    const enough = nCount >= needed;
    return (
    <>
      <Text style={dlStyles.emoji}>💎</Text>
      <Text style={dlStyles.title}>{chest.label || "高级宝箱"}</Text>
      <View style={dlStyles.tagRow}>
        <View style={[dlStyles.tag, { backgroundColor: colors.rarity.典藏 + "18" }]}>
          <Text style={[dlStyles.tagText, { color: colors.rarity.典藏 }]}>{needed <= 1 ? "🧑 单人可开" : `👥 需${needed}人组队`}</Text>
        </View>
        <View style={[dlStyles.tag, { backgroundColor: (inRange && enough) ? colors.success + "18" : colors.info + "18" }]}>
          <Text style={[dlStyles.tagText, { color: (inRange && enough) ? colors.success : colors.info }]}>{(inRange && enough) ? "✅ 可解锁" : "📡 20米内可解锁"}</Text>
        </View>
      </View>
      {dist != null && <Text style={dlStyles.distText}>📍 距离你 {dist}m</Text>}
      <View style={dlStyles.playerBox}>
        <Text style={dlStyles.playerCount}>👥 当前附近 <Text style={{ fontWeight: "900", fontSize: 22 }}>{nCount}</Text> 人</Text>
        <Text style={dlStyles.playerHint}>需{needed}人同时在20米范围内方可解锁</Text>
        <View style={dlStyles.progressBar}>
          <View style={[dlStyles.progressFill, { width: `${Math.min(100, (nCount / needed) * 100)}%`, backgroundColor: enough ? colors.success : colors.rarity.典藏 }]} />
        </View>
        <Text style={{ ...typography.small, color: enough ? colors.success : colors.textHint, marginTop: spacing.xs }}>{needed <= 1 ? "🧑 单人即可开启" : enough ? "✅ 人数已够，可以解锁！" : `还需 ${needed - nCount} 人`}</Text>
      </View>
      <Text style={dlStyles.hint}>多人协作开启后，每位参与者均可获得藏品</Text>
      {cooldowns.advanced > 0 && (
        <View style={{ backgroundColor: colors.warning + "15", borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, width: "100%", alignItems: "center" }}>
          <Text style={{ color: colors.warning, fontWeight: "700" }}>⏳ 冷却中 · {Math.floor(cooldowns.advanced / 60)}分{cooldowns.advanced % 60}秒后解锁</Text>
        </View>
      )}
      <View style={dlStyles.btnRow}>
        <T style={dlStyles.cancelBtn} onPress={closeDialog} activeOpacity={0.7}>
          <Text style={dlStyles.cancelBtnText}>关闭</Text>
        </T>
        <T style={[dlStyles.actionBtn, { backgroundColor: colors.info, flex: 1 }]} onPress={() => { const s = socketRef.current; if (s?.connected && userLocation) { s.emit("location_update", { lat: userLocation.lat, lng: userLocation.lng, campus }); } closeDialog(); setTimeout(() => { const c = chests.find((x: any) => x._id === chest._id); if (c) { setDialogData({ type: "advancedChest", data: { ...c, label: chest.label } }); setDialogVisible(true); } }, 500); }} activeOpacity={0.7}>
          <Text style={dlStyles.actionBtnText}>🔄 刷新</Text>
        </T>
        <T style={[dlStyles.actionBtn, { flex: 1.5 }, !enough && { opacity: 0.5 }]} onPress={() => enough && handleUnlockChest(chest._id)} activeOpacity={0.7}>
          <Text style={dlStyles.actionBtnText}>{enough ? "🎁 解锁" : needed <= 1 && inRange ? "🎁 解锁" : "⏳ 等待…"}</Text>
        </T>
      </View>
    </>
  );};
  const renderEventDialog = (ev: any) => (
    <>
      <Text style={dlStyles.emoji}>{ev.typeId?.iconUrl || "📌"}</Text>
      {ev.typeId?.name && (
        <Text style={{ ...typography.caption, color: ev.typeId?.color || colors.rarity.典藏, fontWeight: "700", marginBottom: 4 }}>{ev.typeId.name}</Text>
      )}
      <Text style={dlStyles.title}>{ev.title || "活动"}</Text>
      <View style={dlStyles.tagRow}>
        <View style={[dlStyles.tag, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[dlStyles.tagText, { color: colors.primary }]}>
            👤 {ev.currentParticipants || 0}/{ev.capacity || "∞"}人
          </Text>
        </View>
        {ev.status && (
          <View style={[dlStyles.tag, { backgroundColor: (ev.status === "recruiting" ? colors.success : ev.status === "ongoing" ? colors.info : colors.warning) + "18" }]}>
            <Text style={[dlStyles.tagText, { color: ev.status === "recruiting" ? colors.success : ev.status === "ongoing" ? colors.info : colors.warning }]}>
              {ev.status === "recruiting" ? "🟢 招募中" : ev.status === "waiting" ? "⏳ 等待开始" : ev.status === "ongoing" ? "🔵 进行中" : "⏳ 等待开始"}
            </Text>
          </View>
        )}
      </View>
      <View style={dlStyles.infoRow}>
        <Text style={dlStyles.infoLabel}>📍</Text>
        <Text style={dlStyles.infoValue}>{ev.locationText || "暂无位置信息"}</Text>
      </View>
      <View style={dlStyles.infoRow}>
        <Text style={dlStyles.infoLabel}>🕐</Text>
        <Text style={dlStyles.infoValue}>{ev.startTime ? new Date(ev.startTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "待定"}</Text>
      </View>
      {ev.description ? <Text style={dlStyles.desc}>{ev.description}</Text> : null}
      <View style={dlStyles.btnRow}>
        <T style={dlStyles.cancelBtn} onPress={closeDialog} activeOpacity={0.7}>
          <Text style={dlStyles.cancelBtnText}>取消</Text>
        </T>
        <T style={dlStyles.actionBtn} onPress={() => { closeDialog(); navigation.navigate("EventDetail", { eventId: ev._id }); }} activeOpacity={0.7}>
          <Text style={dlStyles.actionBtnText}>查看详情</Text>
        </T>
      </View>
    </>
  );

  // HTML: Leaflet + WebView原生GPS (小米走系统高德底层)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
*{margin:0;padding:0}html,body,#map{width:100%;height:100vh}
.normal-chest{filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))}
.adv-chest{filter:drop-shadow(0 3px 12px rgba(155,89,182,0.5)) drop-shadow(0 0 24px rgba(155,89,182,0.3));animation:glow 2.5s ease-in-out infinite}
@keyframes glow{0%,100%{filter:drop-shadow(0 3px 12px rgba(155,89,182,0.5)) drop-shadow(0 0 24px rgba(155,89,182,0.3))}50%{filter:drop-shadow(0 3px 18px rgba(155,89,182,0.8)) drop-shadow(0 0 36px rgba(155,89,182,0.5))}}
.loader{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,255,255,0.9);padding:20px 30px;border-radius:16px;text-align:center;z-index:9999;font-family:sans-serif}
.loader .s{width:30px;height:30px;border:3px solid #e0e0e0;border-top-color:#FF6B6B;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head><body>
<div id="map"></div><div class="loader" id="ldr"><div class="s"></div>加载地图</div>
<script>
var map, cl, ud;
var userLocFirst=true;
function showUL(lat,lng){
  if(ud){map.removeLayer(ud);}
  var ic=L.divIcon({className:'',html:'<div style="width:22px;height:22px;background:#3498DB;border:4px solid #fff;border-radius:50%;box-shadow:0 0 20px rgba(52,152,219,0.8),0 0 40px rgba(52,152,219,0.3);"></div>',iconSize:[30,30],iconAnchor:[15,15]});
  ud=L.marker([lat,lng],{icon:ic,zIndexOffset:9999}).addTo(map);
  if(userLocFirst){userLocFirst=false;/* GPS蓝点仅显示位置,不自动移动地图 */}
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'userCoords',lat:lat,lng:lng}));
}
// GPS完全由RN端expo-location负责，HTML不再自启定位
function init(){
  try{
    map=L.map('map',{center:[${CAMPUS_CENTERS.gulou.lat},${CAMPUS_CENTERS.gulou.lng}],zoom:${CAMPUS_CENTERS.gulou.zoom},zoomControl:false,attributionControl:false});
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',{subdomains:['1','2','3','4'],maxZoom:18,minZoom:3}).addTo(map);
    cl=L.layerGroup().addTo(map);L.control.zoom({position:'bottomright'}).addTo(map);
    map.fitBounds([[${bounds.gulou.minLat},${bounds.gulou.minLng}],[${bounds.gulou.maxLat},${bounds.gulou.maxLng}]]);
    document.getElementById('ldr').style.display='none';
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapReady'}));
    // 不在这里调startGPS，GPS完全由RN端的expo-location负责
  }catch(e){document.getElementById('ldr').innerHTML='加载失败';window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapError'}));}
}
function updateMarkers(chests,events,notes){
  if(!map)return;cl.clearLayers();
  (chests||[]).forEach(function(c,i){
    var a=c.type==='advanced';
    var svg=a?'<div class="adv-chest"><svg viewBox="0 0 40 42" width="40" height="42"><rect x="3" y="10" width="34" height="12" rx="6" fill="#9B59B6" stroke="#6C3483" stroke-width="2.5"/><rect x="3" y="10" width="34" height="5" rx="6" fill="#C39BD3"/><rect x="3" y="20" width="34" height="20" rx="6" fill="#7D3C98" stroke="#6C3483" stroke-width="2.5"/><circle cx="20" cy="30" r="4" fill="#DAA520"/><circle cx="20" cy="30" r="1.5" fill="#FFF8DC"/></svg></div>':'<div class="normal-chest"><svg viewBox="0 0 36 38" width="36" height="38"><rect x="2" y="8" width="32" height="12" rx="6" fill="#F5A623" stroke="#8B572A" stroke-width="2.5"/><rect x="2" y="8" width="32" height="5" rx="6" fill="#FAD27A"/><rect x="2" y="18" width="32" height="18" rx="6" fill="#E8961A" stroke="#8B572A" stroke-width="2.5"/><circle cx="18" cy="27" r="4" fill="#8B572A"/><rect x="17" y="23" width="2" height="9" rx="1" fill="#6B3F12"/></svg></div>';
    var ic=L.divIcon({className:'',html:svg,iconSize:a?[40,42]:[36,38],iconAnchor:a?[20,42]:[18,38]});
    var m=L.marker([c.coordinates.lat,c.coordinates.lng],{icon:ic});
    m.on('click',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'chestClick',chestId:c._id,label:(a?'💎高级#':'📦普通#')+(i+1)}));});
    cl.addLayer(m);
  });
  (events||[]).forEach(function(ev){
    var ec=ev.typeId&&ev.typeId.color?ev.typeId.color:'#3498DB';
    var pin='<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))"><svg viewBox="0 0 28 36" width="28" height="36"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="'+ec+'" stroke="#fff" stroke-width="2"/><circle cx="14" cy="13" r="5" fill="#fff"/></svg></div>';
    var ic=L.divIcon({className:'',html:pin,iconSize:[28,36],iconAnchor:[14,36]});
    var m=L.marker([ev.meetCoordinates.lat,ev.meetCoordinates.lng],{icon:ic});
    m.on('click',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'eventClick',eventId:ev._id}));});
    cl.addLayer(m);
  });
  (notes||[]).forEach(function(n){
    var noteHtml='<div style="filter:drop-shadow(0 3px 8px rgba(255,183,77,0.5))"><svg viewBox="0 0 32 40" width="32" height="40"><rect x="3" y="4" width="26" height="32" rx="3" fill="#FFE082" stroke="#F9A825" stroke-width="2"/><line x1="8" y1="12" x2="24" y2="12" stroke="#F9A825" stroke-width="1.5"/><line x1="8" y1="17" x2="22" y2="17" stroke="#F9A825" stroke-width="1.5"/><line x1="8" y1="22" x2="20" y2="22" stroke="#F9A825" stroke-width="1.5"/><rect x="10" y="36" width="12" height="3" rx="1" fill="#F9A825"/></svg></div>';
    var ic=L.divIcon({className:'',html:noteHtml,iconSize:[32,40],iconAnchor:[16,40]});
    var m=L.marker([n.coordinates.lat,n.coordinates.lng],{icon:ic});
    m.on('click',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'noteClick',noteId:n._id}));});
    cl.addLayer(m);
  });
}
document.addEventListener('message',function(e){
  try{
    var d=JSON.parse(e.data);
    if(d.type==='init'&&map){map.fitBounds([[d.minLat,d.minLng],[d.maxLat,d.maxLng]]);if(d.chests||d.events||d.notes)updateMarkers(d.chests,d.events,d.notes);}
    if(d.type==='moveTo'&&map){map.setView([d.lat,d.lng],d.zoom||16,{animate:true});if(d.chests||d.events||d.notes)updateMarkers(d.chests,d.events,d.notes);}
    if(d.type==='fitBounds'&&map){map.fitBounds([[d.minLat,d.minLng],[d.maxLat,d.maxLng]]);}
    if(d.type==='updateMarkers'&&map)updateMarkers(d.chests,d.events,d.notes);
    if(d.type==='userLoc'&&map)showUL(d.lat,d.lng);
    if(d.type==='centerOnUser'&&ud){var pos=ud.getLatLng();if(pos)map.setView([pos.lat,pos.lng],Math.max(map.getZoom(),16));}
  }catch(err){}
});
setTimeout(function(){if(!map){document.getElementById('ldr').innerHTML='加载超时';window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapError'}));}},25000);
init();
</script></body></html>`;

  return (
    <View style={styles.ct}>
      <View style={styles.tb}>
        <View style={styles.sw}>
          <T activeOpacity={0.7} onPress={() => switchCampus(Campus.GULOU)} style={[styles.sb, campus === Campus.GULOU && styles.sa]}><Text style={[styles.st, campus === Campus.GULOU && styles.sta]}>🏫 鼓楼</Text></T>
          <T activeOpacity={0.7} onPress={() => switchCampus(Campus.XIANLIN)} style={[styles.sb, campus === Campus.XIANLIN && styles.sa]}><Text style={[styles.st, campus === Campus.XIANLIN && styles.sta]}>🏢 仙林</Text></T>
          <T activeOpacity={0.7} onPress={() => switchCampus(Campus.SUZHOU)} style={[styles.sb, campus === Campus.SUZHOU && styles.sa]}><Text style={[styles.st, campus === Campus.SUZHOU && styles.sta]}>🏛️ 苏州</Text></T>
        </View>
      </View>
      {gpsLabel ? (
        <View style={styles.gb}>
          <Text style={styles.gt}>{gpsLabel}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        {mapState === "failed" ? <View style={styles.fb}><Text style={{ fontSize: 64 }}>🗺️</Text><Text style={{ color: "#999", marginTop: 16 }}>地图加载失败</Text><T style={styles.rbtn} onPress={() => setMapState("loading")}><Text style={{ color: colors.primary, fontWeight: "700" }}>🔄 重试</Text></T></View> :
          <WebView ref={wv} source={{ html }} style={{ flex: 1 }} onMessage={handleMsg} javaScriptEnabled domStorageEnabled geolocationEnabled />
        }
        {mapState === "loading" && <View style={styles.lo}><ActivityIndicator size="large" color={colors.primary} /></View>}
        <T style={styles.rf} onPress={fetchAll} activeOpacity={0.7}>
          <Text style={{ fontWeight: "700", color: "#FFF", fontSize: 13 }}>🔄 刷新</Text>
        </T>
        <View style={styles.cs}>
          <View style={styles.ctr}><Text style={styles.ci}>📦</Text><Text style={styles.cn}>{nc.length}</Text></View>
          <View style={[styles.ctr, styles.ca]}><Text style={styles.ci}>💎</Text><Text style={styles.cn}>{ac.length}</Text></View>
        </View>
        <T style={styles.noteBtn} onPress={() => { if (userLocation) { (navigation as any).navigate("WriteNote", { userLocation, campus }); } }} activeOpacity={0.7}>
          <Text style={{ fontSize: 20 }}>📝</Text>
        </T>
        <T style={styles.locBtn} onPress={() => { wv.current?.postMessage(JSON.stringify({ type: "centerOnUser" })); }} activeOpacity={0.7}>
          <Text style={{ fontSize: 20 }}>📍</Text>
        </T>
      </View>
      {/* 宝箱/活动弹窗 */}
      <Modal visible={dialogVisible} transparent animationType="fade" onRequestClose={closeDialog}>
        <T style={dlStyles.overlay} activeOpacity={1} onPress={closeDialog}>
          <T style={dlStyles.card} activeOpacity={1} onPress={() => {}}>
            {dialogData?.type === "normalChest" && renderNormalChestDialog(dialogData.data)}
            {dialogData?.type === "advancedChest" && renderAdvancedChestDialog(dialogData.data)}
            {dialogData?.type === "event" && renderEventDialog(dialogData.data)}
            {dialogData?.type === "note" && (() => { const n = dialogData.data; const dist = userLocation ? (() => { const R=6371000; const dLat=(n.coordinates.lat-userLocation.lat)*Math.PI/180; const dLng=(n.coordinates.lng-userLocation.lng)*Math.PI/180; const x=Math.sin(dLat/2)**2+Math.cos(userLocation.lat*Math.PI/180)*Math.cos(n.coordinates.lat*Math.PI/180)*Math.sin(dLng/2)**2; return Math.round(R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))); })():null; const inR = dist!=null&&dist<=20;
              return <View style={{width:"100%",alignItems:"center"}}><Text style={dlStyles.emoji}>📝</Text><Text style={dlStyles.title}>一张纸条</Text>{dist!=null&&<Text style={{textAlign:"center",marginTop:8,fontWeight:"700",color:colors.textHint}}>📍 距离你 {dist}m</Text>}<Text style={dlStyles.hint}>踏进二十步之内，便能拾起这片心情</Text>{inR?<T style={{backgroundColor:"#F56C6C",borderRadius:20,paddingVertical:16,width:"100%",alignItems:"center",marginTop:4}} onPress={async()=>{const s=socketRef.current||await getSocket();if(!s?.connected||!userLocation)return;setDialogVisible(false);s.emit("location_update",{lat:userLocation.lat,lng:userLocation.lng,campus});setTimeout(()=>s.emit("pickup_note",{noteId:n._id}),300);}}><Text style={{color:"#FFFFFF",fontWeight:"800",fontSize:17}}>📋 捡起这张纸条</Text></T>:<T style={dlStyles.cancelBtn} onPress={closeDialog}><Text style={dlStyles.cancelBtnText}>知道了</Text></T>}</View>;
            })()}
          </T>
        </T>
      </Modal>
      {/* 开箱结果弹窗 */}
      <Modal visible={showResultModal} transparent animationType="fade" onRequestClose={() => { setShowResultModal(false); setOpenResult(null); }}>
        <T style={dlStyles.overlay} activeOpacity={1} onPress={() => { setShowResultModal(false); setOpenResult(null); }}>
          <T style={dlStyles.card} activeOpacity={1} onPress={() => {}}>
            {openResult?.success ? (
              <View style={[resultStyles.successCard, { borderColor: RCOLORS[openResult.rarity] || colors.primary }]}>
                <Text style={[resultStyles.rarityBadge, { backgroundColor: (RCOLORS[openResult.rarity] || colors.primary) + "20" }]}>
                  <Text style={{ color: RCOLORS[openResult.rarity] || colors.primary, fontWeight: "800", fontSize: 15 }}>{openResult.rarity}</Text>
                </Text>
                <Text style={resultStyles.congrats}>🎉 恭喜获得 🎉</Text>
                {openResult.item?.imageUrl ? (
                  <Image source={{ uri: fixImageUrl(openResult.item.imageUrl) }} style={resultStyles.itemImage} resizeMode="contain" />
                ) : null}
                <Text style={resultStyles.itemName2}>{openResult.item?.name || "藏品"}</Text>
                <View style={resultStyles.divider} />
                <Text style={resultStyles.collectHint}>已收入你的展柜，快去看看吧！</Text>
                <T style={[resultStyles.doneBtn, { backgroundColor: RCOLORS[openResult.rarity] || colors.primary }]} onPress={() => { setShowResultModal(false); setOpenResult(null); }} activeOpacity={0.7}>
                  <Text style={resultStyles.doneBtnText}>太棒了！</Text>
                </T>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 56, marginBottom: spacing.md }}>😢</Text>
                <Text style={dlStyles.title}>开箱失败</Text>
                <Text style={dlStyles.desc}>{openResult?.error || "请稍后再试"}</Text>
                <T style={dlStyles.primaryBtn} onPress={() => { setShowResultModal(false); setOpenResult(null); }} activeOpacity={0.7}>
                  <Text style={dlStyles.primaryBtnText}>知道了</Text>
                </T>
              </>
            )}
          </T>
        </T>
      </Modal>
      {/* 纸条拾取结果 */}
      <Modal visible={showNoteResult} transparent animationType="fade" onRequestClose={() => setShowNoteResult(false)}>
        <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.6)",justifyContent:"center",alignItems:"center",padding:24}}>
          <View style={dlStyles.card}>
            {noteResult && <View style={{alignItems:"center",width:"100%"}}>
              <Text style={{fontSize:56,marginBottom:12}}>📜</Text>
              <View style={{backgroundColor:"#FFF9E6",borderRadius:16,borderWidth:1,borderColor:"#E6D5A8",width:"100%",height:200}}>
                <ScrollView style={{flex:1}} nestedScrollEnabled contentContainerStyle={{padding:18}}>
                  <Text style={{fontSize:16,lineHeight:26,color:"#4A3728"}}>{noteResult.content}</Text>
                </ScrollView>
              </View>
              {!noteResult.isAnonymous && <View style={{flexDirection:"row",alignItems:"center",marginTop:14,gap:8}}>
                <View style={{width:32,height:32,borderRadius:16,backgroundColor:"#E8D5B7",alignItems:"center",justifyContent:"center"}}><Text style={{fontSize:16}}>👤</Text></View>
                <View><Text style={{fontWeight:"700",fontSize:14,color:"#4A3728"}}>{noteResult.authorNickname}</Text>{noteResult.authorNumericId > 0 ? <Text style={{fontSize:11,color:"#9B8C7C"}}>ID {noteResult.authorNumericId}</Text> : null}</View>
              </View>}
              <View style={{flexDirection:"row",marginTop:14,gap:24}}>
                <Text style={{fontSize:11,color:"#9B8C7C"}}>🕐 {new Date(noteResult.createdAt).toLocaleString("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})} 留下</Text>
                <Text style={{fontSize:11,color:"#9B8C7C"}}>📋 {new Date(noteResult.pickedAt).toLocaleString("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})} 拾取</Text>
              </View>
              <T style={{backgroundColor:"#C8956C",borderRadius:20,paddingVertical:16,width:"100%",alignItems:"center",marginTop:18}} onPress={() => setShowNoteResult(false)}>
                <Text style={{color:"#FFFFFF",fontWeight:"800",fontSize:16}}>📋 收起纸条</Text>
              </T>
            </View>}
          </View>
        </View>
      </Modal>
      {/* 开箱加载中 */}
      {unlockingChestId && (
        <View style={resultStyles.loadingOverlay}>
          <View style={resultStyles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ ...typography.bodyBold, color: colors.textPrimary, marginTop: spacing.lg }}>正在开启宝箱...</Text>
            <Text style={{ ...typography.caption, color: colors.textHint, marginTop: spacing.xs }}>请稍候</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const RCOLORS: Record<string, string> = { "典藏": "#9B59B6", "神秘": "#FF6B6B", "限定": "#E74C3C", "高端": "#F39C12", "普通": "#3498DB", "常见": "#27AE60" };
const T = TouchableOpacity;
const styles = StyleSheet.create({
  ct: { flex: 1, backgroundColor: colors.background },
  tb: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: "#fff", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, elevation: 8, zIndex: 20 },
  sw: { flexDirection: "row", backgroundColor: "#f0f0f0", borderRadius: 16, padding: 4 },
  sb: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  sa: { backgroundColor: colors.primary },
  st: { fontWeight: "700", color: "#999" },
  sta: { color: "#fff" },
  gb: { backgroundColor: "rgba(52,152,219,0.9)", paddingVertical: 4, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  gt: { color: "#fff", fontWeight: "700", fontSize: 12, fontFamily: "monospace" },
  gr: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  grt: { color: "#fff", fontWeight: "700", fontSize: 11 },
  fb: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#E8F0E0" },
  lo: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "#E8F0E0" },
  cs: { position: "absolute", top: 12, right: 12, gap: 8, alignItems: "flex-end" },
  sqBtn: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, elevation: 4 },
  locBtn: { position: "absolute", bottom: 120, right: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 24, width: 48, height: 48, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, zIndex: 30 },
  noteBtn: { position: "absolute", bottom: 180, right: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,224,130,0.95)", borderRadius: 24, width: 48, height: 48, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, zIndex: 30 },
  ctr: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, elevation: 4 },
  ca: { borderWidth: 1.5, borderColor: colors.rarity.典藏 + "50" },
  ci: { fontSize: 22 }, cn: { fontWeight: "800", fontSize: 18, color: "#333" },
  rf: { position: "absolute", top: 12, left: 12, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, elevation: 6, zIndex: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  rbtn: { marginTop: 16, backgroundColor: "#fff", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});

const dlStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: spacing.xxxl },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xxl, width: "100%", maxWidth: 340, alignItems: "center" },
  emoji: { fontSize: 56, marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md, textAlign: "center", fontWeight: "800" },
  tagRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg, flexWrap: "wrap", justifyContent: "center" },
  tag: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full },
  tagText: { fontWeight: "700", fontSize: 13 },
  desc: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.sm, lineHeight: 22 },
  hint: { ...typography.caption, color: colors.textHint, textAlign: "center", marginBottom: spacing.xl },
  playerBox: { backgroundColor: colors.rarity.典藏 + "08", borderRadius: borderRadius.lg, padding: spacing.lg, width: "100%", marginBottom: spacing.md, alignItems: "center", borderWidth: 1, borderColor: colors.rarity.典藏 + "20" },
  playerCount: { fontWeight: "800", fontSize: 18, color: colors.rarity.典藏, marginBottom: spacing.xs },
  playerHint: { ...typography.caption, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.sm },
  progressBar: { width: "100%", height: 6, backgroundColor: colors.rarity.典藏 + "20", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.rarity.典藏, borderRadius: 3 },
  infoRow: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: spacing.sm, paddingHorizontal: spacing.sm },
  infoLabel: { fontSize: 16, marginRight: spacing.sm, width: 28, textAlign: "center" },
  infoValue: { ...typography.body, color: colors.textPrimary, flex: 1 },
  btnRow: { flexDirection: "row", gap: spacing.md, width: "100%", marginTop: spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.xl, alignItems: "center", backgroundColor: colors.surfaceAlt },
  cancelBtnText: { ...typography.button, color: colors.textSecondary, fontWeight: "600" },
  actionBtn: { flex: 1.5, paddingVertical: spacing.md, borderRadius: borderRadius.xl, alignItems: "center", backgroundColor: colors.primary },
  actionBtnText: { ...typography.button, color: "#FFF", fontWeight: "700" },
  primaryBtn: { width: "100%", paddingVertical: spacing.md, borderRadius: borderRadius.xl, alignItems: "center", backgroundColor: colors.primary, marginTop: spacing.xs },
  primaryBtnText: { ...typography.button, color: "#FFF", fontWeight: "700" },
  distText: { ...typography.body, color: colors.info, textAlign: "center", fontWeight: "700", marginBottom: spacing.sm },
  unlockBtn: { width: "100%", paddingVertical: spacing.md + 2, borderRadius: borderRadius.xl, alignItems: "center", backgroundColor: colors.success, marginTop: spacing.xs, shadowColor: colors.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  unlockBtnText: { ...typography.button, color: "#FFF", fontWeight: "800", fontSize: 18 },
});

const resultStyles = StyleSheet.create({
  successCard: { width: "100%", borderWidth: 3, borderRadius: borderRadius.xl + 4, padding: spacing.xxl, alignItems: "center", backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  glowEmoji: { fontSize: 36, position: "absolute", top: -18, right: 16 },
  rarityBadge: { paddingHorizontal: spacing.xl, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, marginBottom: spacing.sm },
  congrats: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.lg },
  itemImage: { width: 160, height: 160, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  itemName2: { ...typography.h3, color: colors.textPrimary, textAlign: "center", fontWeight: "800", marginBottom: spacing.md },
  divider: { width: "60%", height: 1, backgroundColor: colors.divider, marginBottom: spacing.md },
  collectHint: { ...typography.caption, color: colors.textHint, textAlign: "center", marginBottom: spacing.xl },
  doneBtn: { width: "100%", paddingVertical: spacing.md, borderRadius: borderRadius.xl, alignItems: "center" },
  doneBtnText: { ...typography.button, color: "#FFF", fontWeight: "800", fontSize: 18 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", zIndex: 100 },
  loadingCard: { backgroundColor: "#FFF", borderRadius: borderRadius.xl, padding: spacing.xxxl, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
});
