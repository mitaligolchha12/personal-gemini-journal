import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOut, syncUserProfile } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to sync profile on auth change:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const loggedUser = await signInWithGoogle();
      const profile = await syncUserProfile(loggedUser);
      setUser(loggedUser);
      setUserProfile(profile);
    } catch (err) {
      console.error('Google Sign In failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign Out failed:', err);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const profile = await syncUserProfile(user);
        setUserProfile(profile);
      } catch (err) {
        console.error('Failed to refresh profile:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, loginWithGoogle, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
