"use client";

import React, { useState } from "react";
import styles from "./styles.module.scss"; // Este arquivo de estilos será criado
import { useRouter } from 'next/navigation';
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    sexo: '',
    telefone: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    termosAceitos: false,
    cep: '',
    uf: '',
    cidade: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Se o usuário já estiver logado, redireciona para o carrinho
  if (!authLoading && user) {
      router.push('/carrinho');
      return null; // ou um loading spinner/mensagem
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (!formData.termosAceitos) {
        setError('Você deve aceitar os Termos de Uso e Política de Privacidade.');
        setLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        nomeCompleto: formData.nomeCompleto,
        cpf: formData.cpf,
        rg: formData.rg,
        dataNascimento: formData.dataNascimento,
        sexo: formData.sexo,
        telefone: formData.telefone,
        cep: formData.cep,
        uf: formData.uf,
        cidade: formData.cidade,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
      });

      // Redirecionar para o carrinho após o cadastro
      router.push('/carrinho');

    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

   if (authLoading) {
    return <div className={styles.loading}>Carregando...</div>; // Mostra loading enquanto verifica auth
   }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1>Cadastre-se</h1>
        <form onSubmit={handleRegister} className={styles.registerForm}>
          <h2><span className={styles.stepIndicator}>1</span> Dados Pessoais</h2>
          <p>Preencha seus dados pessoais para criar sua conta</p>

          <div className={styles.formGroup}>
            <label htmlFor="nomeCompleto">Nome Completo*</label>
            <input type="text" id="nomeCompleto" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleInputChange} required placeholder="Nome completo"/>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label htmlFor="cpf">CPF*</label>
                <input type="text" id="cpf" name="cpf" value={formData.cpf} onChange={handleInputChange} required placeholder="000.000.000-00"/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="rg">RG*</label>
                <input type="text" id="rg" name="rg" value={formData.rg} onChange={handleInputChange} required placeholder="00.000.000-0"/>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label htmlFor="dataNascimento">Data de Nascimento*</label>
                <input type="date" id="dataNascimento" name="dataNascimento" value={formData.dataNascimento} onChange={handleInputChange} required placeholder="dd/mm/aaaa"/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="sexo">Sexo*</label>
                <select id="sexo" name="sexo" value={formData.sexo} onChange={handleInputChange} required>
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                </select>
            </div>
          </div>
          <div className={styles.formGroup}>
              <label htmlFor="telefone">Telefone*</label>
              <input type="text" id="telefone" name="telefone" value={formData.telefone} onChange={handleInputChange} required placeholder="(00) 00000-0000"/>
          </div>
          <div className={styles.formGroup}>
              <label htmlFor="email">E-mail*</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="seu@email.com"/>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="senha">Senha*</label>
              <input type="password" id="senha" name="senha" value={formData.senha} onChange={handleInputChange} required placeholder="Crie uma senha"/>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmarSenha">Confirmar Senha*</label>
              <input type="password" id="confirmarSenha" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleInputChange} required placeholder="Confirme sua senha"/>
            </div>
          </div>

          <h2><span className={styles.stepIndicator}>2</span> Endereço de Entrega</h2>
          <p>Informe seu endereço para entrega</p>

          <div className={styles.formGroup}>
            <label htmlFor="cep">CEP*</label>
            <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleInputChange} required placeholder="00000-000"/>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label htmlFor="uf">UF*</label>
                <select id="uf" name="uf" value={formData.uf} onChange={handleInputChange} required>
                    <option value="">UF</option>
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AP">AP</option>
                    <option value="AM">AM</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MT">MT</option>
                    <option value="MS">MS</option>
                    <option value="MG">MG</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PR">PR</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RS">RS</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="SC">SC</option>
                    <option value="SP">SP</option>
                    <option value="SE">SE</option>
                    <option value="TO">TO</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="cidade">Cidade*</label>
                <input type="text" id="cidade" name="cidade" value={formData.cidade} onChange={handleInputChange} required placeholder="Cidade"/>
            </div>
          </div>
          <div className={styles.formGroup}>
              <label htmlFor="rua">Rua*</label>
              <input type="text" id="rua" name="rua" value={formData.rua} onChange={handleInputChange} required placeholder="Nome da rua"/>
          </div>
          <div className={styles.formRow}>
              <div className={styles.formGroup}>
                  <label htmlFor="numero">Número*</label>
                  <input type="text" id="numero" name="numero" value={formData.numero} onChange={handleInputChange} required placeholder="Número"/>
              </div>
              <div className={styles.formGroup}>
                  <label htmlFor="complemento">Complemento</label>
                  <input type="text" id="complemento" name="complemento" value={formData.complemento} onChange={handleInputChange} placeholder="Apto, Bloco, etc."/>
              </div>
          </div>
          <div className={styles.formGroup}>
              <label htmlFor="bairro">Bairro*</label>
              <input type="text" id="bairro" name="bairro" value={formData.bairro} onChange={handleInputChange} required placeholder="Bairro"/>
          </div>

          <div className={styles.termsCheckbox}>
              <input type="checkbox" id="termosAceitos" name="termosAceitos" checked={formData.termosAceitos} onChange={handleInputChange} required/>
              <label htmlFor="termosAceitos">Eu concordo com os <a href="#">Termos de Uso</a> e <a href="#">Política de Privacidade</a>.</label>
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.formActions}>
              <button type="button" className={styles.backButton} onClick={() => router.push('/carrinho')}>← Voltar para o Carrinho</button>
              <button type="submit" className={styles.continueButton} disabled={loading}>
                  {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
} 