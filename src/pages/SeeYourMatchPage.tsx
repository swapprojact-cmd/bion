import React, { useEffect, useState } from 'react';
import { Heart, ShieldCheck, EyeOff, Ban, Flag, Check, X, LockKeyhole } from 'lucide-react';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const FOCUS_OPTIONS = ['Friendship', 'Serious relationship', 'Casual dating', 'Casual sexual connection'] as const;
const ORIENTATION_OPTIONS = ['Bisexual', 'Pansexual', 'Gay', 'Lesbian', 'Queer', 'Straight', 'Questioning', 'Another identity', 'Prefer not to say'] as const;
type Focus = typeof FOCUS_OPTIONS[number];
type MatchProfile = { uid: string; display_name: string; username: string; bio?: string; interests?: string[]; orientation?: string; show_orientation?: boolean; focus: Focus[]; opted_in: boolean };
type MatchRequest = { id: string; sender_id: string; recipient_id: string; status: 'pending' | 'accepted' | 'declined'; sender_name?: string; recipient_name?: string };

const panel = 'rounded-2xl border border-[#2D233D] bg-[#191321] p-5';
const control = 'w-full rounded-xl border border-[#3A2D4C] bg-[#0E0B13] px-3 py-2.5 text-sm text-white outline-none focus:border-[#9B5CFF]';

export const SeeYourMatchPage: React.FC = () => {
  const { currentUser, userPrivate } = useAuth();
  const [profiles, setProfiles] = useState<MatchProfile[]>([]);
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [orientation, setOrientation] = useState('');
  const [showOrientation, setShowOrientation] = useState(false);
  const [focus, setFocus] = useState<Focus[]>([]);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const isAdultByBirthYear = !!userPrivate?.birth_year && new Date().getFullYear() - userPrivate.birth_year >= 18;

  const load = async () => {
    if (!currentUser) { setLoading(false); return; }
    setLoading(true);
    try {
      const [peopleSnap, requestsSnap, mineSnap, blocksSnap] = await Promise.all([
        getDocs(query(collection(db, 'relationship_profiles'), where('opted_in', '==', true))),
        getDocs(query(collection(db, 'match_requests'), where('recipient_id', '==', currentUser.id))),
        getDocs(query(collection(db, 'relationship_profiles'), where('uid', '==', currentUser.id))),
        getDocs(query(collection(db, 'blocks'), where('blocker_id', '==', currentUser.id))),
      ]);
      const blockedIds = new Set(blocksSnap.docs.map(d => String(d.data().blocked_id || '')));
      setProfiles(peopleSnap.docs.map(d => ({ ...(d.data() as MatchProfile), uid: d.id })).filter(p => p.uid !== currentUser.id && !blockedIds.has(p.uid)));
      setRequests(requestsSnap.docs.map(d => ({ ...(d.data() as MatchRequest), id: d.id })));
      if (!mineSnap.empty) {
        const mine = mineSnap.docs[0].data() as MatchProfile & { orientation?: string };
        setEnabled(!!mine.opted_in);
        setOrientation(mine.orientation || '');
        setShowOrientation(!!(mine as any).show_orientation);
        setFocus(mine.focus || []);
        setAdultConfirmed(!!(mine as any).adult_confirmed);
      }
    } catch (e) {
      setNotice('Could not load match discovery. Check Firebase configuration and relationship_profiles/match_requests rules.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [currentUser?.id]);

  const savePreferences = async () => {
    if (!currentUser) return;
    if (focus.length === 0) { setNotice('Choose at least one relationship focus.'); return; }
    if (!isAdultByBirthYear && !adultConfirmed) { setNotice('This section is for adults 18+. Confirm your age and add your birth year in account settings.'); return; }
    setSaving(true); setNotice('');
    try {
      const payload = {
        uid: currentUser.id,
        display_name: currentUser.display_name,
        username: currentUser.username,
        bio: currentUser.bio || '',
        interests: currentUser.interests || [],
        orientation: showOrientation ? (orientation || '') : '',
        show_orientation: showOrientation,
        focus,
        opted_in: enabled,
        adult_confirmed: isAdultByBirthYear || adultConfirmed,
        updated_at: serverTimestamp(),
      };
      await setDoc(doc(db, 'relationship_profiles', currentUser.id), payload, { merge: true });
      setNotice(enabled ? 'Your opt-in match profile is saved.' : 'Match discovery is turned off. Your profile will no longer appear in discovery.');
      await load();
    } catch (e) {
      setNotice('Could not save preferences. Check your Firebase rules and try again.');
    } finally { setSaving(false); }
  };

  const sendInterest = async (person: MatchProfile) => {
    if (!currentUser) return;
    const id = currentUser.id + '_' + person.uid;
    try {
      const existing = await getDoc(doc(db, 'match_requests', id));
      if (existing.exists()) { setNotice('You have already expressed interest in this person.'); return; }
      await setDoc(doc(db, 'match_requests', id), {
        sender_id: currentUser.id, recipient_id: person.uid, sender_name: currentUser.display_name,
        recipient_name: person.display_name, status: 'pending', created_at: serverTimestamp(), updated_at: serverTimestamp(),
      });
      setNotice('Interest sent. A connection is made only if the other person accepts.');
    } catch { setNotice('Could not send interest. The person may have opted out or you may have already sent a request.'); }
  };

  const respond = async (request: MatchRequest, status: 'accepted' | 'declined') => {
    try {
      await updateDoc(doc(db, 'match_requests', request.id), { status, updated_at: serverTimestamp() });
      setNotice(status === 'accepted' ? 'You both expressed interest. You can now decide whether to start a conversation.' : 'Request declined.');
      await load();
    } catch { setNotice('Could not update this request.'); }
  };

  const block = async (person: MatchProfile) => {
    if (!currentUser || !window.confirm('Block this person? They will no longer appear in your match list.')) return;
    try {
      await setDoc(doc(db, 'blocks', currentUser.id + '_' + person.uid), { blocker_id: currentUser.id, blocked_id: person.uid, created_at: serverTimestamp() });
      setProfiles(prev => prev.filter(p => p.uid !== person.uid));
      setNotice('Person blocked.');
    } catch { setNotice('Could not block this person.'); }
  };

  const report = async (person: MatchProfile) => {
    if (!currentUser) return;
    const details = window.prompt('Briefly describe the safety concern (optional):') || '';
    try {
      const id = crypto.randomUUID();
      await setDoc(doc(db, 'reports', id), { reporter_id: currentUser.id, target_type: 'profile', target_id: person.uid, reason: 'other', details: details.slice(0, 1500), status: 'pending', created_at: serverTimestamp(), updated_at: serverTimestamp() });
      setNotice('Report submitted privately to moderation.');
    } catch { setNotice('Could not submit the report.'); }
  };

  if (!currentUser) return <div className={panel + ' my-8'}><h1 className="text-2xl font-bold">See Your Match</h1><p className="mt-2 text-[#B9B0C6]">Sign in to manage an optional match profile.</p></div>;

  return <div className="mx-auto max-w-5xl space-y-6 py-6">
    <header className="rounded-3xl border border-[#4B2D63] bg-gradient-to-br from-[#241738] to-[#191321] p-6 sm:p-8">
      <div className="flex items-center gap-2 text-sm font-semibold text-pink-300"><Heart className="h-4 w-4" /> OPTIONAL · ADULTS 18+</div>
      <h1 className="mt-3 text-3xl font-extrabold text-white">See Your Match</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#D2C8DE]">Explore friendship and relationship connections in a separate opt-in space. Your regular BiCircle feed, friendships, groups, and support circles remain separate.</p>
      <div className="mt-5 flex flex-wrap gap-4 text-xs text-[#D2C8DE]"><span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Mutual consent</span><span className="flex items-center gap-1"><EyeOff className="h-4 w-4 text-purple-300" /> Opt-in only</span><span className="flex items-center gap-1"><LockKeyhole className="h-4 w-4 text-purple-300" /> Private orientation field</span></div>
    </header>

    {notice && <div role="status" className="rounded-xl border border-[#4B3760] bg-[#241738] p-3 text-sm text-[#E8DDF5]">{notice}</div>}

    <section className={panel + ' space-y-4'}>
      <div><h2 className="text-lg font-bold">Your match preferences</h2><p className="mt-1 text-xs text-[#B9B0C6]">Nothing is shared in match discovery until you turn it on. Orientation is optional.</p></div>
      <label className="flex items-start gap-3 rounded-xl border border-[#3A2D4C] p-3"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="mt-1 accent-fuchsia-500" /><span><strong className="block text-sm">Enable See Your Match</strong><span className="text-xs text-[#B9B0C6]">When off, your match profile is not shown in discovery.</span></span></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 text-sm"><label className="block font-medium" htmlFor="match-orientation">Sexual orientation (optional)</label><select id="match-orientation" className={control} value={orientation} onChange={e => setOrientation(e.target.value)}><option value="">Prefer not to share</option>{ORIENTATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select><label className="flex items-center gap-2 pt-1 text-xs text-[#B9B0C6]"><input type="checkbox" checked={showOrientation} onChange={e => setShowOrientation(e.target.checked)} className="accent-fuchsia-500" />Show my orientation to other opted-in members</label></div>
        <div className="space-y-2 text-sm"><span className="block font-medium">Relationship focus</span><div className="grid gap-2">{FOCUS_OPTIONS.map(item => <label key={item} className="flex items-center gap-2 text-sm text-[#D2C8DE]"><input type="checkbox" checked={focus.includes(item)} onChange={e => setFocus(prev => e.target.checked ? [...prev, item] : prev.filter(v => v !== item))} className="accent-fuchsia-500" />{item}</label>)}</div></div>
      </div>
      {!isAdultByBirthYear && <label className="flex items-start gap-2 text-xs text-[#D2C8DE]"><input type="checkbox" checked={adultConfirmed} onChange={e => setAdultConfirmed(e.target.checked)} className="mt-0.5 accent-fuchsia-500" /><span>I confirm I am 18 or older. I understand this checkbox is a self-attestation; BiCircle must implement age verification before production launch.</span></label>}
      <button onClick={savePreferences} disabled={saving} className="rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save preferences'}</button>
    </section>

    <section className={panel + ' space-y-4'}>
      <div><h2 className="text-lg font-bold">People who opted in</h2><p className="mt-1 text-xs text-[#B9B0C6]">Sending interest is not a connection. Only an accepted request records mutual interest.</p></div>
      {!enabled && <p className="rounded-xl border border-[#3A2D4C] p-4 text-sm text-[#B9B0C6]">Turn on your opt-in profile to use match discovery.</p>}
      {enabled && loading && <p className="text-sm text-[#B9B0C6]">Loading profiles…</p>}
      {enabled && !loading && profiles.length === 0 && <p className="text-sm text-[#B9B0C6]">No opted-in profiles are available yet. Check back later.</p>}
      {enabled && profiles.map(person => <article key={person.uid} className="rounded-xl border border-[#3A2D4C] p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row"><div><h3 className="font-bold">{person.display_name}</h3><p className="text-xs text-[#B9B0C6]">@{person.username}</p>{person.bio && <p className="mt-2 text-sm text-[#D2C8DE]">{person.bio}</p>}{person.orientation && person.show_orientation && <p className="mt-2 text-xs text-[#B9B0C6]">Orientation: {person.orientation}</p>}<div className="mt-2 flex flex-wrap gap-1.5">{person.focus.map(f => <span key={f} className="rounded-full bg-[#342345] px-2.5 py-1 text-xs text-purple-200">{f}</span>)}</div></div><div className="flex flex-wrap gap-2 self-start"><button onClick={() => void sendInterest(person)} className="flex items-center gap-1 rounded-lg bg-pink-600 px-3 py-2 text-xs font-semibold"><Heart className="h-3.5 w-3.5" /> Express interest</button><button onClick={() => void block(person)} className="flex items-center gap-1 rounded-lg border border-[#49364E] px-3 py-2 text-xs"><Ban className="h-3.5 w-3.5" /> Block</button><button onClick={() => void report(person)} className="flex items-center gap-1 rounded-lg border border-[#49364E] px-3 py-2 text-xs"><Flag className="h-3.5 w-3.5" /> Report</button></div></div>
      </article>)}
    </section>

    <section className={panel + ' space-y-3'}><h2 className="text-lg font-bold">Requests sent to you</h2>{requests.length === 0 && <p className="text-sm text-[#B9B0C6]">No incoming match requests.</p>}{requests.filter(r => r.status === 'pending').map(request => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#3A2D4C] p-3"><span className="text-sm">{request.sender_name || 'A member'} expressed interest</span><div className="flex gap-2"><button onClick={() => void respond(request, 'accepted')} className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold"><Check className="h-3.5 w-3.5" /> Accept</button><button onClick={() => void respond(request, 'declined')} className="flex items-center gap-1 rounded-lg border border-[#49364E] px-3 py-2 text-xs"><X className="h-3.5 w-3.5" /> Decline</button></div></div>)}</section>
    <p className="px-1 text-xs leading-5 text-[#9D91AA]">Safety: you can block or report any profile. Orientation is sensitive personal information; share only what you choose. Age self-attestation is not verification, and Firebase rules/emulator tests plus real age-assurance and abuse-prevention review are required before launch.</p>
  </div>;
};
