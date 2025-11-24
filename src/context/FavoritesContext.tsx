"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface FavoritesContextType {
  favorites: string[];
  addToFavorites: (productId: string) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      const fetchFavorites = async () => {
        try {
          const dados = getFirestore(db.app);
          const userDoc = doc(dados, "users", user.uid);
          const userSnapshot = await getDoc(userDoc);
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const userFavorites = userData.favorites || [];
            setFavorites(userFavorites);
          } else {
            setFavorites([]);
          }
        } catch (error) {
          console.error('Erro ao buscar favoritos:', error);
          setFavorites([]);
        }
      };

      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const addToFavorites = async (productId: string) => {
    if (!user) {
      return;
    }

    try {
      const dados = getFirestore(db.app);
      const userDoc = doc(dados, "users", user.uid);
      
      // Primeiro, vamos buscar os favoritos atuais
      const userSnapshot = await getDoc(userDoc);
      const currentFavorites = userSnapshot.exists() ? (userSnapshot.data().favorites || []) : [];
      
      // Verificar se o produto já está nos favoritos
      if (currentFavorites.includes(productId)) {
        return;
      }
      
      // Adicionar o novo favorito
      const updatedFavorites = [...currentFavorites, productId];
      
      await updateDoc(userDoc, { favorites: updatedFavorites });
      setFavorites(updatedFavorites);
      console.log('Favorito adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      throw error;
    }
  };

  const removeFromFavorites = async (productId: string) => {
    if (!user) {
      console.log('Usuário não está logado, não é possível remover favorito');
      return;
    }

    try {
      const dados = getFirestore(db.app);
      const userDoc = doc(dados, "users", user.uid);
      const updatedFavorites = favorites.filter(id => id !== productId);
      
      await updateDoc(userDoc, { favorites: updatedFavorites });
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      throw error;
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.includes(productId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addToFavorites, removeFromFavorites, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
} 