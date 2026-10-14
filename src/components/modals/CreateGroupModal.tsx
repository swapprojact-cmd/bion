import React, { useState } from 'react';
import { Users, X, Lock, Globe } from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createGroup } = useCommunity();
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('Personal Stories & Support');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('Be respectful, support one another, and maintain group confidentiality.');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError('Name and description are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const grp = await createGroup({
        name: name.trim(),
        slug: slug || 'group-' + Date.now(),
        topic,
        description: description.trim(),
        rules: rules.trim(),
        visibility,
      });

      setName('');
      setDescription('');
      onClose();
      if (onCreated) onCreated(grp.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#191321] border border-[#2D233D] rounded-2xl p-6 text-[#F8F5FC] shadow-2xl relative">
        <div className="flex items-start justify-between pb-3 border-b border-[#2D233D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#9B5CFF]/15 text-[#9B5CFF] border border-[#9B5CFF]/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display">Create Community Group</h3>
              <p className="text-xs text-[#B9B0C6]">
                Build a dedicated circle around shared interests or life stages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#B9B0C6] hover:text-white rounded-lg hover:bg-[#2D233D]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
              Group Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bi Writers Circle, Pacific Northwest Hikers..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-sm focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
              Primary Topic / Category
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-sm focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC]"
            >
              <option value="Personal Stories & Support">Personal Stories & Support</option>
              <option value="Literature & Culture">Literature & Culture</option>
              <option value="Family & Parenting">Family & Parenting</option>
              <option value="Careers & Mentorship">Careers & Mentorship</option>
              <option value="Arts & Media">Arts & Media</option>
              <option value="Regional & Local Circles">Regional & Local Circles</option>
              <option value="Sports & Outdoor Activities">Sports & Outdoor Activities</option>
              <option value="Gaming & Hobbies">Gaming & Hobbies</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
              Description
            </label>
            <textarea
              required
              rows={3}
              placeholder="What is this group about? Who should join?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
              Community Rules
            </label>
            <textarea
              rows={2}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
              Group Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  visibility === 'public'
                    ? 'bg-[#9B5CFF]/15 border-[#9B5CFF] text-white'
                    : 'bg-[#0E0B13] border-[#2D233D] text-[#B9B0C6] hover:border-[#3D2E55]'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs text-white">
                  <Globe className="w-4 h-4 text-[#9B5CFF]" /> Public Group
                </div>
                <div className="text-[11px] text-[#B9B0C6] mt-1">
                  Anyone in BiCircle can view posts and join directly.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  visibility === 'private'
                    ? 'bg-[#9B5CFF]/15 border-[#9B5CFF] text-white'
                    : 'bg-[#0E0B13] border-[#2D233D] text-[#B9B0C6] hover:border-[#3D2E55]'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs text-white">
                  <Lock className="w-4 h-4 text-[#F05AA6]" /> Private Group
                </div>
                <div className="text-[11px] text-[#B9B0C6] mt-1">
                  Posts visible only to approved members. Requires request to join.
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2D233D]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#B9B0C6] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-[#9B5CFF]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
