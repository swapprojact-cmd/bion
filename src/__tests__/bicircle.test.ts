import { describe, it, expect, beforeEach } from 'vitest';
import { DataService, store } from '../lib/dataService';

describe('BiCircle Platform & Authorization Tests', () => {
  beforeEach(() => {
    store.resetToDefault();
  });

  describe('1. Profile & Privacy Constraints', () => {
    it('isolates private user data from public profiles', async () => {
      const publicProfile = await DataService.getProfileById('usr_maya');
      expect(publicProfile).toBeDefined();
      expect(publicProfile?.display_name).toBe('Maya Lin');
      // Public profile should NOT contain sensitive private fields
      expect((publicProfile as any).account_name).toBeUndefined();
      expect((publicProfile as any).identity_notes).toBeUndefined();

      // Private data is accessible only through dedicated user private store
      const privateData = await DataService.getUserPrivate('usr_maya');
      expect(privateData).toBeDefined();
      expect(privateData.messaging_permission).toBe('everyone');
    });

    it('allows updating permitted profile fields while preserving identity safety', async () => {
      const updated = await DataService.updateProfile('usr_maya', {
        bio: 'Updated community organizer bio.',
        pronouns: 'she/they',
      });
      expect(updated.bio).toBe('Updated community organizer bio.');
      expect(updated.pronouns).toBe('she/they');
    });
  });

  describe('2. Groups & Visibility Rules', () => {
    it('allows browsing public groups and listing members', async () => {
      const groups = await DataService.getGroups('usr_maya');
      const bookClub = groups.find(g => g.slug === 'bi-bookworms-literature');
      expect(bookClub).toBeDefined();
      expect(bookClub?.visibility).toBe('public');

      const members = await DataService.getGroupMembers(bookClub!.id);
      expect(members.length).toBeGreaterThan(0);
    });

    it('handles private group request and approval flow', async () => {
      const parentCircle = store.groups.find(g => g.slug === 'bi-parents-circle');
      expect(parentCircle?.visibility).toBe('private');

      // Jordan joins the private group (creates a pending membership)
      const membership = await DataService.joinGroup(parentCircle!.id, 'usr_jordan');
      expect(membership.membership_status).toBe('pending');

      // Alex (owner/moderator) approves Jordan
      await DataService.updateMemberStatus(parentCircle!.id, 'usr_jordan', 'active');
      const updatedMembers = await DataService.getGroupMembers(parentCircle!.id);
      const jordanMember = updatedMembers.find(m => m.user_id === 'usr_jordan');
      expect(jordanMember?.membership_status).toBe('active');
    });
  });

  describe('3. Posts, Comments & Reactions', () => {
    it('creates posts, toggles likes, and handles comments without duplicate counts', async () => {
      const newPost = await DataService.createPost({
        author_id: 'usr_jordan',
        body: 'Excited to discuss bisexual history essays in the book club!',
        visibility: 'public',
      });

      expect(newPost.id).toBeDefined();
      expect(newPost.likes_count).toBe(0);

      // Like post
      const likeRes1 = await DataService.toggleLike(newPost.id, 'usr_maya');
      expect(likeRes1.liked).toBe(true);
      expect(likeRes1.count).toBe(1);

      // Unlike post
      const likeRes2 = await DataService.toggleLike(newPost.id, 'usr_maya');
      expect(likeRes2.liked).toBe(false);
      expect(likeRes2.count).toBe(0);

      // Add comment
      const comment = await DataService.createComment(newPost.id, 'usr_maya', 'Great to have you with us Jordan!');
      expect(comment.body).toBe('Great to have you with us Jordan!');

      const comments = await DataService.getComments(newPost.id);
      expect(comments.length).toBe(1);
    });

    it('prevents non-author non-moderators from deleting another members post', async () => {
      // Find a post authored by Maya
      const mayaPost = store.posts.find(p => p.author_id === 'usr_maya')!;
      // Jordan tries to delete Maya's post (Jordan is regular member, not moderator)
      await expect(DataService.deletePost(mayaPost.id, 'usr_jordan')).rejects.toThrow('Unauthorized to delete this post');
    });
  });

  describe('4. Friendships & Connection Constraints', () => {
    it('prevents sending a friend request to oneself', async () => {
      await expect(DataService.sendFriendRequest('usr_jordan', 'usr_jordan')).rejects.toThrow('Cannot send friend request to yourself');
    });

    it('sends, accepts, and establishes a bidirectional friendship', async () => {
      // Kai sends a friend request to Jordan
      const req = await DataService.sendFriendRequest('usr_kai', 'usr_jordan');
      expect(req.status).toBe('pending');

      // Jordan accepts
      await DataService.acceptFriendRequest(req.id, 'usr_jordan');

      // Check both are now in each other's friendships
      const jordanFriends = await DataService.getFriendships('usr_jordan');
      const kaiFriends = await DataService.getFriendships('usr_kai');

      expect(jordanFriends.some(f => f.id === 'usr_kai')).toBe(true);
      expect(kaiFriends.some(f => f.id === 'usr_jordan')).toBe(true);
    });
  });

  describe('5. Blocking & Safety Enforcement', () => {
    it('blocks a user and removes them from feed interactions', async () => {
      // Jordan blocks Maya
      await DataService.blockUser('usr_jordan', 'usr_maya');

      const blocks = await DataService.getBlocks('usr_jordan');
      expect(blocks.some(b => b.blocked_id === 'usr_maya')).toBe(true);

      // Posts by Maya should no longer appear in Jordan's feed
      const jordanFeed = await DataService.getPosts({ currentUserId: 'usr_jordan' });
      expect(jordanFeed.some(p => p.author_id === 'usr_maya')).toBe(false);
    });
  });

  describe('6. Moderation & Audit Trail', () => {
    it('creates a report and records an immutable moderation action audit record', async () => {
      const report = await DataService.createReport({
        reporter_id: 'usr_jordan',
        target_type: 'post',
        target_id: 'post_2',
        reason: 'dating_or_hookup_solicitation',
        details: 'Dating solicitation detected.',
      });

      expect(report.status).toBe('pending');

      // Maya (moderator) executes action
      const action = await DataService.executeModerationAction({
        moderator_id: 'usr_maya',
        target_type: 'post',
        target_id: 'post_2',
        action_type: 'warn',
        reason: 'First warning: No dating or hookup solicitation allowed on BiCircle.',
        report_id: report.id,
      });

      expect(action.action_type).toBe('warn');
      const auditLog = await DataService.getModerationActions();
      expect(auditLog.some(a => a.id === action.id)).toBe(true);

      const updatedReports = await DataService.getReports();
      const updatedReport = updatedReports.find(r => r.id === report.id);
      expect(updatedReport?.status).toBe('resolved');
    });
  });
});
