"use client";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import styles from "./styles.module.scss";

export default function DestaquesPage() {
  const { products, loading } = useProducts('destaques');

  if (loading) {
    return <div className={styles.loading}>Carregando produtos...</div>;
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>Produtos em Destaque</h1>
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductClick={() => {}}
            showSpecs={true}
            showBuyButton={true}
          />
        ))}
      </div>
    </section>
  );
}


