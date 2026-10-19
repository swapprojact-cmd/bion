import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Profile, UserPrivate } from '../types';
import { DataService, store, clearDataSessionCache } from '../lib/dataService';
import { auth, db, validateFirestoreConnection } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser, type User } from 'firebase/auth';
import { doc, setDoc, writeBatch } from 'firebase/firestore';

interface AuthContextType {
  currentUser: Profile | null;
  userPrivate: UserPrivate | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  firebaseConnected: boolean | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { email: string; pass: string; displayName: string; username: string; birthYear?: number }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchDemoAccount: (userId: string) => Promise<void>;
  updateCurrentProfile: (updates: Partial<Profile>) => Promise<void>;
  updateCurrentPrivate: (updates: Partial<UserPrivate>) => Promise<void>;
  resetAllDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [userPrivate, setUserPrivate] = useState<UserPrivate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);
  const activeFirebaseUid = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void validateFirestoreConnection().then(connected => {
      if (mounted) setFirebaseConnected(connected);
    });

    // Firebase Auth is the source of truth; never restore a session from a client-controlled user ID.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const nextUid = firebaseUser?.uid || null;
      if (activeFirebaseUid.current !== nextUid) {
        clearDataSessionCache();
        activeFirebaseUid.current = nextUid;
        setCurrentUser(null);
        setUserPrivate(null);
      }
      setIsLoading(true);
      try {
        if (!firebaseUser) {
          setCurrentUser(null);
          setUserPrivate(null);
          return;
        }

        const eventUid = firebaseUser.uid;
        const prof = await DataService.getProfileById(eventUid);
        if (!prof) {
          // Signup writes the profile immediately after creating the Auth user.
          // Do not overwrite a profile already installed by that concurrent signup flow.
          setCurrentUser(existing => existing?.id === eventUid ? existing : null);
          setUserPrivate(existing => existing?.user_id === eventUid ? existing : null);
          console.error('Authenticated Firebase user has no matching Firestore profile.');
          return;
        }

        setCurrentUser(prof);
        const priv = await DataService.getUserPrivate(eventUid);
        setUserPrivate(priv);
      } catch (error) {
        console.error('Unable to load signed-in Firebase account data:', error);
        setCurrentUser(existing => existing?.id === firebaseUser.uid ? existing : null);
        setUserPrivate(existing => existing?.user_id === firebaseUser.uid ? existing : null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      if (!email.includes('@') || pass.length < 6) {
        return { success: false, error: 'Enter a valid email and password.' };
      }
      const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const prof = await DataService.getProfileById(credential.user.uid);
      if (!prof) {
        await signOut(auth);
        return { success: false, error: 'Your account has no BiCircle profile yet. Please contact support.' };
      }
      setCurrentUser(prof);
      const priv = await DataService.getUserPrivate(prof.id);
      setUserPrivate(priv);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.code === 'auth/invalid-credential' ? 'Email or password is incorrect.' : (e.message || 'Login failed') };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: { email: string; pass: string; displayName: string; username: string; birthYear?: number }) => {
    let createdAuthUser: User | null = null;
    setIsLoading(true);
    try {
      const email = data.email.trim().toLowerCase();
      const displayName = data.displayName.trim();
      const username = data.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!email.includes('@') || data.pass.length < 8 || !displayName || username.length < 3) {
        return { success: false, error: 'Use a valid email, a password of at least 8 characters, a display name, and a username of at least 3 characters.' };
      }

      const credential = await createUserWithEmailAndPassword(auth, email, data.pass);
      createdAuthUser = credential.user;
      const uid = credential.user.uid;
      const now = new Date().toISOString();
      const newProfile: Profile = {
        id: uid,
        display_name: displayName,
        username,
        bio: 'New member in BiCircle community.',
        interests: ['Community', 'Friendship'],
        pronouns: 'they/them',
        visibility: 'public',
        is_moderator: false,
        is_admin: false,
        status: 'active',
        created_at: now,
        updated_at: now,
      };
      const privateProfile: UserPrivate = {
        user_id: uid,
        account_name: email,
        birth_year: data.birthYear || null,
        messaging_permission: 'everyone',
        allow_friend_requests: true,
        email_notifications: true,
        notify_messages: true,
        notify_comments: true,
        notify_friend_requests: true,
        created_at: now,
        updated_at: now,
      };
      // Create the public profile and private settings atomically. A half-created
      // Firestore account should not leave the new Auth user stranded.
      const batch = writeBatch(db);
      batch.set(doc(db, 'profiles', uid), newProfile);
      batch.set(doc(db, 'user_private', uid), privateProfile);
      await batch.commit();
      createdAuthUser = null;
      // Update the in-memory view after Firestore confirms both documents were saved.
      store.profiles = store.profiles.filter(profile => profile.id !== uid);
      store.profiles.push(newProfile);
      store.userPrivateMap[uid] = privateProfile;
      store.save();
      setCurrentUser(newProfile);
      setUserPrivate(privateProfile);
      return { success: true };
    } catch (e: any) {
      if (createdAuthUser && auth.currentUser?.uid === createdAuthUser.uid) {
        try {
          await deleteUser(createdAuthUser);
        } catch (cleanupError) {
          console.error('Could not remove a newly-created Auth account after profile setup failed:', cleanupError);
          try { await signOut(auth); } catch { /* Keep the original signup error as the useful message. */ }
        }
      }
      return { success: false, error: e.code === 'auth/email-already-in-use' ? 'An account already exists for this email.' : (e.message || 'Signup failed') };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // quiet
    }
    setCurrentUser(null);
    setUserPrivate(null);
  };

  // Demo account switching is intentionally disabled in Firebase-only mode.
  const switchDemoAccount = async (_userId: string) => {
    console.warn('Demo account switching is disabled. Sign in with Firebase Authentication.');
  };

  const updateCurrentProfile = async (updates: Partial<Profile>) => {
    if (!currentUser) return;
    const updated = await DataService.updateProfile(currentUser.id, updates);
    setCurrentUser(updated);
  };

  const updateCurrentPrivate = async (updates: Partial<UserPrivate>) => {
    if (!currentUser) return;
    const updated = await DataService.updateUserPrivate(currentUser.id, updates);
    setUserPrivate(updated);
  };

  // Demo reset must never authenticate a user or grant client-side privileges.
  const resetAllDemoData = () => {
    store.resetToDefault();
    console.info('Local demo data was reset. Firebase Auth session and server data were not changed.');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userPrivate,
        isAuthenticated: !!currentUser,
        isLoading,
        isModerator: !!currentUser?.is_moderator || !!currentUser?.is_admin,
        isAdmin: !!currentUser?.is_admin,
        firebaseConnected,
        login,
        signup,
        logout,
        switchDemoAccount,
        updateCurrentProfile,
        updateCurrentPrivate,
        resetAllDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
