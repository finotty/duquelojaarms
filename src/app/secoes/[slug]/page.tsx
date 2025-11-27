"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import styles from "./styles.module.scss";

export default function CustomSectionPage() {
  const params = useParams<{ slug: string }>();
  const sectionKey = decodeURIComponent(params.slug);
  const { products, loading } = useProducts(sectionKey);
  const { user, setRedirectPath } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);

  if (loading) {
    return <div className={styles.loading}>Carregando {sectionKey}...</div>;
  }

  if (!products.length) {
    return (
      <div className={styles.emptyState}>
        Nenhum produto encontrado para {sectionKey}.
      </div>
    );
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
      id: product.id,
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
        <h1 className={styles.title}>{sectionKey}</h1>
        <p className={styles.subtitle}>
          Produtos selecionados especialmente para esta seção.
        </p>
      </div>
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductClick={() => handleProductClick(product)}
            showSpecs={true}
            showBuyButton={true}
          />
        ))}
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


