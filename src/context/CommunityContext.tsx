import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Post,
  Comment,
  Group,
  GroupMember,
  FriendRequest,
  Profile,
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
import { DataService, clearDataSessionCache } from '../lib/dataService';
import { useAuth } from './AuthContext';
import { auth } from '../lib/firebase';

interface CommunityContextType {
  posts: Post[];
  groups: Group[];
  friends: Profile[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  conversations: Conversation[];
  notifications: Notification[];
  unreadNotifsCount: number;
  blockedUsers: Block[];
  reports: Report[];
  moderationActions: ModerationAction[];
  sortFeed: 'latest' | 'popular';
  setSortFeed: (sort: 'latest' | 'popular') => void;
  isLoadingFeed: boolean;

  // Actions
  refreshAll: () => Promise<void>;
  createPost: (
    body: string,
    groupId?: string | null,
    media?: string[],
    visibility?: Visibility | 'group_only',
    videoUrl?: string,
    is18Plus?: boolean,
    locationName?: string
  ) => Promise<Post>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  getCommentsForPost: (postId: string) => Promise<Comment[]>;
  addComment: (postId: string, body: string) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<void>;

  // Profile Media Actions
  addProfilePhoto: (photo: { url: string; caption?: string; is_18_plus?: boolean }) => Promise<Profile>;
  addProfileVideo: (video: { url: string; title: string; caption?: string; thumbnail_url?: string; is_18_plus?: boolean }) => Promise<Profile>;
  deleteProfileMedia: (mediaId: string, type: 'photo' | 'video') => Promise<Profile>;

  // Group actions
  createGroup: (data: { name: string; slug: string; description: string; topic: string; rules: string; visibility: 'public' | 'private' }) => Promise<Group>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  getGroupMembers: (groupId: string) => Promise<GroupMember[]>;
  approveGroupMember: (groupId: string, userId: string) => Promise<void>;
  rejectGroupMember: (groupId: string, userId: string) => Promise<void>;

  // Friend actions
  sendFriendRequest: (targetUserId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (targetUserId: string) => Promise<void>;

  // Messaging actions
  startConversation: (targetUserId: string) => Promise<Conversation>;
  sendMessage: (convId: string, body: string) => Promise<Message>;
  getMessages: (convId: string) => Promise<Message[]>;

  // Notification actions
  markNotificationRead: (notifId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Safety & Moderation
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
  reportContent: (targetType: ReportTargetType, targetId: string, reason: ReportReason, details?: string) => Promise<void>;
  takeModerationAction: (targetType: string, targetId: string, actionType: ModerationActionType, reason: string, reportId?: string) => Promise<void>;
  updateReportStatus: (reportId: string, status: Report['status']) => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Block[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([]);
  const [sortFeed, setSortFeed] = useState<'latest' | 'popular'>('latest');
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(false);
  const lastLoadedUid = useRef<string | null>(null);
  const refreshGeneration = useRef(0);

  const clearCommunityState = () => {
    setPosts([]);
    setGroups([]);
    setFriends([]);
    setIncomingRequests([]);
    setOutgoingRequests([]);
    setConversations([]);
    setNotifications([]);
    setBlockedUsers([]);
    setReports([]);
    setModerationActions([]);
  };

  const refreshAll = useCallback(async () => {
    const uid = currentUser?.id || null;
    if (!uid) {
      refreshGeneration.current += 1;
      lastLoadedUid.current = null;
      clearDataSessionCache();
      clearCommunityState();
      setIsLoadingFeed(false);
      return;
    }

    if (lastLoadedUid.current !== uid) {
      lastLoadedUid.current = uid;
      clearDataSessionCache();
      clearCommunityState();
    }

    const generation = ++refreshGeneration.current;
    setIsLoadingFeed(true);
    try {
      const [
        loadedPosts,
        loadedGroups,
        loadedFriends,
        loadedReqs,
        loadedConvs,
        loadedNotifs,
        loadedBlocks,
        loadedReps,
        loadedActions,
      ] = await Promise.all([
        DataService.getPosts({ currentUserId: currentUser.id, sort: sortFeed }),
        DataService.getGroups(currentUser.id),
        DataService.getFriendships(currentUser.id),
        DataService.getFriendRequests(currentUser.id),
        DataService.getConversations(currentUser.id),
        DataService.getNotifications(currentUser.id),
        DataService.getBlocks(currentUser.id),
        currentUser.is_moderator || currentUser.is_admin ? DataService.getReports() : Promise.resolve([]),
        currentUser.is_moderator || currentUser.is_admin ? DataService.getModerationActions() : Promise.resolve([]),
      ]);

      // A previous account or sort request may finish after this one; never let its result replace the active view.
      if (generation !== refreshGeneration.current || auth.currentUser?.uid !== uid) return;
      setPosts(loadedPosts);
      setGroups(loadedGroups);
      setFriends(loadedFriends);
      setIncomingRequests(loadedReqs.incoming);
      setOutgoingRequests(loadedReqs.outgoing);
      setConversations(loadedConvs);
      setNotifications(loadedNotifs);
      setBlockedUsers(loadedBlocks);
      setReports(loadedReps);
      setModerationActions(loadedActions);
    } catch (err) {
      if (generation === refreshGeneration.current) {
        console.error('Failed to load community state from Firestore:', err);
      }
    } finally {
      if (generation === refreshGeneration.current) setIsLoadingFeed(false);
    }
  }, [currentUser, sortFeed]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  // Feed Actions
  const createPost = async (
    body: string,
    groupId?: string | null,
    media?: string[],
    visibility?: Visibility | 'group_only',
    videoUrl?: string,
    is18Plus?: boolean,
    locationName?: string
  ) => {
    if (!currentUser) throw new Error('Must be logged in');
    const newPost = await DataService.createPost({
      author_id: currentUser.id,
      body,
      group_id: groupId,
      media_paths: media,
      video_url: videoUrl,
      visibility,
      is_18_plus: is18Plus,
      location_name: locationName,
    });
    setPosts(prev => [newPost, ...prev]);
    return newPost;
  };

  const addProfilePhoto = async (photo: { url: string; caption?: string; is_18_plus?: boolean }) => {
    if (!currentUser) throw new Error('Must be logged in');
    const updated = await DataService.addProfilePhoto(currentUser.id, photo);
    await refreshAll();
    return updated;
  };

  const addProfileVideo = async (video: { url: string; title: string; caption?: string; thumbnail_url?: string; is_18_plus?: boolean }) => {
    if (!currentUser) throw new Error('Must be logged in');
    const updated = await DataService.addProfileVideo(currentUser.id, video);
    await refreshAll();
    return updated;
  };

  const deleteProfileMedia = async (mediaId: string, type: 'photo' | 'video') => {
    if (!currentUser) throw new Error('Must be logged in');
    const updated = await DataService.deleteProfileMedia(currentUser.id, mediaId, type);
    await refreshAll();
    return updated;
  };

  const deletePost = async (postId: string) => {
    if (!currentUser) return;
    await DataService.deletePost(postId, currentUser.id);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const toggleLike = async (postId: string) => {
    if (!currentUser) return;
    const res = await DataService.toggleLike(postId, currentUser.id);
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            has_liked: res.liked,
            likes_count: res.count,
          };
        }
        return p;
      })
    );
  };

  const getCommentsForPost = async (postId: string) => {
    return DataService.getComments(postId);
  };

  const addComment = async (postId: string, body: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    const comment = await DataService.createComment(postId, currentUser.id, body);
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p))
    );
    return comment;
  };

  const deleteComment = async (commentId: string) => {
    if (!currentUser) return;
    await DataService.deleteComment(commentId, currentUser.id);
  };

  // Group Actions
  const createGroup = async (data: { name: string; slug: string; description: string; topic: string; rules: string; visibility: 'public' | 'private' }) => {
    if (!currentUser) throw new Error('Must be logged in');
    const created = await DataService.createGroup({
      ...data,
      owner_id: currentUser.id,
      status: 'active',
    });
    setGroups(prev => [created, ...prev]);
    return created;
  };

  const joinGroup = async (groupId: string) => {
    if (!currentUser) return;
    await DataService.joinGroup(groupId, currentUser.id);
    await refreshAll();
  };

  const leaveGroup = async (groupId: string) => {
    if (!currentUser) return;
    await DataService.leaveGroup(groupId, currentUser.id);
    await refreshAll();
  };

  const getGroupMembers = async (groupId: string) => {
    return DataService.getGroupMembers(groupId);
  };

  const approveGroupMember = async (groupId: string, userId: string) => {
    await DataService.updateMemberStatus(groupId, userId, 'active');
    await refreshAll();
  };

  const rejectGroupMember = async (groupId: string, userId: string) => {
    await DataService.updateMemberStatus(groupId, userId, 'rejected');
    await refreshAll();
  };

  // Friend Actions
  const sendFriendRequest = async (targetUserId: string) => {
    if (!currentUser) return;
    await DataService.sendFriendRequest(currentUser.id, targetUserId);
    await refreshAll();
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!currentUser) return;
    await DataService.acceptFriendRequest(requestId, currentUser.id);
    await refreshAll();
  };

  const declineFriendRequest = async (requestId: string) => {
    await DataService.declineFriendRequest(requestId);
    await refreshAll();
  };

  const removeFriend = async (targetUserId: string) => {
    if (!currentUser) return;
    await DataService.removeFriendship(currentUser.id, targetUserId);
    await refreshAll();
  };

  // Messaging Actions
  const startConversation = async (targetUserId: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    const conv = await DataService.startOrGetDirectConversation(currentUser.id, targetUserId);
    setConversations(prev => {
      const exists = prev.find(c => c.id === conv.id);
      return exists ? prev : [conv, ...prev];
    });
    return conv;
  };

  const sendMessage = async (convId: string, body: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    const msg = await DataService.sendMessage(convId, currentUser.id, body);
    setConversations(prev =>
      prev.map(c => (c.id === convId ? { ...c, last_message: msg, updated_at: msg.created_at } : c))
    );
    return msg;
  };

  const getMessages = async (convId: string) => {
    return DataService.getMessages(convId);
  };

  // Notifications
  const markNotificationRead = async (notifId: string) => {
    await DataService.markNotificationRead(notifId);
    setNotifications(prev =>
      prev.map(n => (n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n))
    );
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    await DataService.markAllNotificationsRead(currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  };

  // Safety & Moderation
  const blockUser = async (targetUserId: string) => {
    if (!currentUser) return;
    await DataService.blockUser(currentUser.id, targetUserId);
    await refreshAll();
  };

  const unblockUser = async (targetUserId: string) => {
    if (!currentUser) return;
    await DataService.unblockUser(currentUser.id, targetUserId);
    await refreshAll();
  };

  const reportContent = async (targetType: ReportTargetType, targetId: string, reason: ReportReason, details?: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    await DataService.createReport({
      reporter_id: currentUser.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      details,
    });
    await refreshAll();
  };

  const takeModerationAction = async (targetType: string, targetId: string, actionType: ModerationActionType, reason: string, reportId?: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    await DataService.executeModerationAction({
      moderator_id: currentUser.id,
      target_type: targetType,
      target_id: targetId,
      action_type: actionType,
      reason,
      report_id: reportId,
    });
    await refreshAll();
  };

  const updateReportStatus = async (reportId: string, status: Report['status']) => {
    await DataService.updateReportStatus(reportId, status);
    setReports(prev => prev.map(r => (r.id === reportId ? { ...r, status } : r)));
  };

  const unreadNotifsCount = notifications.filter(n => !n.read_at).length;

  return (
    <CommunityContext.Provider
      value={{
        posts,
        groups,
        friends,
        incomingRequests,
        outgoingRequests,
        conversations,
        notifications,
        unreadNotifsCount,
        blockedUsers,
        reports,
        moderationActions,
        sortFeed,
        setSortFeed,
        isLoadingFeed,
        refreshAll,
        createPost,
        deletePost,
        toggleLike,
        getCommentsForPost,
        addComment,
        deleteComment,
        addProfilePhoto,
        addProfileVideo,
        deleteProfileMedia,
        createGroup,
        joinGroup,
        leaveGroup,
        getGroupMembers,
        approveGroupMember,
        rejectGroupMember,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        startConversation,
        sendMessage,
        getMessages,
        markNotificationRead,
        markAllNotificationsRead,
        blockUser,
        unblockUser,
        reportContent,
        takeModerationAction,
        updateReportStatus,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) throw new Error('useCommunity must be used within CommunityProvider');
  return context;
};
