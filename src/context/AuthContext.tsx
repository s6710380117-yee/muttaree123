import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, BOOTSTRAP_ADMIN_EMAIL, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isSuspended: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<{ needVerification: boolean }>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  updateBio: (bio: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync profile from Firestore
  const fetchUserProfile = async (user: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      const isDefaultAdmin = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // If this is bootstrap admin email but role is not admin, upgrade it
        if (isDefaultAdmin && data.role !== 'admin') {
          await updateDoc(userRef, { role: 'admin' });
          data.role = 'admin';
        }
        setUserProfile(data);
      } else {
        // Create initial profile
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน',
          photoURL: user.photoURL || undefined,
          role: isDefaultAdmin ? 'admin' : 'member',
          status: 'active',
          bio: 'ยินดีต้อนรับสู่คลังความรู้',
          createdAt: new Date().toISOString(),
        };

        await setDoc(userRef, newProfile);
        
        // Also register in admins collection if bootstrap admin
        if (isDefaultAdmin) {
          try {
            await setDoc(doc(db, 'admins', user.uid), {
              uid: user.uid,
              email: user.email,
              role: 'admin',
              addedAt: new Date().toISOString(),
            });
          } catch (e) {
            console.error('Error seeding admin entry:', e);
          }
        }

        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error('Error fetching/creating user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await fetchUserProfile(cred.user);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
    }

    const isDefaultAdmin = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName: name,
      role: isDefaultAdmin ? 'admin' : 'member',
      status: 'active',
      bio: '',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      if (isDefaultAdmin) {
        await setDoc(doc(db, 'admins', cred.user.uid), {
          uid: cred.user.uid,
          email,
          role: 'admin',
          addedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${cred.user.uid}`);
    }

    setUserProfile(newProfile);

    // Send real email verification
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('Could not send verification email immediately:', e);
    }

    return { needVerification: true };
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    await fetchUserProfile(cred.user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const updateBio = async (bio: string) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { bio, updatedAt: new Date().toISOString() });
      if (userProfile) {
        setUserProfile({ ...userProfile, bio });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser);
    }
  };

  const isAdmin = userProfile?.role === 'admin' || currentUser?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
  const isModerator = isAdmin || userProfile?.role === 'moderator';
  const isSuspended = userProfile?.status === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoading,
        isAdmin,
        isModerator,
        isSuspended,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        resetPassword,
        resendVerificationEmail,
        logout,
        updateBio,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
