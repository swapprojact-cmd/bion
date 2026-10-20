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


function cleanFirestoreData<T>(value: T): T {
  if (Array.isArray(value)) return value.map(item => cleanFirestoreData(item)) as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (item !== undefined) cleaned[key] = cleanFirestoreData(item);
    }
    return cleaned as T;
  }
  return value;
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
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in to edit your own gallery.');
    const profile = await this.getProfileById(userId);
    if (!profile) throw new Error('Profile not found in Firestore.');
    const newPhoto = { id: 'photo_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16), type: 'photo' as const,
      url: photo.url, caption: photo.caption || '', is_18_plus: !!photo.is_18_plus, created_at: new Date().toISOString() };
    return this.updateProfile(userId, { photos: [newPhoto, ...(profile.photos || [])] });
  },
  async addProfileVideo(userId: string, video: { url: string; title: string; caption?: string; thumbnail_url?: string; is_18_plus?: boolean }): Promise<Profile> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in to edit your own gallery.');
    const profile = await this.getProfileById(userId);
    if (!profile) throw new Error('Profile not found in Firestore.');
    const newVideo = { id: 'vid_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16), type: 'video' as const,
      url: video.url, title: video.title, caption: video.caption || '', thumbnail_url: video.thumbnail_url || '',
      duration: '0:15', is_18_plus: !!video.is_18_plus, created_at: new Date().toISOString() };
    return this.updateProfile(userId, { videos: [newVideo, ...(profile.videos || [])] });
  },
  async deleteProfileMedia(userId: string, mediaId: string, type: 'photo' | 'video'): Promise<Profile> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in to edit your own gallery.');
    const profile = await this.getProfileById(userId);
    if (!profile) throw new Error('Profile not found in Firestore.');
    return this.updateProfile(userId, type === 'photo'
      ? { photos: (profile.photos || []).filter(item => item.id !== mediaId) }
      : { videos: (profile.videos || []).filter(item => item.id !== mediaId) });
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
    await setDoc(doc(db, 'profiles', id), cleanFirestoreData(payload), { merge: true });
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
    const ownMemberships = await readCollection<GroupMember>('group_members', where('user_id', '==', uid));
    if (!ownMemberships.some(member => member.group_id === groupId)) return [];
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
    await readCollection<GroupMember>('group_members', where('user_id', '==', userId));
    const existing = store.groupMembers.find(member => member.group_id === groupId && member.user_id === userId);
    const now = new Date().toISOString();
    const membership: GroupMember = {
      group_id: groupId, user_id: userId, role: existing?.role === 'owner' ? 'owner' : 'member',
      membership_status: group.visibility === 'private' && existing?.role !== 'owner' ? 'pending' : 'active',
      created_at: existing?.created_at || now, updated_at: now,
    };
    const ref = doc(db, 'group_members', groupId + '_' + userId);
    if (existing) await setDoc(ref, membership, { merge: true }); else await setDoc(ref, membership);
    store.groupMembers = store.groupMembers.filter(m => !(m.group_id === groupId && m.user_id === userId)).concat(membership);
    store.save();
    if (membership.membership_status === 'pending') void this.createNotification({ recipient_id: group.owner_id, actor_id: userId, type: 'group_invite', reference_type: 'group', reference_id: groupId, message: 'requested to join ' + group.name });
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
    currentUserId?: string; groupId?: string; sort?: 'latest' | 'popular'; authorId?: string;
  }): Promise<Post[]> {
    const uid = auth.currentUser?.uid || null;
    if (options?.currentUserId && options.currentUserId !== uid) throw new Error('The requested feed user does not match the signed-in account.');
    const shared = [where('status', '==', 'published')];
    const loads: Promise<Post[]>[] = [];
    if (options?.groupId) {
      if (!uid) return [];
      const joined = await this.getGroups(uid);
      if (!joined.some(group => group.id === options.groupId && group.is_member)) return [];
      loads.push(readCollection<Post>('posts', ...shared, where('group_id', '==', options.groupId), where('visibility', '==', 'group_only')));
    } else if (options?.authorId) {
      if (!uid) loads.push(readCollection<Post>('posts', ...shared, where('author_id', '==', options.authorId), where('visibility', '==', 'public')));
      else if (options.authorId === uid) loads.push(readCollection<Post>('posts', ...shared, where('author_id', '==', uid)));
      else {
        loads.push(readCollection<Post>('posts', ...shared, where('author_id', '==', options.authorId), where('visibility', '==', 'public')));
        if ((await this.getFriendships(uid)).some(friend => friend.id === options.authorId)) {
          loads.push(readCollection<Post>('posts', ...shared, where('author_id', '==', options.authorId), where('visibility', '==', 'friends_only')));
        }
      }
    } else {
      loads.push(readCollection<Post>('posts', ...shared, where('visibility', '==', 'public')));
      if (uid) {
        loads.push(readCollection<Post>('posts', ...shared, where('author_id', '==', uid)));
        const friends = await this.getFriendships(uid);
        for (const friend of friends) {
          loads.push(readCollection<Post>('posts', ...shared, where('author_id', '==', friend.id), where('visibility', '==', 'friends_only')));
        }
        const memberships = await readCollection<GroupMember>('group_members', where('user_id', '==', uid), where('membership_status', '==', 'active'));
        for (const groupId of [...new Set(memberships.map(member => member.group_id))]) {
          loads.push(readCollection<Post>('posts', ...shared, where('group_id', '==', groupId), where('visibility', '==', 'group_only')));
        }
      }
    }
    const batches = await Promise.all(loads);
    const unique = [...new Map(batches.flat().map(post => [post.id, post])).values()];
    const blocks = uid ? await this.getBlocks(uid) : [];
    const blocked = new Set(blocks.map(block => block.blocked_id));
    let visible = unique.filter(post => !blocked.has(post.author_id));
    if (options?.authorId) visible = visible.filter(post => post.author_id === options.authorId);
    if (options?.sort === 'popular') visible.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    else visible.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const authorIds = [...new Set(visible.map(post => post.author_id))];
    const authors = new Map<string, Profile>();
    await Promise.all(authorIds.map(async id => {
      const author = await this.getProfileById(id);
      if (author) authors.set(id, author);
    }));
    const groupIds = [...new Set(visible.map(post => post.group_id).filter((id): id is string => !!id))];
    const groups = new Map<string, Group>();
    await Promise.all(groupIds.map(async id => {
      const group = await this.getGroupById(id, uid || undefined);
      if (group) groups.set(id, group);
    }));

    if (uid && visible.length) {
      const postIds = visible.map(post => post.id);
      const likesByPost = new Map<string, number>();
      const likedByMe = new Set<string>();
      const commentsByPost = new Map<string, number>();
      for (let offset = 0; offset < postIds.length; offset += 30) {
        const ids = postIds.slice(offset, offset + 30);
        const [likes, comments] = await Promise.all([
          readCollection<{ id: string; post_id: string; user_id: string }>('post_likes', where('post_id', 'in', ids)),
          readCollection<Comment>('comments', where('post_id', 'in', ids), where('status', '==', 'published')),
        ]);
        for (const like of likes) {
          likesByPost.set(like.post_id, (likesByPost.get(like.post_id) || 0) + 1);
          if (like.user_id === uid) likedByMe.add(like.post_id);
        }
        for (const comment of comments) commentsByPost.set(comment.post_id, (commentsByPost.get(comment.post_id) || 0) + 1);
      }
      visible = visible.map(post => ({ ...post, author: authors.get(post.author_id), group: post.group_id ? groups.get(post.group_id) : undefined,
        likes_count: likesByPost.get(post.id) ?? 0, has_liked: likedByMe.has(post.id), comments_count: commentsByPost.get(post.id) ?? 0 }));
    } else {
      visible = visible.map(post => ({ ...post, author: authors.get(post.author_id), group: post.group_id ? groups.get(post.group_id) : undefined }));
    }
    store.posts = visible;
    store.save();
    return visible;
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
    const uid = auth.currentUser?.uid;
    if (!uid || uid !== data.author_id) throw new Error('Sign in before creating a post.');
    const groupId = data.group_id || null;
    const visibility = (data.visibility as Post['visibility']) || (groupId ? 'group_only' : 'public');
    if (groupId && visibility === 'group_only') {
      const membership = await getDoc(doc(db, 'group_members', groupId + '_' + uid));
      if (!membership.exists() || membership.data().membership_status !== 'active') {
        throw new Error('Join the circle before posting to it.');
      }
    }
    const id = 'post_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    const now = new Date().toISOString();
    const post: Post = {
      id, author_id: uid, group_id: groupId, body: data.body.trim(),
      media_paths: data.media_paths || [], video_url: data.video_url || undefined,
      media_type: data.media_type || (data.video_url ? 'video' : data.media_paths?.length ? 'photo' : undefined),
      is_18_plus: !!data.is_18_plus, location_name: data.location_name,
      location_lat: data.location_lat, location_lng: data.location_lng,
      visibility, status: 'published', created_at: now, updated_at: now,
      likes_count: 0, comments_count: 0, has_liked: false,
    };
    const { author: _author, group: _group, has_liked: _liked, ...payload } = post;
    await setDoc(doc(db, 'posts', id), cleanFirestoreData(payload));
    store.posts.unshift(post);
    store.save();
    return { ...post, author: await this.getProfileById(uid) || undefined };
  },
  async deletePost(postId: string, userId: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in as the post author to delete it.');
    const ref = doc(db, 'posts', postId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error('Post not found in Firestore.');
    if (snapshot.data().author_id !== userId) throw new Error('Only the post author can delete this post.');
    await deleteDoc(ref);
    store.posts = store.posts.filter(post => post.id !== postId);
    store.save();
  },
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in before liking a post.');
    const postSnapshot = await getDoc(doc(db, 'posts', postId));
    if (!postSnapshot.exists()) throw new Error('Post not found.');
    const likeRecords = await readCollection<{ id: string; post_id: string; user_id: string }>('post_likes', where('post_id', '==', postId), where('user_id', '==', userId));
    const likeId = postId + '_' + userId;
    let liked: boolean;
    if (likeRecords.length) {
      await deleteDoc(doc(db, 'post_likes', likeId));
      liked = false;
    } else {
      await setDoc(doc(db, 'post_likes', likeId), { post_id: postId, user_id: userId, created_at: new Date().toISOString() });
      liked = true;
    }
    const allLikes = await readCollection<{ id: string; post_id: string; user_id: string }>('post_likes', where('post_id', '==', postId));
    const count = allLikes.length;
    store.posts = store.posts.map(post => post.id === postId ? { ...post, likes_count: count, has_liked: liked } : post);
    store.save();
    return { liked, count };
  },
  async getComments(postId: string): Promise<Comment[]> {
    if (!auth.currentUser) return [];
    const comments = await readCollection<Comment>('comments', where('post_id', '==', postId), where('status', '==', 'published'));
    const result = await Promise.all(comments.map(async comment => ({
      ...comment, author: await this.getProfileById(comment.author_id) || undefined,
    })));
    result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return result;
  },
  async createComment(postId: string, authorId: string, body: string): Promise<Comment> {
    if (!auth.currentUser || auth.currentUser.uid !== authorId) throw new Error('Sign in before commenting.');
    const normalizedBody = body.trim();
    if (!normalizedBody || normalizedBody.length > 4000) throw new Error('Comments must be between 1 and 4000 characters.');
    const postSnapshot = await getDoc(doc(db, 'posts', postId));
    if (!postSnapshot.exists()) throw new Error('Post not found.');
    const now = new Date().toISOString();
    const id = 'comment_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    const comment: Comment = { id, post_id: postId, author_id: authorId, body: normalizedBody, status: 'published', created_at: now, updated_at: now };
    await setDoc(doc(db, 'comments', id), comment);
    if (postSnapshot.data().author_id !== authorId) {
      void this.createNotification({ recipient_id: postSnapshot.data().author_id, actor_id: authorId, type: 'post_comment', reference_type: 'post', reference_id: postId, message: 'commented on your post.' });
    }
    store.comments.push(comment);
    store.save();
    return { ...comment, author: await this.getProfileById(authorId) || undefined };
  },
  async deleteComment(commentId: string, userId: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in to delete a comment.');
    const ref = doc(db, 'comments', commentId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error('Comment not found.');
    if (snapshot.data().author_id !== userId) throw new Error('Only the comment author can delete it.');
    await deleteDoc(ref);
    store.comments = store.comments.filter(comment => comment.id !== commentId);
    store.save();
  },
  async getFriendships(userId: string): Promise<Profile[]> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in to view your friendships.');
    const [asA, asB] = await Promise.all([
      readCollection<Friendship>('friendships', where('user_a', '==', userId)),
      readCollection<Friendship>('friendships', where('user_b', '==', userId)),
    ]);
    const friendIds = [...new Set([...asA, ...asB].map(item => item.user_a === userId ? item.user_b : item.user_a))];
    const friends = await Promise.all(friendIds.map(id => this.getProfileById(id)));
    return friends.filter((profile): profile is Profile => !!profile && profile.status === 'active');
  },
  async getFriendRequests(userId: string): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in to view your friend requests.');
    const [incoming, outgoing] = await Promise.all([
      readCollection<FriendRequest>('friend_requests', where('recipient_id', '==', userId), where('status', '==', 'pending')),
      readCollection<FriendRequest>('friend_requests', where('sender_id', '==', userId), where('status', '==', 'pending')),
    ]);
    const hydratedIncoming = await Promise.all(incoming.map(async request => ({ ...request, sender: await this.getProfileById(request.sender_id) || undefined })));
    const hydratedOutgoing = await Promise.all(outgoing.map(async request => ({ ...request, recipient: await this.getProfileById(request.recipient_id) || undefined })));
    return { incoming: hydratedIncoming, outgoing: hydratedOutgoing };
  },
  async sendFriendRequest(senderId: string, recipientId: string): Promise<FriendRequest> {
    if (!auth.currentUser || auth.currentUser.uid !== senderId) throw new Error('Sign in before sending a friend request.');
    if (senderId === recipientId) throw new Error('Cannot send a friend request to yourself.');
    const recipient = await this.getProfileById(recipientId);
    if (!recipient || recipient.status !== 'active') throw new Error('This member is unavailable.');
    const ownBlocks = await this.getBlocks(senderId);
    if (ownBlocks.some(block => block.blocked_id === recipientId)) throw new Error('You have blocked this member.');
    const [outgoing, incoming, friendships] = await Promise.all([
      readCollection<FriendRequest>('friend_requests', where('sender_id', '==', senderId), where('recipient_id', '==', recipientId), where('status', '==', 'pending')),
      readCollection<FriendRequest>('friend_requests', where('sender_id', '==', recipientId), where('recipient_id', '==', senderId), where('status', '==', 'pending')),
      this.getFriendships(senderId),
    ]);
    if (outgoing.length || incoming.length) throw new Error('A friend request is already pending.');
    if (friendships.some(profile => profile.id === recipientId)) throw new Error('You are already friends.');
    const id = 'fr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    const now = new Date().toISOString();
    const request: FriendRequest = { id, sender_id: senderId, recipient_id: recipientId, status: 'pending', created_at: now, updated_at: now };
    await setDoc(doc(db, 'friend_requests', id), request);
    void this.createNotification({ recipient_id: recipientId, actor_id: senderId, type: 'friend_request', reference_type: 'user', reference_id: senderId, message: 'sent you a friend request.' });
    store.friendRequests.push(request);
    store.save();
    return { ...request, sender: await this.getProfileById(senderId) || undefined, recipient };
  },
  async acceptFriendRequest(requestId: string, currentUserId: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== currentUserId) throw new Error('Sign in before accepting a friend request.');
    const requestRef = doc(db, 'friend_requests', requestId);
    const requestSnapshot = await getDoc(requestRef);
    if (!requestSnapshot.exists()) throw new Error('Friend request not found.');
    const request = { ...requestSnapshot.data(), id: requestSnapshot.id } as FriendRequest;
    if (request.recipient_id !== currentUserId || request.status !== 'pending') throw new Error('This request cannot be accepted.');
    const now = new Date().toISOString();
    await updateDoc(requestRef, { status: 'accepted', updated_at: now });
    const userA = request.sender_id < request.recipient_id ? request.sender_id : request.recipient_id;
    const userB = request.sender_id < request.recipient_id ? request.recipient_id : request.sender_id;
    const friendship: Friendship = { id: userA + '_' + userB, user_a: userA, user_b: userB, created_at: now };
    await setDoc(doc(db, 'friendships', friendship.id), friendship, { merge: true });
    void this.createNotification({ recipient_id: request.sender_id, actor_id: currentUserId, type: 'friend_accepted', reference_type: 'user', reference_id: currentUserId, message: 'accepted your friend request.' });
    store.friendRequests = store.friendRequests.map(item => item.id === requestId ? { ...item, status: 'accepted', updated_at: now } : item);
    store.friendships = store.friendships.filter(item => item.id !== friendship.id).concat(friendship);
    store.save();
  },
  async declineFriendRequest(requestId: string): Promise<void> {
    if (!auth.currentUser) throw new Error('Sign in before declining a friend request.');
    const requestRef = doc(db, 'friend_requests', requestId);
    const snapshot = await getDoc(requestRef);
    if (!snapshot.exists()) return;
    const request = snapshot.data() as FriendRequest;
    if (request.recipient_id !== auth.currentUser.uid || request.status !== 'pending') throw new Error('You cannot decline this request.');
    const now = new Date().toISOString();
    await updateDoc(requestRef, { status: 'rejected', updated_at: now });
    store.friendRequests = store.friendRequests.map(item => item.id === requestId ? { ...item, status: 'rejected', updated_at: now } : item);
    store.save();
  },
  async removeFriendship(userA: string, userB: string): Promise<void> {
    if (!auth.currentUser || (auth.currentUser.uid !== userA && auth.currentUser.uid !== userB)) throw new Error('You can only remove your own friendship.');
    const userLow = userA < userB ? userA : userB;
    const userHigh = userA < userB ? userB : userA;
    const id = userLow + '_' + userHigh;
    const snapshot = await getDoc(doc(db, 'friendships', id));
    if (snapshot.exists()) await deleteDoc(doc(db, 'friendships', id));
    store.friendships = store.friendships.filter(item => !((item.user_a === userA && item.user_b === userB) || (item.user_a === userB && item.user_b === userA)));
    store.save();
  },
  async getConversations(userId: string): Promise<Conversation[]> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in to view messages.');
    const records = await readCollection<any>('conversations', where('member_ids', 'array-contains', userId));
    const conversations = await Promise.all(records.map(async record => {
      const ids: string[] = Array.isArray(record.member_ids) ? record.member_ids : [];
      const members = await Promise.all(ids.map(async (id: string) => await this.getProfileById(id)));
      return { ...record, members: members.filter((profile): profile is Profile => !!profile) } as Conversation;
    }));
    store.conversations = conversations;
    store.save();
    return conversations.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },
  async getConversationById(convId: string): Promise<Conversation | null> {
    if (!auth.currentUser) throw new Error('Sign in to open a conversation.');
    const snapshot = await getDoc(doc(db, 'conversations', convId));
    if (!snapshot.exists()) return null;
    const record = snapshot.data();
    if (!Array.isArray(record.member_ids) || !record.member_ids.includes(auth.currentUser.uid)) throw new Error('You are not a member of this conversation.');
    const ids = record.member_ids as string[];
    const members = await Promise.all(ids.map(async id => await this.getProfileById(id)));
    return { ...record, id: snapshot.id, members: members.filter((profile): profile is Profile => !!profile) } as Conversation;
  },
  async getMessages(convId: string): Promise<Message[]> {
    const conversation = await this.getConversationById(convId);
    if (!conversation) return [];
    const records = await readCollection<Message>('messages', where('conversation_id', '==', convId));
    const messages = await Promise.all(records.map(async message => ({ ...message, sender: await this.getProfileById(message.sender_id) || undefined })));
    messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    store.messages = store.messages.filter(message => message.conversation_id !== convId).concat(messages);
    store.save();
    return messages;
  },
  async sendMessage(convId: string, senderId: string, body: string): Promise<Message> {
    if (!auth.currentUser || auth.currentUser.uid !== senderId) throw new Error('Sign in before sending a message.');
    const conversation = await this.getConversationById(convId);
    if (!conversation || !conversation.members.some(member => member.id === senderId)) throw new Error('You are not a member of this conversation.');
    const normalized = body.trim();
    if (!normalized || normalized.length > 5000) throw new Error('Messages must be between 1 and 5000 characters.');
    const id = 'msg_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    const now = new Date().toISOString();
    const message: Message = { id, conversation_id: convId, sender_id: senderId, body: normalized, created_at: now, status: 'sent' };
    await setDoc(doc(db, 'messages', id), message);
    const convRef = doc(db, 'conversations', convId);
    await updateDoc(convRef, { updated_at: now, last_message: { id, conversation_id: convId, sender_id: senderId, body: normalized, created_at: now, status: 'sent' } });
    for (const member of conversation.members) {
      if (member.id !== senderId) {
        void this.createNotification({ recipient_id: member.id, actor_id: senderId, type: 'message', reference_type: 'conversation', reference_id: convId, message: 'sent you a message.' });
      }
    }
    store.messages.push(message);
    store.conversations = store.conversations.map(item => item.id === convId ? { ...item, updated_at: now, last_message: message } : item);
    store.save();
    return { ...message, sender: await this.getProfileById(senderId) || undefined };
  },
  async startOrGetDirectConversation(user1Id: string, user2Id: string): Promise<Conversation> {
    if (!auth.currentUser || auth.currentUser.uid !== user1Id) throw new Error('Sign in as yourself to start a conversation.');
    if (user1Id === user2Id) throw new Error('You cannot message yourself.');
    const existing = await readCollection<any>('conversations', where('member_ids', 'array-contains', user1Id));
    const found = existing.find(conv => Array.isArray(conv.member_ids) && conv.member_ids.length === 2 && conv.member_ids.includes(user2Id));
    if (found) return this.getConversationById(found.id) as Promise<Conversation>;
    const [first, second] = await Promise.all([this.getProfileById(user1Id), this.getProfileById(user2Id)]);
    if (!first || !second) throw new Error('Both profiles must exist before messaging.');
    const ids = [user1Id, user2Id].sort();
    const id = 'dm_' + ids[0] + '_' + ids[1];
    const now = new Date().toISOString();
    const payload = { id, member_ids: ids, created_at: now, updated_at: now };
    await setDoc(doc(db, 'conversations', id), payload, { merge: true });
    const conv = { ...payload, members: [first, second], unread_count: 0 } as Conversation;
    store.conversations = store.conversations.filter(item => item.id !== id).concat(conv);
    store.save();
    return conv;
  },
  async getNotifications(userId: string): Promise<Notification[]> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in to view your notifications.');
    const records = await readCollection<Notification>('notifications', where('recipient_id', '==', userId));
    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const result = await Promise.all(records.map(async item => ({ ...item, actor: await this.getProfileById(item.actor_id) || undefined })));
    store.notifications = result;
    store.save();
    return result;
  },
  createNotification(notif: Omit<Notification, 'id' | 'created_at' | 'read_at'>): void {
    const uid = auth.currentUser?.uid;
    if (!uid || notif.actor_id !== uid) {
      console.warn('Skipped notification because actor_id did not match the signed-in Firebase user.');
      return;
    }
    const notification: Notification = {
      ...notif,
      id: 'notif_' + crypto.randomUUID().replace(/-/g, '').slice(0, 18),
      read_at: null,
      created_at: new Date().toISOString(),
    };
    void setDoc(doc(db, 'notifications', notification.id), cleanFirestoreData(notification))
      .then(() => {
        store.notifications.unshift(notification);
        store.save();
      })
      .catch(error => console.error('Could not save Firestore notification:', firestoreErrorMessage(error)));
  },
  async markNotificationRead(notifId: string): Promise<void> {
    if (!auth.currentUser) throw new Error('Sign in to update notifications.');
    const ref = doc(db, 'notifications', notifId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists() || snapshot.data().recipient_id !== auth.currentUser.uid) throw new Error('Notification not found or not yours.');
    const readAt = new Date().toISOString();
    await updateDoc(ref, { read_at: readAt });
    store.notifications = store.notifications.map(item => item.id === notifId ? { ...item, read_at: readAt } : item);
    store.save();
  },
  async markAllNotificationsRead(userId: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in to update your notifications.');
    const notifications = await readCollection<Notification>('notifications', where('recipient_id', '==', userId));
    await Promise.all(notifications.filter(item => !item.read_at).map(item => updateDoc(doc(db, 'notifications', item.id), { read_at: new Date().toISOString() })));
    const now = new Date().toISOString();
    store.notifications = notifications.map(item => ({ ...item, read_at: item.read_at || now }));
    store.save();
  },
  async getBlocks(userId: string): Promise<Block[]> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('Sign in to view your block list.');
    const records = await readCollection<Block>('blocks', where('blocker_id', '==', userId));
    const result = await Promise.all(records.map(async block => ({ ...block, blocked_profile: await this.getProfileById(block.blocked_id) || undefined })));
    store.blocks = result;
    store.save();
    return result;
  },
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== blockerId) throw new Error('Sign in to block a member.');
    if (blockerId === blockedId) throw new Error('You cannot block yourself.');
    const id = blockerId + '_' + blockedId;
    await setDoc(doc(db, 'blocks', id), { blocker_id: blockerId, blocked_id: blockedId, created_at: new Date().toISOString() }, { merge: true });
    // Remove any existing friendship using the deterministic Firestore document ID.
    await this.removeFriendship(blockerId, blockedId).catch(() => undefined);
    store.blocks = store.blocks.filter(block => !(block.blocker_id === blockerId && block.blocked_id === blockedId)).concat({ blocker_id: blockerId, blocked_id: blockedId, created_at: new Date().toISOString() });
    store.save();
  },
  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== blockerId) throw new Error('Sign in to unblock a member.');
    await deleteDoc(doc(db, 'blocks', blockerId + '_' + blockedId));
    store.blocks = store.blocks.filter(block => !(block.blocker_id === blockerId && block.blocked_id === blockedId));
    store.save();
  },
  async createReport(data: {
    reporter_id: string; target_type: ReportTargetType; target_id: string;
    reason: ReportReason; details?: string;
  }): Promise<Report> {
    if (!auth.currentUser || auth.currentUser.uid !== data.reporter_id) throw new Error('Sign in before reporting content.');
    const now = new Date().toISOString();
    const report: Report = {
      id: 'rep_' + crypto.randomUUID().replace(/-/g, '').slice(0, 18),
      reporter_id: data.reporter_id, target_type: data.target_type, target_id: data.target_id,
      reason: data.reason, details: data.details || null, status: 'pending',
      created_at: now, updated_at: now, target_summary: data.target_type + ' #' + data.target_id,
    };
    await setDoc(doc(db, 'reports', report.id), cleanFirestoreData(report));
    store.reports.unshift(report);
    store.save();
    return { ...report, reporter: await this.getProfileById(data.reporter_id) || undefined };
  },
  async getReports(): Promise<Report[]> {
    if (!auth.currentUser) throw new Error('Sign in to view reports.');
    const reports = await readCollection<Report>('reports');
    const result = await Promise.all(reports.map(async report => ({ ...report, reporter: await this.getProfileById(report.reporter_id) || undefined })));
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    store.reports = result;
    store.save();
    return result;
  },
  async updateReportStatus(reportId: string, status: Report['status']): Promise<void> {
    if (!auth.currentUser) throw new Error('Sign in before updating a report.');
    const ref = doc(db, 'reports', reportId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error('Report not found.');
    const update = { status, updated_at: new Date().toISOString() };
    await updateDoc(ref, update);
    store.reports = store.reports.map(report => report.id === reportId ? { ...report, ...update } : report);
    store.save();
  },
  async getModerationActions(): Promise<ModerationAction[]> {
    if (!auth.currentUser) throw new Error('Sign in to view moderation history.');
    const records = await readCollection<ModerationAction>('moderation_actions');
    const result = await Promise.all(records.map(async action => ({ ...action, moderator: await this.getProfileById(action.moderator_id) || undefined })));
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    store.moderationActions = result;
    store.save();
    return result;
  },
  async executeModerationAction(data: {
    moderator_id: string; target_type: string; target_id: string;
    action_type: ModerationActionType; reason: string; report_id?: string;
  }): Promise<ModerationAction> {
    if (!auth.currentUser || auth.currentUser.uid !== data.moderator_id) throw new Error('Sign in before performing moderation.');
    // Privileged effects must run in a trusted Cloud Function; client booleans are not sufficient authority.
    const token = await auth.currentUser.getIdTokenResult(true);
    if (token.claims.moderator !== true && token.claims.admin !== true) throw new Error('This account does not have a trusted Firebase moderator/admin claim.');
    const action: ModerationAction = {
      id: 'mact_' + crypto.randomUUID().replace(/-/g, '').slice(0, 18),
      moderator_id: data.moderator_id, target_type: data.target_type, target_id: data.target_id,
      action_type: data.action_type, reason: data.reason, created_at: new Date().toISOString(),
      report_id: data.report_id,
    } as ModerationAction;
    await setDoc(doc(db, 'moderation_actions', action.id), cleanFirestoreData(action));
    if (data.report_id) await this.updateReportStatus(data.report_id, 'resolved');
    store.moderationActions.unshift(action);
    store.save();
    return action;
  },
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
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error('You can deactivate only your own account.');
    const snapshot = await getDoc(doc(db, 'profiles', userId));
    if (!snapshot.exists()) throw new Error('Profile not found.');
    // Account deactivation status changes should be made by a trusted backend, not a client-writable role field.
    throw new Error('Account deactivation requires the trusted account-management Cloud Function.');
  },
};
