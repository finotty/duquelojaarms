"use client";
import { useCustomSections } from "@/hooks/useCustomSections";
import { ProductSection } from "../product-section";

export function CustomSections() {
  const { customSections, loading, error } = useCustomSections();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#ffec70' }}>
      Carregando seções personalizadas...
    </div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
      Erro ao carregar seções personalizadas
    </div>;
  }

  if (!customSections.length) {
    return null;
  }

  return (
    <>
      {customSections.map((section) => (
        <ProductSection
          key={section.id}
          sectionName={section.name}
          displayLocation={section.name}
          title={section.name}
          subtitle={`Produtos selecionados da seção ${section.name}`}
          viewAllHref={`/secoes/${encodeURIComponent(section.name)}`}
        />
      ))}
    </>
  );
}
