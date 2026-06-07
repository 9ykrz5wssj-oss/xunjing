// 🎨 校园社交与数字收藏 - 设计系统配色
// 风格：可爱、卡通、活泼、暖色调

export const colors = {
  // ── 主色调 ──
  primary: "#FF6B6B",       // 珊瑚粉 - 主要品牌色
  primaryLight: "#FF8E8E",  // 浅珊瑚粉
  primaryDark: "#E05555",   // 深珊瑚粉

  // ── 辅助色 ──
  secondary: "#FFD93D",     // 阳光黄
  accent: "#6BCB77",        // 清新绿
  accentLight: "#A8E6CF",   // 浅薄荷绿

  // ── 背景色 ──
  background: "#FFF8F0",    // 暖奶油色（主背景）
  surface: "#FFFFFF",       // 卡片/表面白
  surfaceAlt: "#FFF0E6",    // 暖橙白（替代背景）

  // ── 文字色 ──
  textPrimary: "#2D3436",   // 深炭灰（不是纯黑）
  textSecondary: "#636E72", // 暖灰
  textHint: "#B2BEC3",      // 提示灰
  textOnPrimary: "#FFFFFF", // 主色上的文字

  // ── 稀有度配色 ──
  rarity: {
    典藏: "#9B59B6",  // 紫色 Legendary
    神秘: "#FF6B6B",  // 彩虹（用主色渐变模拟） Mythic
    限定: "#E74C3C",  // 红色 Limited
    高端: "#F39C12",  // 橙色 Epic
    普通: "#3498DB",  // 蓝色 Rare
    常见: "#27AE60",  // 绿色 Common
  },

  // ── 功能色 ──
  success: "#27AE60",
  warning: "#F39C12",
  error: "#E74C3C",
  info: "#3498DB",

  // ── 边框和分割线 ──
  border: "#F0E6DA",
  divider: "#F5EDE3",

  // ── Tab栏 ──
  tabActive: "#FF6B6B",
  tabInactive: "#B2BEC3",
  tabBackground: "#FFFFFF",
};

// 稀有度渐变色（用于神秘稀有度的彩虹效果）
export const rarityGradients = {
  典藏: ["#9B59B6", "#C39BD3"],
  神秘: ["#FF6B6B", "#FFD93D", "#6BCB77", "#4ECDC4", "#9B59B6"],
  限定: ["#E74C3C", "#FF6B6B"],
  高端: ["#F39C12", "#FFD93D"],
  普通: ["#3498DB", "#85C1E9"],
  常见: ["#27AE60", "#82E0AA"],
};
