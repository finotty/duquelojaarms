"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
  redirectPath: string;
  setRedirectPath: (path: string) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string>('/');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAdmin(user?.email === 'admin@admin.com');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Buscar dados adicionais do usuário no Firestore
      const dados = getFirestore(db.app);
      const userDoc = doc(dados, "users", user.uid);
      const userSnapshot = await getDoc(userDoc);
      
      if (!userSnapshot.exists()) {
        throw new Error('Dados do usuário não encontrados');
      }

      // Pegar o caminho de redirecionamento do localStorage
      const savedRedirectPath = localStorage.getItem('redirectPath') || '/';
      localStorage.removeItem('redirectPath'); // Limpar após usar

      // Redirecionar para o caminho salvo
      router.push(savedRedirectPath);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Salvar dados adicionais do usuário no Firestore
      const dados = getFirestore(db.app);
      await setDoc(doc(dados, "users", user.uid), {
        ...userData,
        email: user.email,
        createdAt: new Date().toISOString()
      });

      // Pegar o caminho de redirecionamento do localStorage
      const savedRedirectPath = localStorage.getItem('redirectPath') || '/';
      localStorage.removeItem('redirectPath'); // Limpar após usar

      // Redirecionar para o caminho salvo
      router.push(savedRedirectPath);
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const handleSetRedirectPath = (path: string) => {
    setRedirectPath(path);
    localStorage.setItem('redirectPath', path);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      logout, 
      redirectPath, 
      setRedirectPath: handleSetRedirectPath,
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 