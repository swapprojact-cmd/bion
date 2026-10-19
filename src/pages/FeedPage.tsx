import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Compass,
  Heart,
  HeartHandshake,
  Plus,
  Search,
  Sparkles,
  Users,
  Clock,
  Flame,
  ShieldCheck,
  UserRoundPlus,
} from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { CreatePostCard } from '../components/feed/CreatePostCard';
import { PostCard } from '../components/feed/PostCard';
import { Avatar } from '../components/common/Avatar';
import { store } from '../lib/dataService';

interface FeedPageProps {
  navigate: (route: string) => void;
}

type FeedChannel = 'all' | 'nearby' | 'circles';

export const FeedPage: React.FC<FeedPageProps> = ({ navigate }) => {
  const { posts, friends, groups, sortFeed, setSortFeed, isLoadingFeed } = useCommunity();
  const { currentUser } = useAuth();
  const [feedChannel, setFeedChannel] = useState<FeedChannel>('all');
  const [showComposer, setShowComposer] = useState(false);

  const filteredPosts = useMemo(() => posts.filter((post) => {
    if (feedChannel === 'circles') return post.group_id != null;
    if (feedChannel === 'nearby') {
      const author = store.profiles.find((profile) => profile.id === post.author_id);
      // Only use member-provided city/location information; never infer a location.
      return post.body.includes('📍') || Boolean(author?.location_city);
    }
    return true;
  }), [posts, feedChannel]);

  const visibleGroups = groups.filter((group) => group.is_member).slice(0, 4);

  const channelClass = (active: boolean) =>
    'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5FF] ' +
    (active
      ? 'border-[#9B5CFF]/60 bg-[#9B5CFF]/20 text-white'
      : 'border-[#3A2D4C] bg-[#191321] text-[#B9B0C6] hover:border-[#70539B] hover:text-white');

  return (
    <div className="bc-page mx-auto max-w-6xl">
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,640px)_minmax(250px,300px)] xl:justify-center">
        <main className="min-w-0 space-y-4 sm:space-y-5">
          {/* Compact social header */}
          <header className="flex items-center justify-between gap-3 px-1">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C4A5FF]">BiCircle community</p>
              <h1 className="bc-page-title mt-1">Home</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label="Find people"
                onClick={() => navigate('/nearby')}
                className="bc-secondary-button !min-h-10 !w-10 !rounded-full !p-0"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Explore community circles"
                onClick={() => navigate('/explore')}
                className="bc-secondary-button !min-h-10 !w-10 !rounded-full !p-0"
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Main app entry point for visitors */}
          {!currentUser && (
            <section className="relative isolate overflow-hidden rounded-3xl border border-[#9B5CFF]/30 bg-gradient-to-br from-[#281746] via-[#191321] to-[#30152C] p-5 shadow-lg shadow-black/15 sm:p-7">
              <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#9B5CFF]/20 blur-3xl" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#E0D0FF]">
                  <HeartHandshake className="h-4 w-4" /> Real people. Genuine connections.
                </span>
                <h2 className="mt-4 max-w-lg text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                  Find your people. Be yourself.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#D0C5DD]">
                  Share what matters, discover supportive circles, and connect at your own pace.
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => navigate('/signup')} className="bc-primary-button">
                    Join BiCircle <ArrowRight className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => navigate('/login')} className="bc-secondary-button !border-white/20 !bg-white/5">
                    Sign in
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* People rail: use only actual profile data, never fabricated stories */}
          {currentUser && (
            <section aria-label="Your circle" className="bc-panel p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white">Your circle</h2>
                  <p className="mt-0.5 text-xs text-[#B9B0C6]">People you’ve connected with</p>
                </div>
                <button type="button" onClick={() => navigate('/friends')} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#C4A5FF] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5FF]">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {friends.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-1">
                  <button type="button" onClick={() => navigate(`/members/${currentUser.id}`)} className="flex w-16 shrink-0 flex-col items-center gap-2 rounded-xl p-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5FF]">
                    <span className="bc-story-ring"><span className="bc-story-ring-inner"><Avatar src={currentUser.avatar_path} name={currentUser.display_name} size="md" className="!h-full !w-full !border-0" /></span></span>
                    <span className="w-full truncate text-[11px] font-medium text-[#D8CDED]">You</span>
                  </button>
                  {friends.slice(0, 12).map((friend) => (
                    <button key={friend.id} type="button" onClick={() => navigate(`/members/${friend.id}`)} className="flex w-16 shrink-0 flex-col items-center gap-2 rounded-xl p-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5FF]">
                      <span className="bc-story-ring"><span className="bc-story-ring-inner"><Avatar src={friend.avatar_path} name={friend.display_name} size="md" className="!h-full !w-full !border-0" /></span></span>
                      <span className="w-full truncate text-[11px] font-medium text-[#D8CDED]">{friend.display_name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[#423354] bg-[#100C16]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9B5CFF]/15 text-[#C4A5FF]"><UserRoundPlus className="h-5 w-5" /></span>
                    <div>
                      <p className="text-sm font-semibold text-white">Your circle starts here</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#B9B0C6]">Discover members and send a friend request when you find someone you connect with.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => navigate('/nearby')} className="bc-secondary-button !min-h-10 w-full sm:w-auto">Find people</button>
                </div>
              )}
            </section>
          )}

          {/* Composer */}
          {currentUser ? (
            <>
              {!showComposer ? (
                <section className="bc-panel p-3 sm:p-4">
                  <button
                    type="button"
                    onClick={() => setShowComposer(true)}
                    aria-expanded={false}
                    className="flex w-full min-h-12 items-center gap-3 rounded-xl p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5FF]"
                  >
                    <Avatar src={currentUser.avatar_path} name={currentUser.display_name} size="md" />
                    <span className="min-w-0 flex-1 truncate rounded-full border border-[#3A2D4C] bg-[#100C16] px-4 py-3 text-sm text-[#9F94AE]">
                      What would you like to share?
                    </span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9B5CFF]/15 text-[#C4A5FF]">
                      <Plus className="h-5 w-5" />
                    </span>
                  </button>
                </section>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold text-white">Create a post</h2>
                    <button type="button" onClick={() => setShowComposer(false)} className="bc-secondary-button !min-h-9 !px-3 !py-1 text-xs">Cancel</button>
                  </div>
                  <CreatePostCard onPostCreated={() => setShowComposer(false)} />
                </div>
              )}
            </>
          ) : (
            <section className="bc-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Join the conversation</h2>
                <p className="mt-1 text-xs leading-relaxed text-[#B9B0C6]">Create an account to post, message members, and join circles.</p>
              </div>
              <button type="button" onClick={() => navigate('/signup')} className="bc-primary-button shrink-0">Join BiCircle</button>
            </section>
          )}

          {/* Feed switcher */}
          <section className="min-w-0 space-y-4">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <h2 className="text-lg font-bold text-white">Community feed</h2>
                <p className="mt-1 text-xs text-[#B9B0C6]">Stories, ideas, and support from your community</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#2D233D] bg-[#191321] p-1">
                <button type="button" aria-label="Sort by latest" title="Latest posts" onClick={() => setSortFeed('latest')} className={'flex h-9 w-9 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5FF] ' + (sortFeed === 'latest' ? 'bg-[#9B5CFF]/25 text-white' : 'text-[#B9B0C6] hover:text-white')}><Clock className="h-4 w-4" /></button>
                <button type="button" aria-label="Sort by popular" title="Popular posts" onClick={() => setSortFeed('popular')} className={'flex h-9 w-9 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5FF] ' + (sortFeed === 'popular' ? 'bg-[#9B5CFF]/25 text-white' : 'text-[#B9B0C6] hover:text-white')}><Flame className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Feed filters">
              <button type="button" aria-pressed={feedChannel === 'all'} onClick={() => setFeedChannel('all')} className={channelClass(feedChannel === 'all')}><Sparkles className="h-4 w-4" />All posts</button>
              <button type="button" aria-pressed={feedChannel === 'nearby'} onClick={() => setFeedChannel('nearby')} className={channelClass(feedChannel === 'nearby')}><Users className="h-4 w-4" />Nearby</button>
              <button type="button" aria-pressed={feedChannel === 'circles'} onClick={() => setFeedChannel('circles')} className={channelClass(feedChannel === 'circles')}><Compass className="h-4 w-4" />Circles</button>
            </div>

            {isLoadingFeed ? (
              <div className="space-y-4" aria-label="Loading community posts">
                {[1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-[#2D233D] bg-[#191321]" />)}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bc-panel px-5 py-10 text-center sm:py-14">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9B5CFF]/15 text-[#C4A5FF]"><HeartHandshake className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className="mt-4 text-base font-bold text-white">{feedChannel === 'nearby' ? 'No nearby posts yet' : feedChannel === 'circles' ? 'No circle posts yet' : 'Your feed is ready for its first post'}</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#B9B0C6]">{currentUser ? 'Be the first to share something useful, joyful, or encouraging with your community.' : 'Sign in or join BiCircle to take part in the conversation.'}</p>
                {currentUser ? (
                  <button type="button" onClick={() => setShowComposer(true)} className="bc-primary-button mt-4">Create a post <ArrowRight className="h-4 w-4" /></button>
                ) : (
                  <button type="button" onClick={() => navigate('/signup')} className="bc-primary-button mt-4">Join the community <ArrowRight className="h-4 w-4" /></button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => <PostCard key={post.id} post={post} onNavigateToGroup={(groupId) => navigate(`/groups/${groupId}`)} onNavigateToProfile={(userId) => navigate(`/members/${userId}`)} />)}
              </div>
            )}
          </section>
          <div className="flex items-center justify-center gap-2 pb-2 text-xs text-[#8F849C]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Share kindly. Respect every boundary.
          </div>
        </main>

        {/* Desktop discovery rail */}
        {currentUser && (
          <aside className="hidden min-w-0 space-y-4 xl:block">
            <section className="bc-panel p-4">
              <div className="flex items-center gap-3">
                <Avatar src={currentUser.avatar_path} name={currentUser.display_name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{currentUser.display_name}</p>
                  <p className="truncate text-xs text-[#B9B0C6]">@{currentUser.username}</p>
                </div>
                <button type="button" aria-label="View your profile" onClick={() => navigate(`/members/${currentUser.id}`)} className="rounded-lg p-2 text-[#C4A5FF] hover:bg-white/5"><ArrowRight className="h-4 w-4" /></button>
              </div>
              <div className="my-4 border-t border-[#2D233D]" />
              <p className="text-sm font-semibold text-white">Your space, your pace.</p>
              <p className="mt-1 text-xs leading-relaxed text-[#B9B0C6]">Community and friendship come first. Choose how you connect.</p>
              <button type="button" onClick={() => navigate('/see-your-match')} className="bc-primary-button mt-4 w-full"><Heart className="h-4 w-4" /> See Your Match</button>
              <p className="mt-2 text-center text-[11px] text-[#8F849C]">Optional · Private until you opt in</p>
            </section>

            <section className="bc-panel p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-white">Your groups</h2>
                <button type="button" onClick={() => navigate('/explore')} className="text-xs font-semibold text-[#C4A5FF] hover:underline">Discover</button>
              </div>
              {visibleGroups.length > 0 ? (
                <div className="mt-3 space-y-1">
                  {visibleGroups.map((group) => (
                    <button key={group.id} type="button" onClick={() => navigate(`/groups/${group.id}`)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#9B5CFF]/15 text-[#C4A5FF]"><Users className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-white">{group.name}</span><span className="mt-0.5 block text-[11px] text-[#B9B0C6]">{group.member_count} members</span></span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#8F849C]" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-[#423354] p-3">
                  <p className="text-xs leading-relaxed text-[#B9B0C6]">Join a circle around a topic you care about.</p>
                  <button type="button" onClick={() => navigate('/explore')} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#C4A5FF]">Explore circles <ArrowRight className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </section>

            <section className="px-2 text-[11px] leading-relaxed text-[#766B84]">
              <button type="button" onClick={() => navigate('/guidelines')} className="hover:text-[#B9B0C6]">Guidelines</button>
              <span className="px-2">·</span>
              <button type="button" onClick={() => navigate('/safety')} className="hover:text-[#B9B0C6]">Safety</button>
              <span className="px-2">·</span>
              <button type="button" onClick={() => navigate('/privacy')} className="hover:text-[#B9B0C6]">Privacy</button>
            </section>
          </aside>
        )}
      </div>
    </div>
  );
};
