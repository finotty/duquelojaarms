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
import { getFirestore, doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import emailjs from 'emailjs-com';

function getProductDataByName(name: string) {
  const preConfigured = produtosData.preConfiguredProducts.find((p: any) => p.name === name);
  const esporte = produtosData.sportEquipment.find((p: any) => p.name === name);
  const tactical = produtosData.tacticalEquipment.find((p: any) => p.name === name);
  return preConfigured || tactical || esporte;
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

const avaliacoesMock = [
  {
    nome: "João S.",
    nota: 5,
    comentario: "Produto excelente, entrega rápida e atendimento nota 10!",
  },
  {
    nome: "Maria F.",
    nota: 4,
    comentario: "Gostei muito, só achei o manual um pouco confuso.",
  },
  {
    nome: "Carlos P.",
    nota: 5,
    comentario: "Ótimo custo-benefício, recomendo!",
  },
];

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

  // Estados para o zoom
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomType, setZoomType] = useState<'img' | 'svg' | null>(null);
  const [svgViewBox, setSvgViewBox] = useState<{ width: number; height: number }>({ width: 520, height: 420 });
  const imageRef = useRef<HTMLDivElement | null>(null);

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
              const productData = getProductDataByName(item.name);
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
                      style={{ width: '520px', height: '420px', position: 'relative' }}
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
                        style={{ width: '520px', height: '420px' }}
                        
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
                      {[1,2,3,4,5].map(i => i <= 4 ? <FaStar key={i} color="#f0b63d" /> : <FaRegStar key={i} color="#f0b63d" />)}
                      <span className={styles.reviews}>(12 avaliações)</span>
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
              // Se o produto tem specifications no próprio item, use ele (personalizado)
              const specs = item.specifications || getProductDataByName(item.name)?.specifications;
              return (
                <div key={idx} className={styles.productDescription}>
                  <h4>{item.name}</h4>
                  {specs && (
                    <div className={styles.specifications}>
                      {Object.entries(specs).map(([key, value]) => (
                        <div key={key} className={styles.specification}>
                          <span className={styles.specLabel}>{key}:</span>
                          <span className={styles.specValue}>{value}</span>
                        </div>
                      ))}
                    </div>
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
        {/*
        <div className={styles.avaliacoesBox}>
          <h3 className={styles.avaliacoesBoxTitle}>Avaliações dos Clientes</h3>
          <div className={styles.avaliacoesList}>
            {avaliacoesMock.map((av, i) => (
              <div key={i} className={styles.avaliacaoItem}>
                <div className={styles.avaliacaoNome}>{av.nome}</div>
                <div className={styles.avaliacaoNota}>
                  {[1,2,3,4,5].map(j => j <= av.nota ? <FaStar key={j} color="#f0b63d" /> : <FaRegStar key={j} color="#f0b63d" />)}
                </div>
                <div className={styles.avaliacaoComentario}>{av.comentario}</div>
              </div>
            ))}
          </div>
        </div>
        
        */}
        {/* Novo: Seção de Procedimento para Compra de Arma de Fogo */}
        <div className={styles.purchaseProcedureSection}>
          <h2>Procedimento Compra de Arma de Fogo</h2>
          <ol>
            <li>
              <strong>Compra:</strong> O primeiro processo é o de compra, onde o usuário poderá escolher o modelo da arma desejada e aguardar as informações contratuais e da loja para prosseguir com a autorização de compra. Antes de realizar a compra da arma o cliente deverá entrar em contato e confirmar a disponibilidade de envio da arma para sua região.
            </li>
            <li>
              <strong>Autorização Deferida:</strong> Após receber o contrato e os dados, o cliente iniciará o processo de autorização de compras junto ao órgão de sua escolha responsável por realizar esse procedimento. Uma vez que a autorização for DEFERIDA, o cliente deverá nos enviar uma cópia nítida escaneada da mesma através do e-mail CONTATO@PESCAECIAARMAS.COM.BR.
            </li>
            <li>
              <strong>Nota:</strong> Ao recebermos a AUTORIZAÇÃO DE COMPRAS e verificarmos se está correta, encaminharemos o pedido ao setor responsável pela emissão das notas fiscais, que será processada em até 07 dias úteis. Com a nota fiscal em mãos, o cliente poderá dar continuidade ao processo de registro da arma de fogo.
            </li>
            <li>
              <strong>Registro Deferido:</strong> Após o deferimento do registro, o cliente deverá enviar, via e-mail para CONTATO@PESCAECIAARMAS.COM.BR, uma cópia escaneada e nítida do seu registro emitido pelo Exército ou Polícia Federal, juntamente com um documento de identificação com foto, como RG, CNH ou documento funcional. Após o envio dos documentos, o cliente aguardará o contato do SETOR RESPONSÁVEL, que ocorrerá em até 24 horas, via WhatsApp ou e-mail. Esse contato será feito para organizar todas as questões referentes ao envio da arma.
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
      </div>
    );
 
}