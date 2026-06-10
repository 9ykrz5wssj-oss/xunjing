import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Image, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { Campus } from "../../utils/constants";
import { getActiveChests } from "../../services/chest.api";
import { getSocket, getCurrentSocket } from "../../socket/socketClient";
import api, { fixImageUrl } from "../../services/api";

const CAMPUS_CENTERS: Record<Campus, { lng: number; lat: number; zoom: number }> = {
  gulou: { lng: 118.7750, lat: 32.0575, zoom: 16 },
  xianlin: { lng: 118.9500, lat: 32.1170, zoom: 15 },
};

// WGS-84 → GCJ-02（浏览器GPS转高德坐标系）
const PI = Math.PI, A = 6378245.0, EE = 0.00669342162296594323;
const _tLat = (x: number, y: number): number => { let r = -100 + 2*x + 3*y + 0.2*y*y + 0.1*x*y + 0.2*Math.sqrt(Math.abs(x)); r += (20*Math.sin(6*x*PI)+20*Math.sin(2*x*PI))*2/3; r += (20*Math.sin(y*PI)+40*Math.sin(y/3*PI))*2/3; r += (160*Math.sin(y/12*PI)+320*Math.sin(y*PI/30))*2/3; return r; };
const _tLng = (x: number, y: number): number => { let r = 300 + x + 2*y + 0.1*x*x + 0.1*x*y + 0.1*Math.sqrt(Math.abs(x)); r += (20*Math.sin(6*x*PI)+20*Math.sin(2*x*PI))*2/3; r += (20*Math.sin(x*PI)+40*Math.sin(x/3*PI))*2/3; r += (150*Math.sin(x/12*PI)+300*Math.sin(x/30*PI))*2/3; return r; };
const wgs84ToGcj02 = (lat: number, lng: number) => { const dLat = _tLat(lng-105, lat-35); const dLng = _tLng(lng-105, lat-35); const rad = lat/180*PI; let m = Math.sin(rad); m = 1-EE*m*m; const s = Math.sqrt(m); return { lat: lat+(dLat*180)/((A*(1-EE))/(m*s)*PI), lng: lng+(dLng*180)/(A/s*Math.cos(rad)*PI) }; };

let L: any = null;
const loadLeaflet = () => new Promise<any>((resolve) => {
  if (typeof window === "undefined") return resolve(null);
  if ((window as any).L) return resolve((window as any).L);
  const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(link);
  const s = document.createElement("script"); s.src = "https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.js"; s.onload = () => resolve((window as any).L); s.onerror = () => resolve(null); document.head.appendChild(s);
});

export function MapScreen() {
  const navigation = useNavigation<any>();
  const [campus, setCampus] = useState<Campus>(Campus.GULOU);
  const [chests, setChests] = useState<any[]>([]);
  const [cooldowns, setCooldowns] = useState<{normal:number,advanced:number}>({normal:0,advanced:0});
  const [events, setEvents] = useState<any[]>([]);
  const [gpsLabel, setGpsLabel] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogData, setDialogData] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [unlockingChestId, setUnlockingChestId] = useState<string | null>(null);
  const [openResult, setOpenResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [nearbyCounts, setNearbyCounts] = useState<Record<string, number>>({});
  const socketRef = useRef<any>(null); const mapRef = useRef<any>(null); const markersRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null); const divRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => { if (!divRef.current || mapRef.current) return; let c = false;
    loadLeaflet().then((leaf) => { if (c || !leaf || !divRef.current) return; L = leaf;
      const ct = CAMPUS_CENTERS[campus];
      const map = L.map(divRef.current, { center: [ct.lat, ct.lng], zoom: ct.zoom, zoomControl: false, attributionControl: false });
      L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", { subdomains: ["1","2","3","4"], maxZoom: 18, minZoom: 3 }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map); markersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map; setMapReady(true); setTimeout(() => map.invalidateSize(), 200);
    }); return () => { c = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => { if (!navigator?.geolocation) return; let first = true;
    const updatePos = (lat: number, lng: number) => {
      const gcj = wgs84ToGcj02(lat, lng);
      setGpsLabel(`📍 ${gcj.lat.toFixed(6)}, ${gcj.lng.toFixed(6)}`); setUserLocation(gcj);
      if (mapRef.current && L) { if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
        const icon = L.divIcon({ className: "", html: '<div style="width:22px;height:22px;background:#3498DB;border:4px solid #fff;border-radius:50%;box-shadow:0 0 20px rgba(52,152,219,0.8);"></div>', iconSize: [30,30], iconAnchor: [15,15] });
        userMarkerRef.current = L.marker([gcj.lat, gcj.lng], { icon, zIndexOffset: 9999 }).addTo(mapRef.current);
        if (first) { first = false; mapRef.current.setView([gcj.lat, gcj.lng], Math.max(mapRef.current.getZoom(), 16)); }
      }
      const s = getCurrentSocket(); if (s?.connected) s.emit("location_update", { lat: gcj.lat, lng: gcj.lng, campus });
    };
    const id = navigator.geolocation.watchPosition(
      (pos) => updatePos(pos.coords.latitude, pos.coords.longitude),
      () => setGpsLabel("⚠ GPS失败"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => updatePos(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }, 10000);
    return () => { navigator.geolocation?.clearWatch(id); clearInterval(interval); };
  }, [campus]);

  const fetchAll = useCallback(async () => { try {
    const [cR, eR] = await Promise.all([getActiveChests(campus), api.get("/map/activity-pins", { params: { campus } })]);
    if (cR.success && cR.data) { setChests(cR.data); setCooldowns((cR as any).cooldowns || {normal:0,advanced:0}); }; if (eR && (eR as any).success) setEvents((eR as any).data || []);
    updateMarkers(cR.data || [], (eR as any)?.data || []);
  } catch {} }, [campus]);
  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 20000); return () => clearInterval(t); }, [fetchAll]);

  useEffect(() => { (async () => { const s = await getSocket(); if (!s) return; socketRef.current = s;
    s.on("chest_open_result", (d: any) => { setUnlockingChestId(null); setOpenResult(d.success ? { success: true, item: d.item, rarity: d.item?.rarity } : { success: false, error: d.error }); setShowResultModal(true); });
    s.on("chest_player_count", (d: any) => { setNearbyCounts(p => ({ ...p, [d.chestId]: d.currentCount })); });
  })(); return () => { const s = socketRef.current; if (s) { s.off("chest_open_result"); s.off("chest_player_count"); } }; }, []);

  const updateMarkers = (ch: any[], ev: any[]) => { if (!markersRef.current || !L) return; markersRef.current.clearLayers();
    ch.forEach((c, i) => { const a = c.type === "advanced";
      const svg = a ? `<div style="filter:drop-shadow(0 3px 12px rgba(155,89,182,0.5))"><svg viewBox="0 0 40 42" width="40" height="42"><rect x="3" y="10" width="34" height="12" rx="6" fill="#9B59B6" stroke="#6C3483" stroke-width="2.5"/><rect x="3" y="10" width="34" height="5" rx="6" fill="#C39BD3"/><rect x="3" y="20" width="34" height="20" rx="6" fill="#7D3C98" stroke="#6C3483" stroke-width="2.5"/><circle cx="20" cy="30" r="4" fill="#DAA520"/></svg></div>` : `<div style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3))"><svg viewBox="0 0 36 38" width="36" height="38"><rect x="2" y="8" width="32" height="12" rx="6" fill="#F5A623" stroke="#8B572A" stroke-width="2.5"/><rect x="2" y="18" width="32" height="18" rx="6" fill="#E8961A" stroke="#8B572A" stroke-width="2.5"/><circle cx="18" cy="27" r="4" fill="#8B572A"/></svg></div>`;
      const icon = L.divIcon({ className: "", html: svg, iconSize: a ? [40,42] : [36,38], iconAnchor: a ? [20,42] : [18,38] });
      const m = L.marker([c.coordinates.lat, c.coordinates.lng], { icon }); m.on("click", () => { setDialogData({ type: c.type === "advanced" ? "advancedChest" : "normalChest", data: { ...c, label: (a ? "💎#" : "📦#") + (i+1) } }); setDialogVisible(true); }); markersRef.current.addLayer(m);
    });
    ev.forEach((e) => { const ec = e.typeId?.color || "#3498DB";
      const pin = `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))"><svg viewBox="0 0 28 36" width="28" height="36"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="${ec}" stroke="#fff" stroke-width="2"/><circle cx="14" cy="13" r="5" fill="#fff"/></svg></div>`;
      const icon = L.divIcon({ className: "", html: pin, iconSize: [28,36], iconAnchor: [14,36] });
      const m = L.marker([e.meetCoordinates.lat, e.meetCoordinates.lng], { icon }); m.on("click", () => { setDialogData({ type: "event", data: e }); setDialogVisible(true); }); markersRef.current.addLayer(m);
    });
  };

  const getDist = (a: number, b: number, c: number, d: number) => { const R = 6371000; const dLat = (c-a)*Math.PI/180; const dLng = (d-b)*Math.PI/180; const x = Math.sin(dLat/2)**2 + Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLng/2)**2; return Math.round(R*2*Math.atan2(Math.sqrt(x), Math.sqrt(1-x))); };
  const handleUnlock = async (id: string) => { const s = socketRef.current || await getSocket(); if (!s?.connected || !userLocation) return; setUnlockingChestId(id); setDialogVisible(false); s.emit("location_update", { lat: userLocation.lat, lng: userLocation.lng, campus }); setTimeout(() => s.emit("chest_open_request", { chestId: id }), 300); };
  const closeDialog = () => setDialogVisible(false);
  const nc = chests.filter((c: any) => c.type === "normal"); const ac = chests.filter((c: any) => c.type === "advanced");
  const RCOLORS: Record<string, string> = { "典藏": "#9B59B6", "神秘": "#FF6B6B", "限定": "#E74C3C", "高端": "#F39C12", "普通": "#3498DB", "常见": "#27AE60" };

  const T = TouchableOpacity;
  return (
    <View style={S.ct}>
      <View style={S.tb}><View style={S.sw}>
        <T onPress={() => { setCampus(Campus.GULOU); mapRef.current?.setView([CAMPUS_CENTERS.gulou.lat, CAMPUS_CENTERS.gulou.lng], 16); }} style={[S.sb, campus === Campus.GULOU && S.sa]}><Text style={[S.st, campus === Campus.GULOU && S.sta]}>🏫 鼓楼</Text></T>
        <T onPress={() => { setCampus(Campus.XIANLIN); mapRef.current?.setView([CAMPUS_CENTERS.xianlin.lat, CAMPUS_CENTERS.xianlin.lng], 15); }} style={[S.sb, campus === Campus.XIANLIN && S.sa]}><Text style={[S.st, campus === Campus.XIANLIN && S.sta]}>🏢 仙林</Text></T>
      </View></View>
      {gpsLabel ? <View style={S.gb}><Text style={S.gt}>{gpsLabel}</Text></View> : null}
      <View style={{ flex: 1 }}>
        <View ref={divRef} style={{ flex: 1 }} />
        <T style={S.rf} onPress={fetchAll}><Text style={{ fontWeight: "700", color: "#FFF", fontSize: 13 }}>🔄 刷新</Text></T>
        <View style={S.cs}>
          <View style={S.ctr}><Text style={S.ci}>📦</Text><Text style={S.cn}>{nc.length}</Text></View>
          <View style={[S.ctr, S.ca]}><Text style={S.ci}>💎</Text><Text style={S.cn}>{ac.length}</Text></View>
          <T style={S.sqBtn} onPress={() => (navigation as any).navigate("ActivitySquare")}><Text style={{ fontSize: 14 }}>🎪</Text><Text style={{ fontSize: 10, fontWeight: "800", color: colors.primary }}>活动广场</Text></T>
        </View>
        <T style={S.locBtn} onPress={() => { if (mapRef.current && userMarkerRef.current) { const p = userMarkerRef.current.getLatLng(); mapRef.current.setView([p.lat, p.lng], Math.max(mapRef.current.getZoom(), 16)); } }}><Text style={{ fontSize: 20 }}>📍</Text></T>
      </View>
      <Modal visible={dialogVisible} transparent animationType="fade"><T style={D.ov} activeOpacity={1} onPress={closeDialog}><T style={D.cd} activeOpacity={1} onPress={() => {}}>
        {dialogData?.type === "normalChest" && (() => { const c = dialogData.data; const dist = userLocation ? getDist(userLocation.lat, userLocation.lng, c.coordinates.lat, c.coordinates.lng) : null; const inR = dist != null && dist <= 20;
          return <><Text style={D.ej}>📦</Text><Text style={D.tl}>普通宝箱</Text><Text style={{fontSize:16,fontWeight:"800",color:colors.primary,marginBottom:8}}>{c.label}</Text><View style={D.tr}><View style={[D.tg, { backgroundColor: colors.success + "18" }]}><Text style={[D.tt, { color: colors.success }]}>🧑 单人</Text></View><View style={[D.tg, { backgroundColor: inR ? colors.success + "18" : colors.info + "18" }]}><Text style={[D.tt, { color: inR ? colors.success : colors.info }]}>{inR ? "✅ 可解锁" : "📡 20米内"}</Text></View></View>{dist != null && <Text style={D.dt}>📍 距离你 {dist}m</Text>}<Text style={D.dc}>靠近20米即可解锁开启</Text>{inR ? <T style={D.ub} onPress={() => handleUnlock(c._id)}><Text style={D.ut}>🎁 解锁宝箱</Text></T> : <T style={D.pb} onPress={closeDialog}><Text style={D.pt}>知道了</Text></T>}</>;
        })()}
        {dialogData?.type === "advancedChest" && (() => { const c = dialogData.data; const dist = userLocation ? getDist(userLocation.lat, userLocation.lng, c.coordinates.lat, c.coordinates.lng) : null; const inR = dist != null && dist <= 20; const n = nearbyCounts[c._id] ?? 0; const nd = c.requiredPlayers || 3; const en = n >= nd || nd <= 1;
          return <><Text style={D.ej}>💎</Text><Text style={D.tl}>高级宝箱</Text><Text style={{fontSize:16,fontWeight:"800",color:colors.primary,marginBottom:8}}>{c.label}</Text><View style={D.tr}><View style={[D.tg, { backgroundColor: colors.rarity.典藏 + "18" }]}><Text style={[D.tt, { color: colors.rarity.典藏 }]}>{nd <= 1 ? "🧑 单人" : `👥 需${nd}人`}</Text></View><View style={[D.tg, { backgroundColor: en ? colors.success + "18" : colors.info + "18" }]}><Text style={[D.tt, { color: en ? colors.success : colors.info }]}>{en ? "✅ 可解锁" : "📡 20米内"}</Text></View></View>{dist != null && <Text style={D.dt}>📍 距离你 {dist}m</Text>}<View style={D.pbox}><Text style={D.pc}>👥 当前 {n} 人 / 需 {nd} 人</Text><View style={D.pr}><View style={[D.pf, { width: `${Math.min(100,(n/nd)*100)}%`, backgroundColor: en ? colors.success : colors.rarity.典藏 }]} /></View></View><View style={{ flexDirection: "row", gap: 8, width: "100%" }}><T style={[D.btn, { flex: 1, backgroundColor: colors.surfaceAlt }]} onPress={closeDialog}><Text>关闭</Text></T><T style={[D.btn, { flex: 1, backgroundColor: colors.info }]} onPress={() => { const s = socketRef.current; if (s?.connected && userLocation) s.emit("location_update", { lat: userLocation.lat, lng: userLocation.lng, campus }); fetchAll(); setTimeout(() => fetchAll(), 500); }}><Text style={{ color: "#FFF", fontWeight: "700" }}>🔄 刷新</Text></T><T style={[D.btn, { flex: 1, backgroundColor: en ? colors.success : "#ccc" }]} onPress={() => en && handleUnlock(c._id)}><Text style={{ color: "#FFF", fontWeight: "700" }}>{en ? "🎁 解锁" : "⏳"}</Text></T></View></>;
        })()}
        {dialogData?.type === "event" && (() => { const e = dialogData.data;
          return <><Text style={D.ej}>{e.typeId?.iconUrl || "📌"}</Text>{e.typeId?.name && <Text style={{ fontSize: 12, fontWeight: "700", color: e.typeId?.color || "#9B59B6", marginBottom: 4 }}>{e.typeId.name}</Text>}<Text style={D.tl}>{e.title || "活动"}</Text><View style={D.tr}><View style={[D.tg, { backgroundColor: colors.primary + "18" }]}><Text style={[D.tt, { color: colors.primary }]}>👤 {e.currentParticipants||0}/{e.capacity||"∞"}人</Text></View>{e.status && <View style={[D.tg, { backgroundColor: (e.status === "recruiting" ? colors.success : colors.warning) + "18" }]}><Text style={[D.tt, { color: e.status === "recruiting" ? colors.success : colors.warning }]}>{e.status === "recruiting" ? "🟢 招募中" : "⏳"}</Text></View>}</View><View style={D.ir}><Text style={D.il}>📍</Text><Text style={D.iv}>{e.locationText || "暂无位置"}</Text></View><View style={D.ir}><Text style={D.il}>🕐</Text><Text style={D.iv}>{e.startTime ? new Date(e.startTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "待定"}</Text></View><View style={{ flexDirection: "row", gap: 8, width: "100%" }}><T style={[D.btn, { flex: 1, backgroundColor: colors.surfaceAlt }]} onPress={closeDialog}><Text>取消</Text></T><T style={[D.btn, { flex: 1.5, backgroundColor: colors.primary }]} onPress={() => { closeDialog(); (navigation as any).navigate("EventDetail", { eventId: e._id }); }}><Text style={{ color: "#FFF", fontWeight: "700" }}>查看详情</Text></T></View></>;
        })()}
      </T></T></Modal>
      <Modal visible={showResultModal} transparent><T style={D.ov} activeOpacity={1} onPress={() => { setShowResultModal(false); setOpenResult(null); }}><T style={D.cd} activeOpacity={1} onPress={() => {}}>
        {openResult?.success ? <><Text style={[R.rb, { backgroundColor: (RCOLORS[openResult.rarity]||colors.primary)+"20" }]}><Text style={{ color: RCOLORS[openResult.rarity]||colors.primary, fontWeight: "800" }}>{openResult.rarity}</Text></Text><Text style={R.cg}>🎉 恭喜获得 🎉</Text>{openResult.item?.imageUrl && <Image source={{ uri: fixImageUrl(openResult.item.imageUrl) }} style={R.im} resizeMode="contain" />}<Text style={R.nm}>{openResult.item?.name}</Text><T style={[R.db, { backgroundColor: RCOLORS[openResult.rarity]||colors.primary }]} onPress={() => { setShowResultModal(false); setOpenResult(null); }}><Text style={R.dt}>太棒了！</Text></T></> : <><Text style={{ fontSize: 56 }}>😢</Text><Text style={D.tl}>开箱失败</Text><Text style={D.dc}>{openResult?.error}</Text><T style={D.pb} onPress={() => { setShowResultModal(false); setOpenResult(null); }}><Text style={D.pt}>知道了</Text></T></>}
      </T></T></Modal>
      {unlockingChestId && <View style={Ld.lo}><View style={Ld.lc}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ fontWeight: "700", marginTop: 20 }}>正在开启...</Text></View></View>}
    </View>
  );
}

const S = StyleSheet.create({
  ct: { flex: 1, backgroundColor: colors.background }, tb: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: "#fff", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, elevation: 8 }, sw: { flexDirection: "row", backgroundColor: "#f0f0f0", borderRadius: 16, padding: 4 }, sb: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" }, sa: { backgroundColor: colors.primary }, st: { fontWeight: "700", color: "#999" }, sta: { color: "#fff" },
  gb: { backgroundColor: "rgba(52,152,219,0.9)", paddingVertical: 4, alignItems: "center" }, gt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  rf: { position: "absolute", top: 12, left: 12, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, elevation: 6, zIndex: 30 },
  cs: { position: "absolute", top: 12, right: 12, gap: 8, alignItems: "flex-end" },
  ctr: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }, ca: { borderWidth: 1.5, borderColor: colors.rarity.典藏 + "50" }, ci: { fontSize: 22 }, cn: { fontWeight: "800", fontSize: 18, color: "#333" },
  sqBtn: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 }, locBtn: { position: "absolute", bottom: 120, right: 12, width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.95)", justifyContent: "center", alignItems: "center", elevation: 4, zIndex: 30 },
});
const D = StyleSheet.create({
  ov: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 32 }, cd: { backgroundColor: "#fff", borderRadius: 24, padding: 24, width: "100%", maxWidth: 340, alignItems: "center" },
  ej: { fontSize: 56, marginBottom: 12 }, tl: { fontSize: 18, fontWeight: "800", color: "#2D3436", marginBottom: 12, textAlign: "center" },
  tr: { flexDirection: "row", gap: 8, marginBottom: 16 }, tg: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999 }, tt: { fontWeight: "700", fontSize: 13 },
  dc: { fontSize: 16, color: "#636E72", textAlign: "center", marginBottom: 8 }, dt: { fontSize: 16, color: "#3498DB", textAlign: "center", fontWeight: "700", marginBottom: 8 },
  pb: { width: "100%", padding: 14, borderRadius: 24, alignItems: "center", backgroundColor: colors.primary }, pt: { fontSize: 17, fontWeight: "700", color: "#FFF" },
  pbox: { width: "100%", padding: 14, borderRadius: 16, alignItems: "center", backgroundColor: colors.rarity.典藏 + "08", borderWidth: 1, borderColor: colors.rarity.典藏 + "20", marginBottom: 8 },
  ub: { width: "100%", padding: 15, borderRadius: 24, alignItems: "center", backgroundColor: "#27AE60" }, ut: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  pc: { fontWeight: "800", fontSize: 18, color: "#9B59B6", marginBottom: 4 }, pr: { width: "100%", height: 6, backgroundColor: "#9B59B620", borderRadius: 3 }, pf: { height: 6, borderRadius: 3 },
  btn: { padding: 14, borderRadius: 24, alignItems: "center" }, ir: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 8 }, il: { fontSize: 16, marginRight: 8, width: 28, textAlign: "center" }, iv: { fontSize: 15, color: "#2D3436", flex: 1 },
});
const R = StyleSheet.create({
  rb: { paddingHorizontal: 20, paddingVertical: 4, borderRadius: 9999, marginBottom: 8 }, cg: { fontWeight: "600", marginBottom: 16 }, im: { width: 160, height: 160, borderRadius: 16, marginBottom: 12 },
  nm: { fontSize: 18, fontWeight: "800", color: "#2D3436", marginBottom: 20 }, db: { width: "100%", padding: 14, borderRadius: 24, alignItems: "center" }, dt: { fontSize: 18, fontWeight: "800", color: "#FFF" },
});
const Ld = StyleSheet.create({
  lo: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", zIndex: 100 } as any,
  lc: { backgroundColor: "#FFF", borderRadius: 24, padding: 32, alignItems: "center" },
});
