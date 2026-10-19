import {
  Profile,
  UserPrivate,
  Group,
  GroupMember,
  Post,
  Comment,
  Friendship,
  FriendRequest,
  Conversation,
  Message,
  Notification,
  Report,
  ModerationAction,
  Block,
  ReportTargetType,
  ReportReason,
  ModerationActionType,
  Visibility,
} from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_USER_PRIVATE,
  INITIAL_GROUPS,
  INITIAL_GROUP_MEMBERS,
  INITIAL_POSTS,
  INITIAL_COMMENTS,
  INITIAL_FRIENDSHIPS,
  INITIAL_FRIEND_REQUESTS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_REPORTS,
  INITIAL_MODERATION_ACTIONS,
} from './initialData';
import { db } from './firebase';
import { doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, collection } from 'firebase/firestore';

// Local storage keys
const STORAGE_PREFIX = 'bicircle_store_';

function getStored<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultVal;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

// In-memory / localStorage data storage layer
class CommunityDataStore {
  profiles: Profile[] = [];
  userPrivateMap: Record<string, UserPrivate> = {};
  groups: Group[] = [];
  groupMembers: GroupMember[] = [];
  posts: Post[] = [];
  comments: Comment[] = [];
  friendships: Friendship[] = [];
  friendRequests: FriendRequest[] = [];
  conversations: Conversation[] = [];
  messages: Message[] = [];
  notifications: Notification[] = [];
  reports: Report[] = [];
  moderationActions: ModerationAction[] = [];
  blocks: Block[] = [];

  constructor() {
    this.reload();
  }

  reload() {
    // Start empty by default. Remove only records shipped as demo fixtures,
    // while preserving real locally-created records for this browser.
    const withoutSeedRecords = <T>(items: T[], seeds: T[], getKey: (item: T) => string): T[] => {
      const seedKeys = new Set(seeds.map(getKey));
      return items.filter(item => !seedKeys.has(getKey(item)));
    };

    this.profiles = withoutSeedRecords(
      getStored<Profile[]>('profiles', []),
      INITIAL_PROFILES,
      item => item.id
    );
    const privateUsers = getStored<Record<string, UserPrivate>>('userPrivate', {});
    this.userPrivateMap = { ...privateUsers };
    delete this.userPrivateMap.usr_maya;

    this.groups = withoutSeedRecords(getStored<Group[]>('groups', []), INITIAL_GROUPS, item => item.id);
    this.groupMembers = withoutSeedRecords(
      getStored<GroupMember[]>('groupMembers', []),
      INITIAL_GROUP_MEMBERS,
      item => `${item.group_id}:${item.user_id}`
    );
    this.posts = withoutSeedRecords(getStored<Post[]>('posts', []), INITIAL_POSTS, item => item.id);
    this.comments = withoutSeedRecords(getStored<Comment[]>('comments', []), INITIAL_COMMENTS, item => item.id);
    this.friendships = withoutSeedRecords(getStored<Friendship[]>('friendships', []), INITIAL_FRIENDSHIPS, item => item.id);
    this.friendRequests = withoutSeedRecords(
      getStored<FriendRequest[]>('friendRequests', []),
      INITIAL_FRIEND_REQUESTS,
      item => item.id
    );
    this.conversations = withoutSeedRecords(
      getStored<Conversation[]>('conversations', []),
      INITIAL_CONVERSATIONS,
      item => item.id
    );
    this.messages = withoutSeedRecords(getStored<Message[]>('messages', []), INITIAL_MESSAGES, item => item.id);
    this.notifications = withoutSeedRecords(
      getStored<Notification[]>('notifications', []),
      INITIAL_NOTIFICATIONS,
      item => item.id
    );
    this.reports = withoutSeedRecords(getStored<Report[]>('reports', []), INITIAL_REPORTS, item => item.id);
    this.moderationActions = withoutSeedRecords(
      getStored<ModerationAction[]>('moderationActions', []),
      INITIAL_MODERATION_ACTIONS,
      item => item.id
    );
    this.blocks = getStored<Block[]>('blocks', []);
  }

  save() {
    setStored('profiles', this.profiles);
    setStored('userPrivate', this.userPrivateMap);
    setStored('groups', this.groups);
    setStored('groupMembers', this.groupMembers);
    setStored('posts', this.posts);
    setStored('comments', this.comments);
    setStored('friendships', this.friendships);
    setStored('friendRequests', this.friendRequests);
    setStored('conversations', this.conversations);
    setStored('messages', this.messages);
    setStored('notifications', this.notifications);
    setStored('reports', this.reports);
    setStored('moderationActions', this.moderationActions);
    setStored('blocks', this.blocks);
  }

  resetToDefault() {
    if (typeof window !== 'undefined') {
      const keys = [
        'profiles', 'userPrivate', 'groups', 'groupMembers', 'posts',
        'comments', 'friendships', 'friendRequests', 'conversations',
        'messages', 'notifications', 'reports', 'moderationActions', 'blocks'
      ];
      keys.forEach(k => localStorage.removeItem(STORAGE_PREFIX + k));
    }
    this.reload();
  }
}

export const store = new CommunityDataStore();

// ==========================================
// DATA SERVICE API
// ==========================================

export function calculateDistanceKm(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const DataService = {
  // Nearby & Community Profiles Discovery
  async getNearbyProfiles(currentUserId?: string, options?: {
    maxDistanceKm?: number;
    city?: string;
    intention?: string;
    searchQuery?: string;
    coords?: { lat: number; lng: number };
  }): Promise<Profile[]> {
    const { maxDistanceKm, city, intention, searchQuery, coords } = options || {};
    const currentUser = currentUserId ? store.profiles.find(p => p.id === currentUserId) : null;
    const myLat = coords?.lat ?? currentUser?.location_lat ?? 40.6782;
    const myLng = coords?.lng ?? currentUser?.location_lng ?? -73.9442;

    let list = store.profiles
      .filter(p => p.status === 'active' && p.show_in_nearby !== false)
      .map(p => {
        const dist = calculateDistanceKm(myLat, myLng, p.location_lat, p.location_lng);
        return {
          ...p,
          distance_km: dist !== null ? dist : undefined,
        };
      });

    if (currentUserId) {
      list = list.filter(p => p.id !== currentUserId);
      const blockedIds = store.blocks
        .filter(b => b.blocker_id === currentUserId || b.blocked_id === currentUserId)
        .map(b => (b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id));
      list = list.filter(p => !blockedIds.includes(p.id));
    }

    if (city && city !== 'All') {
      list = list.filter(p => p.location_city?.toLowerCase().includes(city.toLowerCase()));
    }

    if (intention && intention !== 'All') {
      list = list.filter(p =>
        p.relationship_intentions?.some(i => i.toLowerCase().includes(intention.toLowerCase()))
      );
    }

    if (maxDistanceKm != null && maxDistanceKm > 0) {
      list = list.filter(p => p.distance_km != null && p.distance_km <= maxDistanceKm);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.display_name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.interests.some(i => i.toLowerCase().includes(q)) ||
        p.relationship_vibe?.toLowerCase().includes(q) ||
        p.location_city?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => (a.distance_km ?? 99999) - (b.distance_km ?? 99999));
  },

  async addProfilePhoto(userId: string, photo: { url: string; caption?: string; is_18_plus?: boolean }): Promise<Profile> {
    const p = store.profiles.find(x => x.id === userId);
    if (!p) throw new Error('Profile not found');
    const newPhoto = {
      id: 'photo_' + Date.now(),
      type: 'photo' as const,
      url: photo.url,
      caption: photo.caption || '',
      is_18_plus: !!photo.is_18_plus,
      created_at: new Date().toISOString(),
    };
    p.photos = [newPhoto, ...(p.photos || [])];
    p.updated_at = new Date().toISOString();
    store.save();
    try {
      await setDoc(doc(db, 'profiles', userId), p, { merge: true });
    } catch (e) {
      console.warn('Firestore sync photo:', e);
    }
    return p;
  },

  async addProfileVideo(userId: string, video: { url: string; title: string; caption?: string; thumbnail_url?: string; is_18_plus?: boolean }): Promise<Profile> {
    const p = store.profiles.find(x => x.id === userId);
    if (!p) throw new Error('Profile not found');
    const newVideo = {
      id: 'vid_' + Date.now(),
      type: 'video' as const,
      url: video.url,
      title: video.title,
      caption: video.caption || '',
      thumbnail_url: video.thumbnail_url || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      duration: '0:15',
      is_18_plus: !!video.is_18_plus,
      created_at: new Date().toISOString(),
    };
    p.videos = [newVideo, ...(p.videos || [])];
    p.updated_at = new Date().toISOString();
    store.save();
    try {
      await setDoc(doc(db, 'profiles', userId), p, { merge: true });
    } catch (e) {
      console.warn('Firestore sync video:', e);
    }
    return p;
  },

  async deleteProfileMedia(userId: string, mediaId: string, type: 'photo' | 'video'): Promise<Profile> {
    const p = store.profiles.find(x => x.id === userId);
    if (!p) throw new Error('Profile not found');
    if (type === 'photo') {
      p.photos = (p.photos || []).filter(item => item.id !== mediaId);
    } else {
      p.videos = (p.videos || []).filter(item => item.id !== mediaId);
    }
    p.updated_at = new Date().toISOString();
    store.save();
    try {
      await setDoc(doc(db, 'profiles', userId), p, { merge: true });
    } catch (e) {
      console.warn('Firestore sync delete media:', e);
    }
    return p;
  },

  async seedFirestoreWithInitialData(): Promise<{ success: boolean; count: number }> {
    let count = 0;
    try {
      for (const p of store.profiles) {
        await setDoc(doc(db, 'profiles', p.id), p, { merge: true });
        count++;
      }
      for (const g of store.groups) {
        await setDoc(doc(db, 'groups', g.id), g, { merge: true });
        count++;
      }
      for (const post of store.posts) {
        await setDoc(doc(db, 'posts', post.id), post, { merge: true });
        count++;
      }
      return { success: true, count };
    } catch (e) {
      console.error('Error seeding Firestore:', e);
      return { success: false, count };
    }
  },

  // Profiles
  async getProfiles(): Promise<Profile[]> {
    try {
      const snap = await getDocs(collection(db, 'profiles'));
      if (!snap.empty) {
        const live = snap.docs.map(d => d.data() as Profile);
        if (live.length > 0) return live.filter(p => p.status === 'active');
      }
    } catch {
      // fallback to store
    }
    return store.profiles.filter(p => p.status === 'active');
  },

  async getProfileById(id: string): Promise<Profile | null> {
    try {
      const docSnap = await getDoc(doc(db, 'profiles', id));
      if (docSnap.exists()) {
        return docSnap.data() as Profile;
      }
    } catch {
      // fallback
    }
    return store.profiles.find(p => p.id === id) || null;
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const idx = store.profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      store.profiles[idx] = {
        ...store.profiles[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      store.save();

      try {
        await setDoc(doc(db, 'profiles', id), store.profiles[idx], { merge: true });
      } catch (e) {
        console.warn('Firestore profile sync:', e);
      }

      return store.profiles[idx];
    }
    throw new Error('Profile not found');
  },

  // User Private Settings
  async getUserPrivate(userId: string): Promise<UserPrivate> {
    try {
      const docSnap = await getDoc(doc(db, 'user_private', userId));
      if (docSnap.exists()) {
        return docSnap.data() as UserPrivate;
      }
    } catch {
      // fallback
    }

    if (!store.userPrivateMap[userId]) {
      store.userPrivateMap[userId] = {
        user_id: userId,
        messaging_permission: 'everyone',
        allow_friend_requests: true,
        email_notifications: true,
        notify_messages: true,
        notify_comments: true,
        notify_friend_requests: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.save();

      try {
        await setDoc(doc(db, 'user_private', userId), store.userPrivateMap[userId], { merge: true });
      } catch {
        // quiet
      }
    }
    return store.userPrivateMap[userId];
  },

  async updateUserPrivate(userId: string, updates: Partial<UserPrivate>): Promise<UserPrivate> {
    const current = await this.getUserPrivate(userId);
    store.userPrivateMap[userId] = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    store.save();

    try {
      await setDoc(doc(db, 'user_private', userId), store.userPrivateMap[userId], { merge: true });
    } catch (e) {
      console.warn('Firestore user_private sync:', e);
    }

    return store.userPrivateMap[userId];
  },

  // Groups
  async getGroups(currentUserId?: string): Promise<Group[]> {
    try {
      const snap = await getDocs(collection(db, 'groups'));
      if (!snap.empty) {
        const live = snap.docs.map(d => d.data() as Group);
        if (live.length > 0) {
          return live.map(group => {
            const members = store.groupMembers.filter(gm => gm.group_id === group.id && gm.membership_status === 'active');
            const userMember = currentUserId
              ? store.groupMembers.find(gm => gm.group_id === group.id && gm.user_id === currentUserId)
              : undefined;

            return {
              ...group,
              member_count: members.length || group.member_count || 1,
              is_member: userMember?.membership_status === 'active',
              membership_status: userMember?.membership_status,
              user_role: userMember?.role,
            };
          });
        }
      }
    } catch {
      // fallback
    }

    return store.groups.map(group => {
      const members = store.groupMembers.filter(gm => gm.group_id === group.id && gm.membership_status === 'active');
      const userMember = currentUserId
        ? store.groupMembers.find(gm => gm.group_id === group.id && gm.user_id === currentUserId)
        : undefined;

      return {
        ...group,
        member_count: members.length || group.member_count || 1,
        is_member: userMember?.membership_status === 'active',
        membership_status: userMember?.membership_status,
        user_role: userMember?.role,
      };
    });
  },

  async getGroupById(groupId: string, currentUserId?: string): Promise<Group | null> {
    const all = await this.getGroups(currentUserId);
    return all.find(g => g.id === groupId || g.slug === groupId) || null;
  },

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const list = store.groupMembers.filter(m => m.group_id === groupId);
    return list.map(m => ({
      ...m,
      profile: store.profiles.find(p => p.id === m.user_id),
    }));
  },

  async createGroup(data: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> {
    const newGroup: Group = {
      ...data,
      id: 'grp_' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_count: 1,
      is_member: true,
      membership_status: 'active',
      user_role: 'owner',
    };

    store.groups.unshift(newGroup);
    // Add owner as group member
    store.groupMembers.push({
      group_id: newGroup.id,
      user_id: data.owner_id,
      role: 'owner',
      membership_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    store.save();
    return newGroup;
  },

  async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
    const existing = store.groupMembers.find(gm => gm.group_id === groupId && gm.user_id === userId);
    const targetGroup = store.groups.find(g => g.id === groupId);
    const status = targetGroup?.visibility === 'private' ? 'pending' : 'active';

    if (existing) {
      existing.membership_status = status;
      existing.updated_at = new Date().toISOString();
      store.save();
      return existing;
    }

    const newMember: GroupMember = {
      group_id: groupId,
      user_id: userId,
      role: 'member',
      membership_status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.groupMembers.push(newMember);

    // If private group, notify owner
    if (status === 'pending' && targetGroup) {
      this.createNotification({
        recipient_id: targetGroup.owner_id,
        actor_id: userId,
        type: 'group_invite',
        reference_type: 'group',
        reference_id: groupId,
        message: `requested to join ${targetGroup.name}`,
      });
    }

    store.save();
    return newMember;
  },

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    store.groupMembers = store.groupMembers.filter(
      gm => !(gm.group_id === groupId && gm.user_id === userId)
    );
    store.save();
  },

  async updateMemberStatus(groupId: string, userId: string, status: 'active' | 'rejected'): Promise<void> {
    const member = store.groupMembers.find(gm => gm.group_id === groupId && gm.user_id === userId);
    if (member) {
      member.membership_status = status;
      member.updated_at = new Date().toISOString();
      store.save();

      if (status === 'active') {
        const grp = store.groups.find(g => g.id === groupId);
        this.createNotification({
          recipient_id: userId,
          actor_id: member.user_id,
          type: 'group_approved',
          reference_type: 'group',
          reference_id: groupId,
          message: `Your request to join ${grp?.name || 'the group'} was approved!`,
        });
      }
    }
  },

  // Posts
  async getPosts(options?: {
    currentUserId?: string;
    groupId?: string;
    sort?: 'latest' | 'popular';
    authorId?: string;
  }): Promise<Post[]> {
    const { currentUserId, groupId, sort = 'latest', authorId } = options || {};

    let posts = [...store.posts].filter(p => p.status === 'published');

    // Filter by group if specified
    if (groupId) {
      posts = posts.filter(p => p.group_id === groupId);
    }

    // Filter by author if specified
    if (authorId) {
      posts = posts.filter(p => p.author_id === authorId);
    }

    // Check blocked users
    if (currentUserId) {
      const blockedIds = store.blocks
        .filter(b => b.blocker_id === currentUserId || b.blocked_id === currentUserId)
        .map(b => (b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id));

      posts = posts.filter(p => !blockedIds.includes(p.author_id));
    }

    // Attach authors and groups
    const populated = posts.map(p => {
      const author = store.profiles.find(pr => pr.id === p.author_id);
      const group = p.group_id ? store.groups.find(g => g.id === p.group_id) : undefined;
      return {
        ...p,
        author,
        group,
      };
    });

    if (sort === 'popular') {
      return populated.sort((a, b) => b.likes_count - a.likes_count);
    }
    return populated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createPost(data: {
    author_id: string;
    body: string;
    group_id?: string | null;
    media_paths?: string[];
    video_url?: string;
    media_type?: 'photo' | 'video';
    visibility?: Visibility | 'group_only';
    is_18_plus?: boolean;
    location_name?: string;
    location_lat?: number;
    location_lng?: number;
  }): Promise<Post> {
    const newPost: Post = {
      id: 'post_' + Date.now(),
      author_id: data.author_id,
      group_id: data.group_id || null,
      body: data.body,
      media_paths: data.media_paths || [],
      video_url: data.video_url || undefined,
      media_type: data.media_type || (data.video_url ? 'video' : data.media_paths?.length ? 'photo' : undefined),
      is_18_plus: !!data.is_18_plus,
      location_name: data.location_name,
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      visibility: (data.visibility as any) || (data.group_id ? 'group_only' : 'public'),
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0,
      comments_count: 0,
      has_liked: false,
      author: store.profiles.find(p => p.id === data.author_id),
      group: data.group_id ? store.groups.find(g => g.id === data.group_id) : undefined,
    };

    store.posts.unshift(newPost);
    store.save();

    try {
      await setDoc(doc(db, 'posts', newPost.id), newPost);
    } catch (e) {
      console.warn('Firestore post sync:', e);
    }

    return newPost;
  },

  async deletePost(postId: string, userId: string): Promise<void> {
    const user = store.profiles.find(p => p.id === userId);
    const post = store.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    if (post.author_id !== userId && !user?.is_moderator && !user?.is_admin) {
      throw new Error('Unauthorized to delete this post');
    }

    store.posts = store.posts.filter(p => p.id !== postId);
    store.comments = store.comments.filter(c => c.post_id !== postId);
    store.save();
  },

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    const post = store.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    post.has_liked = !post.has_liked;
    post.likes_count = post.has_liked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1);

    if (post.has_liked && post.author_id !== userId) {
      this.createNotification({
        recipient_id: post.author_id,
        actor_id: userId,
        type: 'post_like',
        reference_type: 'post',
        reference_id: postId,
        message: 'liked your post.',
      });
    }

    store.save();
    return { liked: post.has_liked, count: post.likes_count };
  },

  // Comments
  async getComments(postId: string): Promise<Comment[]> {
    const list = store.comments
      .filter(c => c.post_id === postId && c.status === 'published')
      .map(c => ({
        ...c,
        author: store.profiles.find(p => p.id === c.author_id),
      }));

    return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async createComment(postId: string, authorId: string, body: string): Promise<Comment> {
    const post = store.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    const newComment: Comment = {
      id: 'comm_' + Date.now(),
      post_id: postId,
      author_id: authorId,
      body,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: store.profiles.find(p => p.id === authorId),
    };

    store.comments.push(newComment);
    post.comments_count = (post.comments_count || 0) + 1;

    if (post.author_id !== authorId) {
      this.createNotification({
        recipient_id: post.author_id,
        actor_id: authorId,
        type: 'post_comment',
        reference_type: 'post',
        reference_id: postId,
        message: 'commented on your post.',
      });
    }

    store.save();
    return newComment;
  },

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const user = store.profiles.find(p => p.id === userId);
    const comm = store.comments.find(c => c.id === commentId);
    if (!comm) throw new Error('Comment not found');

    if (comm.author_id !== userId && !user?.is_moderator && !user?.is_admin) {
      throw new Error('Unauthorized');
    }

    store.comments = store.comments.filter(c => c.id !== commentId);
    const post = store.posts.find(p => p.id === comm.post_id);
    if (post) {
      post.comments_count = Math.max(0, (post.comments_count || 1) - 1);
    }
    store.save();
  },

  // Friendships & Requests
  async getFriendships(userId: string): Promise<Profile[]> {
    const friendIds = store.friendships
      .filter(f => f.user_a === userId || f.user_b === userId)
      .map(f => (f.user_a === userId ? f.user_b : f.user_a));

    return store.profiles.filter(p => friendIds.includes(p.id) && p.status === 'active');
  },

  async getFriendRequests(userId: string): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
    const incoming = store.friendRequests
      .filter(r => r.recipient_id === userId && r.status === 'pending')
      .map(r => ({ ...r, sender: store.profiles.find(p => p.id === r.sender_id) }));

    const outgoing = store.friendRequests
      .filter(r => r.sender_id === userId && r.status === 'pending')
      .map(r => ({ ...r, recipient: store.profiles.find(p => p.id === r.recipient_id) }));

    return { incoming, outgoing };
  },

  async sendFriendRequest(senderId: string, recipientId: string): Promise<FriendRequest> {
    if (senderId === recipientId) throw new Error('Cannot send friend request to yourself');

    const existing = store.friendRequests.find(
      r =>
        ((r.sender_id === senderId && r.recipient_id === recipientId) ||
          (r.sender_id === recipientId && r.recipient_id === senderId)) &&
        r.status === 'pending'
    );
    if (existing) throw new Error('Friend request already pending');

    const areAlreadyFriends = store.friendships.some(
      f =>
        (f.user_a === senderId && f.user_b === recipientId) ||
        (f.user_a === recipientId && f.user_b === senderId)
    );
    if (areAlreadyFriends) throw new Error('Already friends');

    const req: FriendRequest = {
      id: 'fr_' + Date.now(),
      sender_id: senderId,
      recipient_id: recipientId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: store.profiles.find(p => p.id === senderId),
      recipient: store.profiles.find(p => p.id === recipientId),
    };

    store.friendRequests.push(req);

    this.createNotification({
      recipient_id: recipientId,
      actor_id: senderId,
      type: 'friend_request',
      reference_type: 'user',
      reference_id: senderId,
      message: 'sent you a friend request.',
    });

    store.save();
    return req;
  },

  async acceptFriendRequest(requestId: string, currentUserId: string): Promise<void> {
    const req = store.friendRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');
    if (req.recipient_id !== currentUserId) throw new Error('Unauthorized');

    req.status = 'accepted';
    req.updated_at = new Date().toISOString();

    const uA = req.sender_id < req.recipient_id ? req.sender_id : req.recipient_id;
    const uB = req.sender_id < req.recipient_id ? req.recipient_id : req.sender_id;

    store.friendships.push({
      id: 'fs_' + Date.now(),
      user_a: uA,
      user_b: uB,
      created_at: new Date().toISOString(),
    });

    this.createNotification({
      recipient_id: req.sender_id,
      actor_id: currentUserId,
      type: 'friend_accepted',
      reference_type: 'user',
      reference_id: currentUserId,
      message: 'accepted your friend request.',
    });

    store.save();
  },

  async declineFriendRequest(requestId: string): Promise<void> {
    const req = store.friendRequests.find(r => r.id === requestId);
    if (req) {
      req.status = 'rejected';
      store.save();
    }
  },

  async removeFriendship(userA: string, userB: string): Promise<void> {
    store.friendships = store.friendships.filter(
      f => !(
        (f.user_a === userA && f.user_b === userB) ||
        (f.user_a === userB && f.user_b === userA)
      )
    );
    store.save();
  },

  // Messaging & Conversations
  async getConversations(userId: string): Promise<Conversation[]> {
    const userConvs = store.conversations.filter(c =>
      c.members.some(m => m.id === userId)
    );

    return userConvs.map(conv => {
      const msgs = store.messages.filter(m => m.conversation_id === conv.id);
      const lastMsg = msgs[msgs.length - 1];
      return {
        ...conv,
        last_message: lastMsg,
      };
    }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },

  async getConversationById(convId: string): Promise<Conversation | null> {
    const conv = store.conversations.find(c => c.id === convId);
    if (!conv) return null;
    return conv;
  },

  async getMessages(convId: string): Promise<Message[]> {
    const list = store.messages.filter(m => m.conversation_id === convId);
    return list.map(m => ({
      ...m,
      sender: store.profiles.find(p => p.id === m.sender_id),
    }));
  },

  async sendMessage(convId: string, senderId: string, body: string): Promise<Message> {
    const conv = store.conversations.find(c => c.id === convId);
    if (!conv) throw new Error('Conversation not found');

    const newMsg: Message = {
      id: 'msg_' + Date.now(),
      conversation_id: convId,
      sender_id: senderId,
      body,
      created_at: new Date().toISOString(),
      status: 'sent',
      sender: store.profiles.find(p => p.id === senderId),
    };

    store.messages.push(newMsg);
    conv.updated_at = new Date().toISOString();
    conv.last_message = newMsg;

    // Notify other members
    conv.members.forEach(m => {
      if (m.id !== senderId) {
        this.createNotification({
          recipient_id: m.id,
          actor_id: senderId,
          type: 'message',
          reference_type: 'conversation',
          reference_id: convId,
          message: 'sent you a message.',
        });
      }
    });

    store.save();
    return newMsg;
  },

  async startOrGetDirectConversation(user1Id: string, user2Id: string): Promise<Conversation> {
    // Check if an existing 2-member conversation exists
    const existing = store.conversations.find(c => {
      const ids = c.members.map(m => m.id);
      return ids.length === 2 && ids.includes(user1Id) && ids.includes(user2Id);
    });

    if (existing) return existing;

    const p1 = store.profiles.find(p => p.id === user1Id);
    const p2 = store.profiles.find(p => p.id === user2Id);
    if (!p1 || !p2) throw new Error('Profile not found');

    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: [p1, p2],
      unread_count: 0,
    };

    store.conversations.unshift(newConv);
    store.save();
    return newConv;
  },

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const list = store.notifications
      .filter(n => n.recipient_id === userId)
      .map(n => ({
        ...n,
        actor: store.profiles.find(p => p.id === n.actor_id),
      }));

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createNotification(notif: Omit<Notification, 'id' | 'created_at' | 'read_at'>): void {
    const newNotif: Notification = {
      ...notif,
      id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6),
      read_at: null,
      created_at: new Date().toISOString(),
    };
    store.notifications.unshift(newNotif);
    store.save();
  },

  async markNotificationRead(notifId: string): Promise<void> {
    const notif = store.notifications.find(n => n.id === notifId);
    if (notif) {
      notif.read_at = new Date().toISOString();
      store.save();
    }
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    store.notifications.forEach(n => {
      if (n.recipient_id === userId && !n.read_at) {
        n.read_at = new Date().toISOString();
      }
    });
    store.save();
  },

  // Safety, Blocks & Reports
  async getBlocks(userId: string): Promise<Block[]> {
    return store.blocks
      .filter(b => b.blocker_id === userId)
      .map(b => ({
        ...b,
        blocked_profile: store.profiles.find(p => p.id === b.blocked_id),
      }));
  },

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) throw new Error('Cannot block yourself');

    const already = store.blocks.some(b => b.blocker_id === blockerId && b.blocked_id === blockedId);
    if (!already) {
      store.blocks.push({
        blocker_id: blockerId,
        blocked_id: blockedId,
        created_at: new Date().toISOString(),
      });
      // Also remove friendships
      this.removeFriendship(blockerId, blockedId);
      store.save();
    }
  },

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    store.blocks = store.blocks.filter(b => !(b.blocker_id === blockerId && b.blocked_id === blockedId));
    store.save();
  },

  async createReport(data: {
    reporter_id: string;
    target_type: ReportTargetType;
    target_id: string;
    reason: ReportReason;
    details?: string;
  }): Promise<Report> {
    const newReport: Report = {
      id: 'rep_' + Date.now(),
      reporter_id: data.reporter_id,
      target_type: data.target_type,
      target_id: data.target_id,
      reason: data.reason,
      details: data.details || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reporter: store.profiles.find(p => p.id === data.reporter_id),
      target_summary: `${data.target_type} #${data.target_id}`,
    };

    store.reports.unshift(newReport);
    store.save();
    return newReport;
  },

  async getReports(): Promise<Report[]> {
    return store.reports.map(r => ({
      ...r,
      reporter: store.profiles.find(p => p.id === r.reporter_id),
    }));
  },

  async updateReportStatus(reportId: string, status: Report['status']): Promise<void> {
    const rep = store.reports.find(r => r.id === reportId);
    if (rep) {
      rep.status = status;
      rep.updated_at = new Date().toISOString();
      store.save();
    }
  },

  async getModerationActions(): Promise<ModerationAction[]> {
    return store.moderationActions.map(ma => ({
      ...ma,
      moderator: store.profiles.find(p => p.id === ma.moderator_id),
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async executeModerationAction(data: {
    moderator_id: string;
    target_type: string;
    target_id: string;
    action_type: ModerationActionType;
    reason: string;
    report_id?: string;
  }): Promise<ModerationAction> {
    const action: ModerationAction = {
      id: 'mact_' + Date.now(),
      moderator_id: data.moderator_id,
      target_type: data.target_type,
      target_id: data.target_id,
      action_type: data.action_type,
      reason: data.reason,
      created_at: new Date().toISOString(),
      moderator: store.profiles.find(p => p.id === data.moderator_id),
    };

    store.moderationActions.unshift(action);

    // Apply consequence
    if (data.action_type === 'remove_content') {
      if (data.target_type === 'post') {
        const post = store.posts.find(p => p.id === data.target_id);
        if (post) post.status = 'removed_by_mod';
      } else if (data.target_type === 'comment') {
        const comm = store.comments.find(c => c.id === data.target_id);
        if (comm) comm.status = 'removed_by_mod';
      }
    } else if (data.action_type === 'suspend_user') {
      const user = store.profiles.find(p => p.id === data.target_id);
      if (user) user.status = 'suspended';
    }

    if (data.report_id) {
      await this.updateReportStatus(data.report_id, 'resolved');
    }

    store.save();
    return action;
  },

  // Account Data Export & Deletion
  async exportUserData(userId: string): Promise<string> {
    const profile = await this.getProfileById(userId);
    const priv = await this.getUserPrivate(userId);
    const posts = store.posts.filter(p => p.author_id === userId);
    const comments = store.comments.filter(c => c.author_id === userId);
    const friendships = await this.getFriendships(userId);

    const payload = {
      export_date: new Date().toISOString(),
      platform: 'BiCircle',
      profile,
      privacy_and_settings: priv,
      posts,
      comments,
      friends_count: friendships.length,
      friends: friendships.map(f => ({ username: f.username, display_name: f.display_name })),
    };

    return JSON.stringify(payload, null, 2);
  },

  async deactivateUser(userId: string): Promise<void> {
    const profile = store.profiles.find(p => p.id === userId);
    if (profile) {
      profile.status = 'deactivated';
      store.save();
    }
  },
};
