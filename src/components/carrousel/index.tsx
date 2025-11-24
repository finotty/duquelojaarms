'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './Carousel.module.scss';
import { FaAngleLeft , FaAngleRight} from "react-icons/fa6";

interface CarouselItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  image?: string;
}

const carouselItems: CarouselItem[] = [
  {
    id: 1,
    title: 'Acessórios que Fazem a Diferença',
    subtitle: 'Equipamentos táticos de última geração',
    description: 'Aumente a eficiência e precisão de suas armas com nossa linha premium de acessórios.',
    buttonText: 'Explorar acessórios',
    buttonLink: '/acessorios',
  },
  {
    id: 2,
    title: 'Armamentos de Precisão',
    subtitle: 'Para profissionais exigentes',
    description: 'Conheça nossa linha completa de armamentos de alta precisão e desempenho superior.',
    buttonText: 'Ver armamentos',
    buttonLink: '/armamentos',
  },
  {
    id: 3,
    title: 'Treinamento Especializado',
    subtitle: 'Aperfeiçoe suas habilidades',
    description: 'Oferecemos cursos e simuladores para todos os níveis de experiência.',
    buttonText: 'Conhecer cursos',
    buttonLink: '/treinamento',
  },
  {
    id: 4,
    title: 'Equipamentos de Proteção',
    subtitle: 'Segurança em primeiro lugar',
    description: 'Coletes, óculos e proteção auditiva da mais alta qualidade para sua segurança.',
    buttonText: 'Ver equipamentos',
    buttonLink: '/protecao',
  },
  {
    id: 5,
    title: 'Munições Especiais',
    subtitle: 'Performance consistente',
    description: 'Munições de precisão para treinamento e uso tático profissional.',
    buttonText: 'Explorar munições',
    buttonLink: '/municoes',
  },
  {
    id: 6,
    title: 'Kits Táticos Completos',
    subtitle: 'Tudo que você precisa',
    description: 'Conjuntos completos de equipamentos táticos para profissionais e entusiastas.',
    buttonText: 'Ver kits',
    buttonLink: '/kits',
  },
];

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1));
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    // Ao clicar em um indicador, limpe o intervalo atual e reinicie
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentSlide(index);
    startAutoRotation();
  };

  const startAutoRotation = () => {
    // Limpa qualquer intervalo existente antes de criar um novo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Cria um novo intervalo
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1));
    }, 5000);
  };

  useEffect(() => {
    // Inicia a rotação automática quando o componente é montado
    startAutoRotation();
    
    // Limpa o intervalo quando o componente é desmontado
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <section className={styles.carousel}>
      <button className={styles.navButton} onClick={goToPrevSlide} aria-label="Slide anterior">
       {/**<span className={styles.arrowLeft}>&#8592;</span> */ }
        <FaAngleLeft size={40} color='#ffffff'/>
      </button>

      <div className={styles.slide}>
        <div className={styles.slideContent}>
          <h2 className={styles.slideTitle}>{carouselItems[currentSlide].title}</h2>
          <p className={styles.slideSubtitle}>{carouselItems[currentSlide].subtitle}</p>
          <p className={styles.slideDescription}>{carouselItems[currentSlide].description}</p>
          <Link href={carouselItems[currentSlide].buttonLink} className={styles.slideButton}>
            {carouselItems[currentSlide].buttonText} →
          </Link>
        </div>
      </div>

      <button className={`${styles.navButton} ${styles.nextButton}`} onClick={goToNextSlide} aria-label="Próximo slide">
        {/*<span className={styles.arrowRight}>&#8594;</span>*/}
        <FaAngleRight size={40} color='#ffffff'/>
      </button>

      <div className={styles.indicators}>
        {carouselItems.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === currentSlide ? styles.active : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
} 