import React, { useMemo, useState } from 'react';
import { ArrowRight, Compass, HeartHandshake, MessageCircle, Sparkles, Users, Clock, Flame } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { CreatePostCard } from '../components/feed/CreatePostCard';
import { PostCard } from '../components/feed/PostCard';
import { store } from '../lib/dataService';

interface FeedPageProps {
  navigate: (route: string) => void;
}

type FeedChannel = 'all' | 'nearby' | 'circles';

export const FeedPage: React.FC<FeedPageProps> = ({ navigate }) => {
  const { posts, sortFeed, setSortFeed, isLoadingFeed } = useCommunity();
  const { currentUser } = useAuth();
  const [feedChannel, setFeedChannel] = useState<FeedChannel>('all');

  const filteredPosts = useMemo(() => posts.filter((post) => {
    if (feedChannel === 'circles') return post.group_id != null;
    if (feedChannel === 'nearby') {
      const author = store.profiles.find((profile) => profile.id === post.author_id);
      // Do not guess a user's location. Only show nearby-tagged posts or profiles
      // that explicitly provide a city.
      return post.body.includes('📍') || Boolean(author?.location_city);
    }
    return true;
  }), [posts, feedChannel]);

  const tabClass = (active: boolean) =>
    'min-h-10 flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-3 sm:px-4 text-sm font-semibold transition ' +
    (active
      ? 'bg-[#9B5CFF]/20 text-white ring-1 ring-inset ring-[#9B5CFF]/40'
      : 'text-[#B9B0C6] hover:bg-white/5 hover:text-white');

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-0 py-3 sm:space-y-6 sm:py-6">
      <section className="relative isolate overflow-hidden rounded-3xl border border-[#9B5CFF]/30 bg-gradient-to-br from-[#281746] via-[#191321] to-[#30152C] p-5 shadow-xl shadow-black/20 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#9B5CFF]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 right-1/3 h-32 w-32 rounded-full bg-[#F05AA6]/15 blur-3xl" />
        <div className="relative">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#D5BFFF]">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" />
            Your community, your pace
          </p>
          <h1 className="max-w-2xl text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            {currentUser ? `Welcome back, ${currentUser.display_name?.split(' ')[0] || 'friend'}.` : 'Find your people. Be yourself.'}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#D0C5DD] sm:text-base">
            A friendly place to share what matters, discover your circles, and connect without pressure.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {currentUser ? (
              <>
                <button type="button" onClick={() => navigate('/explore')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#281746] transition hover:bg-[#F4ECFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <Compass className="h-4 w-4" aria-hidden="true" /> Explore circles <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => navigate('/messages')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> Messages
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => navigate('/signup')} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#281746] transition hover:bg-[#F4ECFF]">Join BiCircle</button>
                <button type="button" onClick={() => navigate('/login')} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Sign in</button>
              </>
            )}
          </div>
        </div>
      </section>

      {currentUser ? (
        <section className="overflow-hidden rounded-2xl border border-[#2D233D] bg-[#191321] p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center gap-3 px-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9B5CFF]/15 text-[#C4A5FF]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">What’s on your mind?</h2>
              <p className="text-xs text-[#B9B0C6]">Share a moment with your community</p>
            </div>
          </div>
          <CreatePostCard onPostCreated={() => {}} />
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-2xl border border-[#2D233D] bg-[#191321] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-sm font-bold text-white">Join the conversation</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#B9B0C6]">Create an account to share posts, message members, and join circles.</p>
          </div>
          <button type="button" onClick={() => navigate('/signup')} className="min-h-11 shrink-0 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110">Join BiCircle</button>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-[#2D233D] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Community feed</h2>
            <p className="mt-1 text-xs text-[#B9B0C6]">Real conversations from your community</p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-[#2D233D] bg-[#191321] p-1">
            <button type="button" aria-label="Sort by latest" onClick={() => setSortFeed('latest')} className={'rounded-lg p-2 transition ' + (sortFeed === 'latest' ? 'bg-[#9B5CFF]/20 text-white' : 'text-[#B9B0C6] hover:text-white')}><Clock className="h-4 w-4" /></button>
            <button type="button" aria-label="Sort by popular" onClick={() => setSortFeed('popular')} className={'rounded-lg p-2 transition ' + (sortFeed === 'popular' ? 'bg-[#9B5CFF]/20 text-white' : 'text-[#B9B0C6] hover:text-white')}><Flame className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-[#2D233D] bg-[#191321] p-1 sm:flex sm:w-fit sm:gap-1.5">
          <button type="button" onClick={() => setFeedChannel('all')} className={tabClass(feedChannel === 'all')}><Sparkles className="h-4 w-4" />All posts</button>
          <button type="button" onClick={() => setFeedChannel('nearby')} className={tabClass(feedChannel === 'nearby')}><Users className="h-4 w-4" />Nearby</button>
          <button type="button" onClick={() => setFeedChannel('circles')} className={tabClass(feedChannel === 'circles')}><Compass className="h-4 w-4" />Circles</button>
        </div>

        {isLoadingFeed ? (
          <div className="space-y-3" aria-label="Loading community posts">
            {[1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl border border-[#2D233D] bg-[#191321]" />)}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#514064] bg-[#191321]/70 px-5 py-10 text-center sm:py-14">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9B5CFF]/15 text-[#C4A5FF]"><HeartHandshake className="h-6 w-6" aria-hidden="true" /></span>
            <h3 className="mt-4 text-base font-bold text-white">{feedChannel === 'nearby' ? 'No nearby posts yet' : feedChannel === 'circles' ? 'No circle posts yet' : 'Your feed is ready for its first post'}</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#B9B0C6]">{currentUser ? 'Start the conversation by sharing something with your community.' : 'Sign in or join BiCircle to take part in the conversation.'}</p>
            {currentUser ? (
              <button type="button" onClick={() => document.getElementById('feed-post-textarea')?.focus()} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#9B5CFF]/15 px-4 py-2 text-sm font-semibold text-[#D5BFFF] hover:bg-[#9B5CFF]/25">Create a post <ArrowRight className="h-4 w-4" /></button>
            ) : (
              <button type="button" onClick={() => navigate('/signup')} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#9B5CFF]/15 px-4 py-2 text-sm font-semibold text-[#D5BFFF] hover:bg-[#9B5CFF]/25">Join the community <ArrowRight className="h-4 w-4" /></button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredPosts.map((post) => <PostCard key={post.id} post={post} onNavigateToGroup={(groupId) => navigate(`/groups/${groupId}`)} onNavigateToProfile={(userId) => navigate(`/members/${userId}`)} />)}
          </div>
        )}
      </section>

      <div className="flex items-center justify-center gap-2 pb-2 text-xs text-[#8F849C]">
        <HeartHandshake className="h-4 w-4" aria-hidden="true" />
        A little more belonging, one conversation at a time.
      </div>
    </div>
  );
};
