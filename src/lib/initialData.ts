import { Profile, UserPrivate, Group, GroupMember, Post, Comment, Friendship, FriendRequest, Conversation, Message, Notification, Report, ModerationAction } from '../types';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr_maya',
    display_name: 'Maya Lin',
    username: 'mayawrites',
    avatar_path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    bio: 'Fiction writer, community organizer & coffee enthusiast. Happy to chat about books, queer history, and community building.',
    interests: ['Book Club', 'Creative Writing', 'Queer History', 'Gardening', 'Coffee Roasting'],
    pronouns: 'she/her',
    visibility: 'public',
    is_moderator: true,
    is_admin: true,
    status: 'active',
    location_city: 'Brooklyn, NY',
    location_region: 'Northeast',
    location_lat: 40.6782,
    location_lng: -73.9442,
    show_in_nearby: true,
    relationship_vibe: 'Looking for thoughtful friendships, book club discussions, and quiet creative co-working.',
    relationship_intentions: [
      'Book Club & Literature',
      'Creative Writing & Poetry',
      'Coffee Chats & Deep Convos',
      'Community Organizing'
    ],
    prompts: [
      {
        id: 'prm_1',
        question: 'What bisexual community means to me',
        answer: 'Finding spaces where we never have to justify or explain ourselves—where bisexual nuance and joy are celebrated without erasure or stereotypes.'
      },
      {
        id: 'prm_2',
        question: 'Best way to spend a Sunday afternoon',
        answer: 'Browsing second-hand bookshops in Park Slope, having an iced oat flat white, and sketching short stories on park benches.'
      },
      {
        id: 'prm_3',
        question: 'Ask me about...',
        answer: 'Bisexual historical figures from the Harlem Renaissance, fountain pen inks, or book recommendations!'
      }
    ],
    photos: [
      {
        id: 'photo_m1',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
        caption: 'My cozy home library nook where our monthly book club reads happen.',
        created_at: '2026-03-01T12:00:00Z'
      },
      {
        id: 'photo_m2',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80',
        caption: 'Coffee tasting and writing session with community friends.',
        created_at: '2026-02-22T15:30:00Z'
      },
      {
        id: 'photo_m3',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
        caption: 'Morning walk through the Brooklyn Botanic Garden.',
        created_at: '2026-02-14T09:40:00Z'
      }
    ],
    videos: [
      {
        id: 'vid_m1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        title: 'Spring Book Club Overview & Reading List',
        caption: 'A quick 1-minute intro to the books we picked for April and May in the Bi Bookworms Circle.',
        duration: '0:15',
        created_at: '2026-03-05T18:00:00Z'
      }
    ],
    created_at: '2026-01-10T12:00:00Z',
    updated_at: '2026-03-01T15:30:00Z',
  },
  {
    id: 'usr_jordan',
    display_name: 'Jordan Rivera',
    username: 'jordan_r',
    avatar_path: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    bio: 'Software engineer and avid road cyclist. Came out in my late 20s. Looking for friendship, cycling buddies, and good conversations.',
    interests: ['Cycling', 'Open Source', 'Late Bloomers', 'Board Games', 'Specialty Coffee'],
    pronouns: 'he/him',
    visibility: 'public',
    is_moderator: false,
    is_admin: false,
    status: 'active',
    location_city: 'Manhattan, NY',
    location_region: 'Northeast',
    location_lat: 40.7831,
    location_lng: -73.9712,
    show_in_nearby: true,
    relationship_vibe: 'Looking for weekend morning road cycling partners, board game evenings, and peer support for later-in-life discovery.',
    relationship_intentions: [
      'Cycling & Outdoor Hikes',
      'Late Bloomer Peer Support',
      'Board Game Nights',
      'Tech & Open Source Chats'
    ],
    prompts: [
      {
        id: 'prm_j1',
        question: 'My advice to someone who just came out later in life',
        answer: 'You did not miss out on anything. Your timeline is your own, and the right community will embrace you with open arms without requiring credentials.'
      },
      {
        id: 'prm_j2',
        question: 'Ideal weekend friendship hangout',
        answer: 'A 25-mile gentle spin along the Hudson River Greenway followed by bagels and iced americanos.'
      }
    ],
    photos: [
      {
        id: 'photo_j1',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80',
        caption: 'Sunset ride past the George Washington Bridge with the local bike crew.',
        created_at: '2026-03-08T18:30:00Z'
      },
      {
        id: 'photo_j2',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=900&q=80',
        caption: 'Our Sunday board game afternoon at the community center.',
        created_at: '2026-02-28T16:00:00Z'
      }
    ],
    videos: [
      {
        id: 'vid_j1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80',
        title: 'Hudson River Greenway Spring Morning Spin',
        caption: 'A quick scenic clip from our Saturday community ride. Message me if you want to join our pace group!',
        duration: '0:15',
        created_at: '2026-03-09T10:15:00Z'
      }
    ],
    created_at: '2026-01-15T09:20:00Z',
    updated_at: '2026-02-14T11:00:00Z',
  },
  {
    id: 'usr_alex',
    display_name: 'Alex Thorne',
    username: 'alex_thorne',
    avatar_path: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
    bio: 'Parent of two energetic kids, amateur ceramicist, and high school art teacher. Facilitator of the Bi Parents Circle.',
    interests: ['Bi Parenting', 'Ceramics', 'Education', 'Mental Health Support', 'Pottery'],
    pronouns: 'they/them',
    visibility: 'public',
    is_moderator: true,
    is_admin: false,
    status: 'active',
    location_city: 'Queens, NY',
    location_region: 'Northeast',
    location_lat: 40.7282,
    location_lng: -73.7949,
    show_in_nearby: true,
    relationship_vibe: 'Seeking fellow bi parents for family weekend park playdates, pottery workshop sessions, and supportive life talks.',
    relationship_intentions: [
      'Bi Parenting Circle',
      'Ceramics & Craft Jams',
      'Family Playdates & Parks',
      'Mental Health Peer Check-ins'
    ],
    prompts: [
      {
        id: 'prm_a1',
        question: 'What I value most in community',
        answer: 'Honesty, gentle boundaries, and being around people who understand that parenting as a queer person has unique beauty and challenges.'
      },
      {
        id: 'prm_a2',
        question: 'Current creative obsession',
        answer: 'Wheel throwing mugs with dual-tone lavender and cobalt glazes. Giving them to community members!'
      }
    ],
    photos: [
      {
        id: 'photo_a1',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80',
        caption: 'Fresh batch of lavender-glazed stoneware mugs just out of the kiln.',
        created_at: '2026-03-04T14:20:00Z'
      },
      {
        id: 'photo_a2',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80',
        caption: 'Weekend community arts workshop with kids in Astoria Park.',
        created_at: '2026-02-20T11:00:00Z'
      }
    ],
    videos: [
      {
        id: 'vid_a1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80',
        title: 'Centering Clay on the Pottery Wheel',
        caption: 'Relaxing studio clip throwing porcelain bowls. Great metaphor for finding balance in life!',
        duration: '0:15',
        created_at: '2026-03-02T16:00:00Z'
      }
    ],
    created_at: '2026-02-01T14:45:00Z',
    updated_at: '2026-02-28T18:10:00Z',
  },
  {
    id: 'usr_samira',
    display_name: 'Samira Patel',
    username: 'samirap',
    avatar_path: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&h=256&q=80',
    bio: 'Biologist & science communicator. Passionate about destigmatizing bisexuality in healthcare and academic spaces.',
    interests: ['STEM Inclusivity', 'Hiking', 'Science Communication', 'Podcasts', 'Botany'],
    pronouns: 'she/they',
    visibility: 'public',
    is_moderator: false,
    is_admin: false,
    status: 'active',
    location_city: 'Jersey City, NJ',
    location_region: 'Northeast',
    location_lat: 40.7178,
    location_lng: -74.0431,
    show_in_nearby: true,
    relationship_vibe: 'Looking for hiking partners, fellow scientists/engineers, and podcast discussions about queer health.',
    relationship_intentions: [
      'Hiking & Nature Walks',
      'STEM Career Mentorship',
      'Science Communication',
      'Coffee & Deep Chats'
    ],
    prompts: [
      {
        id: 'prm_s1',
        question: 'A cause I care deeply about',
        answer: 'Mentoring young queer researchers and breaking down the imposter syndrome that keeps marginalized folks out of academic labs.'
      },
      {
        id: 'prm_s2',
        question: 'My favorite local trail',
        answer: 'Palisades Interstate Park clifftop trails—stunning river views and great spots to sit and chat about life.'
      }
    ],
    photos: [
      {
        id: 'photo_s1',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
        caption: 'Spring botany field walk with the local ecology group.',
        created_at: '2026-03-07T13:40:00Z'
      },
      {
        id: 'photo_s2',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80',
        caption: 'Lab bench setup preparing for our weekly community science seminar.',
        created_at: '2026-02-25T17:15:00Z'
      }
    ],
    videos: [
      {
        id: 'vid_s1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
        title: 'Morning Clifftop Hike at Palisades',
        caption: 'Breathtaking sunrise along the Hudson River cliffs. Who wants to join for the next weekend hike?',
        duration: '0:15',
        created_at: '2026-03-06T08:30:00Z'
      }
    ],
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-03-05T08:30:00Z',
  },
  {
    id: 'usr_kai',
    display_name: 'Kai Chen',
    username: 'kaichen',
    avatar_path: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
    bio: 'Graphic designer and film buff. Exploring bi representation in cinema and visual media across decades.',
    interests: ['Film Analysis', 'Graphic Design', 'Photography', 'Anime', 'Risograph Printing'],
    pronouns: 'he/they',
    visibility: 'public',
    is_moderator: false,
    is_admin: false,
    status: 'active',
    location_city: 'Bronx, NY',
    location_region: 'Northeast',
    location_lat: 40.8448,
    location_lng: -73.8648,
    show_in_nearby: true,
    relationship_vibe: 'Looking for creative collaborators, indie cinema movie buddies, and photo walk companions.',
    relationship_intentions: [
      'Film Nights & Screenings',
      'Graphic Design & Zine Trades',
      'Photography Street Walks',
      'Anime & Casual Gaming'
    ],
    prompts: [
      {
        id: 'prm_k1',
        question: 'Favorite movie with great queer nuances',
        answer: 'Portrait of a Lady on Fire, and Moonlight. The way light and color carry unsaid emotional truths is unforgettable.'
      },
      {
        id: 'prm_k2',
        question: 'Ask me about...',
        answer: 'Analog 35mm cameras, creating risograph prints, or analyzing retro anime character arcs.'
      }
    ],
    photos: [
      {
        id: 'photo_k1',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80',
        caption: 'Latest dual-tone print series: Magenta shadows and electric blue highlights.',
        created_at: '2026-03-08T20:00:00Z'
      },
      {
        id: 'photo_k2',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
        caption: 'Camera kit ready for afternoon street photography through Pelham Bay.',
        created_at: '2026-02-18T14:10:00Z'
      }
    ],
    videos: [
      {
        id: 'vid_k1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
        title: 'Studio Process: Layering Dual Tone Colors',
        caption: 'Short time-lapse of how the colors interact during screen printing. Super fun experimental session!',
        duration: '0:12',
        created_at: '2026-03-03T19:00:00Z'
      }
    ],
    created_at: '2026-02-20T16:00:00Z',
    updated_at: '2026-03-10T19:40:00Z',
  },
  {
    id: 'usr_elena',
    display_name: 'Elena Vance',
    username: 'elenavance',
    avatar_path: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
    bio: 'Acoustic musician, audio producer, and mutual aid volunteer. Organizing acoustic jams and queer poetry nights in Chicago.',
    interests: ['Acoustic Music', 'Audio Production', 'Community Activism', 'Poetry', 'Tea'],
    pronouns: 'she/her',
    visibility: 'public',
    is_moderator: false,
    is_admin: false,
    status: 'active',
    location_city: 'Chicago, IL',
    location_region: 'Midwest',
    location_lat: 41.8781,
    location_lng: -87.6298,
    show_in_nearby: true,
    relationship_vibe: 'Seeking fellow acoustic musicians, songwriting peers, and mutual aid volunteer buddies.',
    relationship_intentions: [
      'Acoustic Jams & Songwriting',
      'Mutual Aid & Community Care',
      'Poetry & Open Mic Nights',
      'Tea & Heartfelt Convos'
    ],
    prompts: [
      {
        id: 'prm_e1',
        question: 'The song that feels like home to me',
        answer: 'Anything by Julien Baker or Brandi Carlile. Raw vulnerability and chords that breathe.'
      },
      {
        id: 'prm_e2',
        question: 'My favorite way to connect with new friends',
        answer: 'Sitting in a living room with guitars, tea, and zero pressure to be anything other than our messy, authentic selves.'
      }
    ],
    photos: [
      {
        id: 'photo_e1',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80',
        caption: 'Sunday acoustic circle rehearsal in Logan Square.',
        created_at: '2026-03-05T17:00:00Z'
      }
    ],
    videos: [
      {
        id: 'vid_e1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80',
        title: 'Fingerpicking Acoustic Demo',
        caption: 'Messing around with an open tuning idea for our community open mic night next weekend.',
        duration: '0:14',
        created_at: '2026-03-04T12:00:00Z'
      }
    ],
    created_at: '2026-02-25T11:00:00Z',
    updated_at: '2026-03-06T14:00:00Z',
  },
  {
    id: 'usr_marcus',
    display_name: 'Marcus Silva',
    username: 'marcus_cooks',
    avatar_path: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
    bio: 'Home cook, community gardener, and bisexual men’s support advocate. Believer in the healing power of shared meals.',
    interests: ['Cooking & Baking', 'Urban Gardening', 'Bi Men Circle', 'Board Games', 'Hiking'],
    pronouns: 'he/him',
    visibility: 'public',
    is_moderator: false,
    is_admin: false,
    status: 'active',
    location_city: 'Austin, TX',
    location_region: 'South',
    location_lat: 30.2672,
    location_lng: -97.7431,
    show_in_nearby: true,
    relationship_vibe: 'Looking to host platonic community potlucks, garden together, and share support for bi men.',
    relationship_intentions: [
      'Community Potlucks & Cooking',
      'Urban Gardening',
      'Bisexual Men Support Circle',
      'Board Game Nights'
    ],
    prompts: [
      {
        id: 'prm_m1',
        question: 'My signature meal to cook for friends',
        answer: 'Slow-braised feijoada with homemade collard greens and orange slices, followed by fresh sourdough focaccia.'
      },
      {
        id: 'prm_m2',
        question: 'Why I joined BiCircle',
        answer: 'To break down the isolation a lot of bi men feel, and create warm spaces where friendship comes first without any pressure or judgment.'
      }
    ],
    photos: [
      {
        id: 'photo_mc1',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80',
        caption: 'Fresh rosemary and garlic focaccia ready for our neighborhood potluck.',
        created_at: '2026-03-06T19:00:00Z'
      }
    ],
    videos: [
      {
        id: 'vid_mc1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
        title: 'Community Garden Spring Planting Tour',
        caption: 'Heirloom tomato seedlings and mint patches coming along nicely in East Austin!',
        duration: '0:15',
        created_at: '2026-03-05T10:00:00Z'
      }
    ],
    created_at: '2026-02-28T09:00:00Z',
    updated_at: '2026-03-08T18:00:00Z',
  },
  {
    id: 'usr_riley',
    display_name: 'Riley Morales',
    username: 'riley_dev',
    avatar_path: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80',
    bio: 'Indie game programmer and Pacific Northwest trail runner. Crafting cozy pixel art games and seeking hiking companions.',
    interests: ['Game Development', 'Trail Running', 'Pixel Art', 'Coffee', 'Sci-Fi'],
    pronouns: 'they/he',
    visibility: 'public',
    is_moderator: false,
    is_admin: false,
    status: 'active',
    location_city: 'Seattle, WA',
    location_region: 'West',
    location_lat: 47.6062,
    location_lng: -122.3321,
    show_in_nearby: true,
    relationship_vibe: 'Looking for indie dev co-working sprints, trail running buddies in the Cascades, and sci-fi book discussions.',
    relationship_intentions: [
      'Indie Game Co-working',
      'Trail Running in Cascades',
      'Queer Sci-Fi Book Chats',
      'Coffee & Deep Convos'
    ],
    prompts: [
      {
        id: 'prm_r1',
        question: 'Current game project',
        answer: 'A narrative adventure about an archivist rebuilding a lost queer library on a floating sky island.'
      },
      {
        id: 'prm_r2',
        question: 'My sanctuary spot',
        answer: 'Rattlesnake Ledge trail on a misty morning when the clouds hover right above the pine canopy.'
      }
    ],
    photos: [
      {
        id: 'photo_r1',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
        caption: 'Misty pine ridges on this morning’s 8-mile trail run.',
        created_at: '2026-03-07T10:00:00Z'
      }
    ],
    videos: [
      {
        id: 'vid_r1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        title: 'Pacific Northwest Trail Ridge Mist',
        caption: 'Quiet morning jog with fresh mountain air. Nothing grounds the mind quite like the forest.',
        duration: '0:15',
        created_at: '2026-03-06T15:00:00Z'
      }
    ],
    created_at: '2026-03-01T15:00:00Z',
    updated_at: '2026-03-09T12:00:00Z',
  }
];

export const INITIAL_USER_PRIVATE: UserPrivate = {
  user_id: 'usr_maya',
  account_name: 'Maya Lin (Personal Account)',
  identity_notes: 'Realized orientation during college; proud advocate for bi visibility and community care.',
  birth_year: 1994,
  location_city: 'Brooklyn, NY',
  show_in_nearby: true,
  messaging_permission: 'everyone',
  allow_friend_requests: true,
  email_notifications: true,
  notify_messages: true,
  notify_comments: true,
  notify_friend_requests: true,
  created_at: '2026-01-10T12:00:00Z',
  updated_at: '2026-03-01T15:30:00Z',
};

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'grp_readers',
    owner_id: 'usr_maya',
    name: 'Bi Bookworms & Literature',
    slug: 'bi-bookworms-literature',
    description: 'A monthly community circle discussing bisexual authors, nuanced queer characters, speculative fiction, and historical memoirs.',
    topic: 'Literature & Culture',
    rules: 'Keep discussions polite and spoiler-tagged when discussing new releases. Celebrate diverse viewpoints.',
    visibility: 'public',
    status: 'active',
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-02-20T14:00:00Z',
    member_count: 148,
  },
  {
    id: 'grp_late_bloomers',
    owner_id: 'usr_jordan',
    name: 'Late Bloomers & Later-in-Life Journeys',
    slug: 'late-bloomers',
    description: 'A welcoming, judgment-free space for people who realized, accepted, or came out as bisexual in their late 20s, 30s, 40s, and beyond.',
    topic: 'Personal Stories & Support',
    rules: 'No gatekeeping or comparison of timelines. Everything shared here stays in the group.',
    visibility: 'public',
    status: 'active',
    created_at: '2026-01-18T16:00:00Z',
    updated_at: '2026-02-25T11:00:00Z',
    member_count: 312,
  },
  {
    id: 'grp_parents',
    owner_id: 'usr_alex',
    name: 'Bisexual Parents Circle',
    slug: 'bi-parents-circle',
    description: 'Support, advice, and community for bi parents raising kids of all ages. Navigating family life, school discussions, and parenting realities.',
    topic: 'Family & Parenting',
    rules: 'Strict privacy regarding children’s photos and personal info. Zero dating/solicitation allowed.',
    visibility: 'private',
    status: 'active',
    created_at: '2026-02-05T09:30:00Z',
    updated_at: '2026-03-02T13:15:00Z',
    member_count: 86,
  },
  {
    id: 'grp_stem',
    owner_id: 'usr_samira',
    name: 'Bisexuals in STEM & Academia',
    slug: 'bi-stem-academia',
    description: 'Connecting researchers, engineers, doctors, students, and technologists. Career mentorship, research chats, and conference meetups.',
    topic: 'Careers & Mentorship',
    rules: 'Maintain professional respect. Mentorship is friendship- and career-oriented only.',
    visibility: 'public',
    status: 'active',
    created_at: '2026-02-12T11:00:00Z',
    updated_at: '2026-03-08T17:00:00Z',
    member_count: 94,
  },
  {
    id: 'grp_creatives',
    owner_id: 'usr_kai',
    name: 'Queer Artists, Designers & Writers',
    slug: 'queer-artists-creatives',
    description: 'A collaborative haven for visual artists, zine makers, poets, and creatives. Share feedback on works in progress, host art sprints, and organize community showcases.',
    topic: 'Arts & Media',
    rules: 'Constructive critiques only with consent. Give proper credit to referenced works.',
    visibility: 'public',
    status: 'active',
    created_at: '2026-02-22T14:30:00Z',
    updated_at: '2026-03-09T18:00:00Z',
    member_count: 172,
  }
];

export const INITIAL_GROUP_MEMBERS: GroupMember[] = [
  { group_id: 'grp_readers', user_id: 'usr_maya', role: 'owner', membership_status: 'active', created_at: '2026-01-12T10:00:00Z', updated_at: '2026-01-12T10:00:00Z' },
  { group_id: 'grp_readers', user_id: 'usr_jordan', role: 'member', membership_status: 'active', created_at: '2026-01-16T15:00:00Z', updated_at: '2026-01-16T15:00:00Z' },
  { group_id: 'grp_readers', user_id: 'usr_alex', role: 'member', membership_status: 'active', created_at: '2026-02-03T11:00:00Z', updated_at: '2026-02-03T11:00:00Z' },
  { group_id: 'grp_late_bloomers', user_id: 'usr_jordan', role: 'owner', membership_status: 'active', created_at: '2026-01-18T16:00:00Z', updated_at: '2026-01-18T16:00:00Z' },
  { group_id: 'grp_late_bloomers', user_id: 'usr_maya', role: 'member', membership_status: 'active', created_at: '2026-01-20T10:30:00Z', updated_at: '2026-01-20T10:30:00Z' },
  { group_id: 'grp_parents', user_id: 'usr_alex', role: 'owner', membership_status: 'active', created_at: '2026-02-05T09:30:00Z', updated_at: '2026-02-05T09:30:00Z' },
  { group_id: 'grp_parents', user_id: 'usr_maya', role: 'member', membership_status: 'active', created_at: '2026-02-06T14:00:00Z', updated_at: '2026-02-06T14:00:00Z' },
  { group_id: 'grp_stem', user_id: 'usr_samira', role: 'owner', membership_status: 'active', created_at: '2026-02-12T11:00:00Z', updated_at: '2026-02-12T11:00:00Z' },
  { group_id: 'grp_stem', user_id: 'usr_maya', role: 'member', membership_status: 'active', created_at: '2026-02-15T18:00:00Z', updated_at: '2026-02-15T18:00:00Z' },
  { group_id: 'grp_creatives', user_id: 'usr_kai', role: 'owner', membership_status: 'active', created_at: '2026-02-22T14:30:00Z', updated_at: '2026-02-22T14:30:00Z' },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post_1',
    author_id: 'usr_maya',
    group_id: 'grp_readers',
    body: "For our April reading selection in Bi Bookworms, we're diving into essays on bisexual history and community resilience. What book has made you feel most seen in your identity? Sharing thoughts and welcoming recommendations below!",
    media_paths: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'],
    media_type: 'photo',
    visibility: 'public',
    status: 'published',
    created_at: '2026-03-12T16:20:00Z',
    updated_at: '2026-03-12T16:20:00Z',
    likes_count: 28,
    comments_count: 6,
    has_liked: true,
  },
  {
    id: 'post_vid_1',
    author_id: 'usr_jordan',
    group_id: 'grp_late_bloomers',
    body: "Captured a snippet from our Saturday morning community ride along the river! Exercising with friends and talking about our coming-out timelines has been the healthiest habit of this year. Anyone in NYC who rides road or gravel bikes, reach out!",
    media_paths: [],
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    media_type: 'video',
    visibility: 'public',
    status: 'published',
    created_at: '2026-03-12T11:30:00Z',
    updated_at: '2026-03-12T11:30:00Z',
    likes_count: 45,
    comments_count: 8,
    has_liked: false,
  },
  {
    id: 'post_2',
    author_id: 'usr_jordan',
    group_id: 'grp_late_bloomers',
    body: "Celebrating one year since I first felt comfortable telling my friends that I'm bisexual. It felt daunting at 29, but having community spaces like BiCircle where friendship and genuine connection come first has meant the world. To anyone just starting their journey: there is zero rush. You belong here.",
    media_paths: [],
    visibility: 'public',
    status: 'published',
    created_at: '2026-03-11T19:45:00Z',
    updated_at: '2026-03-11T19:45:00Z',
    likes_count: 53,
    comments_count: 12,
    has_liked: false,
  },
  {
    id: 'post_3',
    author_id: 'usr_alex',
    group_id: 'grp_parents',
    body: "Our kids made pride bookmarks at the local library workshop this weekend! Being open about who we are creates such an empathetic foundation for our children. Grateful for everyone in the Bi Parents Circle who shared tips on how to handle school family tree activities.",
    media_paths: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80'],
    media_type: 'photo',
    visibility: 'group_only',
    status: 'published',
    created_at: '2026-03-10T14:10:00Z',
    updated_at: '2026-03-10T14:10:00Z',
    likes_count: 22,
    comments_count: 5,
    has_liked: true,
  },
  {
    id: 'post_4',
    author_id: 'usr_samira',
    group_id: 'grp_stem',
    body: "Just finished organizing our lab's first diversity panel discussing LGBTQ+ retention in graduate biology programs. One takeaway that resonated: creating casual friendship groups outside the lab dramatically cuts down on feelings of isolation.",
    media_paths: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'],
    media_type: 'photo',
    visibility: 'public',
    status: 'published',
    created_at: '2026-03-09T11:00:00Z',
    updated_at: '2026-03-09T11:00:00Z',
    likes_count: 36,
    comments_count: 4,
    has_liked: false,
  },
  {
    id: 'post_5',
    author_id: 'usr_kai',
    group_id: 'grp_creatives',
    body: "Working on a series of risograph prints exploring subtle bisexual lighting and dual-tone gradients. It’s so refreshing to make art intended for community discussion rather than algorithm hype. Would love any feedback on color balance!",
    media_paths: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'],
    media_type: 'photo',
    visibility: 'public',
    status: 'published',
    created_at: '2026-03-08T20:15:00Z',
    updated_at: '2026-03-08T20:15:00Z',
    likes_count: 64,
    comments_count: 14,
    has_liked: true,
  }
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comm_1',
    post_id: 'post_1',
    author_id: 'usr_jordan',
    body: 'I really enjoyed "Greedy: Notes from a Bisexual Who Wants Too Much" by Jen Winston. Honest, funny, and comforting.',
    status: 'published',
    created_at: '2026-03-12T17:00:00Z',
    updated_at: '2026-03-12T17:00:00Z',
  },
  {
    id: 'comm_2',
    post_id: 'post_1',
    author_id: 'usr_alex',
    body: 'Seconding that! Also "Bi: Notes for a Bisexual Revolution" by Shiri Eisner offers fantastic structural insights.',
    status: 'published',
    created_at: '2026-03-12T17:40:00Z',
    updated_at: '2026-03-12T17:40:00Z',
  },
  {
    id: 'comm_3',
    post_id: 'post_2',
    author_id: 'usr_maya',
    body: 'Huge congratulations Jordan! One year is a wonderful milestone. The Late Bloomers group has been a beacon for so many.',
    status: 'published',
    created_at: '2026-03-11T20:00:00Z',
    updated_at: '2026-03-11T20:00:00Z',
  },
  {
    id: 'comm_4',
    post_id: 'post_5',
    author_id: 'usr_maya',
    body: 'The magenta to deep violet transition is gorgeous, Kai! The print texture really gives it warmth.',
    status: 'published',
    created_at: '2026-03-08T21:05:00Z',
    updated_at: '2026-03-08T21:05:00Z',
  }
];

export const INITIAL_FRIENDSHIPS: Friendship[] = [
  { id: 'fs_1', user_a: 'usr_jordan', user_b: 'usr_maya', created_at: '2026-01-25T14:00:00Z' },
  { id: 'fs_2', user_a: 'usr_alex', user_b: 'usr_maya', created_at: '2026-02-10T12:00:00Z' },
  { id: 'fs_3', user_a: 'usr_maya', user_b: 'usr_samira', created_at: '2026-02-18T16:30:00Z' },
];

export const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'fr_1',
    sender_id: 'usr_kai',
    recipient_id: 'usr_maya',
    status: 'pending',
    created_at: '2026-03-11T10:00:00Z',
    updated_at: '2026-03-11T10:00:00Z',
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-03-12T18:25:00Z',
    members: [INITIAL_PROFILES[0], INITIAL_PROFILES[1]], // Maya & Jordan
    last_message: {
      id: 'msg_2',
      conversation_id: 'conv_1',
      sender_id: 'usr_jordan',
      body: 'Thanks for pinning the discussion thread in the book club, Maya! Really looking forward to next week.',
      created_at: '2026-03-12T18:25:00Z',
      status: 'read'
    },
    unread_count: 0
  },
  {
    id: 'conv_2',
    created_at: '2026-02-15T14:00:00Z',
    updated_at: '2026-03-10T11:40:00Z',
    members: [INITIAL_PROFILES[0], INITIAL_PROFILES[2]], // Maya & Alex
    last_message: {
      id: 'msg_4',
      conversation_id: 'conv_2',
      sender_id: 'usr_alex',
      body: 'Let me know if you need help co-moderating the parent Q&A circle this Thursday!',
      created_at: '2026-03-10T11:40:00Z',
      status: 'read'
    },
    unread_count: 0
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    conversation_id: 'conv_1',
    sender_id: 'usr_maya',
    body: 'Hi Jordan! Loved your post on reaching the one-year milestone. How are your weekend group rides going?',
    created_at: '2026-03-12T18:00:00Z',
    status: 'read'
  },
  {
    id: 'msg_2',
    conversation_id: 'conv_1',
    sender_id: 'usr_jordan',
    body: 'Thanks for pinning the discussion thread in the book club, Maya! Really looking forward to next week.',
    created_at: '2026-03-12T18:25:00Z',
    status: 'read'
  },
  {
    id: 'msg_3',
    conversation_id: 'conv_2',
    sender_id: 'usr_maya',
    body: 'Hey Alex, checking in on the parent meetup slides. Did you get the outline?',
    created_at: '2026-03-10T10:15:00Z',
    status: 'read'
  },
  {
    id: 'msg_4',
    conversation_id: 'conv_2',
    sender_id: 'usr_alex',
    body: 'Let me know if you need help co-moderating the parent Q&A circle this Thursday!',
    created_at: '2026-03-10T11:40:00Z',
    status: 'read'
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    recipient_id: 'usr_maya',
    actor_id: 'usr_kai',
    type: 'friend_request',
    reference_type: 'user',
    reference_id: 'usr_kai',
    read_at: null,
    created_at: '2026-03-11T10:00:00Z',
    message: 'Kai Chen sent you a friend request.'
  },
  {
    id: 'notif_2',
    recipient_id: 'usr_maya',
    actor_id: 'usr_jordan',
    type: 'post_comment',
    reference_type: 'post',
    reference_id: 'post_1',
    read_at: null,
    created_at: '2026-03-12T17:00:00Z',
    message: 'Jordan Rivera commented on your post in Bi Bookworms & Literature.'
  },
  {
    id: 'notif_3',
    recipient_id: 'usr_maya',
    actor_id: 'usr_alex',
    type: 'post_like',
    reference_type: 'post',
    reference_id: 'post_1',
    read_at: '2026-03-12T17:15:00Z',
    created_at: '2026-03-12T16:50:00Z',
    message: 'Alex Thorne liked your post.'
  }
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'rep_1',
    reporter_id: 'usr_jordan',
    target_type: 'post',
    target_id: 'post_fake_spam',
    reason: 'dating_or_hookup_solicitation',
    details: 'User posted a romantic dating ad. BiCircle guidelines strictly forbid dating/hookup solicitation to preserve friendship spaces.',
    status: 'pending',
    created_at: '2026-03-12T08:00:00Z',
    updated_at: '2026-03-12T08:00:00Z',
    target_summary: 'Post containing external dating link and personal contact request'
  },
  {
    id: 'rep_2',
    reporter_id: 'usr_samira',
    target_type: 'comment',
    target_id: 'comm_flagged',
    reason: 'harassment',
    details: 'Dismissive comment minimizing bisexual identity experiences.',
    status: 'investigating',
    created_at: '2026-03-10T14:30:00Z',
    updated_at: '2026-03-11T09:10:00Z',
    target_summary: 'Comment invalidating another member\'s coming out journey'
  }
];

export const INITIAL_MODERATION_ACTIONS: ModerationAction[] = [
  {
    id: 'mact_1',
    moderator_id: 'usr_maya',
    target_type: 'post',
    target_id: 'post_promo_109',
    action_type: 'remove_content',
    reason: 'Commercial spam promotion violating community guidelines rule #2.',
    created_at: '2026-03-09T18:00:00Z'
  },
  {
    id: 'mact_2',
    moderator_id: 'usr_maya',
    target_type: 'user',
    target_id: 'usr_spambot_3',
    action_type: 'suspend_user',
    reason: 'Repeated unsolicited dating messages sent to community members.',
    created_at: '2026-03-05T12:30:00Z'
  }
];
