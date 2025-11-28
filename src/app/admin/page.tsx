"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { preConfiguredProducts, tacticalEquipment, Product, sportEquipment } from "../../data/products";
import { db } from "../../config/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import styles from "./styles.module.scss";
import { FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import ContactMessages from './components/ContactMessages';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from "firebase/firestore";
import ProductImage from "../../components/ProductImage";



export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [price, setPrice] = useState("");
  const [displayLocation, setDisplayLocation] = useState<string>('header');
  const [message, setMessage] = useState({ text: "", type: "" });
  const [registeredProducts, setRegisteredProducts] = useState<Product[]>([]);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [searchSection, setSearchSection] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<'preConfigured' | 'tactical' | 'esportivos'>('preConfigured');
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductData, setCustomProductData] = useState<Partial<Product>>({
    name: '',
    marca: '',
    image: '',
    category: 'pistolas',
    specifications: {},
  });
  const [showCustomProductModal, setShowCustomProductModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [productSelectSearch, setProductSelectSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement | null>(null);
  const productSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderDateStart, setOrderDateStart] = useState('');
  const [orderDateEnd, setOrderDateEnd] = useState('');
  
  // Novo estado para controlar qual seção está ativa
  const [activeSection, setActiveSection] = useState<'pedidos' | 'cadastrar' | 'produtos' | 'secoes' | 'avaliacoes'>('pedidos');
  
  // Estados para avaliações
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  
  // Estados para seções personalizadas
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [customSectionName, setCustomSectionName] = useState('');
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [customSectionsData, setCustomSectionsData] = useState<Array<{id: string, name: string}>>([]);
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [productsInSection, setProductsInSection] = useState<Product[]>([]);
  const [targetSectionForMove, setTargetSectionForMove] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && !isAdmin) {
      router.push("/");
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    fetchRegisteredProducts();
    fetchCustomSections();
    if (activeSection === 'avaliacoes') {
      fetchReviews();
    }
  }, [activeSection]);

  // Função para buscar seções personalizadas do Firebase
  const fetchCustomSections = async () => {
    try {
      const customSectionsRef = collection(db, "customSections");
      const customSectionsSnapshot = await getDocs(customSectionsRef);
      const sections = customSectionsSnapshot.docs.map(doc => doc.data().name);
      const sectionsData = customSectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setCustomSections(sections);
      setCustomSectionsData(sectionsData);
    } catch (error) {
      console.error("Erro ao buscar seções personalizadas:", error);
    }
  };

  // Função para buscar todas as avaliações
  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const reviewsRef = collection(db, "reviews");
      const reviewsSnapshot = await getDocs(reviewsRef);
      const reviewsData = reviewsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          productId: data.productId || '',
          productName: data.productName || '',
          userId: data.userId || '',
          userName: data.userName || '',
          rating: data.rating || 0,
          comment: data.comment || '',
          createdAt: data.createdAt || Timestamp.now()
        };
      });
      // Ordenar por data (mais recentes primeiro)
      const sortedReviews = reviewsData.sort((a, b) => {
        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      setReviews(sortedReviews);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
      setMessage({ text: "Erro ao buscar avaliações", type: "error" });
    } finally {
      setReviewsLoading(false);
    }
  };

  // Função para excluir avaliação
  const deleteReview = async (reviewId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) {
      return;
    }
    
    try {
      const reviewDoc = doc(db, "reviews", reviewId);
      await deleteDoc(reviewDoc);
      setReviews(reviews.filter(r => r.id !== reviewId));
      setMessage({ text: "Avaliação excluída com sucesso!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Erro ao excluir avaliação:", error);
      setMessage({ text: "Erro ao excluir avaliação", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  // Função para criar uma nova seção personalizada
  const createCustomSection = async (sectionName: string) => {
    try {
      // Verificar se a seção já existe
      if (customSections.includes(sectionName)) {
        setMessage({ text: "Esta seção já existe!", type: "error" });
        return false;
      }

      // Criar a seção no Firebase
      const docRef = await addDoc(collection(db, "customSections"), {
        name: sectionName,
        createdAt: new Date(),
        createdBy: user?.email
      });

      // Atualizar a lista local
      setCustomSections([...customSections, sectionName]);
      setCustomSectionsData([...customSectionsData, { id: docRef.id, name: sectionName }]);
      setMessage({ text: `Seção "${sectionName}" criada com sucesso!`, type: "success" });
      return true;
    } catch (error) {
      console.error("Erro ao criar seção personalizada:", error);
      setMessage({ text: "Erro ao criar seção personalizada", type: "error" });
      return false;
    }
  };

  // Função para verificar produtos em uma seção
  const getProductsInSection = (sectionName: string): Product[] => {
    return registeredProducts.filter(product => product.displayLocation === sectionName);
  };

  // Função para mover produtos para outra seção
  const moveProductsToSection = async (products: Product[], targetSection: string) => {
    try {
      for (const product of products) {
        if (!product.firestoreId) continue;
        
        // Verificar se o produto está em 'products' ou 'customProducts'
        const productRefProducts = doc(db, "products", product.firestoreId);
        const productDocProducts = await getDoc(productRefProducts);
        
        if (productDocProducts.exists()) {
          await updateDoc(productRefProducts, { displayLocation: targetSection });
        } else {
          const productRefCustom = doc(db, "customProducts", product.firestoreId);
          const productDocCustom = await getDoc(productRefCustom);
          if (productDocCustom.exists()) {
            await updateDoc(productRefCustom, { displayLocation: targetSection });
          }
        }
      }
      
      // Atualizar lista de produtos
      await fetchRegisteredProducts();
      setMessage({ text: `Produtos movidos para "${targetSection}" com sucesso!`, type: "success" });
      return true;
    } catch (error) {
      console.error("Erro ao mover produtos:", error);
      setMessage({ text: "Erro ao mover produtos", type: "error" });
      return false;
    }
  };

  // Função para excluir seção personalizada
  const handleDeleteSection = async (sectionName: string) => {
    try {
      // Verificar se há produtos na seção
      const products = getProductsInSection(sectionName);
      
      if (products.length > 0) {
        // Se houver produtos, mostrar modal
        setSectionToDelete(sectionName);
        setProductsInSection(products);
        setShowDeleteSectionModal(true);
        return;
      }
      
      // Se não houver produtos, excluir diretamente
      await deleteSectionFromFirebase(sectionName);
    } catch (error) {
      console.error("Erro ao excluir seção:", error);
      setMessage({ text: "Erro ao excluir seção", type: "error" });
    }
  };

  // Função para excluir seção do Firebase
  const deleteSectionFromFirebase = async (sectionName: string) => {
    try {
      // Primeiro, tentar encontrar no estado local
      let sectionId = customSectionsData.find(s => s.name === sectionName)?.id;
      
      // Se não encontrar no estado local, buscar diretamente no Firebase
      if (!sectionId) {
        const customSectionsRef = collection(db, "customSections");
        const customSectionsSnapshot = await getDocs(customSectionsRef);
        const sectionDoc = customSectionsSnapshot.docs.find(
          doc => doc.data().name === sectionName
        );
        
        if (!sectionDoc) {
          setMessage({ text: "Seção não encontrada no Firebase", type: "error" });
          return;
        }
        
        sectionId = sectionDoc.id;
      }

      // Excluir o documento
      await deleteDoc(doc(db, "customSections", sectionId));
      
      // Atualizar listas locais
      setCustomSections(customSections.filter(s => s !== sectionName));
      setCustomSectionsData(customSectionsData.filter(s => s.name !== sectionName));
      
      // Recarregar seções do Firebase para garantir sincronização
      await fetchCustomSections();
      
      setMessage({ text: `Seção "${sectionName}" excluída com sucesso!`, type: "success" });
      
      // Fechar modal se estiver aberto
      if (showDeleteSectionModal) {
        setShowDeleteSectionModal(false);
        setSectionToDelete(null);
        setProductsInSection([]);
        setTargetSectionForMove('');
      }
    } catch (error) {
      console.error("Erro ao excluir seção do Firebase:", error);
      setMessage({ 
        text: error instanceof Error ? error.message : "Erro ao excluir seção", 
        type: "error" 
      });
    }
  };

  // Função para confirmar exclusão após mover produtos
  const confirmDeleteAfterMove = async () => {
    if (!sectionToDelete) return;
    
    // Buscar produtos atualizados diretamente do Firestore para garantir verificação correta
    const updatedProductsQuery = await getDocs(collection(db, "products"));
    const updatedCustomQuery = await getDocs(collection(db, "customProducts"));
    
    const allUpdatedProducts = [
      ...updatedProductsQuery.docs.map(doc => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data()
      })),
      ...updatedCustomQuery.docs.map(doc => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data()
      }))
    ] as Product[];
    
    // Verificar se ainda há produtos na seção
    const remainingProducts = allUpdatedProducts.filter(
      product => product.displayLocation === sectionToDelete
    );
    
    if (remainingProducts.length > 0) {
      setMessage({ 
        text: `Ainda há ${remainingProducts.length} produto(s) nesta seção. Mova todos os produtos antes de excluir.`, 
        type: "error" 
      });
      setProductsInSection(remainingProducts);
      setRegisteredProducts(allUpdatedProducts);
      return;
    }
    
    // Excluir seção
    await deleteSectionFromFirebase(sectionToDelete);
  };

  const fetchRegisteredProducts = async () => {
    try {
      // Buscar produtos da coleção 'products'
      const querySnapshot = await getDocs(collection(db, "products"));
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data()
      })) as Product[];

      // Buscar produtos personalizados da coleção 'customProducts'
      const customSnapshot = await getDocs(collection(db, "customProducts"));
      const customProducts = customSnapshot.docs.map(doc => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data()
      })) as Product[];

      // Unir os dois arrays
      setRegisteredProducts([...products, ...customProducts]);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setMessage({ text: "Erro ao carregar produtos", type: "error" });
    }
  };

  const handleProductSelect = (productId: string) => {
    if (productId === 'custom') {
      setShowCustomProductModal(true);
      setSelectedProduct(null);
      setMessage({ text: '', type: '' });
      return;
    }
    setIsCustomProduct(false);
    const allProducts = [
      ...(selectedProductType === 'preConfigured' ? preConfiguredProducts : selectedProductType === 'tactical' ? tacticalEquipment : sportEquipment),
      ...customProducts.filter(p => p.category === (selectedProductType === 'preConfigured' ? 'pistolas' : selectedProductType === 'tactical' ? 'taticos' : 'esporte'))
    ];
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
      setSelectedProduct(null);
      return;
    }
    const isProductRegistered = registeredProducts.some(
      registeredProduct => registeredProduct.name === product.name
    );
    if (isProductRegistered) {
      setShowDuplicateModal(true);
      setSelectedProduct(null);
      return;
    }
    setSelectedProduct(product);
    setMessage({ text: '', type: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !price || (!displayLocation && !isCustomSection)) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    try {
      let finalDisplayLocation = displayLocation;
      
      // Se for uma seção personalizada, criar a seção primeiro
      if (isCustomSection && customSectionName.trim()) {
        const sectionCreated = await createCustomSection(customSectionName.trim());
        if (!sectionCreated) {
          return; // Se não conseguiu criar a seção, para aqui
        }
        finalDisplayLocation = customSectionName.trim();
      }

      const productData = {
        ...selectedProduct,
        price: parseFloat(price),
        displayLocation: finalDisplayLocation,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'products'), productData);
      setSelectedProduct(null);
      setPrice('');
      setDisplayLocation('header');
      setIsCustomSection(false);
      setCustomSectionName('');
      fetchRegisteredProducts();
      setMessage({ text: "Produto cadastrado com sucesso!", type: "success" });
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      setMessage({ text: "Erro ao cadastrar produto", type: "error" });
    }
  };

  const handleEdit = async () => {
    if (!selectedProductForEdit || !editPrice) return;

    try {
      console.log("Editando produto:", selectedProductForEdit);
      if (!selectedProductForEdit.firestoreId) {
        throw new Error("ID do documento não encontrado");
      }
      // Verifica se o produto é personalizado (customProducts) ou padrão (products)
      // Critério: se existe na lista customProducts
      const isCustom = customProducts.some(p => p.id === selectedProductForEdit.id);
      const collectionName = isCustom ? "customProducts" : "products";
      const productRef = doc(db, collectionName, selectedProductForEdit.firestoreId);
      await updateDoc(productRef, {
        price: Number(editPrice)
      });
      setMessage({ text: "Preço atualizado com sucesso!", type: "success" });
      setShowEditModal(false);
      setSelectedProductForEdit(null);
      setEditPrice("");
      fetchRegisteredProducts();
    } catch (error) {
      console.error("Erro ao atualizar preço:", error);
      setMessage({ text: "Erro ao atualizar preço", type: "error" });
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      setMessage({ text: "Excluindo produto...", type: "info" });
      
      // Encontra o produto pelo ID
      const product = registeredProducts.find(p => p.id === productId);
      if (!product || !product.firestoreId) {
        throw new Error("Produto não encontrado");
      }
      
      // Tenta excluir da coleção 'products'; se não existir, tenta em 'customProducts'
      const productRefProducts = doc(db, "products", product.firestoreId);
      const productDocProducts = await getDoc(productRefProducts);

      if (productDocProducts.exists()) {
        await deleteDoc(productRefProducts);
      } else {
        const productRefCustom = doc(db, "customProducts", product.firestoreId);
        const productDocCustom = await getDoc(productRefCustom);

        if (productDocCustom.exists()) {
          await deleteDoc(productRefCustom);
        } else {
          throw new Error("Produto não encontrado");
        }
      }
      
      // Atualiza as listas imediatamente
      const updatedProducts = registeredProducts.filter(p => p.id !== productId);
      setRegisteredProducts(updatedProducts);
      setCustomProducts(prev => prev.filter(p => p.id !== productId));
      
      setMessage({ text: "Produto excluído com sucesso!", type: "success" });
      
      // Atualiza a lista completa do Firestore
      await fetchRegisteredProducts();
      
      // Fecha o modal de detalhes se estiver aberto
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      setMessage({ 
        text: error instanceof Error ? error.message : "Erro ao excluir produto", 
        type: "error" 
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const filteredProducts = registeredProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !searchCategory || product.category === searchCategory;
    const matchesSection = !searchSection || product.displayLocation === searchSection;
    return matchesSearch && matchesCategory && matchesSection;
  });

  // Resetar busca do select ao trocar o tipo de produto
  useEffect(() => {
    setProductSelectSearch("");
    setIsProductDropdownOpen(false);
  }, [selectedProductType]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    }
    if (isProductDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProductDropdownOpen]);

  // Foca o input de busca quando abrir o dropdown
  useEffect(() => {
    if (isProductDropdownOpen) {
      setTimeout(() => {
        productSearchInputRef.current?.focus();
      }, 0);
    }
  }, [isProductDropdownOpen]);

  // Listas filtradas para o select de produtos conforme a busca
  const normalizedProductSearch = productSelectSearch.trim().toLowerCase();
  const selectBaseProducts = (
    selectedProductType === 'preConfigured'
      ? preConfiguredProducts
      : selectedProductType === 'tactical'
        ? tacticalEquipment
        : sportEquipment
  ).filter(p => p.name.toLowerCase().includes(normalizedProductSearch));

  const selectCustomProducts = customProducts
    .filter(p => p.category === (
      selectedProductType === 'preConfigured'
        ? 'pistolas'
        : selectedProductType === 'tactical'
          ? 'taticos'
          : 'esporte'
    ))
    .filter(p => p.name.toLowerCase().includes(normalizedProductSearch));

  const categories = Array.from(new Set(registeredProducts.map(p => p.category)));

  // Buscar produtos personalizados do Firebase
  useEffect(() => {
    const fetchCustomProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "customProducts"));
        const products = querySnapshot.docs.map(doc => ({
          id: doc.id,
          firestoreId: doc.id,
          ...doc.data()
        })) as Product[];
        setCustomProducts(products);
      } catch (error) {
        console.error("Erro ao buscar produtos personalizados:", error);
      }
    };
    fetchCustomProducts();
  }, []);

  // Função para converter imagem para SVG
  const convertImageToSVG = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Definir tamanho do canvas
        const maxSize = 300;
        let { width, height } = img;
        
        // Redimensionar mantendo proporção
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem no canvas
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Converter para base64
        const dataURL = canvas.toDataURL('image/png');
        
        // Criar SVG com a imagem como base64
        const svg = `
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <image href="${dataURL}" width="${width}" height="${height}"/>
          </svg>
        `.trim();
        
        resolve(svg);
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Função para lidar com upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      try {
        // Mostrar preview da imagem original
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        
        // Converter para SVG
        const svgCode = await convertImageToSVG(file);
        setCustomProductData({ ...customProductData, image: svgCode });
        
        // Mostrar preview do SVG
        setImagePreview(`data:image/svg+xml;base64,${btoa(svgCode)}`);
        
      } catch (error) {
        console.error('Erro ao converter imagem:', error);
        setMessage({ text: 'Erro ao processar imagem', type: 'error' });
      }
    }
  };

  // Alterar handleCustomProductSubmit para salvar SVG
  const handleCustomProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, marca, image, category, specifications } = customProductData;
    if (!name || !marca || !image || !category) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    try {
      const newProduct: Product = {
        id: uuidv4(),
        name: name!,
        marca: marca!,
        image: image!, // Agora contém o código SVG
        category: category as Product['category'],
        specifications: specifications || {},
        price: parseFloat(price),
        displayLocation,
      };
      await addDoc(collection(db, 'customProducts'), newProduct);
      setCustomProductData({ name: '', marca: '', image: '', category: 'pistolas', specifications: {} });
      setPrice('');
      setDisplayLocation('header');
      setShowCustomProductModal(false);
      setSelectedImage(null);
      setImagePreview('');
      setMessage({ text: 'Produto personalizado cadastrado com sucesso!', type: 'success' });
      // Atualiza lista de customProducts
      const querySnapshot = await getDocs(collection(db, "customProducts"));
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data()
      })) as Product[];
      setCustomProducts(products);
    } catch (error) {
      console.error('Erro ao cadastrar produto personalizado:', error);
      setMessage({ text: 'Erro ao cadastrar produto personalizado', type: 'error' });
    }
  };

  // Buscar pedidos do Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <h1>Acesso Negado</h1>
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.sidebarTitle}>Painel Admin</h1>
          <div className={styles.sidebarUser}>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
        </div>
        
        <nav className={styles.sidebarNav}>
          <button 
            className={`${styles.navButton} ${activeSection === 'pedidos' ? styles.active : ''}`}
            onClick={() => setActiveSection('pedidos')}
          >
            <span className={styles.navIcon}>📦</span>
            <span className={styles.navLabel}>Pedidos</span>
          </button>
          <button 
            className={`${styles.navButton} ${activeSection === 'cadastrar' ? styles.active : ''}`}
            onClick={() => setActiveSection('cadastrar')}
          >
            <span className={styles.navIcon}>➕</span>
            <span className={styles.navLabel}>Cadastrar Produto</span>
          </button>
          <button 
            className={`${styles.navButton} ${activeSection === 'produtos' ? styles.active : ''}`}
            onClick={() => setActiveSection('produtos')}
          >
            <span className={styles.navIcon}>📋</span>
            <span className={styles.navLabel}>Produtos Cadastrados</span>
          </button>
          <button 
            className={`${styles.navButton} ${activeSection === 'secoes' ? styles.active : ''}`}
            onClick={() => setActiveSection('secoes')}
          >
            <span className={styles.navIcon}>📁</span>
            <span className={styles.navLabel}>Gerenciar Seções</span>
          </button>
          <button 
            className={`${styles.navButton} ${activeSection === 'avaliacoes' ? styles.active : ''}`}
            onClick={() => setActiveSection('avaliacoes')}
          >
            <span className={styles.navIcon}>⭐</span>
            <span className={styles.navLabel}>Avaliações</span>
          </button>
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className={styles.mainContent}>
        <div className={styles.contentHeader}>
          <h2 className={styles.pageTitle}>
            {activeSection === 'pedidos' && '📦 Pedidos'}
            {activeSection === 'cadastrar' && '➕ Cadastrar Produto'}
            {activeSection === 'produtos' && '📋 Produtos Cadastrados'}
            {activeSection === 'secoes' && '📁 Gerenciar Seções'}
            {activeSection === 'avaliacoes' && '⭐ Avaliações'}
          </h2>
          <div className={styles.welcome}>
            Bem-vindo, {user.email}!
          </div>
        </div>

        <div className={styles.content}>
        {/* Seção de Pedidos */}
        {activeSection === 'pedidos' && (
          <div className={styles.card}>
            <h2>Pedidos</h2>
            <div className={styles.ordersFilters}>
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className={styles.categorySelect}
                style={{maxWidth: 180, marginRight: 8, marginBottom: 8}}
              >
                <option value="">Todos os status</option>
                <option value="Pendente">Pendente</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </select>
              <br/>
              <input
                type="date"
                value={orderDateStart}
                onChange={e => setOrderDateStart(e.target.value)}
                className={styles.categorySelect}
                style={{maxWidth: 180}}
              />
              <span style={{color:'#b0b0b0', margin: '0 8px'}}>até</span>
              <input
                type="date"
                value={orderDateEnd}
                onChange={e => setOrderDateEnd(e.target.value)}
                className={styles.categorySelect}
                style={{maxWidth: 180}}
              />
            </div>
            {orders.length === 0 ? (
              <p>Nenhum pedido encontrado.</p>
            ) : (
              <div className={styles.ordersContainer}>
                {[...orders]
                  .filter(order => order.createdAt && order.createdAt.seconds)
                  .filter(order => {
                    if (!orderStatusFilter) return true;
                    return order.status === orderStatusFilter;
                  })
                  .filter(order => {
                    if (!orderDateStart && !orderDateEnd) return true;
                    const orderDate = new Date(order.createdAt.seconds * 1000);
                    if (orderDateStart && orderDate < new Date(orderDateStart)) return false;
                    if (orderDateEnd && orderDate > new Date(orderDateEnd + 'T23:59:59')) return false;
                    return true;
                  })
                  .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
                  .map((order) => (
                    <div key={order.id} className={styles.productOrderCard} onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}>
                      <div className={styles.productOrderCardHeader}>
                        <span className={styles.productOrderCardTitle}>Cliente: {order.user?.nomeCompleto || order.user?.email}</span>
                        <span className={styles.productOrderCardTotal}>Total: R$ {order.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className={
                          `${styles.productOrderCardStatus} ` +
                          (order.status === 'Concluído' ? styles.concluido : order.status === 'Cancelado' ? styles.cancelado : styles.pendente)
                        }>
                          {order.status}
                        </span>
                      </div>
                      <div className={styles.productOrderCardInfo}>
                        <span>Data: {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString('pt-BR') : ''}</span>
                        <span>Forma de Pagamento: {order.formaPagamento}</span>
                      </div>
                      <div className={styles.productOrderCardProducts}>
                        {order.products?.map((prod: any, idx: number) => (
                          <span key={idx} className={styles.productOrderCardProduct}>{prod.name} (Qtd: {prod.quantity})</span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Seção de Cadastrar Produto */}
        {activeSection === 'cadastrar' && (
          <div className={styles.card}>
            <h2>Cadastrar Produto</h2>
            <div className={styles.productRegistration}>
              <h2>Cadastro de Produtos</h2>
            
            <div className={styles.productTypeSelector}>
              <button
                className={`${styles.typeButton} ${selectedProductType === 'preConfigured' ? styles.active : ''}`}
                onClick={() => setSelectedProductType('preConfigured')}
              >
                Produtos Padrão
              </button>
              {/* 
              
              <button
                className={`${styles.typeButton} ${selectedProductType === 'tactical' ? styles.active : ''}`}
                onClick={() => setSelectedProductType('tactical')}
              >
                Equipamentos Táticos
              </button>
              <button
                className={`${styles.typeButton} ${selectedProductType === 'esportivos' ? styles.active : ''}`}
                onClick={() => setSelectedProductType('esportivos')}
              >
                Equipamentos Esportivos
              </button>
              */}
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Selecione o Produto:</label>
                <div
                  className={styles.dropdown}
                  ref={productDropdownRef}
                >
                  <button
                    type="button"
                    className={styles.dropdownToggle}
                    onClick={() => {
                      setIsProductDropdownOpen(prev => {
                        const next = !prev;
                        if (next) setProductSelectSearch("");
                        return next;
                      });
                    }}
                  >
                    {selectedProduct ? selectedProduct.name : 'Selecione um produto'}
                  </button>
                  {isProductDropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      <div className={styles.dropdownSearchBox}>
                        <input
                          type="text"
                          value={productSelectSearch}
                          onChange={(e) => setProductSelectSearch(e.target.value)}
                          placeholder="Pesquisar produto..."
                          ref={productSearchInputRef}
                        />
                      </div>
                      <div
                        className={styles.dropdownItem}
                        onClick={() => {
                          setIsCustomProduct(true);
                          setSelectedProduct(null);
                          setIsProductDropdownOpen(false);
                          setShowCustomProductModal(true);
                        }}
                      >
                        Produto Personalizado
                      </div>
                      <div className={styles.dropdownGroupLabel}>Produtos Padrão</div>
                      {selectBaseProducts.map(product => (
                        <div
                          key={product.id}
                          className={styles.dropdownItem}
                          onClick={() => {
                            handleProductSelect(product.id);
                            setIsProductDropdownOpen(false);
                          }}
                        >
                          {product.name}
                        </div>
                      ))}
                      {selectBaseProducts.length === 0 && (
                        <div className={styles.dropdownItem} style={{opacity: 0.7, cursor: 'default'}}>Nenhum produto encontrado</div>
                      )}
                      <div className={styles.dropdownGroupLabel}>Personalizados</div>
                      {selectCustomProducts.map(product => (
                        <div
                          key={product.id}
                          className={styles.dropdownItem}
                          onClick={() => {
                            handleProductSelect(product.id);
                            setIsProductDropdownOpen(false);
                          }}
                        >
                          {product.name} (Personalizado)
                        </div>
                      ))}
                      {selectCustomProducts.length === 0 && (
                        <div className={styles.dropdownItem} style={{opacity: 0.7, cursor: 'default'}}>Nenhum produto encontrado</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Preço:</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Digite o preço"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Local de Exibição:</label>
                <div className={styles.displayLocationContainer}>
                  <select
                    value={isCustomSection ? 'custom' : displayLocation}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomSection(true);
                      } else {
                        setIsCustomSection(false);
                        setDisplayLocation(e.target.value);
                      }
                    }}
                    required
                  >
                    <option value="header">Header</option>
                    <option value="destaques">Destaques</option>
                    <option value="recomendados">Recomendados</option>
                    {/*<option value="taticos">Equipamentos Táticos</option>
                    <option value="esportivos">Equipamentos Esportivos</option>*/}
                    <option value="custom">➕ Criar Seção Personalizada</option>
                    {/* Seções personalizadas existentes */}
                    {customSections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                  
                  {isCustomSection && (
                    <div className={styles.customSectionInput}>
                      <input
                        type="text"
                        value={customSectionName}
                        onChange={(e) => setCustomSectionName(e.target.value)}
                        placeholder="Digite o nome da nova seção"
                        className={styles.customSectionField}
                        required
                      />
                      <small className={styles.customSectionHelp}>
                        Esta seção aparecerá na página inicial do site
                      </small>
                    </div>
                  )}
                </div>
              </div>

              {selectedProduct && (
                <>
                  <div className={styles.productPreview}>
                    <h3>Preview do Produto</h3>
                    <div className={styles.previewContent}>
                      <div className={styles.productColumn}>
                        <ProductImage image={selectedProduct.image} alt={selectedProduct.name} style={{width: 120, height: 120}} />
                        <div className={styles.brandInfo}>
                          <img 
                            src={`/img/marcas/${selectedProduct.marca.toLowerCase().replace(/\s+/g, '-')}.jpg`} 
                            alt={selectedProduct.marca}
                            className={styles.brandImage}
                            style={{width: 120, height: 120}}
                          />
                        </div>
                      </div>
                      <div className={styles.previewDetails}>
                        <h4>{selectedProduct.name}</h4>
                        <div className={styles.specs}>
                          {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                            <div key={key} className={styles.spec}>
                              <span className={styles.specLabel}>{key}:</span>
                              <span className={styles.specValue}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {message.text && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                  {message.text}
                </div>
              )}

              <button type="submit" className={styles.submitButton}>
                Cadastrar Produto
              </button>
            </form>
          </div>
        </div>
        )}

        {/* Seção de Produtos Cadastrados */}
        {activeSection === 'produtos' && (
          <div className={styles.card}>
            <h2>Produtos Cadastrados</h2>
          <div className={styles.searchContainer}>
            <div className={styles.searchInput}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={searchSection}
              onChange={(e) => setSearchSection(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="">Todas as seções</option>
              <option value="header">Menu Principal</option>
              <option value="destaques">Produtos em Destaque</option>
              <option value="recomendados">Produtos Recomendados</option>
            </select>
          </div>
          <div className={styles.productsContainer}>
            <div className={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <div key={product.id} className={styles.productCard} onClick={() => {
                  setSelectedProductForEdit(product);
                  setShowDetailsModal(true);
                }}>
                  <div className={styles.productInfo}>
                    <h3>{product.name}</h3>
                    <p className={styles.price}>{formatPrice(product.price)}</p>
                    <p className={styles.section}>
                      Seção: {
                        product.displayLocation === 'header' ? 'Menu Principal' :
                        product.displayLocation === 'destaques' ? 'Produtos em Destaque' :
                        product.displayLocation === 'taticos' ? 'Equipamentos Táticos' :
                        'Produtos Recomendados'
                      }
                    </p>
                    <div className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForEdit(product);
                          setEditPrice(product.price.toString());
                          setShowEditModal(true);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className={styles.productImage}>
                    <ProductImage image={product.image} alt={product.name} style={{width: 70, height: 70}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Seção de Gerenciar Seções Personalizadas */}
        {activeSection === 'secoes' && (
          <div className={styles.card}>
            <h2>Gerenciar Seções Personalizadas</h2>
            <div className={styles.sectionsList}>
              {customSections.length === 0 ? (
                <p>Nenhuma seção personalizada cadastrada.</p>
              ) : (
                customSections.map((section) => {
                  const productsInThisSection = registeredProducts.filter(
                    product => product.displayLocation === section
                  );
                  const productsCount = productsInThisSection.length;
                  return (
                    <div key={section} className={styles.sectionItem}>
                      <div className={styles.sectionInfo}>
                        <h3>{section}</h3>
                        <p className={styles.sectionProductCount}>
                          {productsCount} {productsCount === 1 ? 'produto' : 'produtos'} cadastrado{productsCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        className={styles.deleteSectionButton}
                        onClick={() => handleDeleteSection(section)}
                      >
                        <FaTrash /> Excluir
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Seção de Avaliações */}
        {activeSection === 'avaliacoes' && (
          <div className={styles.card}>
            <h2>Avaliações dos Clientes</h2>
            <div className={styles.reviewsSearchContainer}>
              <div className={styles.searchInput}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Buscar por produto ou cliente..."
                  value={reviewSearchTerm}
                  onChange={(e) => setReviewSearchTerm(e.target.value)}
                  className={styles.searchInputField}
                />
              </div>
            </div>
            {reviewsLoading ? (
              <p>Carregando avaliações...</p>
            ) : reviews.length === 0 ? (
              <p>Nenhuma avaliação encontrada.</p>
            ) : (
              <div className={styles.reviewsList}>
                {reviews
                  .filter(review => {
                    if (!reviewSearchTerm) return true;
                    const searchLower = reviewSearchTerm.toLowerCase();
                    return (
                      review.productName?.toLowerCase().includes(searchLower) ||
                      review.userName?.toLowerCase().includes(searchLower) ||
                      review.comment?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((review) => {
                    const reviewDate = review.createdAt instanceof Timestamp 
                      ? new Date(review.createdAt.seconds * 1000)
                      : new Date(review.createdAt);
                    return (
                      <div key={review.id} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                          <div className={styles.reviewProductInfo}>
                            <h3>{review.productName || 'Produto não especificado'}</h3>
                            <p className={styles.reviewUser}>Por: {review.userName || 'Usuário'}</p>
                          </div>
                          <div className={styles.reviewRating}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                style={{
                                  color: star <= review.rating ? '#ffd700' : '#ccc',
                                  fontSize: '1.2rem'
                                }}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className={styles.reviewContent}>
                          <p className={styles.reviewComment}>{review.comment}</p>
                          <div className={styles.reviewFooter}>
                            <span className={styles.reviewDate}>
                              {reviewDate.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <button
                              className={styles.deleteReviewButton}
                              onClick={() => deleteReview(review.id)}
                              title="Excluir avaliação"
                            >
                              <FaTrash /> Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
        </div>

        <ContactMessages />
      </main>

      {/* Modais */}
      {showEditModal && selectedProductForEdit && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Editar Preço</h3>
            <div className={styles.formGroup}>
              <label>Novo Preço (R$)</label>
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
            <div className={styles.modalActions}>
              <button onClick={handleEdit} className={styles.submitButton}>
                Salvar
              </button>
              <button onClick={() => setShowEditModal(false)} className={styles.cancelButton}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedProductForEdit && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalImage}>
                <ProductImage image={selectedProductForEdit.image} alt={selectedProductForEdit.name} style={{width: 200, height: 200, borderRadius: 12}} />
              </div>
              <div className={styles.modalDetails}>
                <h3>{selectedProductForEdit.name}</h3>
                <p className={styles.modalPrice}>{formatPrice(selectedProductForEdit.price)}</p>
                <div className={styles.modalSpecs}>
                  {selectedProductForEdit.specifications && Object.entries(selectedProductForEdit.specifications).map(([key, value]) => (
                    <div key={key} className={styles.modalSpec}>
                      <span className={styles.specLabel}>{key}:</span>
                      <span className={styles.specValue}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.modalActions}>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedProductForEdit(selectedProductForEdit);
                      setEditPrice(selectedProductForEdit.price.toString());
                      setShowEditModal(true);
                    }}
                    className={styles.editButton}
                  >
                    <FaEdit /> Editar
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleDelete(selectedProductForEdit.id);
                    }}
                    className={styles.deleteButton}
                  >
                    <FaTrash /> Excluir
                  </button>
                </div>
              </div>
            </div>
            <button className={styles.closeButton} onClick={() => setShowDetailsModal(false)}>×</button>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDuplicateModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Atenção!</h3>
            <p>Este produto já está cadastrado! Procure-o em "Produtos Cadastrados".</p>
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowDuplicateModal(false)} 
                className={styles.submitButton}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomProductModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCustomProductModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Cadastro de Produto Personalizado</h3>
            <form onSubmit={handleCustomProductSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nome do Produto:</label>
                <input 
                  type="text" 
                  value={customProductData.name || ''} 
                  onChange={e => setCustomProductData({ ...customProductData, name: e.target.value })} 
                  placeholder="Digite o nome do produto"
                  required 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Marca:</label>
                <input 
                  type="text" 
                  value={customProductData.marca || ''} 
                  onChange={e => setCustomProductData({ ...customProductData, marca: e.target.value })} 
                  placeholder="Digite a marca"
                  required 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Imagem:</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  required 
                />
                {imagePreview && (
                  <div className={styles.imagePreview}>
                    <div 
                      dangerouslySetInnerHTML={{ __html: customProductData.image || '' }}
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '200px', 
                        marginTop: '8px',
                        display: 'inline-block'
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label>Categoria:</label>
                <select 
                  value={customProductData.category || 'pistolas'} 
                  onChange={e => setCustomProductData({ ...customProductData, category: e.target.value as Product['category'] })} 
                  required
                >
                  <option value="pistolas">Pistolas</option>
                  <option value="revolveres">Revólveres</option>
                  <option value="espingardas">Espingardas</option>
                  <option value="acessorios">Acessórios</option>
                  <option value="taticos">Táticos</option>
                  <option value="esporte">Esporte</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Especificações:</label>
                <div className={styles.specificationsInput}>
                  <input 
                    type="text" 
                    placeholder="Ex: calibre: 9mm" 
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = e.currentTarget.value;
                        if (value && value.includes(':')) {
                          const [key, val] = value.split(':').map(s => s.trim());
                          setCustomProductData({
                            ...customProductData,
                            specifications: { ...customProductData.specifications, [key]: val }
                          });
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <small>Pressione Enter para adicionar cada especificação</small>
                </div>
                <div className={styles.specificationsList}>
                  {customProductData.specifications && Object.entries(customProductData.specifications || {}).map(([key, val]) => (
                    <div key={key} className={styles.specItem}>
                      <span>{key}: {val}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newSpecs = { ...customProductData.specifications };
                          delete newSpecs[key];
                          setCustomProductData({ ...customProductData, specifications: newSpecs });
                        }}
                        className={styles.removeSpec}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Preço (R$):</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  placeholder="0.00"
                  step="0.01"
                  required 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Local de Exibição:</label>
                <select 
                  value={displayLocation} 
                  onChange={(e) => setDisplayLocation(e.target.value as 'header' | 'destaques' | 'recomendados' | 'taticos' | 'esportivos')} 
                  required
                >
                  <option value="header">Header</option>
                  <option value="destaques">Destaques</option>
                  <option value="recomendados">Recomendados</option>
                  <option value="taticos">Equipamentos Táticos</option>
                  <option value="esportivos">Equipamentos Esportivos</option>
                </select>
              </div>
              
              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>
                  Cadastrar Produto
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCustomProductModal(false);
                    setCustomProductData({ name: '', marca: '', image: '', category: 'pistolas', specifications: {} });
                    setPrice('');
                    setDisplayLocation('header');
                    setSelectedImage(null);
                    setImagePreview('');
                  }} 
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOrderModal && selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setShowOrderModal(false)}>
          <div className={styles.adminOrderModal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowOrderModal(false)}>×</button>
            <div className={styles.adminOrderModalTitle}>Detalhes do Pedido</div>
            <div className={styles.adminOrderModalSection}>
              <span className={styles.adminOrderModalLabel}>Nome:</span>
              <span className={styles.adminOrderModalValue}>{selectedOrder.user?.nomeCompleto}</span>
            </div>
            <div className={styles.adminOrderModalSection}>
              <span className={styles.adminOrderModalLabel}>Email:</span>
              <span className={styles.adminOrderModalValue}>{selectedOrder.user?.email}</span>
            </div>
            <div className={styles.adminOrderModalSection}>
              <span className={styles.adminOrderModalLabel}>Telefone:</span>
              <span className={styles.adminOrderModalValue}>{selectedOrder.user?.telefone}</span>
            </div>
            <div className={styles.adminOrderModalSection}>
              <span className={styles.adminOrderModalLabel}>Total:</span>
              <span className={styles.adminOrderModalValue}>R$ {selectedOrder.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={styles.adminOrderModalSection}>
              <span className={styles.adminOrderModalLabel}>Data:</span>
              <span className={styles.adminOrderModalValue}>{selectedOrder.createdAt?.seconds ? new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString('pt-BR') : ''}</span>
            </div>
            <span className={styles.adminOrderModalLabel}>Status:</span>
            <span className={styles.adminOrderModalValue}>{selectedOrder.status}</span>
            <div className={styles.adminOrderModalPagamento}>
              Forma de Pagamento: {selectedOrder.formaPagamento}
            </div>
            <div className={styles.adminOrderModalSection}>
              <div className={styles.adminOrderModalLabel} style={{marginBottom: 6}}>Produtos:</div>
              <div className={styles.adminOrderModalProducts}>
                {selectedOrder.products?.map((prod: any, idx: number) => (
                  <div key={idx} className={styles.adminOrderModalProductCard}>
                    <div className={styles.adminOrderModalProductImage}>
                      <ProductImage 
                       image={prod.image} 
                       alt={prod.name} 
                       className={styles.adminOrderModalProductImg}
                       style={{width: 95, height: 95}}
                       />
                    </div>
                    <div className={styles.adminOrderModalProductInfo}>
                      <strong>{prod.name}</strong>
                      <div>Quantidade: <span className={styles.adminOrderModalValue}>{prod.quantity}</span></div>
                      <div>Preço: <span className={styles.adminOrderModalValue}>{prod.price}</span></div>
                      {selectedOrder.formaPagamento === 'Cartão de crédito' && (
                        <div style={{color:'#1976d2', fontWeight:600, fontSize:'0.97rem'}}>Parcelas: {prod.parcelas}x de {(typeof prod.price === 'number' ? prod.price : parseFloat(String(prod.price).replace('R$', '').replace('.', '').replace(',', '.'))/prod.parcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.adminOrderModalContato}>
              <strong>Contato:</strong><br/>
              Email: <a href={`mailto:${selectedOrder.user?.email}`}>{selectedOrder.user?.email}</a><br/>
              WhatsApp: <a href={`https://wa.me/55${(selectedOrder.user?.telefone || '').replace(/\D/g, '')}?text=Olá! Vi seu pedido no site e gostaria de falar com você.`} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              {selectedOrder.status !== 'Concluído' && selectedOrder.status !== 'Cancelado' && (
                <button
                  className={styles.concluirVendaButton}
                  onClick={async () => {
                    const orderRef = doc(db, 'orders', selectedOrder.id);
                    await updateDoc(orderRef, { status: 'Concluído' });
                    setShowOrderModal(false);
                    // Atualiza lista de pedidos
                    const querySnapshot = await getDocs(collection(db, 'orders'));
                    const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setOrders(ordersData);
                  }}
                >
                  Concluir Venda
                </button>
              )}
              {selectedOrder.status !== 'Cancelado' && selectedOrder.status !== 'Concluído' && (
                <button
                  className={styles.cancelarPedidoButton}
                  style={{background:'#e74c3c', color:'#fff'}}
                  onClick={async () => {
                    if(window.confirm('Tem certeza que deseja cancelar este pedido?')) {
                      const orderRef = doc(db, 'orders', selectedOrder.id);
                      await updateDoc(orderRef, { status: 'Cancelado' });
                      setShowOrderModal(false);
                      // Atualiza lista de pedidos
                      const querySnapshot = await getDocs(collection(db, 'orders'));
                      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                      setOrders(ordersData);
                    }
                  }}
                >
                  Cancelar pedido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para excluir seção com produtos */}
      {showDeleteSectionModal && sectionToDelete && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteSectionModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{maxWidth: '800px'}}>
            <h3>Excluir Seção: {sectionToDelete}</h3>
            <p style={{color: '#ffec70', marginBottom: '20px'}}>
              Esta seção possui {productsInSection.length} {productsInSection.length === 1 ? 'produto' : 'produtos'} cadastrado{productsInSection.length !== 1 ? 's' : ''}. 
              Mova os produtos para outra seção antes de excluir.
            </p>
            
            <div className={styles.productsToMoveList}>
              <h4 style={{marginBottom: '12px', color: '#fff'}}>Produtos nesta seção:</h4>
              <div className={styles.productsListContainer}>
                {productsInSection.map((product) => (
                  <div key={product.id} className={styles.productToMoveItem}>
                    <ProductImage 
                      image={product.image} 
                      alt={product.name} 
                      style={{width: 60, height: 60}} 
                    />
                    <div className={styles.productToMoveInfo}>
                      <strong>{product.name}</strong>
                      <span>{formatPrice(product.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.moveProductsSection}>
              <label style={{display: 'block', marginBottom: '8px', color: '#fff'}}>
                Mover todos os produtos para:
              </label>
              <select
                value={targetSectionForMove}
                onChange={(e) => setTargetSectionForMove(e.target.value)}
                className={styles.categorySelect}
                style={{width: '100%', marginBottom: '16px'}}
              >
                <option value="">Selecione uma seção...</option>
                <option value="header">Menu Principal</option>
                <option value="destaques">Produtos em Destaque</option>
                <option value="recomendados">Produtos Recomendados</option>
                <option value="taticos">Equipamentos Táticos</option>
                <option value="esportivos">Equipamentos Esportivos</option>
                {customSections
                  .filter(s => s !== sectionToDelete)
                  .map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
              </select>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={async () => {
                  if (!targetSectionForMove) {
                    setMessage({ text: "Selecione uma seção para mover os produtos", type: "error" });
                    return;
                  }
                  
                  const success = await moveProductsToSection(productsInSection, targetSectionForMove);
                  if (success) {
                    // Atualizar lista de produtos registrados
                    await fetchRegisteredProducts();
                    
                    // Buscar produtos atualizados diretamente do Firestore para garantir dados corretos
                    const updatedProductsQuery = await getDocs(collection(db, "products"));
                    const updatedCustomQuery = await getDocs(collection(db, "customProducts"));
                    
                    const allUpdatedProducts = [
                      ...updatedProductsQuery.docs.map(doc => ({
                        id: doc.id,
                        firestoreId: doc.id,
                        ...doc.data()
                      })),
                      ...updatedCustomQuery.docs.map(doc => ({
                        id: doc.id,
                        firestoreId: doc.id,
                        ...doc.data()
                      }))
                    ] as Product[];
                    
                    if (sectionToDelete) {
                      const remainingProducts = allUpdatedProducts.filter(
                        product => product.displayLocation === sectionToDelete
                      );
                      setProductsInSection(remainingProducts);
                      
                      // Se não há mais produtos, mostrar mensagem
                      if (remainingProducts.length === 0) {
                        setMessage({ 
                          text: "Todos os produtos foram movidos. Agora você pode excluir a seção.", 
                          type: "success" 
                        });
                      }
                    }
                  }
                }}
                className={styles.submitButton}
                disabled={!targetSectionForMove}
              >
                Mover Produtos
              </button>
              <button
                onClick={async () => {
                  if (!sectionToDelete) return;
                  
                  // Buscar produtos atualizados diretamente do Firestore
                  const updatedProductsQuery = await getDocs(collection(db, "products"));
                  const updatedCustomQuery = await getDocs(collection(db, "customProducts"));
                  
                  const allUpdatedProducts = [
                    ...updatedProductsQuery.docs.map(doc => ({
                      id: doc.id,
                      firestoreId: doc.id,
                      ...doc.data()
                    })),
                    ...updatedCustomQuery.docs.map(doc => ({
                      id: doc.id,
                      firestoreId: doc.id,
                      ...doc.data()
                    }))
                  ] as Product[];
                  
                  const remainingProducts = allUpdatedProducts.filter(
                    product => product.displayLocation === sectionToDelete
                  );
                  
                  if (remainingProducts.length > 0) {
                    setMessage({ 
                      text: `Ainda há ${remainingProducts.length} produto(s) nesta seção. Mova todos antes de excluir.`, 
                      type: "error" 
                    });
                    setProductsInSection(remainingProducts);
                    // Atualizar também o estado de produtos registrados
                    setRegisteredProducts(allUpdatedProducts);
                    return;
                  }
                  
                  // Se não há produtos, confirmar exclusão
                  await confirmDeleteAfterMove();
                }}
                className={styles.deleteButton}
                style={{background: '#e74c3c'}}
              >
                Excluir Seção
              </button>
              <button
                onClick={() => {
                  setShowDeleteSectionModal(false);
                  setSectionToDelete(null);
                  setProductsInSection([]);
                  setTargetSectionForMove('');
                }}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 