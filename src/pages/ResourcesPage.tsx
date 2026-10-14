import React, { useState } from 'react';
import { BookOpen, Sparkles, Filter, ExternalLink, MessageCircle, Heart, ArrowRight } from 'lucide-react';
import { COMMUNITY_RESOURCES, CURRENT_WEEKLY_PROMPT } from '../lib/resourcesData';
import { useAuth } from '../context/AuthContext';

interface ResourcesPageProps {
  navigate: (route: string) => void;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  const categories = ['All', 'Literature', 'History', 'Parenting', 'Mental Health', 'Podcasts'];

  const filtered = COMMUNITY_RESOURCES.filter(r => {
    const matchesCat = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8 py-4 text-[#F8F5FC]">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#9B5CFF] mb-1 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" /> Community Library & Education
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
          BiCircle Knowledge & Resources
        </h1>
        <p className="text-xs sm:text-sm text-[#B9B0C6] mt-1">
          Curated literature, historical archives, parenting guides, podcasts, and weekly reflection prompts.
        </p>
      </div>

      {/* Featured Weekly Community Prompt */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#191321] via-[#221730] to-[#191321] border border-[#3D2E55] space-y-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#F05AA6] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> {CURRENT_WEEKLY_PROMPT.weekTitle}
          </span>
          <span className="text-[11px] text-[#B9B0C6]">
            {CURRENT_WEEKLY_PROMPT.responseCount} community replies
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold font-display text-white">
            "{CURRENT_WEEKLY_PROMPT.question}"
          </h2>
          <p className="text-xs text-[#B9B0C6] leading-relaxed">
            {CURRENT_WEEKLY_PROMPT.context}
          </p>
        </div>

        <button
          onClick={() => navigate('/feed')}
          className="px-4 py-2 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 hover:opacity-95 transition-opacity"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Reply in Community Feed</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#9B5CFF] text-white shadow-sm'
                  : 'bg-[#191321] border border-[#2D233D] text-[#B9B0C6] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search resources by title, keywords, or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-[#191321] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF]"
        />
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(res => (
          <div
            key={res.id}
            className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] hover:border-[#3D2E55] transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="font-semibold text-[#9B5CFF] uppercase tracking-wider">
                  {res.category}
                </span>
                <span className="text-[#B9B0C6]">By {res.authorOrSource}</span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-[#9B5CFF] transition-colors">
                {res.title}
              </h3>

              <p className="mt-2 text-xs text-[#B9B0C6] leading-relaxed">
                {res.description}
              </p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#2D233D]/60 flex items-center justify-between text-xs text-[#9B5CFF]">
              <span className="font-medium group-hover:underline cursor-pointer">
                {res.linkText}
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
