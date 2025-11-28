"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./styles.module.scss";
import ProdutosQuePodemInteressar from "../produtos-que-podem-interessar";
import ProductImage from "../ProductImage";
import { useCart } from "../../context/CartContext";
import { useRouter } from 'next/navigation';
import { useAuth } from "../../context/AuthContext";
import { FaStar, FaRegStar } from "react-icons/fa";
import * as produtosData from "../../data/products";
import { getFirestore, doc, getDoc, addDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import emailjs from 'emailjs-com';

// Cache para produtos do Firebase
let firebaseProductsCache: any[] | null = null;

async function getProductFromFirebase(id: string): Promise<any> {
  try {
    // Se já temos cache, usa ele
    if (!firebaseProductsCache) {
      const dados = getFirestore(db.app);
      
      // Buscar produtos da coleção 'products'
      const productsRef = collection(dados, "products");
      const productsSnapshot = await getDocs(productsRef);
      const productsData = productsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data()
      }));

      // Buscar produtos personalizados da coleção 'customProducts'
      const customProductsRef = collection(dados, "customProducts");
      const customProductsSnapshot = await getDocs(customProductsRef);
      const customProductsData = customProductsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        firestoreId: doc.id,
        ...doc.data()
      }));

      firebaseProductsCache = [...productsData, ...customProductsData];
    }

    // Buscar por ID ou firestoreId
    return firebaseProductsCache.find((p: any) => p.id === id || p.firestoreId === id);
  } catch (error) {
    console.error('Erro ao buscar produto do Firebase:', error);
    return null;
  }
}

function getProductDataById(id: string) {
  const preConfigured = produtosData.preConfiguredProducts.find((p: any) => p.id === id);
  const esporte = produtosData.sportEquipment.find((p: any) => p.id === id);
  const tactical = produtosData.tacticalEquipment.find((p: any) => p.id === id);
  return preConfigured || tactical || esporte;
}

function getProductDataByName(name: string) {
  const preConfigured = produtosData.preConfiguredProducts.find((p: any) => p.name === name);
  const esporte = produtosData.sportEquipment.find((p: any) => p.name === name);
  const tactical = produtosData.tacticalEquipment.find((p: any) => p.name === name);
  return preConfigured || tactical || esporte;
}

async function getProductData(item: { id?: string; name: string }) {
  // Tenta buscar por ID primeiro (mais confiável)
  if (item.id) {
    // Primeiro tenta nos dados pré-configurados
    const productById = getProductDataById(item.id);
    if (productById) return productById;
    
    // Se não encontrar, tenta no Firebase
    const productFromFirebase = await getProductFromFirebase(item.id);
    if (productFromFirebase) return productFromFirebase;
  }
  // Se não encontrar por ID, tenta por nome
  return getProductDataByName(item.name);
}

const perguntasFrequentes = [
  {
    pergunta: "Como funciona a entrega?",
    resposta: "A entrega é realizada por transportadora especializada, com seguro e rastreamento." 
  },
  {
    pergunta: "Quais as formas de pagamento?",
    resposta: "Aceitamos cartão de crédito, débito, Pix e boleto bancário. Parcelamento em até 10x sem juros." 
  },
  {
    pergunta: "Preciso de documentação?",
    resposta: "Sim, é necessário apresentar toda a documentação exigida por lei para compra de armas de fogo." 
  },
];

// Interface para avaliações
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

// Função para verificar se o usuário comprou o produto
async function hasUserPurchasedProduct(userId: string, productId: string, productName: string): Promise<boolean> {
  try {
    const dados = getFirestore(db.app);
    const ordersRef = collection(dados, "orders");
    // Buscar todos os pedidos do usuário (não apenas concluídos)
    const ordersQuery = query(
      ordersRef,
      where("user.uid", "==", userId)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();
      if (orderData.products && Array.isArray(orderData.products)) {
        const hasProduct = orderData.products.some((prod: any) => 
          (productId && prod.id === productId) || prod.name === productName
        );
        if (hasProduct) return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar compra do produto:', error);
    return false;
  }
}

// Função para buscar avaliações de um produto
async function getProductReviews(productId: string, productName: string): Promise<Review[]> {
  try {
    const dados = getFirestore(db.app);
    const reviewsRef = collection(dados, "reviews");
    
    const reviews: Review[] = [];
    const seenIds = new Set<string>();
    
    // Buscar por nome do produto (mais confiável)
    if (productName) {
      const reviewsByNameQuery = query(
        reviewsRef,
        where("productName", "==", productName)
      );
      const reviewsByNameSnapshot = await getDocs(reviewsByNameQuery);
      reviewsByNameSnapshot.forEach((doc) => {
        if (!seenIds.has(doc.id)) {
          const reviewData = doc.data();
          // Se tiver productId, verificar se corresponde
          // Se não tiver productId na review ou no produto, aceitar se o nome corresponder
          const reviewProductId = reviewData.productId || '';
          const searchProductId = productId || '';
          
          // Aceitar se:
          // 1. Ambos têm ID e são iguais
          // 2. Ambos estão vazios (sem ID)
          // 3. O produto buscado não tem ID mas a review tem (pode ser o mesmo produto)
          // 4. A review não tem ID mas o produto tem (pode ser o mesmo produto)
          if (reviewProductId === searchProductId || 
              (reviewProductId === '' && searchProductId === '') ||
              (searchProductId === '' && reviewProductId !== '') ||
              (reviewProductId === '' && searchProductId !== '')) {
            reviews.push({
              id: doc.id,
              ...reviewData
            } as Review);
            seenIds.add(doc.id);
          }
        }
      });
    }
    
    // Se tiver productId e ainda não encontrou, buscar também por ID
    if (productId && productId.trim() !== '' && reviews.length === 0) {
      const reviewsQuery = query(
        reviewsRef,
        where("productId", "==", productId)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      reviewsSnapshot.forEach((doc) => {
        if (!seenIds.has(doc.id)) {
          const reviewData = doc.data();
          // Verificar se o nome também corresponde
          if (reviewData.productName === productName) {
            reviews.push({
              id: doc.id,
              ...reviewData
            } as Review);
            seenIds.add(doc.id);
          }
        }
      });
    }
    
    // Ordenar por data (mais recentes primeiro)
    return reviews.sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return [];
  }
}

// Função para calcular média de avaliações
function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10; // Arredonda para 1 casa decimal
}

// Função para adicionar avaliação
async function addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<boolean> {
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
}

// Função para enviar e-mail via EmailJS
const sendOrderEmail = async (order: any) => {
  // Substitua pelos seus IDs do EmailJS
  const serviceID = 'SEU_SERVICE_ID';
  const templateID = 'SEU_TEMPLATE_ID';
  const userID = 'SEU_USER_ID';

  // Montar mensagem do pedido
  const productList = order.products.map((prod: any) => `- ${prod.name} (Qtd: ${prod.quantity})`).join('\n');
  const templateParams = {
    user_name: order.user.nomeCompleto,
    user_email: order.user.email,
    order_total: order.total,
    order_products: productList,
    order_date: order.createdAt.toLocaleString('pt-BR'),
  };

  try {
    await emailjs.send(serviceID, templateID, templateParams, userID);
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
  }
};

// Função para enviar pedido para WhatsApp
const sendOrderWhatsApp = (order: any) => {
  // Substitua pelo número do WhatsApp do vendedor (apenas números, com DDI, ex: 5511999999999)
  const phone = '+5521987604846';
  const productList = order.products.map((prod: any) => `- ${prod.name} (Qtd: ${prod.quantity})`).join('%0A');
  const msg = `Novo pedido no site!%0A%0ACliente: ${order.user.nomeCompleto}%0AEmail: ${order.user.email}%0ATotal: R$ ${order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%0AProdutos:%0A${productList}%0AData: ${order.createdAt.toLocaleString('pt-BR')}`;
  const url = `https://wa.me/${phone}?text=${msg}`;
  window.open(url, '_blank');
};

export default function Carrinho() {
  const { cart, handleQty, removeFromCart, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState<{[key: number]: number}>({});
  const [nomeCompleto, setNomeCompleto] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('Cartão de crédito');
  const [parcelas, setParcelas] = useState(1);
  const [telefone, setTelefone] = useState<string | null>(null);
  const [productsSpecs, setProductsSpecs] = useState<Record<number, Record<string, string>>>({});

  // Estados para o zoom
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomType, setZoomType] = useState<'img' | 'svg' | null>(null);
  const [svgViewBox, setSvgViewBox] = useState<{ width: number; height: number }>({ width: 520, height: 420 });
  const imageRef = useRef<HTMLDivElement | null>(null);

  // Estados para avaliações
  const [productReviews, setProductReviews] = useState<Record<string, Review[]>>({});
  const [productRatings, setProductRatings] = useState<Record<string, number>>({});
  const [canReview, setCanReview] = useState<Record<string, boolean>>({});
  const [showReviewForm, setShowReviewForm] = useState<Record<string, boolean>>({});
  const [newReview, setNewReview] = useState<Record<string, { rating: number; comment: string }>>({});
  const [submittingReview, setSubmittingReview] = useState<Record<string, boolean>>({});
  const [showReviewsModal, setShowReviewsModal] = useState<string | null>(null); // productKey do produto cujas avaliações estão sendo visualizadas

  // Função para extrair o viewBox do SVG
  function extractViewBox(svgString: string): { width: number; height: number } {
    const match = svgString.match(/viewBox=["'](\d+)[ ,]+(\d+)[ ,]+(\d+)[ ,]+(\d+)["']/);
    if (match) {
      const width = parseFloat(match[3]);
      const height = parseFloat(match[4]);
      return { width, height };
    }
    // fallback: tenta pegar width/height direto
    const widthMatch = svgString.match(/width=["'](\d+)["']/);
    const heightMatch = svgString.match(/height=["'](\d+)["']/);
    if (widthMatch && heightMatch) {
      return { width: parseFloat(widthMatch[1]), height: parseFloat(heightMatch[1]) };
    }
    return { width: 520, height: 420 };
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const dados = getFirestore(db.app);
          const userDoc = doc(dados, "users", user.uid);
          const userSnapshot = await getDoc(userDoc);
          
          console.log('Dados encontrados:', userSnapshot.exists());
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            console.log('Dados do usuário:', userData);
            setNomeCompleto(userData.nomeCompleto);
            setTelefone(userData.telefone);
          } else {
            console.log('Documento do usuário não encontrado');
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      };
      fetchUserData();
    }
  }, [user]);

  // Buscar especificações dos produtos do carrinho
  useEffect(() => {
    const fetchSpecs = async () => {
      const specsMap: Record<number, Record<string, string>> = {};
      
      for (let idx = 0; idx < cart.length; idx++) {
        const item = cart[idx];
        
        // Se já tem specifications no item, usa ele
        if (item.specifications && Object.keys(item.specifications).length > 0) {
          specsMap[idx] = Object.fromEntries(
            Object.entries(item.specifications).filter(
              ([_, v]) => typeof v === 'string' && v !== undefined && v.trim() !== ''
            )
          ) as Record<string, string>;
          continue;
        }
        
        // Tenta buscar nos dados do produto
        try {
          const productData = await getProductData(item);
          if (productData?.specifications) {
            const filteredSpecs = Object.fromEntries(
              Object.entries(productData.specifications).filter(
                ([_, v]) => typeof v === 'string' && v !== undefined && v.trim() !== ''
              )
            ) as Record<string, string>;
            
            if (Object.keys(filteredSpecs).length > 0) {
              specsMap[idx] = filteredSpecs;
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar especificações do produto ${item.name}:`, error);
        }
      }
      
      setProductsSpecs(specsMap);
    };

    if (cart.length > 0) {
      fetchSpecs();
    } else {
      setProductsSpecs({});
    }
  }, [cart]);

  // Buscar avaliações dos produtos e verificar se usuário pode avaliar
  useEffect(() => {
    const fetchReviews = async () => {
      if (!user || cart.length === 0) {
        setProductReviews({});
        setProductRatings({});
        setCanReview({});
        return;
      }

      const reviewsMap: Record<string, Review[]> = {};
      const ratingsMap: Record<string, number> = {};
      const canReviewMap: Record<string, boolean> = {};

      for (const item of cart) {
        // Usar a mesma chave que é usada no dashboard: id_name
        const productKey = `${item.id || ''}_${item.name}`;
        
        // Buscar avaliações
        const reviews = await getProductReviews(item.id || '', item.name);
        reviewsMap[productKey] = reviews;
        
        // Calcular média
        const avgRating = calculateAverageRating(reviews);
        ratingsMap[productKey] = avgRating;
        
        // Verificar se usuário já avaliou
        const userHasReviewed = reviews.some(r => r.userId === user.uid);
        
        // Verificar se usuário comprou o produto
        if (!userHasReviewed) {
          const hasPurchased = await hasUserPurchasedProduct(user.uid, item.id || '', item.name);
          canReviewMap[productKey] = hasPurchased;
        } else {
          canReviewMap[productKey] = false;
        }
      }

      setProductReviews(reviewsMap);
      setProductRatings(ratingsMap);
      setCanReview(canReviewMap);
    };

    fetchReviews();
  }, [cart, user]);

  const total = cart.reduce((acc, item) => {
    let valorNumerico = typeof item.price === 'number'
      ? item.price
      : parseFloat(String(item.price)
          .replace('R$', '')
          .trim()
          .replace(/\./g, '')  // Remove pontos de milhar
          .replace(',', '.')); // Substitui vírgula por ponto
    const price = isNaN(valorNumerico) ? 0 : valorNumerico * item.quantity;
    return acc + price;
  }, 0);

  // Valor total com desconto se for Pix/Boleto
  const totalComDesconto = +(total * 0.85).toFixed(2);
  const isDesconto = formaPagamento === 'Pix' || formaPagamento === 'Boleto';

  const handleCheckout = async () => {
    if (!user) {
      localStorage.setItem('redirectAfterLogin', '/carrinho');
      window.location.href = '/login';
      return;
    }

    setLoadingCheckout(true);

    // Coletar dados do usuário
    const userData = {
      uid: user.uid,
      email: user.email,
      nomeCompleto: nomeCompleto || '',
      telefone: telefone || '',
    };

    // Coletar produtos do carrinho, incluindo parcelas por produto
    const products = cart.map((item, idx) => ({
      id: item.id || '', // Incluir o ID do produto
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      parcelas: formaPagamento === 'Cartão de crédito' ? (parcelasSelecionadas[idx] || 1) : 1,
    }));

    // Montar dados do pedido
    const order = {
      user: userData,
      products,
      total: isDesconto ? totalComDesconto : total,
      createdAt: new Date(),
      status: 'Pendente',
      formaPagamento,
    };

    try {
      // Salvar no Firestore
      await addDoc(collection(db, 'orders'), order);
      // Enviar e-mail
      await sendOrderEmail(order);
      // Enviar WhatsApp
     // sendOrderWhatsApp(order);
      setOrderData(order);
      clearCart();
      setShowOrderModal(true);
    } catch (error) {
      alert('Erro ao finalizar pedido. Tente novamente.');
      console.error('Erro ao salvar pedido:', error);
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (authLoading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  // Se o usuário já estiver logado, mostre a tela final de compra/checkout
  return (
    <div className={styles.wrapper}>
    
        <div className={styles.cartSectionProfissional}>
          {cart.length > 1 && (
            <button
              className={styles.checkoutButtonGrande1}
              style={{ marginBottom: 24, background: '#1976d2', color: '#fff', alignSelf: 'center', maxWidth: 340 }}
              onClick={handleCheckout}
              disabled={loadingCheckout}
            >
              {loadingCheckout ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className={styles.spinner} />
                  Finalizando...
                </span>
              ) : (
                'Comprar todo o carrinho'
              )}
            </button>
          )}
          {cart.length === 0 ? (
            <div className={styles.emptyCartMsg}>Seu carrinho está vazio.</div>
          ) : (
            cart.map((item, idx) => {
              // Busca síncrona para o código do produto (usa dados pré-configurados)
              const productData = item.id ? getProductDataById(item.id) : getProductDataByName(item.name);
              let valorNumerico = typeof item.price === 'number'
                ? item.price
                : parseFloat(String(item.price)
                    .replace('R$', '')
                    .trim()
                    .replace(/\./g, '')  // Remove pontos de milhar
                    .replace(',', '.')); // Substitui vírgula por ponto
              const parcelas = parcelasSelecionadas[idx] || 10;
              const valorComDesconto = +(valorNumerico * 0.85).toFixed(2);
              return (
                <div className={styles.productBox} key={idx}>
                  <div className={styles.productImageArea}>
                    <div
                      ref={imageRef}
                      className={styles.productImageContainer}
                      onMouseEnter={() => {
                        setZoomActive(true);
                        setZoomImage(item.image);
                        setZoomType(item.image.startsWith('<svg') ? 'svg' : 'img');
                        if (item.image.startsWith('<svg')) {
                          setSvgViewBox(extractViewBox(item.image));
                        }
                      }}
                      onMouseLeave={() => {
                        setZoomActive(false);
                        setZoomImage(null);
                      }}
                      onMouseMove={e => {
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        setZoomPosition({ x, y });
                      }}
                    >
                      <ProductImage
                        image={item.image}
                        alt={item.name}
                        className={styles.productImageGrande}
                        
                      />
                      {/* Modal de Zoom */}
                      {zoomActive && zoomImage === item.image && (
                        <div className={styles.zoomModal} style={{ left: '540px', top: 0 }}>
                          {zoomType === 'img' ? (
                            <div
                              className={styles.zoomImgBox}
                              style={{
                                backgroundImage: `url(${zoomImage})`,
                                backgroundPosition: `${-zoomPosition.x * 2 + 150}px ${-zoomPosition.y * 2 + 150}px`,
                                backgroundSize: '1040px 840px',
                                width: 300,
                                height: 300,
                                borderRadius: 12,
                                border: '2px solid #ffec70',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                                backgroundRepeat: 'no-repeat',
                              }}
                            />
                          ) : (
                            <div
                              className={styles.zoomImgBox}
                              style={{
                                width: 300,
                                height: 300,
                                borderRadius: 12,
                                border: '2px solid #ffec70',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                                overflow: 'hidden',
                                background: '#fff',
                                position: 'relative',
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <div
                                style={{
                                  width: svgViewBox.width,
                                  height: svgViewBox.height,
                                  transform: `scale(2)`,
                                  transformOrigin: `${(zoomPosition.x / 520) * svgViewBox.width}px ${(zoomPosition.y / 420) * svgViewBox.height}px`,
                                  pointerEvents: 'none',
                                  display: 'block',
                                }}
                                dangerouslySetInnerHTML={{ __html: zoomImage || '' }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                    
                  <div className={styles.productInfoArea}>
                    <div className={styles.productInfoAreaTop}>
                      <h2 className={styles.productName}>{item.name}</h2>
                      <button className={styles.removeBtn} title="Remover" onClick={() => removeFromCart(idx)}>🗑️</button>
                    </div>
                    <div className={styles.ratingArea}>
                      {(() => {
                        const productKey = `${item.id || ''}_${item.name}`;
                        const avgRating = productRatings[productKey] || 0;
                        const reviews = productReviews[productKey] || [];
                        const roundedRating = Math.round(avgRating);
                        return [1,2,3,4,5].map(i => 
                          i <= roundedRating ? 
                            <FaStar key={i} color="#f0b63d" /> : 
                            <FaRegStar key={i} color="#f0b63d" />
                        );
                      })()}
                      <span 
                        className={styles.reviews}
                        style={{ 
                          cursor: (() => {
                            const productKey = `${item.id || ''}_${item.name}`;
                            const reviews = productReviews[productKey] || [];
                            return reviews.length > 0 ? 'pointer' : 'default';
                          })(),
                          textDecoration: (() => {
                            const productKey = `${item.id || ''}_${item.name}`;
                            const reviews = productReviews[productKey] || [];
                            return reviews.length > 0 ? 'underline' : 'none';
                          })()
                        }}
                        onClick={() => {
                          const productKey = `${item.id || ''}_${item.name}`;
                          const reviews = productReviews[productKey] || [];
                          if (reviews.length > 0) {
                            setShowReviewsModal(productKey);
                          }
                        }}
                      >
                        {(() => {
                          const productKey = `${item.id || ''}_${item.name}`;
                          const reviews = productReviews[productKey] || [];
                          const avgRating = productRatings[productKey] || 0;
                          return (
                            <>
                              ({reviews.length} avaliações)
                              {avgRating > 0 && (
                                <span style={{ marginLeft: '8px', fontWeight: 600 }}>
                                  {avgRating.toFixed(1)}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </span>
                    </div>
                    <div className={styles.productCode}>Cód: {productData?.id || '---'}</div>
                    <div className={styles.productPrice}>
                      <span>Por Apenas:</span>
                      {isDesconto
                        ? valorComDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : item.price}
                    </div>
                    <div className={styles.productInstallments}>
                      <span className={styles.installment1 + (isDesconto ? ' ' + styles.installmentsDisabled : '')}>Em até</span>
                      <select
                        value={parcelas}
                        onChange={e => setParcelasSelecionadas({ ...parcelasSelecionadas, [idx]: Number(e.target.value) })}
                        className={styles.selectParcelas + (isDesconto ? ' ' + styles.installmentsDisabled : '')}
                        disabled={isDesconto}
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>
                            <span className={styles.installment}>{num}x</span> de { (valorNumerico/num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
                          </option>
                        ))}
                      </select>
                      <span className={styles.installment1 + (isDesconto ? ' ' + styles.installmentsDisabled : '')}>sem juros</span>
                    </div>
                    {isDesconto && (
                      <div className={styles.pix}>
                        <span className={styles.pixText}>Valor com desconto:</span>
                        <span className={styles.pixValue}>
                          {valorComDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <span className={styles.pixText}> no {formaPagamento} (15% desconto)</span>
                      </div>
                    )}
                    {!isDesconto && (
                      <div className={styles.pix}>
                        <span className={styles.pixText}>ou </span>
                        <span className={styles.pixValue}>
                          {((valorNumerico * 0.85).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))} 
                        </span>
                        <span className={styles.pixText}> no Pix, Boleto ou transferência à vista (15% desconto)</span>
                      </div>
                    )}
                    <div style={{ marginTop: 18, marginBottom: 8 }}>
                      <label style={{ fontWeight: 600, color: '#23262b', marginRight: 12 }}>Forma de Pagamento:</label>
                      <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}>
                        <option value="Cartão de crédito">Cartão de crédito</option>
                        <option value="Pix">Pix</option>
                        <option value="Boleto">Boleto</option>
                      </select>
                    </div>
                    <div className={styles.imgText}>
                      <span>IMAGENS MERAMENTE ILUSTRATIVAS.</span>
                    </div>
                 
                    <button 
                      className={styles.checkoutButtonGrande} 
                      onClick={handleCheckout}
                      disabled={loadingCheckout}
                    >
                      {loadingCheckout ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <span className={styles.spinner} />
                          Finalizando...
                        </span>
                      ) : (
                        'Finalizar Compra'
                      )}
                    </button>
                  </div>
                  
                </div>
              );
            })
          )}
        </div>
        
        {/* Descrição do produto */}
        {cart.length > 0 && (
          <div className={styles.productDescriptionBox}>
            <h3 className={styles.productDescriptionBoxTitle}>Descrição do Produto</h3>
            {cart.map((item, idx) => {
              const specs = productsSpecs[idx];
              
              return (
                <div key={idx} className={styles.productDescription}>
                  <h4>{item.name}</h4>
                  {specs && Object.keys(specs).length > 0 ? (
                    <div className={styles.specifications}>
                      {Object.entries(specs).map(([key, value]) => (
                        <div key={key} className={styles.specification}>
                          <span className={styles.specLabel}>{key}:</span>
                          <span className={styles.specValue}>{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#b0b0b0', fontStyle: 'italic' }}>
                      Especificações não disponíveis para este produto.
                    </p>
                  )}
                </div>
              );
            })}
        
          </div>
        )}
        {/* Perguntas Frequentes */}
        <div className={styles.faqBox}>
          <h3 className={styles.faqBoxTitle}>Perguntas Frequentes</h3>
          {perguntasFrequentes.map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <button className={styles.faqQuestion} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                {faq.pergunta}
              </button>
              {faqOpen === i && <div className={styles.faqAnswer}>{faq.resposta}</div>}
            </div>
          ))}
        </div>
        {/* Avaliações dos Clientes */}
        {cart.length > 0 && cart.map((item, idx) => {
          const productKey = `${item.id || ''}_${item.name}`;
          const reviews = productReviews[productKey] || [];
          const canUserReview = canReview[productKey] || false;
          const showForm = showReviewForm[productKey] || false;
          const reviewData = newReview[productKey] || { rating: 0, comment: '' };
          const isSubmitting = submittingReview[productKey] || false;

          return (
            <div key={`reviews-${idx}`} className={styles.avaliacoesBox}>
              <h3 className={styles.avaliacoesBoxTitle}>Avaliações - {item.name}</h3>
              
              {/* Formulário de avaliação */}
              {canUserReview && !showForm && (
                <button 
                  className={styles.addReviewButton}
                  onClick={() => setShowReviewForm({ ...showReviewForm, [productKey]: true })}
                >
                  Avaliar este produto
                </button>
              )}

              {showForm && user && (
                <div className={styles.reviewForm}>
                  <h4>Avaliar {item.name}</h4>
                  <div className={styles.ratingInput}>
                    <span>Avaliação:</span>
                    <div className={styles.starRating}>
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          className={styles.starButton}
                          onClick={() => setNewReview({
                            ...newReview,
                            [productKey]: { ...reviewData, rating: star }
                          })}
                        >
                          {star <= reviewData.rating ? 
                            <FaStar color="#f0b63d" size={24} /> : 
                            <FaRegStar color="#f0b63d" size={24} />
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    className={styles.reviewCommentInput}
                    placeholder="Deixe seu comentário sobre o produto..."
                    value={reviewData.comment}
                    onChange={(e) => setNewReview({
                      ...newReview,
                      [productKey]: { ...reviewData, comment: e.target.value }
                    })}
                    rows={4}
                  />
                  <div className={styles.reviewFormActions}>
                    <button
                      className={styles.submitReviewButton}
                      onClick={async () => {
                        if (reviewData.rating === 0 || !reviewData.comment.trim()) {
                          alert('Por favor, selecione uma avaliação e escreva um comentário.');
                          return;
                        }

                        setSubmittingReview({ ...submittingReview, [productKey]: true });
                        
                        const dados = getFirestore(db.app);
                        const userDoc = doc(dados, "users", user.uid);
                        const userSnapshot = await getDoc(userDoc);
                        const userName = userSnapshot.exists() ? userSnapshot.data().nomeCompleto : user.email?.split('@')[0] || 'Usuário';

                        const success = await addReview({
                          productId: item.id || '',
                          productName: item.name,
                          userId: user.uid,
                          userName: userName,
                          rating: reviewData.rating,
                          comment: reviewData.comment.trim()
                        });

                        if (success) {
                          // Recarregar todas as avaliações de todos os produtos do carrinho
                          const reviewsMap: Record<string, Review[]> = {};
                          const ratingsMap: Record<string, number> = {};
                          const canReviewMap: Record<string, boolean> = { ...canReview };

                          for (const cartItem of cart) {
                            const cartProductKey = `${cartItem.id || ''}_${cartItem.name}`;
                            const updatedReviews = await getProductReviews(cartItem.id || '', cartItem.name);
                            reviewsMap[cartProductKey] = updatedReviews;
                            ratingsMap[cartProductKey] = calculateAverageRating(updatedReviews);
                            
                            // Atualizar canReview apenas para o produto que foi avaliado
                            if (cartProductKey === productKey) {
                              canReviewMap[cartProductKey] = false;
                            } else {
                              // Verificar se usuário já avaliou
                              const userHasReviewed = updatedReviews.some(r => r.userId === user.uid);
                              if (!userHasReviewed) {
                                const hasPurchased = await hasUserPurchasedProduct(user.uid, cartItem.id || '', cartItem.name);
                                canReviewMap[cartProductKey] = hasPurchased;
                              } else {
                                canReviewMap[cartProductKey] = false;
                              }
                            }
                          }

                          setProductReviews(reviewsMap);
                          setProductRatings(ratingsMap);
                          setCanReview(canReviewMap);
                          setShowReviewForm({ ...showReviewForm, [productKey]: false });
                          setNewReview({ ...newReview, [productKey]: { rating: 0, comment: '' } });
                          alert('Avaliação enviada com sucesso!');
                        } else {
                          alert('Erro ao enviar avaliação. Tente novamente.');
                        }
                        
                        setSubmittingReview({ ...submittingReview, [productKey]: false });
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
                    </button>
                    <button
                      className={styles.cancelReviewButton}
                      onClick={() => {
                        setShowReviewForm({ ...showReviewForm, [productKey]: false });
                        setNewReview({ ...newReview, [productKey]: { rating: 0, comment: '' } });
                      }}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de avaliações */}
              {reviews.length > 0 ? (
                <div className={styles.avaliacoesList}>
                  {reviews.map((review) => (
                    <div key={review.id} className={styles.avaliacaoItem}>
                      <div className={styles.avaliacaoHeader}>
                        <div className={styles.avaliacaoNome}>{review.userName}</div>
                        <div className={styles.avaliacaoNota}>
                          {[1,2,3,4,5].map(j => 
                            j <= review.rating ? 
                              <FaStar key={j} color="#f0b63d" size={16} /> : 
                              <FaRegStar key={j} color="#f0b63d" size={16} />
                          )}
                        </div>
                      </div>
                      <div className={styles.avaliacaoComentario}>{review.comment}</div>
                      <div className={styles.avaliacaoDate}>
                        {review.createdAt instanceof Timestamp 
                          ? new Date(review.createdAt.toMillis()).toLocaleDateString('pt-BR')
                          : new Date(review.createdAt).toLocaleDateString('pt-BR')
                        }
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noReviews}>Ainda não há avaliações para este produto.</p>
              )}
            </div>
          );
        })}
        {/* Novo: Seção de Procedimento para Compra de Arma de Fogo */}
        <div className={styles.purchaseProcedureSection}>
          <h2>Procedimento Compra de Arma de Fogo</h2>
          <ol>
            <li>
              <strong>Compra:</strong> O primeiro processo é o de compra, onde o usuário poderá escolher o modelo da arma desejada e aguardar as informações contratuais e da loja para prosseguir com a autorização de compra. Antes de realizar a compra da arma o cliente deverá entrar em contato e confirmar a disponibilidade de envio da arma para sua região.
            </li>
            <li>
              <strong>Autorização Deferida:</strong> Após receber o contrato e os dados, o cliente iniciará o processo de autorização de compras junto ao órgão de sua escolha responsável por realizar esse procedimento. Uma vez que a autorização for DEFERIDA, o cliente deverá nos enviar uma cópia nítida escaneada da mesma através do e-mail CONTATO@DUQUEARMAS.COM.
            </li>
            <li>
              <strong>Nota:</strong> Ao recebermos a AUTORIZAÇÃO DE COMPRAS e verificarmos se está correta, encaminharemos o pedido ao setor responsável pela emissão das notas fiscais, que será processada em até 07 dias úteis. Com a nota fiscal em mãos, o cliente poderá dar continuidade ao processo de registro da arma de fogo.
            </li>
            <li>
              <strong>Registro Deferido:</strong> Após o deferimento do registro, o cliente deverá enviar, via e-mail para CONTATO@DUQUEARMAS.COM, uma cópia escaneada e nítida do seu registro emitido pelo Exército ou Polícia Federal, juntamente com um documento de identificação com foto, como RG, CNH ou documento funcional. Após o envio dos documentos, o cliente aguardará o contato do SETOR RESPONSÁVEL, que ocorrerá em até 24 horas, via WhatsApp ou e-mail. Esse contato será feito para organizar todas as questões referentes ao envio da arma.
            </li>
          </ol>
        </div>
       {/* <ProdutosQuePodemInteressar/> */}
        {showOrderModal && orderData && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <button className={styles.closeButton} onClick={() => { setShowOrderModal(false); setOrderData(null); clearCart(); }}>×</button>
              <h2 style={{ color: '#23262b', fontWeight: 700, fontSize: '1.6rem', marginBottom: 8, textAlign: 'center' }}>Pedido realizado com sucesso!</h2>
              <p style={{ color: '#444', fontSize: '1.08rem', marginBottom: 18, textAlign: 'center' }}>
                Seu pedido está sendo analisado. Em breve um vendedor entrará em contato para finalizar a compra.
              </p>
              <h3 style={{ color: '#f0b63d', fontWeight: 700, fontSize: '1.18rem', margin: '10px 0 8px 0', textAlign: 'center' }}>Resumo do Pedido</h3>
              <div className={styles.orderResumo}>
                <div><strong>Nome:</strong> {orderData.user.nomeCompleto}</div>
                <div><strong>Email:</strong> {orderData.user.email}</div>
                <div><strong>Telefone:</strong> {orderData.user.telefone}</div>
                <div><strong>Total:</strong> R$ {orderData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div><strong>Forma de Pagamento:</strong> {orderData.formaPagamento}</div>
                <div><strong>Produtos:</strong></div>
                <div className={styles.orderProducts}>
                  {orderData.products.map((prod: any, idx: number) => (
                    <div key={idx} className={styles.orderProductCard}>
                      <ProductImage image={prod.image} alt={prod.name} style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 6 }}
                       
                      />
                      <div><strong>{prod.name}</strong></div>
                      <div>Qtd: {prod.quantity}</div>
                      <div>Preço: {prod.price}</div>
                      {orderData.formaPagamento === 'Cartão de crédito' && (
                        <div>Parcelas: {prod.parcelas}x de {(typeof prod.price === 'number' ? prod.price : parseFloat(String(prod.price).replace('R$', '').replace('.', '').replace(',', '.'))/prod.parcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Avaliações */}
        {showReviewsModal && productReviews[showReviewsModal] && (
          <div 
            className={styles.reviewsModalOverlay}
            onClick={() => setShowReviewsModal(null)}
          >
            <div 
              className={styles.reviewsModal}
              onClick={e => e.stopPropagation()}
            >
              <button 
                className={styles.reviewsModalCloseButton}
                onClick={() => setShowReviewsModal(null)}
              >
                ×
              </button>
              <h2 className={styles.reviewsModalTitle}>
                Avaliações - {(() => {
                  const productKey = showReviewsModal;
                  const item = cart.find(i => `${i.id || ''}_${i.name}` === productKey);
                  return item?.name || 'Produto';
                })()}
              </h2>
              <div className={styles.reviewsModalList}>
                {productReviews[showReviewsModal].map((review) => {
                  const reviewDate = review.createdAt instanceof Timestamp 
                    ? new Date(review.createdAt.toMillis())
                    : new Date(review.createdAt);
                  return (
                    <div key={review.id} className={styles.reviewsModalItem}>
                      <div className={styles.reviewsModalItemHeader}>
                        <div className={styles.reviewsModalItemUser}>
                          <strong>{review.userName || 'Usuário'}</strong>
                          <span className={styles.reviewsModalItemDate}>
                            {reviewDate.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className={styles.reviewsModalItemRating}>
                          {[1, 2, 3, 4, 5].map(star => (
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
                      <div className={styles.reviewsModalItemComment}>
                        {review.comment}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
 
}