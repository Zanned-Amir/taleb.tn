// Video Chat Gateway Events
export const VIDEO_CHAT_EVENTS = {
  // Client to Server
  join_room: 'join-room',
  send_offer: 'send-offer',
  send_answer: 'send-answer',
  send_ice_candidate: 'send-ice-candidate',
  leave_room: 'leave-room',
  send_message: 'send-message',

  // Server to Client
  joined_room: 'joined-room',
  peer_joined: 'peer-joined',
  receive_offer: 'receive-offer',
  receive_answer: 'receive-answer',
  receive_ice_candidate: 'receive-ice-candidate',
  peer_left: 'peer-left',
  left_room: 'left-room',
  peer_disconnected: 'peer-disconnected',
  receive_message: 'receive-message',
  video_chat_error: 'video-chat-error',
} as const;

export type VideoChatEvent =
  (typeof VIDEO_CHAT_EVENTS)[keyof typeof VIDEO_CHAT_EVENTS];
