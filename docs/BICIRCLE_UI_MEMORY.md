# BiCircle UI Memory — Product & Design Contract

This file is the persistent project memory for future UI work. Read it before redesigning pages or creating shared components.

## Product structure

BiCircle is a responsive, inclusive community app. Keep these areas clear and separate:
- **Community & Friendship:** community feed, circles/groups, friends, nearby profiles, direct messages, support resources.
- **See Your Match:** an optional relationship-discovery area. It must stay opt-in and visibly separate from ordinary friendship/community features.
- **Safety & Privacy:** user controls, block/report flows, community guidelines, and privacy settings should be easy to find.
- **Staff-only areas:** moderation and admin links must remain permission-gated.

## Visual direction

- Product name: **BiCircle**. Tagline: **Find your people. Be yourself.**
- Dark, calm premium interface with warm purple and pink accents; inclusive and friendly rather than overly flashy.
- Main background: `#0E0B13`; elevated surface: `#191321`; border: `#2D233D`; primary purple: `#9B5CFF`; accent pink: `#F05AA6`; main text: `#F8F5FC`; secondary text: `#B9B0C6`.
- Prefer restrained purple-to-pink gradients for the main CTA only. Use clear spacing, rounded cards, soft borders, simple icons, readable type, and strong visible focus states.
- Use consistent buttons, inputs, card surfaces, headings, empty states, and loading states across pages.
- Mobile first: stack columns at small widths, keep touch targets comfortably large (about 44px where practical), allow filter rows to scroll horizontally, avoid horizontal page overflow, and keep dialogs vertically scrollable.
- Keep normal-user navigation simple; show the core routes first and put less-used community links behind a “More” control. Keep active routes visible.

## Main user journeys

1. First visit → short welcome modal → choose **Community & Friendship** (community feed) or **See Your Match** (match page). Keep the community/age/safety acceptance behavior intact.
2. Community feed → compose post → filter/browse posts → interact with the community.
3. Explore Circles / My Groups → search/filter → inspect a group → join or request to join.
4. See Your Match → clearly explain that it is optional → user opts in → chooses relationship focus → connection requests only proceed after mutual acceptance.
5. Profile / Friends / Messages → discover, manage, and communicate with clear privacy affordances.
6. Settings / Safety / Guidelines / Resources → accessible controls and plain-language explanations.

## Match section rules

- Keep relationship discovery opt-in; never imply a user is visible unless they opt in.
- Relationship focus choices are exactly: Friendship, Serious relationship, Casual dating, Casual sexual connection.
- Orientation and relationship focus remain optional fields.
- Make consent, blocking, reporting, adult-only eligibility, and profile visibility controls explicit.
- Never create fake/seed profiles or imply a live match exists without verified data.
- Do not merge the match section into the friendship navigation or silently change the stated intent of either area.

## Engineering rules

- Use existing React + TypeScript + Vite + Tailwind + Lucide patterns.
- Use reusable utility classes from `src/styles/design-system.css` rather than copying slightly different card/button styles into every new page.
- Preserve existing routes, component contracts, data flows, Firebase integration, and permissions when adjusting appearance.
- Avoid fake results and hardcoded demo activity. Empty states should be honest and guide users to a next action.
- Do not commit secrets or Firebase service-account JSON. Public Firebase web configuration is not a secret, but privileged keys are.
- Build/check status must be verified before saying a change builds. A PR is not the same as a deployed/live website.

## Page inventory to keep visually consistent

`/` Landing; `/login`, `/signup`, `/forgot-password`, `/reset-password` authentication; `/feed` community feed; `/explore` circles; `/groups` joined groups; `/groups/:id` group detail; `/nearby` and legacy profile-discovery routes; `/see-your-match` opt-in matching; `/members/:id` member profile; `/friends`; `/messages`; `/notifications`; `/settings/*`; `/safety`; `/guidelines`; `/resources`; `/privacy`; `/terms`; `/about`; and permission-restricted `/moderation` and `/admin`.

## Acceptance checklist for future UI changes

- [ ] Desktop and narrow mobile layouts both work.
- [ ] Focus, hover, disabled, loading, and empty states are covered where relevant.
- [ ] Buttons/links have meaningful actions and accessible labels.
- [ ] Inputs have readable labels and a visible focus treatment.
- [ ] Matching remains opt-in, age gated, privacy aware, and based on real saved data.
- [ ] Routes and auth/role gates are preserved.
- [ ] No mock or seeded data is presented as real.
- [ ] Current CI/build result is checked before claiming success.
