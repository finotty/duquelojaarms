"use client";
import { useState, useRef } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import styles from "./styles.module.scss";
import ProductImage from "../ProductImage";
import { ProductCard } from "../ProductCard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

interface ProductSectionProps {
  sectionName: string;
  displayLocation: string;
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function ProductSection({ 
  sectionName, 
  displayLocation, 
  title,
  subtitle,
  viewAllHref,
  viewAllLabel
}: ProductSectionProps) {
  const { products, loading } = useProducts(displayLocation);
  const { user, setRedirectPath } = useAuth();
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return <div className={styles.loading}>Carregando {sectionName.toLowerCase()}...</div>;
  }

  if (!products.length) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleProductClick = (product: typeof products[0]) => {
    setSelectedProduct(product);
  };

  const handleModalBuy = (product: typeof products[0]) => {
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
      
      setSelectedProduct(null);
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
    setSelectedProduct(null);
    router.push('/carrinho');
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title || sectionName}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className={styles.viewAllButton}>
            {viewAllLabel || "Ver Todos"}
            <FaArrowRight />
          </Link>
        )}
      </div>
      {subtitle && (
        <div className={styles.subtitleContainer}>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      )}
      <div className={styles.scrollContainer}>
        <div className={styles.productsScroll} ref={scrollRef}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={handleProductClick}
              showSpecs={true}
              showBuyButton={true}
            />
          ))}
        </div>
      </div>

      {selectedProduct && (
        <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalImageContainer}>
              <ProductImage
                image={selectedProduct.image}
                alt={selectedProduct.name}
                style={{ 
                  width: '300px', 
                  height: '300px', 
                  objectFit: 'contain' 
                }}
                stylesCustom={{ 
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center'
                }}
              />
            </div>
            <div className={styles.modalContent}>
              <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
              <div className={styles.modalSpecs}>
                {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                  <div key={key} className={styles.modalSpec}>
                    <span className={styles.modalSpecLabel}>{key}</span>
                    <span className={styles.modalSpecValue}>{value}</span>
                  </div>
                ))}
              </div>
              <div className={styles.modalPrice}>
                {formatPrice(selectedProduct.price)}
              </div>
              <div className={styles.modalInstallments}>
                Em até 10x de {formatPrice(selectedProduct.price / 10)} sem juros
              </div>
              <button 
                className={styles.modalBuyButton}
                onClick={() => handleModalBuy(selectedProduct)}
              >
                Adicionar ao Carrinho
              </button>
            </div>
            <button 
              className={styles.modalCloseButton}
              onClick={() => setSelectedProduct(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
