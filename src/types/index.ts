export type Visibility = 'public' | 'members_only' | 'private';
export type GroupVisibility = 'public' | 'private';
export type PostVisibility = 'public' | 'group_only' | 'friends_only' | 'private';
export type UserStatus = 'active' | 'suspended' | 'deactivated';
export type MemberRole = 'owner' | 'moderator' | 'member';
export type MembershipStatus = 'pending' | 'active' | 'rejected' | 'banned';
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type ReportTargetType = 'post' | 'comment' | 'profile' | 'group' | 'message';
export type ReportReason = 
  | 'harassment' 
  | 'hate_speech' 
  | 'dating_or_hookup_solicitation' 
  | 'privacy_violation' 
  | 'spam_or_phishing' 
  | 'inappropriate_media' 
  | 'other';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';
export type ModerationActionType = 'warn' | 'remove_content' | 'restrict_messaging' | 'suspend_user' | 'dismiss_report' | 'reinstate';
export type NotificationType = 
  | 'friend_request' 
  | 'friend_accepted' 
  | 'post_like' 
  | 'post_comment' 
  | 'group_invite' 
  | 'group_approved' 
  | 'message' 
  | 'mod_alert';

export interface ProfileMediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail_url?: string;
  title?: string;
  caption?: string;
  duration?: string;
  is_18_plus?: boolean;
  created_at: string;
}

export interface ProfilePrompt {
  id: string;
  question: string;
  answer: string;
}

export interface Profile {
  id: string;
  display_name: string;
  username: string;
  avatar_path?: string | null;
  bio?: string | null;
  interests: string[];
  pronouns?: string | null;
  visibility: Visibility;
  is_moderator: boolean;
  is_admin: boolean;
  status: UserStatus;
  location_city?: string;
  location_region?: string;
  location_lat?: number;
  location_lng?: number;
  show_in_nearby?: boolean;
  distance_km?: number;
  relationship_intentions?: string[];
  relationship_vibe?: string;
  is_18_verified?: boolean;
  prompts?: ProfilePrompt[];
  photos?: ProfileMediaItem[];
  videos?: ProfileMediaItem[];
  created_at: string;
  updated_at: string;
}

export interface UserPrivate {
  user_id: string;
  account_name?: string | null;
  identity_notes?: string | null;
  birth_year?: number | null;
  location_city?: string;
  show_in_nearby?: boolean;
  show_18_plus_content?: boolean;
  messaging_permission: 'everyone' | 'friends_only' | 'none';
  allow_friend_requests: boolean;
  email_notifications: boolean;
  notify_messages: boolean;
  notify_comments: boolean;
  notify_friend_requests: boolean;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  topic: string;
  rules: string;
  visibility: GroupVisibility;
  status: 'active' | 'archived' | 'suspended';
  created_at: string;
  updated_at: string;
  // Computed / joined fields
  member_count?: number;
  is_member?: boolean;
  membership_status?: MembershipStatus;
  user_role?: MemberRole;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: MemberRole;
  membership_status: MembershipStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  recipient?: Profile;
}

export interface Friendship {
  id: string;
  user_a: string;
  user_b: string;
  /** The accepted request authorizing this relationship, when newly created. */
  request_id?: string;
  created_at: string;
  friend?: Profile;
}

export interface Post {
  id: string;
  author_id: string;
  group_id?: string | null;
  body: string;
  media_paths: string[];
  video_url?: string;
  media_type?: 'photo' | 'video';
  is_18_plus?: boolean;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  visibility: PostVisibility;
  status: 'published' | 'hidden' | 'removed_by_mod';
  created_at: string;
  updated_at: string;
  // Joined / computed
  author?: Profile;
  group?: Group;
  likes_count: number;
  comments_count: number;
  has_liked?: boolean;
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id?: string | null;
  body: string;
  status: 'published' | 'removed_by_mod';
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  members: Profile[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  status: 'active' | 'left' | 'muted';
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  status: 'sent' | 'delivered' | 'read' | 'deleted';
  sender?: Profile;
}

export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked_profile?: Profile;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
  target_summary?: string;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  target_type: string;
  target_id: string;
  action_type: ModerationActionType;
  reason: string;
  created_at: string;
  moderator?: Profile;
}

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  reference_type?: string | null;
  reference_id?: string | null;
  read_at?: string | null;
  created_at: string;
  actor?: Profile;
  message?: string;
}
