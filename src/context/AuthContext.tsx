import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider } from '../lib/firebase';
import { UserProfile } from '../types';

export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile;
  isAuthLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  authProviderName: 'google' | 'facebook' | 'password' | 'none';
}

const defaultProfile: UserProfile = {
  name: 'ผู้ใช้ NutriMed',
  email: '',
  role: 'ผู้ใช้งานทั่วไป',
  elderlyMode: false,
  fontSize: 'normal',
  diseases: [],
  allergies: [],
  medications: [],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Sync or fetch profile from Firestore when user changes
  const fetchOrCreateUserProfile = async (user: User, customName?: string): Promise<UserProfile> => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        const profile: UserProfile = {
          name: data.displayName || customName || user.displayName || 'ผู้ใช้งาน',
          email: data.email || user.email || '',
          role: data.role || 'ผู้ใช้งานทั่วไป',
          elderlyMode: !!data.elderlyMode,
          fontSize: data.fontSize || 'normal',
          age: data.age || '',
          gender: data.gender || '',
          diseases: Array.isArray(data.diseases) ? data.diseases : [],
          allergies: Array.isArray(data.allergies) ? data.allergies : [],
          medications: Array.isArray(data.medications) ? data.medications : [],
        };
        setUserProfile(profile);
        return profile;
      } else {
        // Create initial user document in Firestore
        const newProfile: UserProfile = {
          name: customName || user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน',
          email: user.email || '',
          role: 'ผู้ใช้งานทั่วไป',
          elderlyMode: false,
          fontSize: 'normal',
          diseases: [],
          allergies: [],
          medications: [],
        };

        const docData = {
          uid: user.uid,
          displayName: newProfile.name,
          email: newProfile.email,
          photoURL: user.photoURL || '',
          providerId: user.providerData?.[0]?.providerId || 'password',
          role: newProfile.role,
          elderlyMode: newProfile.elderlyMode,
          fontSize: newProfile.fontSize,
          diseases: newProfile.diseases,
          allergies: newProfile.allergies,
          medications: newProfile.medications,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userRef, docData, { merge: true });
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (e) {
      console.warn('[AuthContext] Firestore profile fetch/create error:', e);
      // Fallback in-memory
      const fallback: UserProfile = {
        name: customName || user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน',
        email: user.email || '',
        role: 'ผู้ใช้งานทั่วไป',
        elderlyMode: false,
        fontSize: 'normal',
        diseases: [],
        allergies: [],
        medications: [],
      };
      setUserProfile(fallback);
      return fallback;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthContext] Auth state changed:', user ? `User UID: ${user.uid}` : 'No User');
      setCurrentUser(user);
      if (user) {
        await fetchOrCreateUserProfile(user);
      } else {
        setUserProfile(defaultProfile);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await fetchOrCreateUserProfile(cred.user);
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    // Update Firebase Auth profile
    try {
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch (e) {
      console.warn('Could not update Auth displayName:', e);
    }
    await fetchOrCreateUserProfile(cred.user, name.trim());
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await fetchOrCreateUserProfile(cred.user);
  };

  const loginWithFacebook = async () => {
    const cred = await signInWithPopup(auth, facebookProvider);
    await fetchOrCreateUserProfile(cred.user);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(defaultProfile);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);

    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(
          userRef,
          {
            uid: currentUser.uid,
            displayName: updated.name,
            email: updated.email,
            role: updated.role,
            age: updated.age || '',
            gender: updated.gender || '',
            elderlyMode: updated.elderlyMode,
            fontSize: updated.fontSize,
            diseases: updated.diseases,
            allergies: updated.allergies,
            medications: updated.medications,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Failed to save profile updates to Firestore:', e);
      }
    }
  };

  // Determine provider name
  let authProviderName: 'google' | 'facebook' | 'password' | 'none' = 'none';
  if (currentUser) {
    const providerId = currentUser.providerData?.[0]?.providerId;
    if (providerId === 'google.com') authProviderName = 'google';
    else if (providerId === 'facebook.com') authProviderName = 'facebook';
    else authProviderName = 'password';
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAuthLoading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithFacebook,
        sendPasswordReset,
        logout,
        updateUserProfile,
        authProviderName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
