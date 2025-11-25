"use client";
import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import styles from "./styles.module.scss";
import { FaStar, FaRegStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

interface ProductProps {
  id: string;
  image: StaticImageData;
  name: string;
  price: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  discount?: string;
  description: string;
}

export default function Product({
  id,
  image,
  name,
  price,
  rating,
  reviews,
  isNew,
  discount,
  description,
}: ProductProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const handleBuy = () => {
    addToCart({
      id,
      image: typeof image === 'object' && 'src' in image ? image.src : image,
      name,
      price,
      quantity: 1
    });
    router.push('/carrinho');
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite(id)) {
      await removeFromFavorites(id);
    } else {
      await addToFavorites(id);
    }
  };

  return (
    <>
      <div className={styles.card} onClick={() => setShowModal(true)}>
        <div className={styles.topBar}>
          {isNew && <span className={styles.badgeNew}>Novo</span>}
          {discount && <span className={styles.badgeDiscount}>{discount}</span>}
          <button 
            className={styles.favorite} 
            onClick={handleFavorite}
            title={isFavorite(id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            {isFavorite(id) ? <FaHeart color="#e74c3c" /> : <FaRegHeart />}
          </button>
        </div>
        <div className={styles.imageWrapper}>
          <Image src={image} alt={name} width={120} height={80} className={styles.productImg} />
        </div>
        <div className={styles.rating}>
          {[1,2,3,4,5].map(i => i <= Math.round(rating) ? <FaStar key={i} color="#f0b63d" /> : <FaRegStar key={i} color="#f0b63d" />)}
          <span className={styles.reviews}>{rating.toFixed(1)} ({reviews})</span>
        </div>
        <h3 className={styles.name}>{name}</h3>
        <div className={styles.price}>{price}</div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <Image src={image} alt={name} width={260} height={180} className={styles.modalImg} />
            <div className={styles.modalInfo}>
              <h2>{name}</h2>
              <div className={styles.rating}>
                {[1,2,3,4,5].map(i => i <= Math.round(rating) ? <FaStar key={i} color="#f0b63d" /> : <FaRegStar key={i} color="#f0b63d" />)}
                <span className={styles.reviews}>{rating.toFixed(1)} ({reviews})</span>
              </div>
              <div className={styles.modalPrice}>{price}</div>
              <p className={styles.modalDesc}>{description}</p>
              <button className={styles.buyBtn} onClick={handleBuy}>Comprar</button>
            </div>
            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
          </div>
        </div>
      )}
    </>
  );
} 