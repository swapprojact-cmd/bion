import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Profile, UserPrivate } from '../types';
import { DataService, store } from '../lib/dataService';
import { auth, db, validateFirestoreConnection } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: Profile | null;
  userPrivate: UserPrivate | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  firebaseConnected: boolean;
  firebaseConnectionChecked: boolean;
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
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [firebaseConnectionChecked, setFirebaseConnectionChecked] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    void validateFirestoreConnection().then(connected => {
      if (active) {
        setFirebaseConnected(connected);
        setFirebaseConnectionChecked(true);
      }
    }).catch(error => {
      console.error('Firestore connection validation failed:', error);
      if (active) {
        setFirebaseConnected(false);
        setFirebaseConnectionChecked(true);
      }
    });

    // Firebase Auth is the source of truth; never restore a session from a client-controlled user ID.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      try {
        if (!firebaseUser) {
          setCurrentUser(null);
          setUserPrivate(null);
          if (typeof window !== 'undefined') localStorage.removeItem('bicircle_current_user_id');
          return;
        }
        const prof = await DataService.getProfileById(firebaseUser.uid);
        if (!prof) {
          setCurrentUser(null);
          setUserPrivate(null);
          console.error('Authenticated Firebase user has no matching Firestore profile.');
          return;
        }
        // Display roles from trusted Firebase Auth custom claims, not mutable profile booleans.
        const token = await firebaseUser.getIdTokenResult();
        const trustedProfile: Profile = {
          ...prof,
          is_admin: token.claims.admin === true,
          is_moderator: token.claims.moderator === true || token.claims.admin === true,
        };
        setCurrentUser(trustedProfile);
        const priv = await DataService.getUserPrivate(firebaseUser.uid);
        setUserPrivate(priv);
        if (typeof window !== 'undefined') localStorage.setItem('bicircle_current_user_id', firebaseUser.uid);
      } catch (error) {
        console.error('Unable to load the signed-in Firebase profile:', error);
        setCurrentUser(null);
        setUserPrivate(null);
      } finally {
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
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
      // Force-refresh role claims after successful sign-in so UI permissions match Firestore rules.
      const token = await credential.user.getIdTokenResult(true);
      const trustedProfile: Profile = {
        ...prof,
        is_admin: token.claims.admin === true,
        is_moderator: token.claims.moderator === true || token.claims.admin === true,
      };
      setCurrentUser(trustedProfile);
      const priv = await DataService.getUserPrivate(prof.id);
      setUserPrivate(priv);
      if (typeof window !== 'undefined') localStorage.setItem('bicircle_current_user_id', prof.id);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.code === 'auth/invalid-credential' ? 'Email or password is incorrect.' : (e.message || 'Login failed') };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: { email: string; pass: string; displayName: string; username: string; birthYear?: number }) => {
    setIsLoading(true);
    let createdUid: string | null = null;
    try {
      const email = data.email.trim().toLowerCase();
      const displayName = data.displayName.trim();
      const username = data.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!email.includes('@') || data.pass.length < 8 || !displayName || username.length < 3) {
        return { success: false, error: 'Use a valid email, a password of at least 8 characters, a display name, and a username of at least 3 characters.' };
      }

      const credential = await createUserWithEmailAndPassword(auth, email, data.pass);
      const uid = credential.user.uid;
      createdUid = uid;
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
      // Fail signup if Firestore profile creation fails; do not create a local fake account.
      await setDoc(doc(db, 'profiles', uid), newProfile);
      await setDoc(doc(db, 'user_private', uid), privateProfile);
      // Keep the same-browser cache warm for immediate UI updates; Firestore remains authoritative.
      store.profiles = store.profiles.filter(profile => profile.id !== uid);
      store.profiles.push(newProfile);
      store.userPrivateMap[uid] = privateProfile;
      store.save();
      setCurrentUser(newProfile);
      setUserPrivate(privateProfile);
      if (typeof window !== 'undefined') localStorage.setItem('bicircle_current_user_id', uid);
      return { success: true };
    } catch (e: any) {
      // If account creation succeeded but a required Firestore write failed, roll back
      // the partial profile so future logins do not end up with an orphaned auth account.
      if (createdUid && auth.currentUser?.uid === createdUid) {
        try { await deleteDoc(doc(db, 'user_private', createdUid)); } catch (cleanupError) { console.warn('Could not clean up partial private profile:', cleanupError); }
        try { await deleteDoc(doc(db, 'profiles', createdUid)); } catch (cleanupError) { console.warn('Could not clean up partial public profile:', cleanupError); }
        try { await deleteUser(auth.currentUser); } catch (cleanupError) { console.warn('Could not roll back the partially created Firebase Auth account:', cleanupError); }
        setCurrentUser(null);
        setUserPrivate(null);
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
    localStorage.removeItem('bicircle_current_user_id');
  };

  // Demo account switching is intentionally disabled in Firebase-only mode.
  const switchDemoAccount = async (_userId: string) => {
    console.warn('Demo account switching is disabled. Sign in with Firebase Authentication.');
  };

  const updateCurrentProfile = async (updates: Partial<Profile>) => {
    if (!currentUser) return;
    const updated = await DataService.updateProfile(currentUser.id, updates);
    setCurrentUser({
      ...updated,
      is_admin: currentUser.is_admin,
      is_moderator: currentUser.is_moderator,
    });
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
        firebaseConnectionChecked,
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
