// ── 客户端发出的事件 ──
export interface ClientToServerEvents {
  authenticate: (data: { token: string }) => void;
  location_update: (data: LocationUpdatePayload) => void;
  chest_open_request: (data: { chestId: string }) => void;
  private_message: (data: PrivateMessagePayload) => void;
  group_message: (data: GroupMessagePayload) => void;
  typing_start: (data: { conversationId: string; conversationType: string }) => void;
  typing_end: (data: { conversationId: string; conversationType: string }) => void;
  mark_read: (data: { conversationId: string; conversationType: string }) => void;
  join_event_chat: (data: { eventId: string }) => void;
  leave_event_chat: (data: { eventId: string }) => void;
  pickup_note: (data: { noteId: string }) => void;
}

// ── 服务端发出的事件 ──
export interface ServerToClientEvents {
  authenticated: (data: { userId: string; numericId: number }) => void;
  auth_error: (data: { message: string }) => void;
  geofence_warning: (data: { message: string }) => void;
  chest_removed: (data: { chestId: string }) => void;
  chest_spawned: (data: ChestSpawnedPayload) => void;
  chest_player_count: (data: { chestId: string; currentCount: number; requiredCount: number }) => void;
  chest_open_result: (data: ChestOpenResult) => void;
  new_private_message: (data: { conversationId: string; message: MessagePayload }) => void;
  new_group_message: (data: { eventId: string; message: MessagePayload }) => void;
  user_typing: (data: { userId: string; conversationId: string; conversationType: string }) => void;
  user_stop_typing: (data: { userId: string; conversationId: string; conversationType: string }) => void;
  new_application: (data: { eventId: string; applicant: UserBriefPayload }) => void;
  application_result: (data: { eventId: string; status: string }) => void;
  event_status_changed: (data: { eventId: string; newStatus: string; oldStatus: string }) => void;
  participant_joined: (data: { eventId: string; participant: UserBriefPayload }) => void;
  participant_left: (data: { eventId: string; userId: string; reason: string }) => void;
  friend_request_received: (data: { requestId: string; fromUser: UserBriefPayload }) => void;
  friend_request_accepted: (data: { friendId: string; friendInfo: UserBriefPayload }) => void;
  friend_request_rejected: (data: { targetUserId: string }) => void;
  unread_notification: (data: { count: number; latestType: string }) => void;
  pickup_note_result: (data: { noteId: string; success: boolean; error?: string; data?: any }) => void;
  note_removed: (data: { noteId: string }) => void;
  note_picked: (data: { noteId: string; pickedBy: number }) => void;
}

// ── Payload 类型 ──
export interface LocationUpdatePayload {
  lat: number;
  lng: number;
  campus: string;
}

export interface PrivateMessagePayload {
  conversationId: string;
  receiverId: string;
  content: string;
  contentType: "text" | "emoji";
}

export interface GroupMessagePayload {
  eventId: string;
  content: string;
  contentType: "text" | "emoji";
}

export interface MessagePayload {
  senderId: string;
  senderNickname: string;
  senderAvatar: string;
  content: string;
  contentType: string;
  createdAt: string;
}

export interface UserBriefPayload {
  userId: string;
  numericId: number;
  nickname: string;
  avatar: string;
}

export interface ChestSpawnedPayload {
  chestId: string;
  type: string;
  coordinates: { lat: number; lng: number };
  requiredPlayers: number;
}

export interface ChestOpenResult {
  chestId: string;
  success: boolean;
  error?: string;
  item?: {
    id: string;
    name: string;
    rarity: string;
    imageUrl: string;
  };
}
