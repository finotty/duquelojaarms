"use client";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export interface CustomSection {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
}

export function useCustomSections() {
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomSections = async () => {
    try {
      setLoading(true);
      const customSectionsRef = collection(db, "customSections");
      const customSectionsSnapshot = await getDocs(customSectionsRef);
      const sections = customSectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as CustomSection[];
      
      setCustomSections(sections);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar seções personalizadas");
      console.error('Erro ao buscar seções personalizadas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomSections();
  }, []);

  return {
    customSections,
    loading,
    error,
    refreshSections: fetchCustomSections
  };
}
