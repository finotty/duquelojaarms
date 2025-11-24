"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import styles from './styles.module.scss';
import { FaHeart, FaShoppingCart, FaTrash } from 'react-icons/fa';
import ProductImage from '@/components/ProductImage';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category?: string;
  displayLocation?: string;
  specifications?: {
    calibre?: string;
    capacidade?: string;
    comprimento?: string;
    material?: string;
    peso?: string;
  };
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { favorites, removeFromFavorites } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (!user) {
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }

      try {
        const dados = getFirestore(db.app);
        const userDoc = doc(dados, "users", user.uid);
        const userSnapshot = await getDoc(userDoc);
        
        if (!userSnapshot.exists()) {
          setFavoriteProducts([]);
          setLoading(false);
          return;
        }

        const userData = userSnapshot.data();
        const favoriteIds = userData.favorites || [];

        console.log("Favoritos: ", favoriteIds);

        if (favoriteIds.length === 0) {
          setFavoriteProducts([]);
          setLoading(false);
          return;
        }

        // Buscar os produtos na coleção "products"
        const produtosCollection = collection(dados, "products");
        const produtosSnapshot = await getDocs(produtosCollection);
        const produtos = produtosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        // Buscar os produtos personalizados na coleção "customProducts"
        const customProdutosCollection = collection(dados, "customProducts");
        const customProdutosSnapshot = await getDocs(customProdutosCollection);
        const customProdutos = customProdutosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        // Combinar os dois arrays de produtos
        const allProducts = [...produtos, ...customProdutos];

        // Filtrar apenas os produtos que estão nos favoritos usando o id do produto
        const favoriteProducts = allProducts.filter(product => 
          favoriteIds.includes(product.id)
        );
        
        console.log('Produtos favoritos encontrados:', favoriteProducts);
        setFavoriteProducts(favoriteProducts);
      } catch (error) {
        console.error('Erro ao buscar produtos favoritos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [user, favorites]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      image: product.image,
      name: product.name,
      price: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(product.price),
      quantity: 1
    });
  };

  const handleRemoveFromFavorites = async (productId: string) => {
    try {
      await removeFromFavorites(productId);
      // Atualiza o estado local removendo o produto da lista
      setFavoriteProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Erro ao remover dos favoritos:', error);
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <h1>Favoritos</h1>
        <p>Por favor, faça login para ver seus produtos favoritos.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>Favoritos</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Meus Favoritos</h1>
      {favoriteProducts.length === 0 ? (
        <p>Você ainda não tem produtos favoritos.</p>
      ) : (
        <div className={styles.productsGrid}>
          {favoriteProducts.map((product) => (
            <div key={product.id} className={styles.productCard}>
              <ProductImage 
                image={product.image} 
                alt={product.name}
                style={{ width: '100%', height: '200px', objectFit: 'contain' }}
              />
              <h3>{product.name}</h3>
              <p className={styles.price}>R$ {product.price.toFixed(2)}</p>
              {product.specifications && (
                <div className={styles.specifications}>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <p key={key} className={styles.spec}>
                      <strong>{key}:</strong> {value}
                    </p>
                  ))}
                </div>
              )}
              <div className={styles.actions}>
                <button
                  onClick={() => handleAddToCart(product)}
                  className={styles.addToCartButton}
                >
                  <FaShoppingCart /> Adicionar ao Carrinho
                </button>
                <button
                  onClick={() => handleRemoveFromFavorites(product.id)}
                  className={styles.removeButton}
                >
                  <FaTrash /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 