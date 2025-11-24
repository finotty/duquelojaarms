"use client";
import { useParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import styles from "./styles.module.scss";

export default function CustomSectionPage() {
  const params = useParams<{ slug: string }>();
  const sectionKey = decodeURIComponent(params.slug);
  const { products, loading } = useProducts(sectionKey);

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
            onProductClick={() => {}}
            showSpecs={true}
            showBuyButton={true}
          />
        ))}
      </div>
    </section>
  );
}


