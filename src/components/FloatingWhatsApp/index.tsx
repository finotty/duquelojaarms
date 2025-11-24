"use client";

import { FaWhatsapp } from 'react-icons/fa';
import styles from './styles.module.scss';

export default function FloatingWhatsApp() {
  const phoneNumber = '5511999999999'; // Substitua pelo número correto
  const message = 'Olá! Gostaria de mais informações.'; // Mensagem padrão

  const handleClick = () => {
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button 
      className={styles.whatsappButton}
      onClick={handleClick}
      title="Fale conosco pelo WhatsApp"
    >
      <FaWhatsapp />
      {
        /*
        <span>Fale conosco</span>
        */
        }
    </button>
  );
} 