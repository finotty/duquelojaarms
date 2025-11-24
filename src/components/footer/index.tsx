import React from "react";
import styles from "./styles.module.scss";
import { FaPhoneAlt, FaWhatsapp, FaEnvelope, FaClock, FaQuestionCircle, FaFacebookF, FaInstagram, FaTwitter, FaCcMastercard, FaCcVisa } from "react-icons/fa";
import { SiPix } from "react-icons/si";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.topSection}>
        <div className={styles.col}>
          <h3>Atendimento ao Cliente</h3>
          <ul>
            <li><FaPhoneAlt className={styles.icon} /> (00) 5555-555</li>
            <li><FaWhatsapp className={styles.icon} /> WhatsApp: (00) 99999-9999</li>
            <li><FaEnvelope className={styles.icon} /> Email: exemplo@exemplo.com</li>
            <li><FaClock className={styles.icon} /> Segunda a Sexta: 9h às 18h</li>
            <li><FaQuestionCircle className={styles.icon} /> Perguntas Frequentes</li>
          </ul>
        </div>
        <div className={styles.col}>
          <h3>Links Rápidos</h3>
          <ul>
            <li>Política de Privacidade</li>
            <li>Termos de Uso</li>
            <li>Devolução e Trocas</li>
            <li>Sobre Nós</li>
            <li>Documentação Necessária</li>
            <li>Como Comprar</li>
            <li>Rastreamento de Pedidos</li>
          </ul>
        </div>
        <div className={styles.col}>
          <h3>Redes Sociais</h3>
          <div className={styles.socials}>
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaTwitter /></a>
            <a href="#"><FaWhatsapp /></a>
          </div>
          <h3 className={styles.paymentTitle}>Formas de pagamento</h3>
          <div className={styles.payments}>
            <FaCcMastercard />
            <FaCcVisa />
            <SiPix />
          </div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <span>2025 Armas de Precisão. Todos os direitos reservados.</span>
        <span>CNPJ: 00.000.000/0001-00</span>
      </div>
    </footer>
  );
}
