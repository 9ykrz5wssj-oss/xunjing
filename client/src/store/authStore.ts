import { create } from "zustand";
import { UserProfile } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  justLoggedIn: boolean;

  setToken: (token: string | null) => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setJustLoggedIn: (v: boolean) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isLoggedIn: false,
  justLoggedIn: false,

  setToken: async (token: string | null) => {
    if (token) {
      await AsyncStorage.setItem("token", token);
    } else {
      await AsyncStorage.removeItem("token");
    }
    set({ token, isLoggedIn: !!token });
  },

  setUser: (user: UserProfile | null) => {
    set({ user });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setJustLoggedIn: (justLoggedIn: boolean) => {
    set({ justLoggedIn });
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    set({ token: null, user: null, isLoggedIn: false });
  },

  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        set({ token, isLoggedIn: true });
      }
    } catch (error) {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },
}));
