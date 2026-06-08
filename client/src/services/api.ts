import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const SERVER = Platform.OS === "web" ? "" : "http://124.222.230.80:3000";
const BASE_URL = `${SERVER}/api/v1`;

export function fixImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (Platform.OS === "web") return `https://seekwhale.cn${url}`;
  return `${SERVER}${url}`;
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// 请求拦截器：自动注入Token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // multipart/form-data由浏览器自动设boundary
  const ct = String(config.headers?.["Content-Type"] || "");
  if (ct.includes("multipart")) delete config.headers["Content-Type"];
  return config;
});

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，可在此触发登出
      AsyncStorage.removeItem("token");
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
