"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ProductImage from "../ProductImage";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import styles from "./styles.module.scss";
import { Product } from "@/hooks/useProducts";

interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
  showSpecs?: boolean;
  showBuyButton?: boolean;
}

export function ProductCard({ 
  product, 
  onProductClick, 
  showSpecs = true, 
  showBuyButton = true 
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { user, setRedirectPath } = useAuth();
  const router = useRouter();

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      localStorage.setItem('pendingProduct', JSON.stringify({
        image: product.image,
        name: product.name,
        price: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(product.price),
        quantity: 1
      }));
      
      setRedirectPath('/carrinho');
      router.push('/login');
      return;
    }

    addToCart({
      image: product.image,
      name: product.name,
      price: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(product.price),
      quantity: 1,
      specifications: product.specifications
        ? Object.fromEntries(Object.entries(product.specifications).filter(([_, v]) => typeof v === 'string' && v !== undefined)) as Record<string, string>
        : undefined
    });
    router.push('/carrinho');
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setRedirectPath('/');
      router.push('/login');
      return;
    }

    if (isFavorite(product.id)) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getSpecsToShow = () => {
    if (!showSpecs || !product.specifications) return [];
    
    const specs = Object.entries(product.specifications);
    return specs.slice(0, 4); // Mostrar apenas as primeiras 4 especificações
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.imageContainer}>
        <ProductImage
          image={product.image}
          alt={product.name}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain' 
          }}
          stylesCustom={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
        <button 
          className={styles.favoriteButton}
          onClick={handleFavorite}
          title={isFavorite(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          {isFavorite(product.id) ? <FaHeart color="#e74c3c" /> : <FaRegHeart color="#000" />}
        </button>
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.productName}>{product.name}</h3>
        
        <div className={styles.price}>{formatPrice(product.price)}</div>
        <div className={styles.installments}>
          Em até 10x de {formatPrice(product.price / 10)} sem juros
        </div>
        
        {showBuyButton && (
          <button 
            className={styles.buyButton}
            onClick={handleBuy}
            type="button"
          >
            Adicionar ao Carrinho
          </button>
        )}
      </div>
    </div>
  );
}