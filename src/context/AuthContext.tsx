import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserPrivate } from '../types';
import { DataService, store } from '../lib/dataService';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: Profile | null;
  userPrivate: UserPrivate | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  firebaseConnected: boolean;
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
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      // Load current user from stored ID if session exists
      const storedUserId = localStorage.getItem('bicircle_current_user_id');
      if (storedUserId) {
        const prof = await DataService.getProfileById(storedUserId);
        if (prof) {
          setCurrentUser(prof);
          const priv = await DataService.getUserPrivate(prof.id);
          setUserPrivate(priv);
        }
      } else {
        setCurrentUser(null);
        setUserPrivate(null);
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      // 1. Try Firebase Auth if valid email format
      if (email.includes('@') && pass.length >= 6) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, pass);
          if (userCredential.user) {
            const prof = await DataService.getProfileById(userCredential.user.uid);
            if (prof) {
              setCurrentUser(prof);
              localStorage.setItem('bicircle_current_user_id', prof.id);
              const priv = await DataService.getUserPrivate(prof.id);
              setUserPrivate(priv);
              return { success: true };
            }
          }
        } catch {
          // Fall through to demo matching
        }
      }

      // 2. Demo accounts or username login
      const found = store.profiles.find(
        p => p.username.toLowerCase() === email.toLowerCase() || email.includes(p.username)
      );
      const target = found || store.profiles[0];
      setCurrentUser(target);
      localStorage.setItem('bicircle_current_user_id', target.id);
      const priv = await DataService.getUserPrivate(target.id);
      setUserPrivate(priv);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: { email: string; pass: string; displayName: string; username: string; birthYear?: number }) => {
    setIsLoading(true);
    try {
      let uid = 'usr_' + Date.now();

      // Register with Firebase Auth if valid email & password
      if (data.email.includes('@') && data.pass.length >= 6) {
        try {
          const res = await createUserWithEmailAndPassword(auth, data.email, data.pass);
          if (res.user) {
            uid = res.user.uid;
          }
        } catch {
          // If already exists or in offline dev, generate safe uid
        }
      }

      const newProfile: Profile = {
        id: uid,
        display_name: data.displayName,
        username: data.username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio: 'New member in BiCircle community.',
        interests: ['Community', 'Friendship'],
        pronouns: 'they/them',
        visibility: 'public',
        is_moderator: false,
        is_admin: false,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store.profiles.push(newProfile);
      store.userPrivateMap[uid] = {
        user_id: uid,
        account_name: data.email,
        birth_year: data.birthYear || null,
        messaging_permission: 'everyone',
        allow_friend_requests: true,
        email_notifications: true,
        notify_messages: true,
        notify_comments: true,
        notify_friend_requests: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.save();

      // Write to Firebase Firestore
      try {
        await setDoc(doc(db, 'profiles', uid), newProfile, { merge: true });
        await setDoc(doc(db, 'user_private', uid), store.userPrivateMap[uid], { merge: true });
      } catch (e) {
        console.warn('Firestore initial user write:', e);
      }

      setCurrentUser(newProfile);
      setUserPrivate(store.userPrivateMap[uid]);
      localStorage.setItem('bicircle_current_user_id', uid);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Signup failed' };
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

  const switchDemoAccount = async (userId: string) => {
    const prof = await DataService.getProfileById(userId);
    if (prof) {
      setCurrentUser(prof);
      localStorage.setItem('bicircle_current_user_id', prof.id);
      const priv = await DataService.getUserPrivate(prof.id);
      setUserPrivate(priv);
    }
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

  const resetAllDemoData = () => {
    store.resetToDefault();
    const maya = store.profiles[0];
    setCurrentUser(maya);
    setUserPrivate(store.userPrivateMap[maya.id]);
    localStorage.setItem('bicircle_current_user_id', maya.id);
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
