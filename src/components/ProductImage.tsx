import React, { useMemo, useEffect, useState } from 'react';

interface ProductImageProps {
  image: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  stylesCustom?: React.CSSProperties;
}

function svgToDataUrl(svg: string) {
  // Remove quebras de linha e espaços extras
  const cleaned = svg.replace(/\n/g, '').replace(/\s{2,}/g, ' ');
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(cleaned);
}

const ProductImage: React.FC<ProductImageProps> = ({ image, alt, className, style, stylesCustom }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateBreakpoint = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.innerWidth <= 768);
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  const mobileImageStyle: React.CSSProperties | undefined = isMobile
    ? {
        maxWidth: 200,
        maxHeight: 200,
        width: '85%',
        height: 'auto'
      }
    : undefined;
  // Memoiza o data URL do SVG para evitar recálculos durante o render
  const dataUrl = useMemo(() => {
    if (!image || typeof image !== 'string') {
      return null;
    }
    if (image.trim().startsWith('<svg')) {
      return svgToDataUrl(image);
    }
    return null;
  }, [image]);

  if (dataUrl) {
    return (
      <img
        src={dataUrl}
        alt={alt}
        className={className}
        style={{
          maxWidth: 180,
          maxHeight: 180,
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
          margin: '0 auto 6px auto',
          ...style,
          ...stylesCustom,
          ...mobileImageStyle
        }}
      />
    );
  } else {
    // É uma URL normal
    if (!image) {
      return null;
    }
    return (
      <img
        src={image}
        alt={alt}
        className={className}
        style={{
          maxWidth: 480,
          maxHeight: 480,
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
          margin: '0 auto 6px auto',
          borderRadius: '10px',
          ...style,
          ...mobileImageStyle
        }}
      />
    );
  }
};

export default ProductImage; 