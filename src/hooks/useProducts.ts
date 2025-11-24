"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";

export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  specifications: Record<string, string>;
  location: string;
  displayLocation: string;
  category: string;
  marca?: string;
  firestoreId?: string;
}

type ProductCategory = 'destaques' | 'pistolas' | 'revolveres' | 'espingardas' | 'acessorios' | 'taticos' | 'esporte';

export function useProducts(location?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Buscar produtos da coleção 'products'
      const productsRef = collection(db, "products");
      const productsQuery = location 
        ? query(productsRef, where('displayLocation', '==', location))
        : productsRef;
      
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data()
      })) as Product[];

      // Buscar produtos personalizados da coleção 'customProducts'
      const customProductsRef = collection(db, "customProducts");
      const customProductsQuery = location 
        ? query(customProductsRef, where('displayLocation', '==', location))
        : customProductsRef;
      
      const customProductsSnapshot = await getDocs(customProductsQuery);
      const customProductsData = customProductsSnapshot.docs.map(doc => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data()
      })) as Product[];

      // Combinar os dois arrays de produtos
      const allProducts = [...productsData, ...customProductsData];
      
      setProducts(allProducts);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar produtos");
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProductsByLocation = (location: string) => {
    return products.filter(product => product.displayLocation === location);
  };

  const getProductsByCategory = (category: Product['category']) => {
    return products.filter(product => product.category === category);
  };

  useEffect(() => {
    fetchProducts();
  }, [location]);

  return {
    products,
    loading,
    error,
    getProductsByLocation,
    getProductsByCategory,
    refreshProducts: fetchProducts
  };
} 