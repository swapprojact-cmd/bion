import React, { useState, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Comment } from '../../types';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { currentUser, isModerator } = useAuth();
  const { getCommentsForPost, addComment, deleteComment } = useCommunity();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    getCommentsForPost(postId).then(data => {
      if (mounted) {
        setComments(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [postId, getCommentsForPost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim() || submitting || !currentUser) return;

    setSubmitting(true);
    try {
      const added = await addComment(postId, newCommentBody.trim());
      setComments(prev => [...prev, added]);
      setNewCommentBody('');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <div className="pt-3 mt-3 border-t border-[#2D233D]/60 space-y-3">
      {/* Input */}
      {currentUser && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Avatar src={currentUser.avatar_path} name={currentUser.display_name} size="sm" />
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Write a supportive reply..."
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC]"
            />
            <button
              type="submit"
              disabled={submitting || !newCommentBody.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-[#9B5CFF] hover:text-[#F05AA6] disabled:opacity-30 disabled:hover:text-[#9B5CFF] transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Comment list */}
      {loading ? (
        <div className="py-2 text-center text-xs text-[#B9B0C6]">Loading replies...</div>
      ) : comments.length === 0 ? (
        <div className="py-2 text-center text-xs text-[#B9B0C6]/70">No comments yet. Start the conversation!</div>
      ) : (
        <div className="space-y-2.5">
          {comments.map((comment) => {
            const author = comment.author;
            const isAuthor = currentUser?.id === comment.author_id;
            const canDelete = isAuthor || isModerator;

            return (
              <div key={comment.id} className="flex items-start gap-2.5 text-xs group">
                <Avatar src={author?.avatar_path} name={author?.display_name || 'Member'} size="sm" />
                <div className="flex-1 bg-[#0E0B13]/70 rounded-xl px-3 py-2 border border-[#2D233D]/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white">{author?.display_name || 'Member'}</span>
                      <span className="text-[11px] text-[#B9B0C6]">@{author?.username}</span>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#B9B0C6] hover:text-rose-400 p-0.5 transition-opacity"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[#F8F5FC] leading-relaxed whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
