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
import { auth, db } from './firebase';
import { doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, collection, query, where, orderBy, limit, runTransaction, writeBatch, getCountFromServer, type QueryConstraint } from 'firebase/firestore';

// The store is an in-memory view cache only. Firestore is the data source of truth.
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
    this.profiles = [];
    this.userPrivateMap = {};
    this.groups = [];
    this.groupMembers = [];
    this.posts = [];
    this.comments = [];
    this.friendships = [];
    this.friendRequests = [];
    this.conversations = [];
    this.messages = [];
    this.notifications = [];
    this.reports = [];
    this.moderationActions = [];
    this.blocks = [];
  }

  // Intentionally no localStorage persistence: successful Firestore writes are authoritative.
  save() {
    // DataService updates this in-memory view only after successful server operations.
  }

  resetToDefault() {
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

const profileServerCache = new Map<string, Profile | null>();
const groupServerCache = new Map<string, Group | null>();

function cleanForFirestore<T extends Record<string, any>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function documentValue<T>(snapshot: { id: string; data: () => unknown }): T {
  return { ...(snapshot.data() as Record<string, unknown>), id: snapshot.id } as T;
}

function cacheById<T extends { id: string }>(items: T[], value: T): T[] {
  const index = items.findIndex(item => item.id === value.id);
  if (index === -1) return [...items, value];
  return items.map((item, i) => i === index ? value : item);
}

function storedPost(post: Post): Record<string, unknown> {
  const { author: _author, group: _group, has_liked: _hasLiked, distance_km: _distance, ...data } = post as Post & { distance_km?: number };
  return cleanForFirestore(data) as Record<string, unknown>;
}

function groupMemberDocumentId(groupId: string, userId: string): string {
  return groupId + '_' + userId;
}

function friendshipDocumentId(userA: string, userB: string): string {
  return userA < userB ? userA + '_' + userB : userB + '_' + userA;
}

function requireSignedInUser(expectedUserId?: string): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in is required to use this feature.');
  if (expectedUserId && uid !== expectedUserId) throw new Error('Your sign-in does not match this action.');
  return uid;
}

async function profileFromCacheOrServer(userId: string): Promise<Profile | undefined> {
  if (profileServerCache.has(userId)) return profileServerCache.get(userId) || undefined;
  const snapshot = await getDoc(doc(db, 'profiles', userId));
  if (!snapshot.exists()) {
    profileServerCache.set(userId, null);
    return undefined;
  }
  const profile = documentValue<Profile>(snapshot);
  profileServerCache.set(userId, profile);
  store.profiles = cacheById(store.profiles, profile);
  return profile;
}

async function groupFromCacheOrServer(groupId: string): Promise<Group | undefined> {
  if (groupServerCache.has(groupId)) return groupServerCache.get(groupId) || undefined;
  const snapshot = await getDoc(doc(db, 'groups', groupId));
  if (!snapshot.exists()) {
    groupServerCache.set(groupId, null);
    return undefined;
  }
  const group = documentValue<Group>(snapshot);
  groupServerCache.set(groupId, group);
  store.groups = cacheById(store.groups, group);
  return group;
}

async function isActiveGroupMember(groupId: string, userId: string): Promise<boolean> {
  const membership = await getDoc(doc(db, 'group_members', groupMemberDocumentId(groupId, userId)));
  return membership.exists() && membership.data().membership_status === 'active';
}

async function blockedIdsForVisibility(userId: string): Promise<Set<string>> {
  const [outgoing, incoming] = await Promise.all([
    getDocs(query(collection(db, 'blocks'), where('blocker_id', '==', userId))),
    getDocs(query(collection(db, 'blocks'), where('blocked_id', '==', userId))),
  ]);
  const blockedIds = new Set<string>();
  outgoing.docs.forEach(item => blockedIds.add(String(item.data().blocked_id || '')));
  incoming.docs.forEach(item => blockedIds.add(String(item.data().blocker_id || '')));
  blockedIds.delete('');
  return blockedIds;
}

export const DataService = {
  async getNearbyProfiles(currentUserId?: string, options?: {
    maxDistanceKm?: number;
    city?: string;
    intention?: string;
    searchQuery?: string;
    coords?: { lat: number; lng: number };
  }): Promise<Profile[]> {
    const uid = auth.currentUser?.uid;
    const safeUserId = uid && (!currentUserId || currentUserId === uid) ? uid : undefined;
    const { maxDistanceKm, city, intention, searchQuery, coords } = options || {};
    const profiles = await this.getProfiles();
    const ownProfile = safeUserId ? await this.getProfileById(safeUserId) : null;
    const originLat = coords?.lat ?? ownProfile?.location_lat;
    const originLng = coords?.lng ?? ownProfile?.location_lng;
    const blockedIds = safeUserId ? await blockedIdsForVisibility(safeUserId) : new Set<string>();
    let list = profiles
      .filter(profile => profile.status === 'active' && profile.show_in_nearby !== false)
      .filter(profile => !safeUserId || (profile.id !== safeUserId && !blockedIds.has(profile.id)))
      .map(profile => {
        const distance = originLat != null && originLng != null
          ? calculateDistanceKm(originLat, originLng, profile.location_lat, profile.location_lng)
          : null;
        return { ...profile, distance_km: distance ?? undefined };
      });

    if (city && city !== 'All') list = list.filter(profile => profile.location_city?.toLowerCase().includes(city.toLowerCase()));
    if (intention && intention !== 'All') {
      list = list.filter(profile => profile.relationship_intentions?.some(item => item.toLowerCase().includes(intention.toLowerCase())));
    }
    if (maxDistanceKm != null && maxDistanceKm > 0) list = list.filter(profile => profile.distance_km != null && profile.distance_km <= maxDistanceKm);
    if (searchQuery?.trim()) {
      const term = searchQuery.toLowerCase();
      list = list.filter(profile =>
        profile.display_name.toLowerCase().includes(term) ||
        profile.username.toLowerCase().includes(term) ||
        profile.bio?.toLowerCase().includes(term) ||
        profile.interests.some(interest => interest.toLowerCase().includes(term)) ||
        profile.relationship_vibe?.toLowerCase().includes(term) ||
        profile.location_city?.toLowerCase().includes(term)
      );
    }

    return list.sort((a, b) => {
      if (a.distance_km == null && b.distance_km == null) return a.display_name.localeCompare(b.display_name);
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    });
  },

  async addProfilePhoto(userId: string, photo: { url: string; caption?: string; is_18_plus?: boolean }): Promise<Profile> {
    requireSignedInUser(userId);
    const profile = await this.getProfileById(userId);
    if (!profile) throw new Error('Your profile could not be found in Firestore.');
    const now = new Date().toISOString();
    const media = { id: 'photo_' + crypto.randomUUID(), type: 'photo' as const, url: photo.url, caption: photo.caption || '', is_18_plus: !!photo.is_18_plus, created_at: now };
    const updated = { ...profile, photos: [media, ...(profile.photos || [])], updated_at: now };
    await updateDoc(doc(db, 'profiles', userId), cleanForFirestore(updated) as Record<string, unknown>);
    store.profiles = cacheById(store.profiles, updated);
    store.save();
    return updated;
  },

  async addProfileVideo(userId: string, video: { url: string; title: string; caption?: string; thumbnail_url?: string; is_18_plus?: boolean }): Promise<Profile> {
    requireSignedInUser(userId);
    const profile = await this.getProfileById(userId);
    if (!profile) throw new Error('Your profile could not be found in Firestore.');
    const now = new Date().toISOString();
    const media = { id: 'vid_' + crypto.randomUUID(), type: 'video' as const, url: video.url, title: video.title, caption: video.caption || '', thumbnail_url: video.thumbnail_url, is_18_plus: !!video.is_18_plus, created_at: now };
    const updated = { ...profile, videos: [media, ...(profile.videos || [])], updated_at: now };
    await updateDoc(doc(db, 'profiles', userId), cleanForFirestore(updated) as Record<string, unknown>);
    store.profiles = cacheById(store.profiles, updated);
    store.save();
    return updated;
  },

  async deleteProfileMedia(userId: string, mediaId: string, type: 'photo' | 'video'): Promise<Profile> {
    requireSignedInUser(userId);
    const profile = await this.getProfileById(userId);
    if (!profile) throw new Error('Your profile could not be found in Firestore.');
    const updated: Profile = {
      ...profile,
      photos: type === 'photo' ? (profile.photos || []).filter(item => item.id !== mediaId) : profile.photos,
      videos: type === 'video' ? (profile.videos || []).filter(item => item.id !== mediaId) : profile.videos,
      updated_at: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'profiles', userId), cleanForFirestore(updated) as Record<string, unknown>);
    store.profiles = cacheById(store.profiles, updated);
    store.save();
    return updated;
  },

  async seedFirestoreWithInitialData(): Promise<{ success: boolean; count: number }> {
    console.warn('Automatic Firestore seeding is disabled to prevent demo data from entering production.');
    return { success: false, count: 0 };
  },

  async getProfiles(): Promise<Profile[]> {
    const publicSnapshot = await getDocs(query(collection(db, 'profiles'), where('visibility', '==', 'public'), where('status', '==', 'active')));
    const results = new Map<string, Profile>();
    publicSnapshot.docs.forEach(snapshot => {
      const profile = documentValue<Profile>(snapshot);
      results.set(profile.id, profile);
    });

    const uid = auth.currentUser?.uid;
    if (uid) {
      const membersSnapshot = await getDocs(query(collection(db, 'profiles'), where('visibility', '==', 'members_only'), where('status', '==', 'active')));
      membersSnapshot.docs.forEach(snapshot => {
        const profile = documentValue<Profile>(snapshot);
        results.set(profile.id, profile);
      });
      const ownSnapshot = await getDoc(doc(db, 'profiles', uid));
      if (ownSnapshot.exists()) {
        const profile = documentValue<Profile>(ownSnapshot);
        results.set(profile.id, profile);
      }
    }
    const profiles = [...results.values()];
    store.profiles = profiles;
    store.save();
    return profiles;
  },

  async getProfileById(id: string): Promise<Profile | null> {
    const snapshot = await getDoc(doc(db, 'profiles', id));
    if (!snapshot.exists()) return null;
    const profile = documentValue<Profile>(snapshot);
    store.profiles = cacheById(store.profiles, profile);
    return profile;
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    requireSignedInUser(id);
    const current = await this.getProfileById(id);
    if (!current) throw new Error('Your profile could not be found in Firestore.');
    const next = { ...current, ...updates, id, updated_at: new Date().toISOString() };
    delete (next as Partial<Profile>).distance_km;
    await updateDoc(doc(db, 'profiles', id), cleanForFirestore(next) as Record<string, unknown>);
    store.profiles = cacheById(store.profiles, next);
    store.save();
    return next;
  },

  async getUserPrivate(userId: string): Promise<UserPrivate> {
    requireSignedInUser(userId);
    const ref = doc(db, 'user_private', userId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) return documentValue<UserPrivate>(snapshot);
    const now = new Date().toISOString();
    const defaults: UserPrivate = {
      user_id: userId, messaging_permission: 'everyone', allow_friend_requests: true,
      email_notifications: true, notify_messages: true, notify_comments: true,
      notify_friend_requests: true, created_at: now, updated_at: now,
    };
    await setDoc(ref, defaults);
    store.userPrivateMap[userId] = defaults;
    store.save();
    return defaults;
  },

  async updateUserPrivate(userId: string, updates: Partial<UserPrivate>): Promise<UserPrivate> {
    requireSignedInUser(userId);
    const current = await this.getUserPrivate(userId);
    const next = { ...current, ...updates, user_id: userId, updated_at: new Date().toISOString() };
    await setDoc(doc(db, 'user_private', userId), cleanForFirestore(next) as Record<string, unknown>, { merge: true });
    store.userPrivateMap[userId] = next;
    store.save();
    return next;
  },

  async getGroups(currentUserId?: string): Promise<Group[]> {
    const publicSnapshot = await getDocs(query(collection(db, 'groups'), where('visibility', '==', 'public'), where('status', '==', 'active')));
    const byId = new Map<string, Group>();
    publicSnapshot.docs.forEach(snapshot => byId.set(snapshot.id, documentValue<Group>(snapshot)));
    const uid = auth.currentUser?.uid;
    let memberships: GroupMember[] = [];
    if (uid && (!currentUserId || currentUserId === uid)) {
      const membershipSnapshot = await getDocs(query(collection(db, 'group_members'), where('user_id', '==', uid)));
      memberships = membershipSnapshot.docs.map(snapshot => documentValue<GroupMember>(snapshot));
      for (const membership of memberships) {
        if (byId.has(membership.group_id)) continue;
        const groupSnapshot = await getDoc(doc(db, 'groups', membership.group_id));
        if (groupSnapshot.exists()) byId.set(groupSnapshot.id, documentValue<Group>(groupSnapshot));
      }
    }
    const membershipByGroup = new Map(memberships.map(membership => [membership.group_id, membership]));
    const groups: Group[] = [];
    for (const group of byId.values()) {
      let memberCount = Number(group.member_count || 0);
      try {
        const countSnapshot = await getCountFromServer(query(collection(db, 'group_members'), where('group_id', '==', group.id), where('membership_status', '==', 'active')));
        memberCount = countSnapshot.data().count;
      } catch {
        // Preserve stored counts if older deployed rules prevent public group aggregates.
      }
      const membership = membershipByGroup.get(group.id);
      groups.push({ ...group, member_count: memberCount, is_member: membership?.membership_status === 'active', membership_status: membership?.membership_status, user_role: membership?.role });
    }
    store.groups = groups;
    store.groupMembers = memberships;
    store.save();
    return groups;
  },

  async getGroupById(groupId: string, _currentUserId?: string): Promise<Group | null> {
    const direct = await getDoc(doc(db, 'groups', groupId));
    if (direct.exists()) return documentValue<Group>(direct);
    const snapshot = await getDocs(query(collection(db, 'groups'), where('slug', '==', groupId), where('visibility', '==', 'public'), limit(1)));
    return snapshot.empty ? null : documentValue<Group>(snapshot.docs[0]);
  },

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const snapshot = await getDocs(query(collection(db, 'group_members'), where('group_id', '==', groupId)));
    const members = await Promise.all(snapshot.docs.map(async item => {
      const member = documentValue<GroupMember>(item);
      const profile = await this.getProfileById(member.user_id);
      return { ...member, profile: profile || undefined };
    }));
    store.groupMembers = [...store.groupMembers.filter(member => member.group_id !== groupId), ...members];
    store.save();
    return members;
  },

  async createGroup(data: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> {
    const uid = requireSignedInUser(data.owner_id);
    const ref = doc(collection(db, 'groups'));
    const now = new Date().toISOString();
    const group: Group = { ...data, id: ref.id, owner_id: uid, status: 'active', member_count: 1, is_member: true, membership_status: 'active', user_role: 'owner', created_at: now, updated_at: now };
    await setDoc(ref, {
      id: group.id, owner_id: uid, name: group.name, slug: group.slug,
      description: group.description, topic: group.topic, rules: group.rules,
      visibility: group.visibility, status: group.status, member_count: 1,
      created_at: now, updated_at: now,
    });
    const membership: GroupMember = { group_id: group.id, user_id: uid, role: 'owner', membership_status: 'active', created_at: now, updated_at: now };
    await setDoc(doc(db, 'group_members', groupMemberDocumentId(group.id, uid)), membership);
    store.groups = cacheById(store.groups, group);
    store.groupMembers = [...store.groupMembers.filter(item => !(item.group_id === group.id && item.user_id === uid)), membership];
    store.save();
    return group;
  },

  async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
    const uid = requireSignedInUser(userId);
    const groupRef = doc(db, 'groups', groupId);
    const memberRef = doc(db, 'group_members', groupMemberDocumentId(groupId, uid));
    const membership = await runTransaction(db, async transaction => {
      const [groupSnapshot, memberSnapshot] = await Promise.all([transaction.get(groupRef), transaction.get(memberRef)]);
      if (!groupSnapshot.exists()) throw new Error('This group no longer exists.');
      const group = documentValue<Group>(groupSnapshot);
      if (group.status !== 'active') throw new Error('This group is not accepting members.');
      const previous = memberSnapshot.exists() ? documentValue<GroupMember>(memberSnapshot) : null;
      if (previous?.membership_status === 'active' || previous?.membership_status === 'pending') return previous;
      if (previous?.membership_status === 'banned') throw new Error('You cannot join this group.');
      const now = new Date().toISOString();
      const next: GroupMember = { group_id: groupId, user_id: uid, role: 'member', membership_status: group.visibility === 'private' ? 'pending' : 'active', created_at: previous?.created_at || now, updated_at: now };
      transaction.set(memberRef, next);
      return next;
    });
    store.groupMembers = [...store.groupMembers.filter(item => !(item.group_id === groupId && item.user_id === uid)), membership];
    store.save();
    const group = await this.getGroupById(groupId, uid);
    if (membership.membership_status === 'pending' && group) {
      await this.createNotification({ recipient_id: group.owner_id, actor_id: uid, type: 'group_invite', reference_type: 'group', reference_id: groupId, message: 'requested to join ' + group.name });
    }
    return membership;
  },

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const uid = requireSignedInUser(userId);
    const ref = doc(db, 'group_members', groupMemberDocumentId(groupId, uid));
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) await deleteDoc(ref);
    store.groupMembers = store.groupMembers.filter(member => !(member.group_id === groupId && member.user_id === uid));
    store.save();
  },

  async updateMemberStatus(groupId: string, userId: string, status: 'active' | 'rejected'): Promise<void> {
    requireSignedInUser();
    const ref = doc(db, 'group_members', groupMemberDocumentId(groupId, userId));
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error('Group membership request not found.');
    const member = documentValue<GroupMember>(snapshot);
    if (member.membership_status === status) return;
    const now = new Date().toISOString();
    await updateDoc(ref, { membership_status: status, updated_at: now });
    store.groupMembers = store.groupMembers.map(item => item.group_id === groupId && item.user_id === userId ? { ...item, membership_status: status, updated_at: now } : item);
    store.save();
    if (status === 'active') {
      const group = await this.getGroupById(groupId);
      if (group) {
        await this.createNotification({ recipient_id: userId, actor_id: auth.currentUser!.uid, type: 'group_approved', reference_type: 'group', reference_id: groupId, message: 'Your request to join ' + group.name + ' was approved!' });
      }
    }
  },

  async getPosts(options?: { currentUserId?: string; groupId?: string; sort?: 'latest' | 'popular'; authorId?: string }): Promise<Post[]> {
    const uid = auth.currentUser?.uid;
    const { groupId, sort = 'latest', authorId } = options || {};
    const results = new Map<string, Post>();

    // Put every filter before orderBy/limit so all generated Firestore queries are valid.
    const fetchWith = async (filters: QueryConstraint[]) => {
      const snapshot = await getDocs(query(
        collection(db, 'posts'),
        ...filters,
        where('status', '==', 'published'),
        orderBy('created_at', 'desc'),
        limit(60)
      ));
      snapshot.docs.forEach(item => {
        const post = documentValue<Post>(item);
        if (post.status === 'published') results.set(post.id, post);
      });
    };

    if (authorId && uid === authorId) {
      await fetchWith([where('author_id', '==', authorId)]);
    } else {
      const publicFilters: QueryConstraint[] = [where('visibility', '==', 'public')];
      if (groupId) publicFilters.push(where('group_id', '==', groupId));
      if (authorId) publicFilters.push(where('author_id', '==', authorId));
      await fetchWith(publicFilters);

      if (uid && groupId && await isActiveGroupMember(groupId, uid)) {
        const groupFilters: QueryConstraint[] = [
          where('visibility', '==', 'group_only'),
          where('group_id', '==', groupId),
        ];
        if (authorId) groupFilters.push(where('author_id', '==', authorId));
        await fetchWith(groupFilters);
      }

      if (uid && authorId && !groupId) {
        const [friendshipA, friendshipB] = await Promise.all([
          getDocs(query(collection(db, 'friendships'), where('user_a', '==', uid), where('user_b', '==', authorId))),
          getDocs(query(collection(db, 'friendships'), where('user_a', '==', authorId), where('user_b', '==', uid))),
        ]);
        if (friendshipA.size || friendshipB.size) {
          await fetchWith([where('visibility', '==', 'friends_only'), where('author_id', '==', authorId)]);
        }
      } else if (uid && !groupId && !authorId) {
        const [memberships, friends] = await Promise.all([
          getDocs(query(collection(db, 'group_members'), where('user_id', '==', uid), where('membership_status', '==', 'active'))),
          this.getFriendships(uid),
        ]);

        for (const membership of memberships.docs) {
          await fetchWith([
            where('visibility', '==', 'group_only'),
            where('group_id', '==', String(membership.data().group_id)),
          ]);
        }
        for (const friend of friends) {
          await fetchWith([
            where('visibility', '==', 'friends_only'),
            where('author_id', '==', friend.id),
          ]);
        }
      }
    }

    const hydrated = await Promise.all([...results.values()].map(async post => {
      const [author, group] = await Promise.all([
        profileFromCacheOrServer(post.author_id),
        post.group_id ? groupFromCacheOrServer(post.group_id) : Promise.resolve(undefined),
      ]);
      let likesCount = Number(post.likes_count || 0);
      let commentsCount = Number(post.comments_count || 0);
      let hasLiked = false;

      try {
        likesCount = (await getCountFromServer(collection(db, 'posts', post.id, 'likes'))).data().count;
      } catch {
        // Saved counters remain a display fallback if aggregation reads are not available.
      }
      try {
        commentsCount = (await getCountFromServer(query(
          collection(db, 'comments'),
          where('post_id', '==', post.id),
          where('status', '==', 'published')
        ))).data().count;
      } catch {
        // Saved counters remain a display fallback if aggregation reads are not available.
      }
      if (uid) {
        try {
          hasLiked = (await getDoc(doc(db, 'posts', post.id, 'likes', uid))).exists();
        } catch {
          hasLiked = false;
        }
      }
      return { ...post, author, group, likes_count: likesCount, comments_count: commentsCount, has_liked: hasLiked };
    }));

    const blockedIds = uid ? await blockedIdsForVisibility(uid) : new Set<string>();
    const visible = hydrated.filter(post => !blockedIds.has(post.author_id));
    const sorted = sort === 'popular'
      ? visible.sort((a, b) => b.likes_count - a.likes_count)
      : visible.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    store.posts = sorted;
    store.save();
    return sorted;
  },

  async createPost(data: {
    author_id: string; body: string; group_id?: string | null; media_paths?: string[];
    video_url?: string; media_type?: 'photo' | 'video'; visibility?: Visibility | 'group_only';
    is_18_plus?: boolean; location_name?: string; location_lat?: number; location_lng?: number;
  }): Promise<Post> {
    const uid = requireSignedInUser(data.author_id);
    if (!data.body.trim() && !data.media_paths?.length && !data.video_url) throw new Error('Add text, a photo, or a video before sharing your post.');
    if (data.group_id && !(await isActiveGroupMember(data.group_id, uid))) throw new Error('Join this circle before posting to its member feed.');
    const now = new Date().toISOString();
    const ref = doc(collection(db, 'posts'));
    const post: Post = {
      id: ref.id, author_id: uid, group_id: data.group_id || null, body: data.body.trim(),
      media_paths: data.media_paths || [], video_url: data.video_url || undefined,
      media_type: data.media_type || (data.video_url ? 'video' : data.media_paths?.length ? 'photo' : undefined),
      is_18_plus: !!data.is_18_plus, location_name: data.location_name, location_lat: data.location_lat, location_lng: data.location_lng,
      visibility: (data.visibility as Post['visibility']) || (data.group_id ? 'group_only' : 'public'),
      status: 'published', created_at: now, updated_at: now, likes_count: 0, comments_count: 0, has_liked: false,
      author: await profileFromCacheOrServer(uid), group: data.group_id ? await groupFromCacheOrServer(data.group_id) : undefined,
    };
    await setDoc(ref, storedPost(post));
    store.posts = [post, ...store.posts.filter(item => item.id !== post.id)];
    store.save();
    return post;
  },

  async deletePost(postId: string, userId: string): Promise<void> {
    requireSignedInUser(userId);
    const ref = doc(db, 'posts', postId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error('Post not found.');
    // The deployed Firestore rule is the authority for author/moderator authorization.
    await deleteDoc(ref);
    store.posts = store.posts.filter(post => post.id !== postId);
    store.comments = store.comments.filter(comment => comment.post_id !== postId);
    store.save();
  },

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    const uid = requireSignedInUser(userId);
    const likeRef = doc(db, 'posts', postId, 'likes', uid);
    const postRef = doc(db, 'posts', postId);
    const liked = await runTransaction(db, async transaction => {
      const [postSnapshot, likeSnapshot] = await Promise.all([transaction.get(postRef), transaction.get(likeRef)]);
      if (!postSnapshot.exists()) throw new Error('Post not found.');
      if (likeSnapshot.exists()) {
        transaction.delete(likeRef);
        return false;
      }
      transaction.set(likeRef, { post_id: postId, user_id: uid, created_at: new Date().toISOString() });
      return true;
    });
    const count = (await getCountFromServer(collection(db, 'posts', postId, 'likes'))).data().count;
    store.posts = store.posts.map(post => post.id === postId ? { ...post, has_liked: liked, likes_count: count } : post);
    store.save();
    const post = store.posts.find(item => item.id === postId);
    if (liked && post && post.author_id !== uid) {
      await this.createNotification({ recipient_id: post.author_id, actor_id: uid, type: 'post_like', reference_type: 'post', reference_id: postId, message: 'liked your post.' });
    }
    return { liked, count };
  },

  async getComments(postId: string): Promise<Comment[]> {
    const snapshot = await getDocs(query(collection(db, 'comments'), where('post_id', '==', postId), where('status', '==', 'published'), orderBy('created_at', 'asc')));
    const comments = await Promise.all(snapshot.docs.map(async item => {
      const comment = documentValue<Comment>(item);
      return { ...comment, author: await profileFromCacheOrServer(comment.author_id) };
    }));
    store.comments = [...store.comments.filter(comment => comment.post_id !== postId), ...comments];
    store.save();
    return comments;
  },

  async createComment(postId: string, authorId: string, body: string): Promise<Comment> {
    const uid = requireSignedInUser(authorId);
    if (!body.trim()) throw new Error('Write a comment before sending.');
    const postSnapshot = await getDoc(doc(db, 'posts', postId));
    if (!postSnapshot.exists()) throw new Error('Post not found.');
    const now = new Date().toISOString();
    const ref = doc(collection(db, 'comments'));
    const comment: Comment = { id: ref.id, post_id: postId, author_id: uid, body: body.trim(), status: 'published', created_at: now, updated_at: now, author: await profileFromCacheOrServer(uid) };
    await setDoc(ref, { id: ref.id, post_id: postId, author_id: uid, body: comment.body, status: 'published', created_at: now, updated_at: now });
    store.comments = [...store.comments, comment];
    const post = store.posts.find(item => item.id === postId);
    if (post) {
      store.posts = store.posts.map(item => item.id === postId ? { ...item, comments_count: item.comments_count + 1 } : item);
      if (post.author_id !== uid) await this.createNotification({ recipient_id: post.author_id, actor_id: uid, type: 'post_comment', reference_type: 'post', reference_id: postId, message: 'commented on your post.' });
    }
    store.save();
    return comment;
  },

  async deleteComment(commentId: string, userId: string): Promise<void> {
    requireSignedInUser(userId);
    const ref = doc(db, 'comments', commentId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error('Comment not found.');
    await deleteDoc(ref);
    const comment = documentValue<Comment>(snapshot);
    store.comments = store.comments.filter(item => item.id !== commentId);
    store.posts = store.posts.map(post => post.id === comment.post_id ? { ...post, comments_count: Math.max(0, post.comments_count - 1) } : post);
    store.save();
  },

  async getFriendships(userId: string): Promise<Profile[]> {
    const uid = requireSignedInUser(userId);
    const [a, b] = await Promise.all([
      getDocs(query(collection(db, 'friendships'), where('user_a', '==', uid))),
      getDocs(query(collection(db, 'friendships'), where('user_b', '==', uid))),
    ]);
    const map = new Map<string, Friendship>();
    [...a.docs, ...b.docs].forEach(snapshot => map.set(snapshot.id, documentValue<Friendship>(snapshot)));
    const friendships = [...map.values()];
    store.friendships = friendships;
    const profiles = await Promise.all(friendships.map(item => this.getProfileById(item.user_a === uid ? item.user_b : item.user_a)));
    return profiles.filter((profile): profile is Profile => !!profile && profile.status === 'active');
  },

  async getFriendRequests(userId: string): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
    const uid = requireSignedInUser(userId);
    const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'friend_requests'), where('recipient_id', '==', uid), where('status', '==', 'pending'))),
      getDocs(query(collection(db, 'friend_requests'), where('sender_id', '==', uid), where('status', '==', 'pending'))),
    ]);
    const incomingDocs = incomingSnapshot.docs.map(snapshot => documentValue<FriendRequest>(snapshot));
    const outgoingDocs = outgoingSnapshot.docs.map(snapshot => documentValue<FriendRequest>(snapshot));
    const incoming = await Promise.all(incomingDocs.map(async request => ({ ...request, sender: await profileFromCacheOrServer(request.sender_id) })));
    const outgoing = await Promise.all(outgoingDocs.map(async request => ({ ...request, recipient: await profileFromCacheOrServer(request.recipient_id) })));
    store.friendRequests = [...incomingDocs, ...outgoingDocs];
    store.save();
    return { incoming, outgoing };
  },

  async sendFriendRequest(senderId: string, recipientId: string): Promise<FriendRequest> {
    const uid = requireSignedInUser(senderId);
    if (uid === recipientId) throw new Error('Cannot send a friend request to yourself.');
    const [forward, reverse, friendshipA, friendshipB, recipient] = await Promise.all([
      getDocs(query(collection(db, 'friend_requests'), where('sender_id', '==', uid), where('recipient_id', '==', recipientId), where('status', '==', 'pending'))),
      getDocs(query(collection(db, 'friend_requests'), where('sender_id', '==', recipientId), where('recipient_id', '==', uid), where('status', '==', 'pending'))),
      getDocs(query(collection(db, 'friendships'), where('user_a', '==', uid), where('user_b', '==', recipientId))),
      getDocs(query(collection(db, 'friendships'), where('user_a', '==', recipientId), where('user_b', '==', uid))),
      this.getProfileById(recipientId),
    ]);
    if (forward.size || reverse.size) throw new Error('A friend request is already pending.');
    if (friendshipA.size || friendshipB.size) throw new Error('You are already friends.');
    if (!recipient) throw new Error('This profile is no longer available.');
    const now = new Date().toISOString();
    const ref = doc(collection(db, 'friend_requests'));
    const request: FriendRequest = { id: ref.id, sender_id: uid, recipient_id: recipientId, status: 'pending', created_at: now, updated_at: now, sender: await this.getProfileById(uid) || undefined, recipient };
    await setDoc(ref, { id: ref.id, sender_id: uid, recipient_id: recipientId, status: 'pending', created_at: now, updated_at: now });
    store.friendRequests = [...store.friendRequests, request];
    await this.createNotification({ recipient_id: recipientId, actor_id: uid, type: 'friend_request', reference_type: 'user', reference_id: uid, message: 'sent you a friend request.' });
    store.save();
    return request;
  },

  async acceptFriendRequest(requestId: string, currentUserId: string): Promise<void> {
    const uid = requireSignedInUser(currentUserId);
    const requestRef = doc(db, 'friend_requests', requestId);
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(requestRef);
      if (!snapshot.exists()) throw new Error('Friend request not found.');
      const request = documentValue<FriendRequest>(snapshot);
      if (request.recipient_id !== uid || request.status !== 'pending') throw new Error('This request cannot be accepted.');
      const now = new Date().toISOString();
      const friendshipId = friendshipDocumentId(request.sender_id, request.recipient_id);
      transaction.update(requestRef, { status: 'accepted', updated_at: now });
      transaction.set(doc(db, 'friendships', friendshipId), {
        id: friendshipId,
        user_a: request.sender_id < request.recipient_id ? request.sender_id : request.recipient_id,
        user_b: request.sender_id < request.recipient_id ? request.recipient_id : request.sender_id,
        accepted_request_id: requestId,
        created_at: now,
      });
    });
    const snapshot = await getDoc(requestRef);
    if (snapshot.exists()) {
      const request = documentValue<FriendRequest>(snapshot);
      store.friendRequests = store.friendRequests.map(item => item.id === requestId ? request : item);
      await this.createNotification({ recipient_id: request.sender_id, actor_id: uid, type: 'friend_accepted', reference_type: 'user', reference_id: uid, message: 'accepted your friend request.' });
    }
    store.save();
  },

  async declineFriendRequest(requestId: string): Promise<void> {
    requireSignedInUser();
    const ref = doc(db, 'friend_requests', requestId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return;
    if (snapshot.data().recipient_id !== auth.currentUser?.uid) throw new Error('Only the recipient can decline this request.');
    if (snapshot.data().status !== 'pending') return;
    await updateDoc(ref, { status: 'rejected', updated_at: new Date().toISOString() });
    store.friendRequests = store.friendRequests.map(item => item.id === requestId ? { ...item, status: 'rejected' } : item);
    store.save();
  },

  async removeFriendship(userA: string, userB: string): Promise<void> {
    const uid = requireSignedInUser(userA);
    const [forward, reverse] = await Promise.all([
      getDocs(query(collection(db, 'friendships'), where('user_a', '==', uid), where('user_b', '==', userB))),
      getDocs(query(collection(db, 'friendships'), where('user_a', '==', userB), where('user_b', '==', uid))),
    ]);
    const matches = [...forward.docs, ...reverse.docs];
    for (const item of matches) await deleteDoc(item.ref);
    store.friendships = store.friendships.filter(item => !((item.user_a === uid && item.user_b === userB) || (item.user_a === userB && item.user_b === uid)));
    store.save();
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    const uid = requireSignedInUser(userId);
    const snapshot = await getDocs(query(collection(db, 'conversations'), where('member_ids', 'array-contains', uid), orderBy('updated_at', 'desc')));
    const conversations = await Promise.all(snapshot.docs.map(async item => {
      const raw = item.data();
      const ids = Array.isArray(raw.member_ids) ? raw.member_ids as string[] : [];
      const members = (await Promise.all(ids.map(id => profileFromCacheOrServer(id)))).filter((profile): profile is Profile => !!profile);
      const last = await getDocs(query(collection(db, 'messages'), where('conversation_id', '==', item.id), orderBy('created_at', 'desc'), limit(1)));
      const lastMessage = last.empty ? undefined : documentValue<Message>(last.docs[0]);
      if (lastMessage) lastMessage.sender = await profileFromCacheOrServer(lastMessage.sender_id);
      return { id: item.id, created_at: String(raw.created_at || ''), updated_at: String(raw.updated_at || ''), members, last_message: lastMessage, unread_count: Number(raw.unread_count || 0) } as Conversation;
    }));
    store.conversations = conversations;
    store.save();
    return conversations;
  },

  async getConversationById(convId: string): Promise<Conversation | null> {
    const snapshot = await getDoc(doc(db, 'conversations', convId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    const ids = Array.isArray(data.member_ids) ? data.member_ids as string[] : [];
    const members = (await Promise.all(ids.map(id => profileFromCacheOrServer(id)))).filter((profile): profile is Profile => !!profile);
    return { id: snapshot.id, created_at: String(data.created_at || ''), updated_at: String(data.updated_at || ''), members, unread_count: Number(data.unread_count || 0) };
  },

  async getMessages(convId: string): Promise<Message[]> {
    requireSignedInUser();
    const snapshot = await getDocs(query(collection(db, 'messages'), where('conversation_id', '==', convId), orderBy('created_at', 'asc')));
    const messages = await Promise.all(snapshot.docs.map(async item => {
      const message = documentValue<Message>(item);
      return { ...message, sender: await profileFromCacheOrServer(message.sender_id) };
    }));
    store.messages = [...store.messages.filter(message => message.conversation_id !== convId), ...messages];
    store.save();
    return messages;
  },

  async sendMessage(convId: string, senderId: string, body: string): Promise<Message> {
    const uid = requireSignedInUser(senderId);
    if (!body.trim()) throw new Error('Write a message before sending.');
    const conversationRef = doc(db, 'conversations', convId);
    const conversationSnapshot = await getDoc(conversationRef);
    if (!conversationSnapshot.exists()) throw new Error('Conversation not found.');
    const memberIds = conversationSnapshot.data().member_ids as string[];
    if (!memberIds.includes(uid)) throw new Error('You are not a participant in this conversation.');
    const now = new Date().toISOString();
    const ref = doc(collection(db, 'messages'));
    const message: Message = { id: ref.id, conversation_id: convId, sender_id: uid, body: body.trim(), created_at: now, status: 'sent', sender: await profileFromCacheOrServer(uid) };
    await setDoc(ref, { id: ref.id, conversation_id: convId, sender_id: uid, body: message.body, created_at: now, status: 'sent' });
    await updateDoc(conversationRef, { updated_at: now });
    store.messages = [...store.messages, message];
    store.conversations = store.conversations.map(conversation => conversation.id === convId ? { ...conversation, updated_at: now, last_message: message } : conversation);
    await Promise.all(memberIds.filter(memberId => memberId !== uid).map(recipientId =>
      this.createNotification({ recipient_id: recipientId, actor_id: uid, type: 'message', reference_type: 'conversation', reference_id: convId, message: 'sent you a message.' })
    ));
    store.save();
    return message;
  },

  async startOrGetDirectConversation(user1Id: string, user2Id: string): Promise<Conversation> {
    const uid = requireSignedInUser(user1Id);
    if (uid === user2Id) throw new Error('You cannot start a conversation with yourself.');
    const snapshot = await getDocs(query(collection(db, 'conversations'), where('member_ids', 'array-contains', uid)));
    const existing = snapshot.docs.find(item => {
      const ids = item.data().member_ids as string[];
      return ids.length === 2 && ids.includes(user2Id);
    });
    if (existing) {
      const conversation = await this.getConversationById(existing.id);
      if (conversation) return conversation;
    }
    const [profile1, profile2] = await Promise.all([this.getProfileById(uid), this.getProfileById(user2Id)]);
    if (!profile1 || !profile2) throw new Error('Both member profiles must exist to start a conversation.');
    const now = new Date().toISOString();
    const ref = doc(collection(db, 'conversations'));
    await setDoc(ref, { member_ids: [uid, user2Id], created_at: now, updated_at: now, unread_count: 0 });
    const conversation: Conversation = { id: ref.id, created_at: now, updated_at: now, members: [profile1, profile2], unread_count: 0 };
    store.conversations = [conversation, ...store.conversations.filter(item => item.id !== ref.id)];
    store.save();
    return conversation;
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    const uid = requireSignedInUser(userId);
    const snapshot = await getDocs(query(collection(db, 'notifications'), where('recipient_id', '==', uid), orderBy('created_at', 'desc'), limit(100)));
    const notifications = await Promise.all(snapshot.docs.map(async item => {
      const notification = documentValue<Notification>(item);
      return { ...notification, actor: await profileFromCacheOrServer(notification.actor_id) };
    }));
    store.notifications = notifications;
    store.save();
    return notifications;
  },

  async createNotification(notif: Omit<Notification, 'id' | 'created_at' | 'read_at'>): Promise<void> {
    const uid = requireSignedInUser();
    if (notif.actor_id !== uid) throw new Error('Notifications must be created by the signed-in actor.');
    const now = new Date().toISOString();
    const ref = doc(collection(db, 'notifications'));
    const notification: Notification = { ...notif, id: ref.id, read_at: null, created_at: now };
    await setDoc(ref, {
      id: ref.id, recipient_id: notification.recipient_id, actor_id: uid, type: notification.type,
      reference_type: notification.reference_type || null, reference_id: notification.reference_id || null,
      message: notification.message || '', read_at: null, created_at: now,
    });
    store.notifications = [notification, ...store.notifications.filter(item => item.id !== notification.id)];
    store.save();
  },

  async markNotificationRead(notifId: string): Promise<void> {
    requireSignedInUser();
    const ref = doc(db, 'notifications', notifId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return;
    if (snapshot.data().recipient_id !== auth.currentUser?.uid) throw new Error('You cannot update another member’s notification.');
    const now = new Date().toISOString();
    await updateDoc(ref, { read_at: now });
    store.notifications = store.notifications.map(item => item.id === notifId ? { ...item, read_at: now } : item);
    store.save();
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    const uid = requireSignedInUser(userId);
    const snapshot = await getDocs(query(collection(db, 'notifications'), where('recipient_id', '==', uid)));
    const unread = snapshot.docs.filter(item => !item.data().read_at);
    for (let i = 0; i < unread.length; i += 450) {
      const batch = writeBatch(db);
      unread.slice(i, i + 450).forEach(item => batch.update(item.ref, { read_at: new Date().toISOString() }));
      await batch.commit();
    }
    const now = new Date().toISOString();
    store.notifications = store.notifications.map(item => ({ ...item, read_at: item.read_at || now }));
    store.save();
  },

  async getBlocks(userId: string): Promise<Block[]> {
    const uid = requireSignedInUser(userId);
    const snapshot = await getDocs(query(collection(db, 'blocks'), where('blocker_id', '==', uid)));
    const blocks = await Promise.all(snapshot.docs.map(async item => {
      const block: Block = {
        blocker_id: String(item.data().blocker_id),
        blocked_id: String(item.data().blocked_id),
        created_at: String(item.data().created_at || ''),
      };
      return { ...block, blocked_profile: await profileFromCacheOrServer(block.blocked_id) };
    }));
    store.blocks = blocks.map(({ blocked_profile: _profile, ...block }) => block);
    store.save();
    return blocks;
  },

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    const uid = requireSignedInUser(blockerId);
    if (uid === blockedId) throw new Error('You cannot block yourself.');
    const existing = await getDocs(query(
      collection(db, 'blocks'),
      where('blocker_id', '==', uid),
      where('blocked_id', '==', blockedId)
    ));
    if (existing.empty) {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'blocks', uid + '_' + blockedId), {
        blocker_id: uid, blocked_id: blockedId, created_at: now,
      });
    }
    await this.removeFriendship(uid, blockedId);
    store.blocks = [
      ...store.blocks.filter(block => !(block.blocker_id === uid && block.blocked_id === blockedId)),
      { blocker_id: uid, blocked_id: blockedId, created_at: new Date().toISOString() },
    ];
    store.save();
  },

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const uid = requireSignedInUser(blockerId);
    const snapshot = await getDocs(query(
      collection(db, 'blocks'),
      where('blocker_id', '==', uid),
      where('blocked_id', '==', blockedId)
    ));
    for (const item of snapshot.docs) await deleteDoc(item.ref);
    store.blocks = store.blocks.filter(block => !(block.blocker_id === uid && block.blocked_id === blockedId));
    store.save();
  },

  async createReport(data: { reporter_id: string; target_type: ReportTargetType; target_id: string; reason: ReportReason; details?: string }): Promise<Report> {
    const uid = requireSignedInUser(data.reporter_id);
    const now = new Date().toISOString();
    const ref = doc(collection(db, 'reports'));
    const report: Report = { id: ref.id, reporter_id: uid, target_type: data.target_type, target_id: data.target_id, reason: data.reason, details: data.details || null, status: 'pending', created_at: now, updated_at: now, reporter: await profileFromCacheOrServer(uid), target_summary: data.target_type + ' #' + data.target_id };
    await setDoc(ref, { id: ref.id, reporter_id: uid, target_type: report.target_type, target_id: report.target_id, reason: report.reason, details: report.details, status: report.status, created_at: now, updated_at: now });
    store.reports = [report, ...store.reports.filter(item => item.id !== report.id)];
    store.save();
    return report;
  },

  async getReports(): Promise<Report[]> {
    requireSignedInUser();
    const snapshot = await getDocs(query(collection(db, 'reports'), orderBy('created_at', 'desc')));
    const reports = await Promise.all(snapshot.docs.map(async item => {
      const report = documentValue<Report>(item);
      return { ...report, reporter: await profileFromCacheOrServer(report.reporter_id), target_summary: report.target_type + ' #' + report.target_id };
    }));
    store.reports = reports;
    store.save();
    return reports;
  },

  async updateReportStatus(reportId: string, status: Report['status']): Promise<void> {
    requireSignedInUser();
    const ref = doc(db, 'reports', reportId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error('Report not found.');
    const now = new Date().toISOString();
    await updateDoc(ref, { status, updated_at: now });
    store.reports = store.reports.map(report => report.id === reportId ? { ...report, status, updated_at: now } : report);
    store.save();
  },

  async getModerationActions(): Promise<ModerationAction[]> {
    requireSignedInUser();
    const snapshot = await getDocs(query(collection(db, 'moderation_actions'), orderBy('created_at', 'desc')));
    const actions = await Promise.all(snapshot.docs.map(async item => {
      const action = documentValue<ModerationAction>(item);
      return { ...action, moderator: await profileFromCacheOrServer(action.moderator_id) };
    }));
    store.moderationActions = actions;
    store.save();
    return actions;
  },

  async executeModerationAction(data: { moderator_id: string; target_type: string; target_id: string; action_type: ModerationActionType; reason: string; report_id?: string }): Promise<ModerationAction> {
    const uid = requireSignedInUser(data.moderator_id);
    const now = new Date().toISOString();
    if (data.action_type === 'remove_content') {
      const targetCollection = data.target_type === 'comment' ? 'comments' : 'posts';
      await updateDoc(doc(db, targetCollection, data.target_id), { status: 'removed_by_mod', updated_at: now });
    } else if (data.action_type === 'suspend_user') {
      await updateDoc(doc(db, 'profiles', data.target_id), { status: 'suspended', updated_at: now });
    }
    const ref = doc(collection(db, 'moderation_actions'));
    const action: ModerationAction = { id: ref.id, moderator_id: uid, target_type: data.target_type, target_id: data.target_id, action_type: data.action_type, reason: data.reason, created_at: now, moderator: await profileFromCacheOrServer(uid) };
    await setDoc(ref, { id: ref.id, moderator_id: uid, target_type: action.target_type, target_id: action.target_id, action_type: action.action_type, reason: action.reason, report_id: data.report_id || null, created_at: now });
    if (data.report_id) await this.updateReportStatus(data.report_id, 'resolved');
    store.moderationActions = [action, ...store.moderationActions];
    store.save();
    return action;
  },

  async exportUserData(userId: string): Promise<string> {
    const uid = requireSignedInUser(userId);
    const [profile, privateProfile, posts, friends, commentSnapshot] = await Promise.all([
      this.getProfileById(uid),
      this.getUserPrivate(uid),
      this.getPosts({ currentUserId: uid, authorId: uid }),
      this.getFriendships(uid),
      getDocs(query(collection(db, 'comments'), where('author_id', '==', uid))),
    ]);
    const payload = { export_date: new Date().toISOString(), platform: 'BiCircle', profile, privacy_and_settings: privateProfile, posts: posts.map(storedPost), comments: commentSnapshot.docs.map(item => documentValue<Comment>(item)), friends_count: friends.length, friends: friends.map(friend => ({ username: friend.username, display_name: friend.display_name })) };
    return JSON.stringify(payload, null, 2);
  },

  async deactivateUser(userId: string): Promise<void> {
    const uid = requireSignedInUser(userId);
    await updateDoc(doc(db, 'profiles', uid), { status: 'deactivated', updated_at: new Date().toISOString() });
    store.profiles = store.profiles.map(profile => profile.id === uid ? { ...profile, status: 'deactivated' } : profile);
    store.save();
  },
};
