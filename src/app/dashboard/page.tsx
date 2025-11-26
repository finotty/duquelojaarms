"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FaBox, FaUser, FaHeart, FaSignOutAlt, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaIdCard, FaAddressCard, FaCalendarAlt, FaHome, FaBuilding, FaMapPin, FaTrash, FaShoppingCart, FaWhatsapp } from 'react-icons/fa';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import Image from 'next/image';
import styles from './styles.module.scss';
import ProductImage from '@/components/ProductImage';

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
                      {selectedOrder.products?.map((prod: any, idx: number) => (
                        <div key={idx} className={styles.modalOrderProductCard}>
                          <ProductImage image={prod.image} alt={prod.name} style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 4, background: '#fff' }} />
                          <div className={styles.modalProductInfo}>
                            <strong>{prod.name}</strong>
                            <div className={styles.modalProductDetails}>
                            
                              <span>{prod.price}</span>
                            </div>
                            {selectedOrder.formaPagamento === 'Cartão de crédito' && (
                              <div className={styles.modalParcelas}>{prod.parcelas}x de {(typeof prod.price === 'number' ? prod.price : parseFloat(String(prod.price).replace('R$', '').replace('.', '').replace(',', '.'))/prod.parcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                            )}
                          </div>
                        </div>
                      ))}
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