// 校区枚举
export enum Campus {
  GULOU = "gulou",
  XIANLIN = "xianlin",
}

export const CAMPUS_NAMES: Record<Campus, string> = {
  [Campus.GULOU]: "鼓楼校区",
  [Campus.XIANLIN]: "仙林校区",
};

// 稀有度颜色
export const RARITY_COLORS: Record<string, string> = {
  "典藏": "#9B59B6",
  "神秘": "#FF6B6B",
  "限定": "#E74C3C",
  "高端": "#F39C12",
  "普通": "#3498DB",
  "常见": "#27AE60",
};

// 活动状态中文名
export const ACTIVITY_STATUS_LABELS: Record<string, string> = {
  recruiting: "招募中",
  waiting: "等待开始",
  ongoing: "进行中",
  finished: "圆满结束",
  cancelled: "已取消",
};

export const PARTICIPANT_STATUS_LABELS: Record<string, string> = {
  applied: "响应中",
  accepted: "响应通过",
  rejected: "响应未通过",
  exited: "已退出",
};
