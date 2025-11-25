"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export interface CartProduct {
  id?: string;
  image: string;
  name: string;
  price: string;
  quantity: number;
  specifications?: Record<string, string>;
}

interface CartContextType {
  cart: CartProduct[];
  addToCart: (product: CartProduct) => void;
  handleQty: (idx: number, delta: number) => void;
  removeFromCart: (idx: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);


export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartProduct[]>([]);
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  const clearCart = () => setCart([]);

  // Carregar carrinho do localStorage quando o componente montar
  useEffect(() => {
    const cartData = localStorage.getItem("cart");
    if (cartData) {
      setCart(JSON.parse(cartData));
    }
    setIsInitialized(true);
  }, []);

  // Sincronizar carrinho com Firestore quando o usuário fizer login
  useEffect(() => {
    const syncCartWithFirestore = async () => {
      if (!user || !isInitialized) return;

      try {
        const dados = getFirestore(db.app);
        const userDoc = doc(dados, "users", user.uid);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          const firestoreCart = userData.cart || [];
          const localCart = JSON.parse(localStorage.getItem("cart") || "[]");

          // Se houver itens no carrinho local, mesclar com o carrinho do Firestore
          if (localCart.length > 0) {
            const mergedCart = [...firestoreCart];
            
            localCart.forEach((localItem: CartProduct) => {
              const existingItemIndex = mergedCart.findIndex(
                item => item.name === localItem.name
              );

              if (existingItemIndex > -1) {
                mergedCart[existingItemIndex].quantity += localItem.quantity;
              } else {
                mergedCart.push(localItem);
              }
            });

            // Atualizar Firestore com o carrinho mesclado
            await setDoc(userDoc, { cart: mergedCart }, { merge: true });
            setCart(mergedCart);
            localStorage.setItem("cart", JSON.stringify(mergedCart));
          } else if (firestoreCart.length > 0) {
            // Se não houver itens no carrinho local, usar o carrinho do Firestore
            setCart(firestoreCart);
            localStorage.setItem("cart", JSON.stringify(firestoreCart));
          }
        }
      } catch (error) {
        console.error('Erro ao sincronizar carrinho:', error);
      }
    };

    syncCartWithFirestore();
  }, [user, isInitialized]);

  // Salvar carrinho no localStorage e Firestore quando ele mudar
  useEffect(() => {
    if (!isInitialized) return;

    localStorage.setItem("cart", JSON.stringify(cart));

    const saveCartToFirestore = async () => {
      if (user) {
        try {
          const dados = getFirestore(db.app);
          const userDoc = doc(dados, "users", user.uid);
          await setDoc(userDoc, { cart }, { merge: true });
        } catch (error) {
          console.error('Erro ao salvar carrinho no Firestore:', error);
        }
      }
    };

    saveCartToFirestore();
  }, [cart, user, isInitialized]);

  const addToCart = (product: CartProduct) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.name === product.name);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += product.quantity || 1;
        return updated;
      }
      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
  };

  const handleQty = (idx: number, delta: number) => {
    setCart(prev => {
      const updated = prev.map((item, i) => {
        if (i === idx) {
          return {
            ...item,
            quantity: Math.max(1, item.quantity + delta)
          };
        }
        return item;
      });
      return updated;
    });
  };

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, handleQty, removeFromCart,clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}; 