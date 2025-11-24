"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import styles from './styles.module.scss';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaIdCard,
  FaAddressCard,
  FaCalendarAlt,
  FaHome,
  FaBuilding,
  FaMapPin
} from 'react-icons/fa';

interface UserData {
  nomeCompleto: string;
  email: string;
  telefone: string;
  endereco: string;
  cpf: string;
  rg: string;
  cidade: string;
  estado: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  dataNascimento: string;
  uf: string;
}

export default function Perfil() {
  const { user } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const dados = getFirestore(db.app);
        const userDoc = doc(dados, "users", user.uid);
        const userSnapshot = await getDoc(userDoc);
        
        if (userSnapshot.exists()) {
          const data = userSnapshot.data() as UserData;
          setUserData(data);
          setEditedData(data);
          console.log(data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        setMessage({ text: 'Erro ao carregar dados do usuário', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, router]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(userData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(userData);
  };

  const handleSave = async () => {
    if (!user || !editedData) return;

    try {
      const dados = getFirestore(db.app);
      const userDoc = doc(dados, "users", user.uid);
      await updateDoc(userDoc, editedData as any);
      
      setUserData(editedData);
      setIsEditing(false);
      setMessage({ text: 'Dados atualizados com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      setMessage({ text: 'Erro ao atualizar dados', type: 'error' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedData) return;
    
    const { name, value } = e.target;
    setEditedData(prev => prev ? { ...prev, [name]: value } : null);
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (!userData) {
    return <div className={styles.error}>Dados não encontrados</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Meu Perfil</h1>
        {!isEditing ? (
          <button className={styles.editButton} onClick={handleEdit}>
            <FaEdit /> Editar Perfil
          </button>
        ) : (
          <div className={styles.editButtons}>
            <button className={styles.saveButton} onClick={handleSave}>
              <FaSave /> Salvar
            </button>
            <button className={styles.cancelButton} onClick={handleCancel}>
              <FaTimes /> Cancelar
            </button>
          </div>
        )}
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.profileContent}>
        <div className={styles.profileSection}>
          <h2>Informações Pessoais</h2>
          <div className={styles.field}>
            <label>
              <FaUser /> Nome Completo
            </label>
            {isEditing ? (
              <input
                type="text"
                name="nomeCompleto"
                value={editedData?.nomeCompleto || ''}
                onChange={handleInputChange}
              />
            ) : (
              <p>{userData.nomeCompleto}</p>
            )}
          </div>

          <div className={styles.field}>
            <label>
              <FaEnvelope /> E-mail
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={editedData?.email || ''}
                onChange={handleInputChange}
              />
            ) : (
              <p>{userData.email}</p>
            )}
          </div>

          <div className={styles.field}>
            <label>
              <FaPhone /> Telefone
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="telefone"
                value={editedData?.telefone || ''}
                onChange={handleInputChange}
              />
            ) : (
              <p>{userData.telefone}</p>
            )}
          </div>

          <div className={styles.field}>
            <label>
              <FaIdCard /> CPF
            </label>
            {isEditing ? (
              <input
                type="text"
                name="cpf"
                value={editedData?.cpf || ''}
                onChange={handleInputChange}
              />
            ) : (
              <p>{userData.cpf}</p>
            )}
          </div>

          <div className={styles.field}>
            <label>
              <FaAddressCard /> RG
            </label>
            {isEditing ? (
              <input
                type="text"
                name="rg"
                value={editedData?.rg || ''}
                onChange={handleInputChange}
              />
            ) : (
              <p>{userData.rg}</p>
            )}
          </div>

          <div className={styles.field}>
            <label>
              <FaCalendarAlt /> Data de Nascimento
            </label>
            {isEditing ? (
              <input
                type="date"
                name="dataNascimento"
                value={editedData?.dataNascimento || ''}
                onChange={handleInputChange}
              />
            ) : (
              <p>{userData.dataNascimento}</p>
            )}
          </div>
        </div>

        <div className={styles.profileSection}>
          <h2>Endereço</h2>
          <div className={styles.field}>
            <label>
              <FaHome /> Rua
            </label>
            {isEditing ? (
              <input
                type="text"
                name="rua"
                value={editedData?.rua || ''}
                onChange={handleInputChange}
              />
            ) : (
              <p>{userData.rua}</p>
            )}
          </div>

          <div className={styles.addressGrid}>
            <div className={styles.field}>
              <label>
                <FaMapMarkerAlt /> Número
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="numero"
                  value={editedData?.numero || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{userData.numero}</p>
              )}
            </div>

            <div className={styles.field}>
              <label>
                <FaBuilding /> Complemento
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="complemento"
                  value={editedData?.complemento || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{userData.complemento || 'Não informado'}</p>
              )}
            </div>

            <div className={styles.field}>
              <label>
                <FaMapPin /> Bairro
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="bairro"
                  value={editedData?.bairro || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{userData.bairro}</p>
              )}
            </div>
          </div>

          <div className={styles.addressGrid}>
            <div className={styles.field}>
              <label>
                <FaMapMarkerAlt /> Cidade
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="cidade"
                  value={editedData?.cidade || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{userData.cidade}</p>
              )}
            </div>

            <div className={styles.field}>
              <label>
                <FaMapMarkerAlt /> Estado
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="estado"
                  value={editedData?.estado || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{userData.estado}</p>
              )}
            </div>

            <div className={styles.field}>
              <label>
                <FaMapMarkerAlt /> CEP
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="cep"
                  value={editedData?.cep || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{userData.cep}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 