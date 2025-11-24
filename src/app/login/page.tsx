"use client";
import { useState, useEffect } from "react";
import styles from "./styles.module.scss";
import Image from "next/image";
import logo from "../../../public/img/Frame 99.png";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../context/FavoritesContext";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { signIn, user } = useAuth();
  const { addToCart } = useCart();
  const { addToFavorites } = useFavorites();
  const router = useRouter();

  useEffect(() => {
    const handlePostLogin = async () => {
      if (user && isLoggingIn) {
        try {
          // Verificar se há um produto pendente no localStorage
          const pendingProduct = localStorage.getItem('pendingProduct');
          if (pendingProduct) {
            // Adicionar o produto ao carrinho
            addToCart(JSON.parse(pendingProduct));
            // Limpar o produto pendente
            localStorage.removeItem('pendingProduct');
            // Redirecionar para o carrinho
            router.push('/carrinho');
            setIsLoggingIn(false);
            return;
          }

          // Verificar se há um favorito pendente no localStorage
          const pendingFavorite = localStorage.getItem('pendingFavorite');
          if (pendingFavorite) {
            await addToFavorites(pendingFavorite);
            localStorage.removeItem('pendingFavorite');
          }

          setIsLoggingIn(false);
        } catch (error) {
          console.error('Erro ao processar ações pós-login:', error);
          setIsLoggingIn(false);
        }
      }
    };

    handlePostLogin();
  }, [user, isLoggingIn, addToCart, addToFavorites, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoggingIn(true);
    
    try {
      await signIn(email, senha);
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError(
        error.code === "auth/invalid-credential"
          ? "E-mail ou senha inválidos"
          : "Erro ao fazer login. Tente novamente."
      );
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.logoArea}>
          <Image src={logo} alt="Logo" width={260} height={60} quality={100} />
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.loginButton}>
            Entrar
          </button>
          <div className={styles.links}>
            <a href="#">Esqueceu a senha?</a>
            <Link href="/register">Criar conta</Link>
          </div>
        </form>
      </div>
    </div>
  );
} 