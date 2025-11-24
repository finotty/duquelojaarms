import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import styles from '../styles.module.scss';
import { FaEnvelope, FaEnvelopeOpen, FaReply, FaTrash } from 'react-icons/fa';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: any;
  status: 'pending' | 'read' | 'replied';
}

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const messagesQuery = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(messagesQuery);
      const messagesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContactMessage[];
      setMessages(messagesData);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (messageId: string, newStatus: 'read' | 'replied') => {
    try {
      const messageRef = doc(db, 'contacts', messageId);
      await updateDoc(messageRef, { status: newStatus });
      await fetchMessages();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <FaEnvelopeOpen color="#4CAF50" />;
      case 'replied':
        return <FaReply color="#2196F3" />;
      default:
        return <FaEnvelope color="#FFC107" />;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const confirmed = window.confirm('Tem certeza que deseja excluir esta mensagem?');
      if (!confirmed) return;
      await deleteDoc(doc(db, 'contacts', messageId));
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setShowModal(false);
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando mensagens...</div>;
  }

  return (
    <div className={styles.contactMessages}>
      <h2>Mensagens de Contato</h2>
      
      <div className={styles.messagesList}>
        {messages.length === 0 ? (
          <p className={styles.noMessages}>Nenhuma mensagem recebida.</p>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`${styles.messageCard} ${message.status === 'pending' ? styles.pending : ''}`}
              onClick={() => {
                setSelectedMessage(message);
                setShowModal(true);
                if (message.status === 'pending') {
                  handleStatusChange(message.id, 'read');
                }
              }}
            >
              <div className={styles.messageHeader}>
                <div className={styles.messageInfo}>
                  <span className={styles.messageSubject}>{message.subject}</span>
                  <span className={styles.messageDate}>{formatDate(message.createdAt)}</span>
                </div>
                <div className={styles.messageStatus}>
                  {getStatusIcon(message.status)}
                </div>
              </div>
              <div className={styles.messagePreview}>
                <p><strong>De:</strong> {message.name} ({message.email})</p>
                <p className={styles.messageText}>{message.message.substring(0, 100)}...</p>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && selectedMessage && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{selectedMessage.subject}</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.messageDetailsContainer}>
                <div className={styles.messageDetails}>
                  <p><strong>De:</strong> {selectedMessage.name}</p>
                  <p><strong>Email:</strong> {selectedMessage.email}</p>
                  <p><strong>Data:</strong> {formatDate(selectedMessage.createdAt)}</p>
                  <p><strong>Status:</strong> {
                    selectedMessage.status === 'pending' ? 'Pendente' :
                    selectedMessage.status === 'read' ? 'Lida' : 'Respondida'
                  }</p>
                </div>
                

              <div className={styles.messageActions}>
              
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                >
                  <FaTrash /> Excluir
                </button>
              </div>
              </div>
                <div className={styles.messageBody}>
                  <h4>Mensagem:</h4>
                  <p>{selectedMessage.message}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 