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
import { auth, db } from './firebase';
import { doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, collection, query, where, type QueryConstraint } from 'firebase/firestore';

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

/** Firestore is the durable source of truth. localStorage is only a same-browser cache. */
function fromFirestore<T>(snapshot: { id: string; data: () => Record<string, any> }): T {
  return { ...snapshot.data(), id: snapshot.id } as T;
}

async function readCollection<T>(name: string, ...constraints: QueryConstraint[]): Promise<T[]> {
  const source = collection(db, name);
  const result = await getDocs(constraints.length ? query(source, ...constraints) : source);
  return result.docs.map(snapshot => fromFirestore<T>(snapshot));
}

function cacheCollection<T>(items: T[], key: keyof CommunityDataStore): void {
  (store as any)[key] = items;
  store.save();
}

function firestoreErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: unknown }).code || '');
    if (code.includes('permission-denied')) return 'Firebase denied this database operation. Check the deployed Firestore rules.';
    if (code.includes('unavailable') || code.includes('network')) return 'Firebase is unreachable. Check the network and Firebase project configuration.';
    if (code.includes('not-found')) return 'The configured Firestore database was not found.';
  }
  return error instanceof Error ? error.message : 'Unknown Firestore error';
}


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
    maxDistanceKm?: number; city?: string; intention?: string; searchQuery?: string;
    coords?: { lat: number; lng: number };
  }): Promise<Profile[]> {
    const { maxDistanceKm, city, intention, searchQuery, coords } = options || {};
    const current = currentUserId ? await this.getProfileById(currentUserId) : null;
    const myLat = coords?.lat ?? current?.location_lat;
    const myLng = coords?.lng ?? current?.location_lng;
    const profiles = await this.getProfiles();
    const blocks = currentUserId ? await this.getBlocks(currentUserId) : [];
    const blockedIds = new Set(blocks.map(block => block.blocked_id));
    let list = profiles.filter(profile =>
      profile.status === 'active' && profile.show_in_nearby !== false &&
      profile.id !== currentUserId && !blockedIds.has(profile.id)
    ).map(profile => ({
      ...profile,
      distance_km: myLat != null && myLng != null
        ? calculateDistanceKm(myLat, myLng, profile.location_lat, profile.location_lng) ?? undefined
        : undefined,
    }));
    if (city && city !== 'All') list = list.filter(p => p.location_city?.toLowerCase().includes(city.toLowerCase()));
    if (intention && intention !== 'All') list = list.filter(p => p.relationship_intentions?.some(i => i.toLowerCase().includes(intention.toLowerCase())));
    if (maxDistanceKm != null && maxDistanceKm > 0) list = list.filter(p => p.distance_km != null && p.distance_km <= maxDistanceKm);
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.display_name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) || p.interests.some(i => i.toLowerCase().includes(q)) ||
        p.relationship_vibe?.toLowerCase().includes(q) || p.location_city?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => (a.distance_km ?? Number.POSITIVE_INFINITY) - (b.distance_km ?? Number.POSITIVE_INFINITY));
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
    // Never upload demo fixtures into a production database.
    console.warn('Firestore fixture seeding is disabled. Create real data through the app.');
    return { success: false, count: 0 };
  },
  async getProfiles(): Promise<Profile[]> {
    const allowedVisibility = auth.currentUser ? ['public', 'members_only'] : ['public'];
    const live = await readCollection<Profile>('profiles',
      where('visibility', 'in', allowedVisibility),
      where('status', '==', 'active')
    );
    if (auth.currentUser && !live.some(profile => profile.id === auth.currentUser?.uid)) {
      const mine = await this.getProfileById(auth.currentUser.uid);
      if (mine) live.push(mine);
    }
    cacheCollection(live, 'profiles');
    return live;
  },
  async getProfileById(id: string): Promise<Profile | null> {
    try {
      const snapshot = await getDoc(doc(db, 'profiles', id));
      return snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as Profile) : null;
    } catch (error: any) {
      if (error?.code === 'permission-denied' || error?.code === 'firestore/permission-denied') return null;
      throw new Error('Could not load profile from Firestore: ' + firestoreErrorMessage(error));
    }
  },
  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    if (auth.currentUser?.uid !== id) throw new Error('You can update only your own profile.');
    const current = await this.getProfileById(id);
    if (!current) throw new Error('Profile not found in Firestore.');
    const updated: Profile = { ...current, ...updates, id, updated_at: new Date().toISOString() };
    const { distance_km: _distance, ...payload } = updated;
    await setDoc(doc(db, 'profiles', id), payload, { merge: true });
    const index = store.profiles.findIndex(p => p.id === id);
    if (index >= 0) store.profiles[index] = updated; else store.profiles.push(updated);
    store.save();
    return updated;
  },
  async getUserPrivate(userId: string): Promise<UserPrivate> {
    if (auth.currentUser?.uid !== userId) throw new Error('You can read only your own private settings.');
    const snapshot = await getDoc(doc(db, 'user_private', userId));
    if (snapshot.exists()) {
      const value = { ...snapshot.data(), user_id: userId } as UserPrivate;
      store.userPrivateMap[userId] = value;
      store.save();
      return value;
    }
    const now = new Date().toISOString();
    const defaults: UserPrivate = {
      user_id: userId, messaging_permission: 'everyone', allow_friend_requests: true,
      email_notifications: true, notify_messages: true, notify_comments: true,
      notify_friend_requests: true, created_at: now, updated_at: now,
    };
    await setDoc(doc(db, 'user_private', userId), defaults);
    store.userPrivateMap[userId] = defaults;
    store.save();
    return defaults;
  },
  async updateUserPrivate(userId: string, updates: Partial<UserPrivate>): Promise<UserPrivate> {
    if (auth.currentUser?.uid !== userId) throw new Error('You can update only your own private settings.');
    const current = await this.getUserPrivate(userId);
    const updated: UserPrivate = { ...current, ...updates, user_id: userId, updated_at: new Date().toISOString() };
    await setDoc(doc(db, 'user_private', userId), updated, { merge: true });
    store.userPrivateMap[userId] = updated;
    store.save();
    return updated;
  },
  async getGroups(currentUserId?: string): Promise<Group[]> {
    const publicGroups = await readCollection<Group>('groups', where('visibility', '==', 'public'));
    let ownMemberships: GroupMember[] = [];
    let joinedGroups: Group[] = [];
    if (currentUserId && auth.currentUser?.uid === currentUserId) {
      ownMemberships = await readCollection<GroupMember>('group_members', where('user_id', '==', currentUserId));
      const privateIds = new Set(ownMemberships.filter(m => m.membership_status === 'active').map(m => m.group_id));
      for (const groupId of privateIds) {
        if (publicGroups.some(group => group.id === groupId)) continue;
        const snapshot = await getDoc(doc(db, 'groups', groupId));
        if (snapshot.exists()) joinedGroups.push({ ...snapshot.data(), id: snapshot.id } as Group);
      }
    }
    store.groupMembers = ownMemberships;
    const combined = [...new Map([...publicGroups, ...joinedGroups].map(group => [group.id, group])).values()]
      .filter(group => group.status === 'active')
      .map(group => {
        const own = ownMemberships.find(m => m.group_id === group.id);
        return { ...group, is_member: own?.membership_status === 'active',
          membership_status: own?.membership_status, user_role: own?.role };
      });
    store.groups = combined;
    store.save();
    return combined;
  },
  async getGroupById(groupId: string, currentUserId?: string): Promise<Group | null> {
    const all = await this.getGroups(currentUserId);
    const cached = all.find(group => group.id === groupId || group.slug === groupId);
    if (cached) return cached;
    try {
      const snapshot = await getDoc(doc(db, 'groups', groupId));
      if (!snapshot.exists()) return null;
      return { ...snapshot.data(), id: snapshot.id } as Group;
    } catch (error: any) {
      if (error?.code === 'permission-denied' || error?.code === 'firestore/permission-denied') return null;
      throw new Error('Could not load group from Firestore: ' + firestoreErrorMessage(error));
    }
  },
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Sign in to view group membership.');
    const ownSnapshot = await getDoc(doc(db, 'group_members', groupId + '_' + uid));
    if (!ownSnapshot.exists()) return [];
    const group = await this.getGroupById(groupId, uid);
    if (!group) return [];
    const members = await readCollection<GroupMember>('group_members', where('group_id', '==', groupId));
    const visible = await Promise.all(members.filter(m => m.membership_status === 'active').map(async member => ({
      ...member, profile: await this.getProfileById(member.user_id) || undefined,
    })));
    store.groupMembers = store.groupMembers.filter(member => member.group_id !== groupId).concat(members);
    store.save();
    return visible;
  },
  async createGroup(data: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> {
    const uid = auth.currentUser?.uid;
    if (!uid || data.owner_id !== uid) throw new Error('Sign in as the group owner before creating a group.');
    const id = 'grp_' + crypto.randomUUID().replace(/-/g, '').slice(0, 18);
    const now = new Date().toISOString();
    const group: Group = { ...data, id, created_at: now, updated_at: now, member_count: 1, is_member: true, membership_status: 'active', user_role: 'owner' };
    const { is_member: _isMember, membership_status: _membership, user_role: _role, member_count: _memberCount, ...groupPayload } = group;
    const membership: GroupMember = { group_id: id, user_id: uid, role: 'owner', membership_status: 'active', created_at: now, updated_at: now };
    await setDoc(doc(db, 'groups', id), groupPayload);
    try {
      await setDoc(doc(db, 'group_members', id + '_' + uid), membership);
    } catch (error) {
      await deleteDoc(doc(db, 'groups', id));
      throw new Error('Group was not created because owner membership could not be saved: ' + firestoreErrorMessage(error));
    }
    store.groups.unshift(group);
    store.groupMembers.push(membership);
    store.save();
    return group;
  },
  async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in before joining a group.');
    const group = await this.getGroupById(groupId, userId);
    if (!group) throw new Error('Group not found or you do not have access.');
    const ref = doc(db, 'group_members', groupId + '_' + userId);
    const existing = await getDoc(ref);
    const now = new Date().toISOString();
    const membership: GroupMember = {
      group_id: groupId, user_id: userId, role: 'member',
      membership_status: group.visibility === 'private' ? 'pending' : 'active',
      created_at: existing.exists() ? String(existing.data().created_at || now) : now, updated_at: now,
    };
    if (existing.exists()) await setDoc(ref, membership, { merge: true });
    else await setDoc(ref, membership);
    store.groupMembers = store.groupMembers.filter(m => !(m.group_id === groupId && m.user_id === userId)).concat(membership);
    store.save();
    if (membership.membership_status === 'pending') {
      void this.createNotification({ recipient_id: group.owner_id, actor_id: userId, type: 'group_invite', reference_type: 'group', reference_id: groupId, message: 'requested to join ' + group.name });
    }
    return membership;
  },
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in before leaving a group.');
    const group = await this.getGroupById(groupId, userId);
    if (group?.owner_id === userId) throw new Error('Transfer group ownership before leaving your own group.');
    await deleteDoc(doc(db, 'group_members', groupId + '_' + userId));
    store.groupMembers = store.groupMembers.filter(member => !(member.group_id === groupId && member.user_id === userId));
    store.save();
  },
  async updateMemberStatus(groupId: string, userId: string, status: 'active' | 'rejected'): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Sign in before reviewing a group request.');
    const group = await this.getGroupById(groupId, uid);
    if (!group || group.owner_id !== uid) throw new Error('Only this group owner can review join requests.');
    const ref = doc(db, 'group_members', groupId + '_' + userId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error('Group membership request not found.');
    const membershipStatus = status === 'rejected' ? 'rejected' : 'active';
    await updateDoc(ref, { membership_status: membershipStatus, updated_at: new Date().toISOString() });
    const member = { ...snapshot.data(), group_id: groupId, user_id: userId, membership_status: membershipStatus } as GroupMember;
    store.groupMembers = store.groupMembers.filter(m => !(m.group_id === groupId && m.user_id === userId)).concat(member);
    store.save();
    if (status === 'active') void this.createNotification({ recipient_id: userId, actor_id: uid, type: 'group_approved', reference_type: 'group', reference_id: groupId, message: 'Your request to join ' + group.name + ' was approved.' });
  },
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
