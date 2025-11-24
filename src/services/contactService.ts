import { db } from '@/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}

export const saveContactMessage = async (messageData: Omit<ContactMessage, 'createdAt'>) => {
  try {
    const contactRef = collection(db, 'contacts');
    const docRef = await addDoc(contactRef, {
      ...messageData,
      createdAt: serverTimestamp(),
      status: 'pending' // pending, read, replied
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
    throw error;
  }
}; 