-- BiCircle Database Schema Migration
-- Migration: 20261013000000_bicircle_schema.sql
-- Description: Complete schema for BiCircle bisexual community platform with 16 tables, RLS policies, functions and triggers.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to ensure search_path safety
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 1. PROFILES (Public Profile Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) >= 2 AND char_length(display_name) <= 50),
  username TEXT NOT NULL UNIQUE CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$'),
  avatar_path TEXT,
  bio TEXT CHECK (char_length(bio) <= 600),
  interests TEXT[] DEFAULT '{}',
  pronouns TEXT CHECK (char_length(pronouns) <= 30),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'members_only', 'private')),
  is_moderator BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- ============================================================================
-- 2. USER_PRIVATE (Sensitive private details, never exposed to other members)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_private (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT,
  identity_notes TEXT, -- optional sensitive identity reflections
  birth_year INTEGER CHECK (birth_year IS NULL OR (birth_year >= 1900 AND birth_year <= 2012)),
  messaging_permission TEXT NOT NULL DEFAULT 'everyone' CHECK (messaging_permission IN ('everyone', 'friends_only', 'none')),
  allow_friend_requests BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  notify_messages BOOLEAN NOT NULL DEFAULT TRUE,
  notify_comments BOOLEAN NOT NULL DEFAULT TRUE,
  notify_friend_requests BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. GROUPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 80),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~* '^[a-z0-9_-]{3,80}$'),
  description TEXT NOT NULL CHECK (char_length(description) <= 1000),
  topic TEXT NOT NULL CHECK (char_length(topic) <= 50),
  rules TEXT DEFAULT 'Be respectful, maintain confidentiality, support fellow community members. No harassment or dating solicitation.',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_slug ON public.groups(slug);
CREATE INDEX IF NOT EXISTS idx_groups_visibility ON public.groups(visibility);

-- ============================================================================
-- 4. GROUP_MEMBERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('pending', 'active', 'rejected', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON public.group_members(membership_status);

-- ============================================================================
-- 5. FRIEND_REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_friend_requests_no_self CHECK (sender_id <> recipient_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_requests_unique_pending 
ON public.friend_requests (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id))
WHERE status = 'pending';

-- ============================================================================
-- 6. FRIENDSHIPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_friendships_no_self CHECK (user_a <> user_b),
  CONSTRAINT chk_friendships_order CHECK (user_a < user_b),
  CONSTRAINT uq_friendships_pair UNIQUE (user_a, user_b)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_a ON public.friendships(user_a);
CREATE INDEX IF NOT EXISTS idx_friendships_user_b ON public.friendships(user_b);

-- ============================================================================
-- 7. POSTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 5000),
  media_paths TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'group_only', 'friends_only', 'private')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'removed_by_mod')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_group ON public.posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- ============================================================================
-- 8. POST_LIKES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 1500),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'removed_by_mod')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id);

-- ============================================================================
-- 10. CONVERSATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 11. CONVERSATION_MEMBERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left', 'muted')),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON public.conversation_members(user_id);

-- ============================================================================
-- 12. MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 3000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);

-- ============================================================================
-- 13. BLOCKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT chk_blocks_no_self CHECK (blocker_id <> blocked_id)
);

-- ============================================================================
-- 14. REPORTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'profile', 'group', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('harassment', 'hate_speech', 'dating_or_hookup_solicitation', 'privacy_violation', 'spam_or_phishing', 'inappropriate_media', 'other')),
  details TEXT CHECK (char_length(details) <= 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ============================================================================
-- 15. MODERATION_ACTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'profile', 'group', 'user')),
  target_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('warn', 'remove_content', 'restrict_messaging', 'suspend_user', 'dismiss_report', 'reinstate')),
  reason TEXT NOT NULL CHECK (char_length(reason) >= 3 AND char_length(reason) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mod_actions_mod ON public.moderation_actions(moderator_id);

-- ============================================================================
-- 16. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'post_like', 'post_comment', 'group_invite', 'group_approved', 'message', 'mod_alert')),
  reference_type TEXT CHECK (reference_type IN ('post', 'comment', 'group', 'conversation', 'user')),
  reference_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id) WHERE read_at IS NULL;

-- Triggers for updated_at
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_user_private_updated_at BEFORE UPDATE ON public.user_private FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.is_moderator(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND (is_moderator = TRUE OR is_admin = TRUE)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.are_friends(user_1 UUID, user_2 UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_a = LEAST(user_1, user_2) AND user_b = GREATEST(user_1, user_2))
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_blocked_between(user_1 UUID, user_2 UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = user_1 AND blocked_id = user_2)
       OR (blocker_id = user_2 AND blocked_id = user_1)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- PROFILES Policies
CREATE POLICY "Public profiles are viewable by everyone unless blocked"
  ON public.profiles FOR SELECT
  USING (
    status = 'active'
    AND (
      auth.uid() IS NULL 
      OR NOT public.is_blocked_between(auth.uid(), id)
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- USER_PRIVATE Policies
CREATE POLICY "Users can only select their own private data"
  ON public.user_private FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own private data"
  ON public.user_private FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own private data"
  ON public.user_private FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- GROUPS Policies
CREATE POLICY "Anyone can view public groups"
  ON public.groups FOR SELECT
  USING (
    visibility = 'public' 
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = groups.id AND user_id = auth.uid() AND membership_status = 'active'
    )
    OR public.is_moderator(auth.uid())
  );

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners or moderators can update group details"
  ON public.groups FOR UPDATE
  USING (
    owner_id = auth.uid() 
    OR public.is_moderator(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = groups.id AND user_id = auth.uid() AND role IN ('owner', 'moderator')
    )
  );

-- GROUP_MEMBERS Policies
CREATE POLICY "Members can view membership in accessible groups"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_members.group_id 
      AND (g.visibility = 'public' OR g.owner_id = auth.uid())
    )
    OR group_members.user_id = auth.uid()
    OR public.is_moderator(auth.uid())
  );

CREATE POLICY "Users can join or request to join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave or managers can update membership"
  ON public.group_members FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.is_moderator(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()
    )
  );

-- FRIEND_REQUESTS Policies
CREATE POLICY "Users can view friend requests they sent or received"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id 
    AND NOT public.is_blocked_between(sender_id, recipient_id)
  );

CREATE POLICY "Parties can update friend request status"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- FRIENDSHIPS Policies
CREATE POLICY "Users can view friendships of their own"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "System or accepted members can delete friendship"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- POSTS Policies
CREATE POLICY "Users can read posts based on visibility and group membership"
  ON public.posts FOR SELECT
  USING (
    status = 'published'
    AND NOT public.is_blocked_between(auth.uid(), author_id)
    AND (
      visibility = 'public'
      OR (visibility = 'friends_only' AND (author_id = auth.uid() OR public.are_friends(auth.uid(), author_id)))
      OR (visibility = 'group_only' AND EXISTS (
          SELECT 1 FROM public.group_members 
          WHERE group_id = posts.group_id AND user_id = auth.uid() AND membership_status = 'active'
      ))
      OR author_id = auth.uid()
      OR public.is_moderator(auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors or moderators can update posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id OR public.is_moderator(auth.uid()));

CREATE POLICY "Authors or moderators can delete posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id OR public.is_moderator(auth.uid()));

-- POST_LIKES Policies
CREATE POLICY "Post likes are visible to anyone who can see the post"
  ON public.post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p WHERE p.id = post_likes.post_id
    )
  );

CREATE POLICY "Users can like posts as themselves"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- COMMENTS Policies
CREATE POLICY "Comments are viewable if the post is viewable"
  ON public.comments FOR SELECT
  USING (
    status = 'published'
    AND NOT public.is_blocked_between(auth.uid(), author_id)
    AND EXISTS (
      SELECT 1 FROM public.posts p WHERE p.id = comments.post_id
    )
  );

CREATE POLICY "Users can add comments as themselves"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = comments.post_id AND public.is_blocked_between(auth.uid(), p.author_id)
    )
  );

CREATE POLICY "Authors or moderators can update/delete comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id OR public.is_moderator(auth.uid()));

CREATE POLICY "Authors or moderators can delete comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = author_id OR public.is_moderator(auth.uid()));

-- CONVERSATIONS & CONVERSATION_MEMBERS Policies
CREATE POLICY "Members can view conversations they participate in"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm 
      WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view membership of their conversations"
  ON public.conversation_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm 
      WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()
    )
  );

-- MESSAGES Policies
CREATE POLICY "Participants can view conversation messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm 
      WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm 
      WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid()
    )
  );

-- BLOCKS Policies
CREATE POLICY "Users can see their own blocks"
  ON public.blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block someone"
  ON public.blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id AND blocker_id <> blocked_id);

CREATE POLICY "Users can unblock someone"
  ON public.blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- REPORTS Policies
CREATE POLICY "Reporters and moderators can view reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id OR public.is_moderator(auth.uid()));

CREATE POLICY "Authenticated users can submit reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Only moderators can update reports"
  ON public.reports FOR UPDATE
  USING (public.is_moderator(auth.uid()));

-- MODERATION_ACTIONS Policies
CREATE POLICY "Moderators can view moderation logs"
  ON public.moderation_actions FOR SELECT
  USING (public.is_moderator(auth.uid()));

CREATE POLICY "Moderators can create moderation logs"
  ON public.moderation_actions FOR INSERT
  WITH CHECK (auth.uid() = moderator_id AND public.is_moderator(auth.uid()));

-- NOTIFICATIONS Policies
CREATE POLICY "Users can view only their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can mark their notifications as read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id);
