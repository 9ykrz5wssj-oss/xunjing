import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View, StyleSheet } from "react-native";
import { colors } from "../theme";
import { TutorialModal } from "../components/TutorialModal";
import { useAuthStore } from "../store/authStore";

// 屏幕
import { MapScreen } from "../screens/map/MapScreen";
import { EventDetailScreen } from "../screens/log/EventDetailScreen";
import { GalleryScreen } from "../screens/gallery/GalleryScreen";
import { ItemDetailScreen } from "../screens/gallery/ItemDetailScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { AdminPanelScreen } from "../screens/admin/AdminPanelScreen";
import { FriendListScreen } from "../screens/friends/FriendListScreen";
import { ChatScreen } from "../screens/friends/ChatScreen";
import { UserGalleryScreen } from "../screens/gallery/UserGalleryScreen";
import { PublishEventScreen } from "../screens/publish/PublishEventScreen";
import { MapPickerScreen } from "../screens/publish/MapPickerScreen";
import { LogFeedScreen } from "../screens/log/LogFeedScreen";
import { GroupChatScreen } from "../screens/log/GroupChatScreen";
import { ActivitySquareScreen } from "../screens/log/ActivitySquareScreen";
import { ActivityTypeListScreen } from "../screens/log/ActivityTypeListScreen";

export type MainTabParamList = {
  FriendsTab: undefined;
  LogTab: undefined;
  PublishTab: undefined;
  MapTab: undefined;
  GalleryTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// ── 各 Tab 的 Stack ──
const GalleryStackNav = createStackNavigator();
function GalleryStack() {
  return (
    <GalleryStackNav.Navigator screenOptions={{ headerShown: false }}>
      <GalleryStackNav.Screen name="GalleryMain" component={GalleryScreen} />
      <GalleryStackNav.Screen name="ItemDetail" component={ItemDetailScreen} />
    </GalleryStackNav.Navigator>
  );
}

const FriendsStackNav = createStackNavigator();
function FriendsStack() {
  return (
    <FriendsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <FriendsStackNav.Screen name="FriendsMain" component={FriendListScreen} />
      <FriendsStackNav.Screen name="Chat" component={ChatScreen} />
      <FriendsStackNav.Screen name="UserGallery" component={UserGalleryScreen} />
    </FriendsStackNav.Navigator>
  );
}

const LogStackNav = createStackNavigator();
function LogStack() {
  return (
    <LogStackNav.Navigator screenOptions={{ headerShown: false }}>
      <LogStackNav.Screen name="LogMain" component={LogFeedScreen} />
      <LogStackNav.Screen name="EventDetail" component={EventDetailScreen} />
      <LogStackNav.Screen name="GroupChat" component={GroupChatScreen} />
      <LogStackNav.Screen name="UserGallery" component={UserGalleryScreen} />
    </LogStackNav.Navigator>
  );
}

const PublishStackNav = createStackNavigator();
function PublishStack() {
  return (
    <PublishStackNav.Navigator screenOptions={{ headerShown: false }}>
      <PublishStackNav.Screen name="PublishMain" component={PublishEventScreen} />
      <PublishStackNav.Screen name="MapPicker" component={MapPickerScreen} />
    </PublishStackNav.Navigator>
  );
}

const MapStackNav = createStackNavigator();
function MapStack() {
  return (
    <MapStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MapStackNav.Screen name="MapMain" component={MapScreen} />
      <MapStackNav.Screen name="EventDetail" component={EventDetailScreen} />
      <MapStackNav.Screen name="GroupChat" component={GroupChatScreen} />
      <MapStackNav.Screen name="UserGallery" component={UserGalleryScreen} />
      <MapStackNav.Screen name="ActivitySquare" component={ActivitySquareScreen} />
      <MapStackNav.Screen name="ActivityTypeList" component={ActivityTypeListScreen} />
    </MapStackNav.Navigator>
  );
}

const ProfileStackNav = createStackNavigator();
function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStackNav.Screen name="AdminPanel" component={AdminPanelScreen} />
      <ProfileStackNav.Screen name="MapPicker" component={MapPickerScreen} />
    </ProfileStackNav.Navigator>
  );
}

// ── Tab Icon ──
const TabIcon = ({ label, emoji, focused }: { label: string; emoji: string; focused: boolean }) => (
  <View style={styles.tabIcon}>
    <Text style={[styles.emoji, focused && styles.emojiActive]}>{emoji}</Text>
    <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
  </View>
);

export function MainTabs() {
  const { justLoggedIn, setJustLoggedIn } = useAuthStore();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (justLoggedIn) {
      const t = setTimeout(() => setShowTutorial(true), 500);
      return () => clearTimeout(t);
    }
  }, [justLoggedIn]);

  const handleTutorialDone = () => {
    setShowTutorial(false);
    setJustLoggedIn(false);
  };

  return (
    <>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
      }}
    >
      <Tab.Screen name="FriendsTab" component={FriendsStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="好友" emoji="🤝" focused={focused} /> }} />
      <Tab.Screen name="LogTab" component={LogStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="日志" emoji="📖" focused={focused} /> }} />
      <Tab.Screen name="PublishTab" component={PublishStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="发布" emoji="📝" focused={focused} /> }} />
      <Tab.Screen name="MapTab" component={MapStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="地图" emoji="📍" focused={focused} /> }} />
      <Tab.Screen name="GalleryTab" component={GalleryStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="展柜" emoji="🏛️" focused={focused} /> }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="我" emoji="👤" focused={focused} /> }} />
    </Tab.Navigator>
    <TutorialModal visible={showTutorial} onDone={handleTutorialDone} />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBackground,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabIcon: { alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 22, opacity: 0.5 },
  emojiActive: { opacity: 1, transform: [{ scale: 1.15 }] },
  label: { fontSize: 10, marginTop: 2, color: colors.tabInactive, fontWeight: "500" },
  labelActive: { color: colors.tabActive, fontWeight: "700" },
});
