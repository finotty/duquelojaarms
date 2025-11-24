"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Product } from '../../../hooks/useProducts';
import { db } from '../../../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import styles from './styles.module.scss';
import { ProductCard } from '../../../components/ProductCard';

export default function BrandPage() {
  const params = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState('');

  // Função para gerar diferentes variações do nome da marca
  const generateBrandVariations = (slug: string) => {
    const words = slug.split('-');
    const variations = new Set<string>();
    
    // Adicionar diferentes formatos
    variations.add(words.map(word => word.toUpperCase()).join(' ')); // CBC
    variations.add(words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')); // Tauros
    variations.add(words.map(word => word.toLowerCase()).join(' ')); // cbc
    variations.add(words.join(' ')); // Formato original do slug
    
    return Array.from(variations);
  };

  // Função para buscar produtos com diferentes variações de marca
  const searchProductsByBrandVariations = async (brandVariations: string[]) => {
    const allProducts: Product[] = [];
    
    for (const brandName of brandVariations) {
      try {
        // Buscar na coleção 'products'
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('marca', '==', brandName));
        const querySnapshot = await getDocs(q);
        
        const productsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            firestoreId: doc.id,
            ...data,
            location: data.location || '',
            displayLocation: data.displayLocation || '',
            category: data.category || ''
          };
        }) as Product[];

        // Buscar na coleção 'customProducts'
        const customRef = collection(db, 'customProducts');
        const qCustom = query(customRef, where('marca', '==', brandName));
        const customSnapshot = await getDocs(qCustom);
        
        const customProductsData = customSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            firestoreId: doc.id,
            ...data,
            location: data.location || '',
            displayLocation: data.displayLocation || '',
            category: data.category || ''
          };
        }) as Product[];

        allProducts.push(...productsData, ...customProductsData);
      } catch (error) {
        console.error(`Erro ao buscar produtos para marca "${brandName}":`, error);
      }
    }
    
    // Remover duplicatas baseado no ID
    const uniqueProducts = allProducts.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    );
    
    return uniqueProducts;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const slug = params.slug as string;
        
        // Para exibição, usar formato mais legível (primeira letra maiúscula)
        const displayBrandName = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        setBrandName(displayBrandName);

        // Gerar variações do nome da marca
        const brandVariations = generateBrandVariations(slug);
        
        // Buscar produtos com todas as variações
        const products = await searchProductsByBrandVariations(brandVariations);
        
        setProducts(products);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [params.slug]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Produtos {brandName}</h1>
      
      {products.length === 0 ? (
        <div className={styles.noProducts}>
          <p>Nenhum produto encontrado para esta marca.</p>
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
} 