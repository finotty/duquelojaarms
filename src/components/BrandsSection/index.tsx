"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './styles.module.scss';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Brand {
  name: string;
  image: string;
}
const brands: Brand[] = [
  { name: 'Beretta', image: '/img/marcas/beretta-firearms.jpg' },
  { name: 'Glock', image: '/img/marcas/glock.jpg' },
  { name: 'Taurus', image: '/img/marcas/taurus.jpg' },
  { name: 'Huglu', image: '/img/marcas/huglu.jpg' },
  { name: 'CZ', image: '/img/marcas/cz.jpg' },
  { name: 'Tanfoglio', image: '/img/marcas/tanfoglio.jpg' },
  { name: 'Eternal Shotguns', image: '/img/marcas/eternal-shotguns.jpg' },
  { name: 'Rossi', image: '/img/marcas/rossi.jpg' },
  { name: 'CBC', image: '/img/marcas/cbc.jpg' },
  { name: 'Mossberg', image: '/img/marcas/mossberg.jpg' },
  { name: 'Smith & Wesson', image: '/img/marcas/smith-and-wesson.jpg' },
  { name: 'Walther', image: '/img/marcas/walther.jpg' },
  { name: 'Keltec', image: '/img/marcas/keltec.jpg' },
  { name: 'Alfa Proj', image: '/img/marcas/alfa-proj.jpg' },
];

export default function BrandsSection() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);
        
        // Obter marcas únicas dos produtos
        const uniqueBrands = new Set<string>();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.marca) {
            uniqueBrands.add(data.marca);
          }
        });

        // Mapear as marcas para o formato necessário
        const brandsData = Array.from(uniqueBrands).map(brandName => ({
          name: brandName,
          image: `/img/marcas/${brandName.toLowerCase().replace(/\s+/g, '-')}.jpg`
        }));

        setBrands(brandsData);
      } catch (error) {
        console.error('Erro ao buscar marcas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const handleBrandClick = (brandName: string) => {
    const formattedBrandName = brandName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/marca/${formattedBrandName}`);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando marcas...</div>;
  }

  if (brands.length === 0) {
    return null;
  }

  return (
    <section className={styles.brandsSection}>
      <h2>Comprar por Marcas</h2>
      <div className={styles.scrollContainer}>
        <button 
          className={`${styles.scrollButton} ${styles.leftButton}`}
          onClick={() => scroll('left')}
        >
          <FaChevronLeft />
        </button>
        <div className={styles.brandsScroll} ref={scrollRef}>
          {brands.map((brand) => (
            <div
              key={brand.name}
              className={styles.brandCard}
              onClick={() => handleBrandClick(brand.name)}
            >
              <img src={brand.image} alt={brand.name} className={styles.brandImage} />
            </div>
          ))}
        </div>
        <button 
          className={`${styles.scrollButton} ${styles.rightButton}`}
          onClick={() => scroll('right')}
        >
          <FaChevronRight />
        </button>
      </div>
    </section>
  );
} 