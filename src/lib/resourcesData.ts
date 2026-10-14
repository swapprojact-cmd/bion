export interface CommunityResource {
  id: string;
  title: string;
  category: 'Literature' | 'History' | 'Parenting' | 'Mental Health' | 'Podcasts';
  description: string;
  authorOrSource: string;
  linkText: string;
  url?: string;
}

export interface WeeklyPrompt {
  id: string;
  weekTitle: string;
  question: string;
  context: string;
  responseCount: number;
}

export const COMMUNITY_RESOURCES: CommunityResource[] = [
  {
    id: 'res_1',
    title: 'Greedy: Notes from a Bisexual Who Wants Too Much',
    category: 'Literature',
    description: 'A hilarious, moving memoir by Jen Winston examining bisexuality, identity shifts, and breaking free of binary expectations.',
    authorOrSource: 'Jen Winston',
    linkText: 'Book Guide & Discussion',
  },
  {
    id: 'res_2',
    title: 'Bi: Notes for a Bisexual Revolution',
    category: 'Literature',
    description: 'Groundbreaking feminist treatise on bisexual politics, anti-erasure activism, and challenging monosexism.',
    authorOrSource: 'Shiri Eisner',
    linkText: 'Reading Guide',
  },
  {
    id: 'res_3',
    title: 'The Bisexual History Project Archives',
    category: 'History',
    description: 'Chronicles the pivotal role of bisexual activists in Stonewall, early Pride organizing, and the AIDS crisis.',
    authorOrSource: 'Queer Heritage Collaborative',
    linkText: 'Explore Historical Timeline',
  },
  {
    id: 'res_4',
    title: 'Bisexual Parenting: Navigating Schools and Family Dynamics',
    category: 'Parenting',
    description: 'A compassionate guide for bi parents addressing age-appropriate family identity discussions and school curriculum.',
    authorOrSource: 'Bi Parents Network',
    linkText: 'Family Toolkit',
  },
  {
    id: 'res_5',
    title: 'Two Bi Guys Podcast',
    category: 'Podcasts',
    description: 'In-depth interviews exploring bisexuality, relationships, polyamory, and queer identity across diverse communities.',
    authorOrSource: 'Rob & Nicole',
    linkText: 'Listen to Episodes',
  },
  {
    id: 'res_6',
    title: 'Mental Health & Dual Erasure: Peer Strategies',
    category: 'Mental Health',
    description: 'Evidence-based peer support strategies for dealing with imposter syndrome and biphobia in social settings.',
    authorOrSource: 'LGBTQ+ Wellness Council',
    linkText: 'Wellness Guide',
  }
];

export const CURRENT_WEEKLY_PROMPT: WeeklyPrompt = {
  id: 'prompt_week_15',
  weekTitle: 'Weekly Community Circle Prompt',
  question: 'What book, film, or song first helped you feel that bisexuality is a complete, whole identity?',
  context: 'Share your reflections with the community below. No rush or comparison—every journey is valid.',
  responseCount: 18,
};
