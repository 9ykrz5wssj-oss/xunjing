import {
  ActivityStatus,
  ParticipantStatus,
  ALLOWED_ACTIVITY_TRANSITIONS,
  ALLOWED_PARTICIPANT_TRANSITIONS,
} from "../config/constants";

/**
 * 验证活动状态流转是否合法
 */
export function canTransitionActivity(
  current: ActivityStatus,
  target: ActivityStatus
): boolean {
  return ALLOWED_ACTIVITY_TRANSITIONS[current]?.includes(target) ?? false;
}

/**
 * 验证参与者状态流转是否合法
 */
export function canTransitionParticipant(
  current: ParticipantStatus,
  target: ParticipantStatus
): boolean {
  return ALLOWED_PARTICIPANT_TRANSITIONS[current]?.includes(target) ?? false;
}

/**
 * 获取活动的状态中文名
 */
export function getActivityStatusLabel(status: ActivityStatus): string {
  const labels: Record<ActivityStatus, string> = {
    [ActivityStatus.RECRUITING]: "招募中",
    [ActivityStatus.WAITING]: "等待开始",
    [ActivityStatus.ONGOING]: "进行中",
    [ActivityStatus.FINISHED]: "圆满结束",
    [ActivityStatus.CANCELLED]: "已取消",
  };
  return labels[status];
}

/**
 * 获取参与者状态中文名
 */
export function getParticipantStatusLabel(status: ParticipantStatus): string {
  const labels: Record<ParticipantStatus, string> = {
    [ParticipantStatus.APPLIED]: "响应中",
    [ParticipantStatus.ACCEPTED]: "响应通过",
    [ParticipantStatus.REJECTED]: "响应未通过",
    [ParticipantStatus.EXITED]: "已退出",
  };
  return labels[status];
}
