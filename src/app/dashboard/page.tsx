"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FaBox, FaUser, FaHeart, FaSignOutAlt, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaIdCard, FaAddressCard, FaCalendarAlt, FaHome, FaBuilding, FaMapPin, FaTrash, FaShoppingCart, FaWhatsapp } from 'react-icons/fa';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import Image from 'next/image';
import styles from './styles.module.scss';
import ProductImage from '@/components/ProductImage';
import { FaStar, FaRegStar } from 'react-icons/fa';

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

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category?: string;
  displayLocation?: string;
  specifications?: {
    calibre?: string;
    capacidade?: string;
    comprimento?: string;
    material?: string;
    peso?: string;
  };
}

interface Review {
  id?: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp | Date;
}

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const { favorites, removeFromFavorites } = useFavorites();
  const { addToCart, cart, removeFromCart } = useCart();
  const [activeTab, setActiveTab] = useState('pedidos');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Estados para avaliações
  const [productReviews, setProductReviews] = useState<Record<string, any[]>>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState<any | null>(null);
  const [newReview, setNewReview] = useState<{ rating: number; comment: string }>({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${user.uid}`);
        const data = await response.json();
        setUserData(data);
        setEditedData(data);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        setMessage({ text: 'Erro ao carregar dados do usuário', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, router]);

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (!user) {
        setFavoriteProducts([]);
        setProductsLoading(false);
        return;
      }

      try {
        const dados = getFirestore(db.app);
        const userDoc = doc(dados, "users", user.uid);
        const userSnapshot = await getDoc(userDoc);
        
        if (!userSnapshot.exists()) {
          setFavoriteProducts([]);
          setProductsLoading(false);
          return;
        }

        const userData = userSnapshot.data();
        const favoriteIds = userData.favorites || [];

        if (favoriteIds.length === 0) {
          setFavoriteProducts([]);
          setProductsLoading(false);
          return;
        }

        const produtosCollection = collection(dados, "products");
        const produtosSnapshot = await getDocs(produtosCollection);
        const produtos = produtosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        const favoriteProducts = produtos.filter(product => 
          favoriteIds.includes(product.id)
        );
        
        setFavoriteProducts(favoriteProducts);
      } catch (error) {
        console.error('Erro ao buscar produtos favoritos:', error);
        setMessage({ text: 'Erro ao carregar favoritos', type: 'error' });
      } finally {
        setProductsLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [user, favorites]);

  // Buscar pedidos do usuário logado
  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    const fetchOrders = async () => {
      try {
        const dados = getFirestore(db.app);
        const ordersRef = collection(dados, 'orders');
        const q = query(ordersRef, where('user.uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserOrders(ordersData);
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(userData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(userData);
  };

  const handleSaveProfile = async () => {
    if (!user || !editedData) return;

    try {
      const response = await fetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar dados');
      }

      setUserData(editedData);
      setIsEditing(false);
      setMessage({ text: 'Dados atualizados com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      setMessage({ text: 'Erro ao atualizar dados', type: 'error' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedData) return;
    
    const { name, value } = e.target;
    setEditedData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      image: product.image,
      name: product.name,
      price: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(product.price),
      quantity: 1
    });
  };

  const handleRemoveFromFavorites = async (productId: string) => {
    try {
      await removeFromFavorites(productId);
      setFavoriteProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
      setMessage({ text: 'Produto removido dos favoritos', type: 'success' });
    } catch (error) {
      console.error('Erro ao remover dos favoritos:', error);
      setMessage({ text: 'Erro ao remover favorito', type: 'error' });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleRemoveFromCart = (index: number) => {
    removeFromCart(index);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price.replace('R$', '').replace('.', '').replace(',', '.'));
      return total + price;
    }, 0);
  };

  // Funções para avaliações
  // Buscar avaliações de um produto
  const getProductReviews = async (productId: string, productName: string): Promise<Review[]> => {
    try {
      const dados = getFirestore(db.app);
      const reviewsRef = collection(dados, "reviews");
      
      const reviews: Review[] = [];
      
      // Se tiver productId, buscar por ID primeiro
      if (productId && productId.trim() !== '') {
        const reviewsQuery = query(
          reviewsRef,
          where("productId", "==", productId)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        reviewsSnapshot.forEach((doc) => {
          const reviewData = doc.data();
          // Verificar se o nome também corresponde (para garantir que é o produto correto)
          if (reviewData.productName === productName) {
            reviews.push({
              id: doc.id,
              ...reviewData
            } as Review);
          }
        });
      }
      
      // Se não encontrou por ID ou não tem ID, buscar por nome E verificar se o ID corresponde (ou está vazio)
      if (reviews.length === 0 && productName) {
        const reviewsByNameQuery = query(
          reviewsRef,
          where("productName", "==", productName)
        );
        const reviewsByNameSnapshot = await getDocs(reviewsByNameQuery);
        reviewsByNameSnapshot.forEach((doc) => {
          const reviewData = doc.data();
          // Só incluir se o productId da review corresponder ao productId buscado (ou se ambos estiverem vazios)
          const reviewProductId = reviewData.productId || '';
          const searchProductId = productId || '';
          if (reviewProductId === searchProductId) {
            reviews.push({
              id: doc.id,
              ...reviewData
            } as Review);
          }
        });
      }
      
      // Remover duplicatas baseado no ID do documento
      const uniqueReviews = reviews.filter((review, index, self) => 
        index === self.findIndex((r) => r.id === review.id)
      );
      
      // Ordenar por data (mais recentes primeiro)
      return uniqueReviews.sort((a, b) => {
        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
  };

  // Adicionar avaliação
  const addReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const dados = getFirestore(db.app);
      const reviewsRef = collection(dados, "reviews");
      await addDoc(reviewsRef, {
        ...review,
        createdAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Erro ao adicionar avaliação:', error);
      return false;
    }
  };

  // Verificar avaliações dos produtos do pedido
  useEffect(() => {
    const checkCanReview = async () => {
      if (!user || !selectedOrder) {
        setProductReviews({});
        return;
      }

      const reviewsMap: Record<string, Review[]> = {};

      try {
        for (const prod of selectedOrder.products || []) {
          const productKey = `${prod.id || ''}_${prod.name}`;
          
          // Buscar avaliações usando a função getProductReviews que já faz a verificação correta
          const reviews = await getProductReviews(prod.id || '', prod.name);
          
          reviewsMap[productKey] = reviews;
        }

        setProductReviews(reviewsMap);
      } catch (error) {
        console.error('Erro ao verificar avaliações:', error);
      }
    };

    checkCanReview();
  }, [selectedOrder, user]);

  // Função para cancelar pedido
  const handleCancelOrder = async (orderId: string) => {
    try {
      const dados = getFirestore(db.app);
      const orderRef = doc(dados, 'orders', orderId);
      await updateDoc(orderRef, { status: 'Cancelado' });
      setUserOrders(prev => prev.filter(o => o.id !== orderId));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      alert('Erro ao cancelar pedido. Tente novamente.');
      console.error('Erro ao cancelar pedido:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (!userData) {
    return <div className={styles.error}>Dados não encontrados</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.sidebar}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            <FaUser size={40} />
          </div>
          <h3>{userData?.nomeCompleto || 'Usuário'}</h3>
          <p>{userData?.email}</p>
        </div>

        <nav className={styles.menu}>
          <button 
            className={`${styles.menuItem} ${activeTab === 'pedidos' ? styles.active : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            <FaBox /> Meus Pedidos
          </button>
          <button 
            className={`${styles.menuItem} ${activeTab === 'carrinho' ? styles.active : ''}`}
            onClick={() => setActiveTab('carrinho')}
          >
            <FaShoppingCart /> Carrinho
          </button>
          <button 
            className={`${styles.menuItem} ${activeTab === 'perfil' ? styles.active : ''}`}
            onClick={() => setActiveTab('perfil')}
          >
            <FaUser /> Dados Pessoais
          </button>
          <button 
            className={`${styles.menuItem} ${activeTab === 'favoritos' ? styles.active : ''}`}
            onClick={() => setActiveTab('favoritos')}
          >
            <FaHeart /> Favoritos
          </button>
          <button className={styles.menuItem} onClick={handleLogout}>
            <FaSignOutAlt /> Sair
          </button>
        </nav>
      </div>

      <div className={styles.content}>
        {activeTab === 'pedidos' && (
          <div className={styles.section}>
            <h2>Meus Pedidos</h2>
            <div className={styles.ordersList}>
              {ordersLoading ? (
                <p>Carregando...</p>
              ) : userOrders.length === 0 ? (
                <p>Nenhum pedido encontrado.</p>
              ) : (
                userOrders.map((order) => (
                  <div key={order.id} className={styles.orderCard} onClick={() => setSelectedOrder(order)}>
                    <div className={styles.orderCardImageCol}>
                      <ProductImage image={order.products?.[0]?.image} alt={order.products?.[0]?.name} />
                    <div className={styles.orderCardPriceCol}>
                      <div className={styles.orderCardTotal}>R$ {order.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                    </div>
                    <div className={styles.orderCardDetailsCol}>
                      <div className={styles.orderCardInfoRow}>
                        <span className={styles.orderCardDate}>Pedido em {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '--/--/----'}</span>
                        <span className={styles.orderCardStatus}>{order.status}</span>
                      </div>
                      <div className={styles.orderCardProductsLabel}>Produtos:

                      <div className={styles.orderCardProductsList}>
                        {order.products?.map((prod: any, idx: number) => (
                          <span key={idx} className={styles.orderCardProductName}>{prod.name}</span>
                        ))}
                      </div>
                      </div>
                    </div>
                    <div className={styles.orderCardActionsCol}>
                      <button className={styles.sendMsgBtn} onClick={e => { e.stopPropagation(); window.open(`https://wa.me/5521988086924?text=Olá! Gostaria de informações sobre meu pedido (${order.id})`, '_blank'); }}>
                        <FaWhatsapp /> Enviar mensagem
                      </button>
                      {order.status === 'Pendente' && (
                        <button className={styles.cancelOrderBtn} onClick={e => { e.stopPropagation(); handleCancelOrder(order.id); }}>
                          Cancelar pedido
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Modal de detalhes do pedido */}
            {selectedOrder && (
              <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
                <div className={styles.modal} onClick={e => e.stopPropagation()}>
                  <button className={styles.closeButton} onClick={() => setSelectedOrder(null)}>×</button>
                  <div className={styles.modalTitle}>Detalhes do Pedido</div>
                  <div className={styles.modalInfoRow}>
                    <div className={styles.modalInfoItem}>
                      <span className={styles.modalLabel}>Data</span>
                      <span className={styles.modalValue}>{selectedOrder.createdAt?.seconds ? new Date(selectedOrder.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : ''}</span>
                    </div>
                    <div className={styles.modalInfoItem}>
                      <span className={styles.modalLabel}>Status</span>
                      <span className={styles.modalValue}>{selectedOrder.status}</span>
                    </div>
                    <div className={styles.modalInfoItem}>
                      <span className={styles.modalLabel}>Total</span>
                      <span className={styles.modalValue}>R$ {selectedOrder.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className={styles.modalPagamento}>
                    {selectedOrder.formaPagamento}
                  </div>
                    <div className={styles.modalSection}>
                    <div className={styles.modalLabel}>Produtos:</div>
                    <div className={styles.modalOrderProducts}>
                      {selectedOrder.products?.map((prod: any, idx: number) => {
                        const productKey = `${prod.id || ''}_${prod.name}`;
                        const reviews = productReviews[productKey] || [];
                        // Verificar se usuário já avaliou - se não houver reviews ainda, assume que não avaliou
                        const userHasReviewed = user && reviews.length > 0 ? reviews.some((r: Review) => r.userId === user.uid) : false;

                        return (
                          <div key={idx} className={styles.modalOrderProductCard}>
                            <ProductImage image={prod.image} alt={prod.name} style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 4, background: '#fff' }} />
                            <div className={styles.modalProductInfo}>
                              <strong>{prod.name}</strong>
                              <div className={styles.modalProductDetails}>
                                <span >{prod.price}</span>
                              </div>
                              {selectedOrder.formaPagamento === 'Cartão de crédito' && (
                                <div className={styles.modalParcelas}>{prod.parcelas}x de {(typeof prod.price === 'number' ? prod.price : parseFloat(String(prod.price).replace('R$', '').replace('.', '').replace(',', '.'))/prod.parcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                              )}
                              
                              {/* Botão de avaliação */}
                              {user && !userHasReviewed && (
                                <button 
                                  className={styles.reviewButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProductForReview(prod);
                                    setShowReviewModal(true);
                                    setNewReview({ rating: 0, comment: '' });
                                  }}
                                  style={{
                                    background: 'linear-gradient(135deg, #f0b63d, #ffd700)',
                                    color: '#23262b',
                                    border: '3px solid #f0b63d',
                                    padding: '14px 28px',
                                    borderRadius: '12px',
                                    fontSize: '1.1rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    marginTop: '16px',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    boxShadow: '0 4px 16px rgba(240, 182, 61, 0.6)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                    minHeight: '48px'
                                  }}
                                >
                                  <FaStar style={{ fontSize: '1.2rem' }} /> <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#23262b' }}>Avaliar Produto</span>
                                </button>
                              )}

                              {/* Indicador se já avaliou */}
                              {userHasReviewed && (
                                <div className={styles.reviewedIndicator}>
                                  <FaStar color="#f0b63d" /> <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#23262b' }}>Você já avaliou este produto</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className={styles.modalContato}>
                      <strong>Contato:</strong>
                      <a href={`mailto:${selectedOrder.user?.email}`}>{selectedOrder.user?.email}</a>
                      <a href={`https://wa.me/?text=Olá, vi seu pedido no site!`}>WhatsApp</a>
                    </div>
                  )}
                  {selectedOrder.status === 'Pendente' && (
                    <button className={styles.cancelOrderBtn} onClick={() => handleCancelOrder(selectedOrder.id)}>
                      Cancelar pedido
                    </button>
                  )}

                  {/* Modal de Avaliação - dentro do modal de detalhes */}
                  {showReviewModal && selectedProductForReview && user && (
                    <div 
                      className={styles.reviewModalOverlay} 
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedProductForReview(null);
                        setNewReview({ rating: 0, comment: '' });
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '20px',
                        backdropFilter: 'blur(6px)',
                        borderRadius: '20px'
                      }}
                    >
                      <div 
                        className={styles.reviewModal} 
                        onClick={e => e.stopPropagation()}
                        style={{
                          background: 'linear-gradient(135deg, #fff 0%, #fffbe6 100%)',
                          borderRadius: '20px',
                          padding: '36px',
                          maxWidth: '650px',
                          width: '100%',
                          maxHeight: '85vh',
                          overflowY: 'auto',
                          position: 'relative',
                          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(240, 182, 61, 0.3)',
                          zIndex: 2001,
                          margin: 'auto',
                          border: '2px solid #f0b63d'
                        }}
                      >
                        <button 
                          className={styles.reviewModalCloseButton} 
                          onClick={() => {
                            setShowReviewModal(false);
                            setSelectedProductForReview(null);
                            setNewReview({ rating: 0, comment: '' });
                          }}
                        >
                          ×
                        </button>
                        <h2 className={styles.reviewModalTitle}>Avaliar Produto</h2>
                        
                        <div className={styles.reviewModalProductInfo}>
                          <ProductImage 
                            image={selectedProductForReview.image} 
                            alt={selectedProductForReview.name} 
                            style={{ width: 140, height: 140, objectFit: 'contain', borderRadius: 12, background: '#fff', padding: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }} 
                          />
                          <strong style={{ fontSize: '1.2rem', color: '#23262b', textAlign: 'center', fontWeight: '700', textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}>
                            {selectedProductForReview.name}
                          </strong>
                        </div>

                        <div className={styles.reviewForm}>
                          <div className={styles.ratingInput}>
                            <span style={{ color: '#23262b', fontWeight: '700', fontSize: '1rem', letterSpacing: '0.5px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}>
                              Avaliação:
                            </span>
                            <div className={styles.starRating}>
                              {[1,2,3,4,5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  className={styles.starButton}
                                  onClick={() => setNewReview({ ...newReview, rating: star })}
                                >
                                  {star <= newReview.rating ? 
                                    <FaStar color="#f0b63d" size={32} /> : 
                                    <FaRegStar color="#f0b63d" size={32} />
                                  }
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            className={styles.reviewCommentInput}
                            placeholder="Deixe seu comentário sobre o produto..."
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            rows={5}
                            style={{
                              width: '100%',
                              padding: '16px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '12px',
                              fontSize: '1rem',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              marginBottom: '24px',
                              minHeight: '120px',
                              background: '#fff',
                              lineHeight: '1.6',
                              color: '#23262b'
                            }}
                          />
                          <div 
                            className={styles.reviewFormActions}
                            style={{
                              display: 'flex',
                              gap: '16px',
                              justifyContent: 'center',
                              marginTop: '8px'
                            }}
                          >
                            <button
                              className={styles.submitReviewButton}
                              style={{
                                background: 'linear-gradient(135deg, #f0b63d, #ffd700)',
                                color: '#23262b',
                                border: '3px solid #f0b63d',
                                padding: '14px 32px',
                                borderRadius: '12px',
                                fontSize: '1.05rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px',
                                minWidth: '180px',
                                boxShadow: '0 4px 16px rgba(240, 182, 61, 0.4)'
                              }}
                              onClick={async () => {
                                if (newReview.rating === 0 || !newReview.comment.trim()) {
                                  alert('Por favor, selecione uma avaliação e escreva um comentário.');
                                  return;
                                }

                                setSubmittingReview(true);
                                
                                const dados = getFirestore(db.app);
                                const userDoc = doc(dados, "users", user.uid);
                                const userSnapshot = await getDoc(userDoc);
                                const userName = userSnapshot.exists() ? userSnapshot.data().nomeCompleto : user.email?.split('@')[0] || 'Usuário';

                                const success = await addReview({
                                  productId: selectedProductForReview.id || '',
                                  productName: selectedProductForReview.name,
                                  userId: user.uid,
                                  userName: userName,
                                  rating: newReview.rating,
                                  comment: newReview.comment.trim()
                                });

                                if (success) {
                                  // Recarregar todas as avaliações de todos os produtos do pedido
                                  if (selectedOrder && selectedOrder.products) {
                                    const reviewsMap: Record<string, Review[]> = {};
                                    
                                    for (const prod of selectedOrder.products) {
                                      const productKey = `${prod.id || ''}_${prod.name}`;
                                      const updatedReviews = await getProductReviews(prod.id || '', prod.name);
                                      reviewsMap[productKey] = updatedReviews;
                                    }
                                    
                                    setProductReviews(reviewsMap);
                                  } else {
                                    // Fallback: atualizar apenas o produto avaliado
                                    const productKey = `${selectedProductForReview.id || ''}_${selectedProductForReview.name}`;
                                    const updatedReviews = await getProductReviews(selectedProductForReview.id || '', selectedProductForReview.name);
                                    setProductReviews({ ...productReviews, [productKey]: updatedReviews });
                                  }
                                  
                                  alert('Avaliação enviada com sucesso!');
                                  setShowReviewModal(false);
                                  setSelectedProductForReview(null);
                                  setNewReview({ rating: 0, comment: '' });
                                } else {
                                  alert('Erro ao enviar avaliação. Tente novamente.');
                                }
                                
                                setSubmittingReview(false);
                              }}
                              disabled={submittingReview}
                            >
                              {submittingReview ? 'Enviando...' : 'Enviar Avaliação'}
                            </button>
                            <button
                              className={styles.cancelReviewButton}
                              onClick={() => {
                                setShowReviewModal(false);
                                setSelectedProductForReview(null);
                                setNewReview({ rating: 0, comment: '' });
                              }}
                              disabled={submittingReview}
                              style={{
                                background: '#fff',
                                color: '#23262b',
                                border: '2px solid #d0d0d0',
                                padding: '14px 32px',
                                borderRadius: '12px',
                                fontSize: '1.05rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                minWidth: '180px'
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'carrinho' && (
          <div className={styles.section}>
            <h2>Meu Carrinho</h2>
            {cart.length === 0 ? (
              <p>Seu carrinho está vazio.</p>
            ) : (
              <>
                <div className={styles.cartItems}>
                  {cart.map((item, index) => (
                    <div key={index} className={styles.cartItem}>
                      <div className={styles.itemImage}>
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className={styles.itemInfo}>
                        <h3>{item.name}</h3>
                        <p className={styles.price}>{item.price}</p>
                      </div>
                      <button 
                        className={styles.removeButton}
                        onClick={() => handleRemoveFromCart(index)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.cartSummary}>
                  <div className={styles.total}>
                    <span>Total:</span>
                    <span>R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                  <button 
                    className={styles.checkoutButton}
                    onClick={() => router.push('/checkout')}
                  >
                    Finalizar Compra
                  </button>
                  {cart.length > 1 && (
                    <button 
                      className={styles.checkoutButton}
                      style={{ marginTop: 10, background: '#1976d2', color: '#fff' }}
                      onClick={() => router.push('/checkout')}
                    >
                      Comprar todo o carrinho
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className={styles.section}>
            <div className={styles.header}>
              <h2>Dados Pessoais</h2>
              {!isEditing ? (
                <button className={styles.editButton} onClick={handleEdit}>
                  <FaEdit /> Editar Perfil
                </button>
              ) : (
                <div className={styles.editButtons}>
                  <button className={styles.saveButton} onClick={handleSaveProfile}>
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
                <h3>Informações Pessoais</h3>
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
                      disabled
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
                <h3>Endereço</h3>
                <div className={styles.addressGrid}>
                  <div className={styles.field}>
                    <label>
                      <FaMapPin /> CEP
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
                      <FaBuilding /> Cidade
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

                  <div className={styles.field}>
                    <label>
                      <FaHome /> Número
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
                      <FaHome /> Complemento
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="complemento"
                        value={editedData?.complemento || ''}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p>{userData.complemento}</p>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>
                      <FaHome /> Bairro
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
              </div>
            </div>
          </div>
        )}

        {activeTab === 'favoritos' && (
          <div className={styles.section}>
            <h2>Meus Favoritos</h2>
            {message.text && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}
            <div className={styles.favoritesList}>
              {productsLoading ? (
                <p>Carregando...</p>
              ) : favoriteProducts.length === 0 ? (
                <p>Você ainda não tem produtos favoritos.</p>
              ) : (
                <div className={styles.productsGrid}>
                  {favoriteProducts.map((product) => (
                    <div key={product.id} className={styles.productCard}>
                      <img src={product.image} alt={product.name} />
                      <h3>{product.name}</h3>
                      <p className={styles.price}>R$ {product.price.toFixed(2)}</p>
                      {product.specifications && (
                        <div className={styles.specifications}>
                          {Object.entries(product.specifications).map(([key, value]) => (
                            <p key={key} className={styles.spec}>
                              <strong>{key}:</strong> {value}
                            </p>
                          ))}
                        </div>
                      )}
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className={styles.addToCartButton}
                        >
                          <FaShoppingCart /> Adicionar ao Carrinho
                        </button>
                        <button
                          onClick={() => handleRemoveFromFavorites(product.id)}
                          className={styles.removeButton}
                        >
                          <FaTrash /> Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 