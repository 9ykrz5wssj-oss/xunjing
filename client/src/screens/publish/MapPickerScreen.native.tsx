import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from "react-native";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { Campus } from "../../utils/constants";

let WebViewNative: any = null;
if (Platform.OS !== "web") { try { WebViewNative = require("react-native-webview").WebView; } catch {} }

const CAMPUS_CENTERS: Record<Campus, { lng: number; lat: number; zoom: number }> = {
  gulou: { lng: 118.7750, lat: 32.0575, zoom: 16 },
  xianlin: { lng: 118.9500, lat: 32.1170, zoom: 15 },
};

// ===== Web Map =====
function WebMapPicker({ campus, onCoord }: { campus: Campus; onCoord: (c: {lat:number;lng:number}) => void }) {
  const mapRef = useRef<any>(null); const markerRef = useRef<any>(null); const divRef = useRef<any>(null);
  useEffect(() => {
    if (!divRef.current || mapRef.current) return; let cancelled = false;
    const load = (): Promise<any> => {
      if ((window as any).L) return Promise.resolve((window as any).L);
      return new Promise<any>((resolve) => {
        const link = document.createElement("link"); link.rel="stylesheet"; link.href="https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(link);
        const s = document.createElement("script"); s.src="https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.js"; s.onload=()=>resolve((window as any).L); document.head.appendChild(s);
      });
    };
    load().then((L) => {
      if (cancelled || !L || !divRef.current) return;
      const ct = CAMPUS_CENTERS[campus];
      const map = L.map(divRef.current, { center:[ct.lat,ct.lng], zoom:ct.zoom, zoomControl:false, attributionControl:false });
      L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", { subdomains:["1","2","3","4"], maxZoom:18, minZoom:3 }).addTo(map);
      map.on("click", (e:any) => { const {lat,lng}=e.latlng; onCoord({lat,lng}); if(markerRef.current) map.removeLayer(markerRef.current); const ic = L.divIcon({className:"",html:'<div style="width:28px;height:36px;filter:drop-shadow(0 3px 4px rgba(0,0,0,0.3))"><svg viewBox="0 0 28 36" width="28" height="36"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#FF6B6B" stroke="#fff" stroke-width="2"/><circle cx="14" cy="13" r="5" fill="#fff"/></svg></div>',iconSize:[28,36],iconAnchor:[14,36]}); markerRef.current = L.marker([lat,lng],{icon:ic}).addTo(map); });
      mapRef.current = map; setTimeout(()=>map.invalidateSize(),200);
    });
    return ()=>{ cancelled=true; if(mapRef.current){mapRef.current.remove();mapRef.current=null;} };
  }, []);
  return <View ref={divRef} style={{flex:1}} />;
}

// ===== Native Map (WebView) =====
function NativeMapPicker({ campus, onCoord, onReady }: { campus: Campus; onCoord: (c: {lat:number;lng:number}) => void; onReady: (wv:any) => void }) {
  const webViewRef = useRef<any>(null);
  const ct = CAMPUS_CENTERS[campus];
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdn.bootcdn.net/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>*{margin:0;padding:0}html,body,#map{width:100%;height:100vh}</style></head><body><div id="map"></div>
<script>
var map=L.map('map',{center:[${ct.lat},${ct.lng}],zoom:${ct.zoom},zoomControl:false,attributionControl:false});
L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',{subdomains:['1','2','3','4'],maxZoom:18,minZoom:3}).addTo(map);
var pinIcon=L.divIcon({className:'',html:'<div style="width:28px;height:36px;filter:drop-shadow(0 3px 4px rgba(0,0,0,0.3))"><svg viewBox="0 0 28 36" width="28" height="36"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#FF6B6B" stroke="#fff" stroke-width="2"/><circle cx="14" cy="13" r="5" fill="#fff"/></svg></div>',iconSize:[28,36],iconAnchor:[14,36]});
var currentPin=null;
map.on('click',function(e){if(currentPin)map.removeLayer(currentPin);currentPin=L.marker([e.latlng.lat,e.latlng.lng],{icon:pinIcon}).addTo(map);window.ReactNativeWebView.postMessage(JSON.stringify({type:'pinPlaced',lat:e.latlng.lat,lng:e.latlng.lng}));});
window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapReady'}));
document.addEventListener('message',function(e){var d=JSON.parse(e.data);if(d.type==='init')map.setView([d.lat,d.lng],d.zoom||16);});
</script></body></html>`;

  const handleMessage = (event: any) => {
    try { const d = JSON.parse(event.nativeEvent.data); if (d.type==="mapReady") onReady(webViewRef.current); if (d.type==="pinPlaced") onCoord({lat:d.lat,lng:d.lng}); } catch {}
  };

  useEffect(() => { if (webViewRef.current) onReady(webViewRef.current); }, []);

  return <WebViewNative ref={webViewRef} source={{ html }} style={{flex:1}} onMessage={handleMessage} javaScriptEnabled domStorageEnabled />;
}

// ===== Main Screen =====
export function MapPickerScreen({ route, navigation }: any) {
  const { campus: initialCampus, onSelect } = route.params || {};
  const [campus] = useState<Campus>(initialCampus || Campus.GULOU);
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const wvRef = useRef<any>(null);

  const confirmLocation = () => {
    if (selectedCoord && onSelect) { onSelect(selectedCoord); navigation.goBack(); }
  };

  return (
    <View style={styles.ct}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← 返回</Text></TouchableOpacity>
        <Text style={styles.title}>选择位置</Text>
        <TouchableOpacity style={[styles.confirmBtn, !selectedCoord && { opacity: 0.4 }]} onPress={confirmLocation} disabled={!selectedCoord}>
          <Text style={styles.confirmText}>确认</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.mapWrap}>
        {Platform.OS === "web" ? (
          <WebMapPicker campus={campus} onCoord={setSelectedCoord} />
        ) : WebViewNative ? (
          <NativeMapPicker campus={campus} onCoord={setSelectedCoord} onReady={(wv) => { wvRef.current = wv; setMapReady(true); }} />
        ) : (
          <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><Text style={{color:colors.textHint}}>地图不可用</Text></View>
        )}
        {selectedCoord ? (
          <View style={styles.coordBar}><Text style={styles.coordText}>📍 {selectedCoord.lat.toFixed(5)}, {selectedCoord.lng.toFixed(5)}</Text></View>
        ) : mapReady ? (
          <View style={styles.hintBar}><Text style={styles.hintText}>👆 点击地图选择位置</Text></View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ct: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 56, paddingBottom: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", elevation: 4, zIndex: 20 },
  backText: { ...typography.h2, color: colors.primary },
  title: { ...typography.bodyBold, color: colors.textPrimary },
  confirmBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  confirmText: { ...typography.bodyBold, color: "#FFF" },
  mapWrap: { flex: 1 },
  coordBar: { position: "absolute", bottom: 50, left: 16, right: 16, backgroundColor: "rgba(39,174,96,0.9)", borderRadius: 12, padding: spacing.md },
  coordText: { color: "#FFF", fontWeight: "700", textAlign: "center" },
  hintBar: { position: "absolute", top: 12, left: 16, right: 16, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 8, padding: spacing.sm },
  hintText: { color: "#FFF", textAlign: "center", fontSize: 13 },
});
