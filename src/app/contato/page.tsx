"use client";
import React, { useState } from 'react';
import { FaFacebook, FaInstagram, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import { saveContactMessage } from '@/services/contactService';
import styles from './styles.module.scss';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await saveContactMessage(formData);
      
      setMessage({
        text: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
        type: 'success'
      });
      
      // Limpar o formulário
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessage({
        text: 'Erro ao enviar mensagem. Por favor, tente novamente.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.contactInfo}>
          <h1>Entre em Contato</h1>
          <p>Estamos aqui para ajudar! Entre em contato conosco através dos canais abaixo ou preencha o formulário.</p>
          
          <div className={styles.infoItems}>
            <div className={styles.infoItem}>
              <FaPhone />
              <div>
                <h3>Telefone</h3>
                <p>(11) 99999-9999</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <FaWhatsapp />
              <div>
                <h3>WhatsApp</h3>
                <p>(11) 99999-9999</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <FaEnvelope />
              <div>
                <h3>Email</h3>
                <p>contato@duqueloja.com</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <FaMapMarkerAlt />
              <div>
                <h3>Endereço</h3>
                <p>Rua Exemplo, 123 - São Paulo, SP</p>
              </div>
            </div>
          </div>

          <div className={styles.socialMedia}>
            <h3>Redes Sociais</h3>
            <div className={styles.socialLinks}>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={`${styles.socialLink} ${styles.facebook}`}>
                <FaFacebook />
                <span>Facebook</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={`${styles.socialLink} ${styles.instagram}`}>
                <FaInstagram />
                <span>Instagram</span>
              </a>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className={`${styles.socialLink} ${styles.whatsapp}`}>
                <FaWhatsapp />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        <div className={styles.contactForm}>
          <h2>Envie uma Mensagem</h2>
          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Nome</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Seu nome completo"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="subject">Assunto</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="Assunto da mensagem"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Mensagem</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Digite sua mensagem"
                rows={5}
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 