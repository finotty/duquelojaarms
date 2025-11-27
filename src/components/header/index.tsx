"use client";
import React, { useState, useEffect } from "react";
import styles from "./styles.module.scss";
import Image from "next/image";
import logo from "../../../public/img/logo black.png";
import { useRouter } from "next/navigation";
import { useProducts, Product } from "../../hooks/useProducts";
import { useAuth } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { FaUser, FaShoppingCart, FaHeart, FaSignOutAlt, FaCog, FaTachometerAlt, FaSearch, FaBars, FaTimes, FaBullseye } from "react-icons/fa";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../context/FavoritesContext";
import { FaRegHeart } from "react-icons/fa";
import ProductImage from "../ProductImage";

const allMenuItems = [
  { label: "Pistolas", category: "pistolas" },
  { label: "Revólveres", category: "revolveres" },
  { label: "Espingardas", category: "espingardas" },
  { label: "Acessórios", category: "acessorios" },
  { label: "Esportivo", category: "esporte" },
  { label: "Contato", href: "/contato" },
];

export default function Header() {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [hoveredPistola, setHoveredPistola] = useState<Product | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [primeiroNome, setPrimeiroNome] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [customSections, setCustomSections] = useState<string[]>([]);
  const router = useRouter();
  const { getProductsByCategory, loading, products } = useProducts();
  const { user, setRedirectPath, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  // Função para extrair o primeiro nome
  const extrairPrimeiroNome = (nomeCompleto: string) => {
    return nomeCompleto.split(' ')[0];
  };

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const dados = getFirestore(db.app);
          const userDoc = doc(dados, "users", user.uid);
          const userSnapshot = await getDoc(userDoc);
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            if (userData.nomeCompleto) {
              setPrimeiroNome(extrairPrimeiroNome(userData.nomeCompleto));
              console.log(userData.nomeCompleto);
            }
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      };
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.dropdownWrapper}`) && !target.closest(`.${styles.userMenuWrapper}`)) {
        setOpenMenuIndex(null);
        setUserMenuOpen(false);
      }
      if (!target.closest(`.${styles.menu}`) && !target.closest(`.${styles.mobileToggle}`)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log('Estado do menu mudou:', userMenuOpen);
  }, [userMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Buscar seções personalizadas do Firebase
  useEffect(() => {
    const fetchCustomSections = async () => {
      try {
        const customSectionsRef = collection(db, "customSections");
        const customSectionsSnapshot = await getDocs(customSectionsRef);
        const sections = customSectionsSnapshot.docs.map(doc => doc.data().name);
        setCustomSections(sections);
      } catch (error) {
        console.error("Erro ao buscar seções personalizadas:", error);
      }
    };
    fetchCustomSections();
    
    // Recarregar seções periodicamente para pegar novas seções criadas
    const interval = setInterval(fetchCustomSections, 30000); // A cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);

  const handleMenuClick = (index: number) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };

  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Toggle menu - Estado atual:', userMenuOpen);
    setUserMenuOpen(prev => !prev);
    console.log('Toggle menu - Novo estado:', !userMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setOpenMenuIndex(null);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleBuy = (product: Product) => {
    if (!user) {
      // Salva o produto no localStorage antes de redirecionar
      localStorage.setItem('pendingProduct', JSON.stringify({
        image: product.image,
        name: product.name,
        price: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(product.price),
        quantity: 1
      }));
      
      // Fecha o modal antes de redirecionar
      setSelectedProduct(null);
      setRedirectPath('/carrinho');
      router.push('/login');
      return;
    }

    addToCart({
      id: product.id,
      image: product.image,
      name: product.name,
      price: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(product.price),
      quantity: 1,
      specifications: product.specifications
        ? Object.fromEntries(Object.entries(product.specifications).filter(([_, v]) => typeof v === 'string' && v !== undefined)) as Record<string, string>
        : undefined
    });
    setSelectedProduct(null);
    router.push('/carrinho');
  };

  const handleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    
    if (!user) {
      console.log('Usuário não logado, salvando produto pendente:', productId);
      // Salva apenas o ID do produto no localStorage
      localStorage.setItem('pendingFavorite', productId);
      
      // Fecha o modal antes de redirecionar
      setSelectedProduct(null);
      setRedirectPath('/favoritos');
      router.push('/login');
      return;
    }

    try {
      if (isFavorite(productId)) {
        console.log('Removendo dos favoritos:', productId);
        await removeFromFavorites(productId);
      } else {
        console.log('Adicionando aos favoritos:', productId);
        await addToFavorites(productId);
      }
    } catch (error) {
      console.error('Erro ao manipular favoritos:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(term.toLowerCase()) ||
        product.category.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchResultClick = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm('');
    setShowSearchResults(false);
    if (isMobile) {
      setIsMobileMenuOpen(false);
      setOpenMenuIndex(null);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
    if (isMobileMenuOpen) {
      setOpenMenuIndex(null);
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
    setOpenMenuIndex(null);
  };

  // Função para verificar se há produtos em uma seção personalizada
  const getProductsByDisplayLocation = (displayLocation: string): Product[] => {
    return products.filter(product => product.displayLocation === displayLocation);
  };

  // Filtrar menuItems para exibir apenas categorias com produtos cadastrados
  const menuItems = React.useMemo(() => {
    // Separar itens com categoria e o item "Contato"
    const itemsWithCategory = allMenuItems.filter((item) => item.category);
    const contatoItem = allMenuItems.find((item) => item.href === "/contato");

    // Filtrar categorias que têm produtos
    const filteredCategoryItems = itemsWithCategory.filter((item) => {
      // Para itens com categoria, verificar se há produtos
      if (item.category === "acessorios") {
        const acessoriosProducts = getProductsByCategory("acessorios");
        const taticosProducts = getProductsByCategory("taticos");
        return acessoriosProducts.length > 0 || taticosProducts.length > 0;
      }

      const categoryProducts = getProductsByCategory(item.category as Product['category']);
      return categoryProducts.length > 0;
    });

    // Adicionar seções personalizadas que têm produtos
    const customMenuItems = customSections
      .filter(sectionName => {
        const sectionProducts = getProductsByDisplayLocation(sectionName);
        return sectionProducts.length > 0;
      })
      .map(sectionName => ({
        label: sectionName,
        displayLocation: sectionName,
        isCustom: true
      }));

    // Montar array final: categorias + seções personalizadas + Contato (sempre por último)
    const finalItems = [...filteredCategoryItems, ...customMenuItems];
    
    // Adicionar "Contato" sempre no final
    if (contatoItem) {
      finalItems.push(contatoItem);
    }

    return finalItems;
  }, [products, getProductsByCategory, customSections]);

  const renderSearchArea = (extraClass?: string) => (
    <div className={`${styles.searchArea} ${extraClass ? extraClass : ""}`}>
      <FaSearch className={styles.searchIcon} />
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Buscar produtos..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => searchTerm.length >= 2 && setShowSearchResults(true)}
      />
      {showSearchResults && searchResults.length > 0 && (
        <div className={styles.searchResults}>
          {searchResults.map((product) => (
            <div
              key={product.id}
              className={styles.searchResultItem}
              onClick={() => handleSearchResultClick(product)}
            >
              <ProductImage
                image={product.image}
                alt={product.name}
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  objectFit: 'contain' 
                }}
              />
              <div className={styles.searchResultInfo}>
                <span className={styles.searchResultName}>{product.name}</span>
                <span className={styles.searchResultPrice}>
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <header className={styles.header}>
      <div className={styles.branding}>
        {isMobile && (
          <button
            className={styles.mobileToggle}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        )}
        <div className={styles.logoArea} onClick={() => handleNavigate("/")}>
          <Image
            src={logo}
            alt="Logo Duque Armas"
            width={220}
            height={52}
            quality={100}
            priority
            sizes="(max-width: 600px) 150px, (max-width: 900px) 180px, 220px"
            className={styles.logoImg}
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>
      <nav
        className={`${styles.menu} ${isMobile ? styles.mobileMenu : ""} ${isMobile && isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}
      >
        {isMobile && (
          <div className={styles.mobileSearchContainer}>
            {renderSearchArea(styles.mobileSearchArea)}
          </div>
        )}
        {menuItems.map((item, index) => {
          const isOpen = openMenuIndex === index;
          const menuItem = item as any;
          
          // Verificar se é uma seção personalizada
          if (menuItem.isCustom && menuItem.displayLocation) {
            const sectionProducts = getProductsByDisplayLocation(menuItem.displayLocation);
            return (
              <div key={item.label} className={styles.dropdownWrapper}>
                <button
                  className={`${styles.menuItem} ${isOpen ? styles.menuItemActive : ""}`}
                  onClick={() => handleMenuClick(index)}
                >
                  {item.label} <span className={styles.arrow}>{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  isMobile ? (
                    <div className={styles.mobileDropdownContent}>
                      {sectionProducts.map((product) => (
                        <button
                          key={product.id}
                          className={styles.mobileProductItem}
                          onClick={() => handleProductClick(product)}
                        >
                          {product.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.dropdownContent}>
                        <div className={styles.pistolasList}>
                          <div className={styles.pistolasTitle}>
                            <FaBullseye /> Todos em {item.label}
                          </div>
                          <div className={styles.pistolasDivider}></div>
                          <div className={styles.pistolasItemsContainer}>
                              {sectionProducts.map((product) => (
                              <div
                                key={product.id}
                                className={styles.pistolaItem + (hoveredPistola?.id === product.id ? ' ' + styles.pistolaItemActive : '')}
                                onMouseEnter={() => !isMobile && setHoveredPistola(product)}
                                onMouseLeave={() => !isMobile && setHoveredPistola(null)}
                                onClick={() => handleProductClick(product)}
                              >
                                {product.name}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className={styles.pistolaPreview}>
                          {hoveredPistola === null ? (
                            <div className={styles.previewDefault}>
                              <span>Passe o mouse sobre um produto</span>
                            </div>
                          ) : (
                            <div className={styles.previewProduto}>
                              <ProductImage 
                                image={hoveredPistola.image} 
                                alt={hoveredPistola.name} 
                                
                                style={{ 
                                  width: '180px', 
                                  height: '120px', 
                                  objectFit: 'contain' 
                                }}
                              />
                              <div className={styles.previewPreco}>
                                R$ {hoveredPistola.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          }
          
          if (menuItem.category) {
            const products = menuItem.category === "acessorios"
              ? [...getProductsByCategory("acessorios"), ...getProductsByCategory("taticos")]
              : getProductsByCategory(menuItem.category as Product['category']);
            return (
              <div key={item.label} className={styles.dropdownWrapper}>
                <button
                  className={`${styles.menuItem} ${isOpen ? styles.menuItemActive : ""}`}
                  onClick={() => handleMenuClick(index)}
                >
                  {item.label} <span className={styles.arrow}>{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  isMobile ? (
                    <div className={styles.mobileDropdownContent}>
                      {products.map((product) => (
                        <button
                          key={product.id}
                          className={styles.mobileProductItem}
                          onClick={() => handleProductClick(product)}
                        >
                          {product.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.dropdownContent}>
                        <div className={styles.pistolasList}>
                          <div className={styles.pistolasTitle}>
                            <FaBullseye /> Todos em {item.label}
                          </div>
                          <div className={styles.pistolasDivider}></div>
                          <div className={styles.pistolasItemsContainer}>
                            {products.map((product) => (
                              <div
                                key={product.id}
                                className={styles.pistolaItem + (hoveredPistola?.id === product.id ? ' ' + styles.pistolaItemActive : '')}
                                onMouseEnter={() => !isMobile && setHoveredPistola(product)}
                                onMouseLeave={() => !isMobile && setHoveredPistola(null)}
                                onClick={() => handleProductClick(product)}
                              >
                                {product.name}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className={styles.pistolaPreview}>
                          {hoveredPistola === null ? (
                            <div className={styles.previewDefault}>
                              <span>Passe o mouse sobre um produto</span>
                            </div>
                          ) : (
                            <div className={styles.previewProduto}>
                              <ProductImage 
                                image={hoveredPistola.image} 
                                alt={hoveredPistola.name} 
                                style={{ 
                                  width: '180px', 
                                  height: '120px', 
                                  objectFit: 'contain' 
                                }}
                              />
                              <div className={styles.previewPreco}>
                                R$ {hoveredPistola.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          } else if (menuItem.href) {
            return (
              <button
                key={item.label}
                className={styles.menuItem}
                onClick={() => handleNavigate(menuItem.href)}
              >
                {item.label}
              </button>
            );
          } else {
            return (
              <div key={item.label} className={styles.menuItem}>
                {item.label}
              </div>
            );
          }
        })}
        {isMobile && (
          <div className={styles.mobileActions}>
            {user ? (
              <button 
                className={styles.mobileAccountButton}
                onClick={(e) => {
                  toggleUserMenu(e);
                  if (!userMenuOpen) {
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                <FaUser size={18} />
                <span>Minha conta</span>
              </button>
            ) : (
              <button 
                className={styles.mobileAccountButton}
                onClick={() => {
                  setRedirectPath('/');
                  setIsMobileMenuOpen(false);
                  router.push("/login");
                }}
              >
                <FaUser size={18} />
                <span>Entrar</span>
              </button>
            )}
          </div>
        )}
      </nav>
      <div className={styles.rightArea}>
        {!isMobile && renderSearchArea()}
        {user ? (
          <div className={styles.userMenuWrapper}>
            <button 
              className={styles.userButton}
              onClick={toggleUserMenu}
            >
              <FaUser size={20} />
              {primeiroNome && <span className={styles.userName}>{primeiroNome}</span>}
            </button>
            {userMenuOpen && (
              <div 
                className={styles.userMenu} 
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>
                    <FaUser size={20} />
                  </div>
                  <span>Olá, {primeiroNome}</span>
                </div>
                <div className={styles.menuItems}>
                  {!isAdmin && <button onClick={() => {
                    router.push('/dashboard');
                    setUserMenuOpen(false);
                  }}>
                    <FaTachometerAlt /> Dashboard
                  </button>}
                  {isAdmin && (
                    <button onClick={() => {
                      router.push('/admin');
                      setUserMenuOpen(false);
                    }}>
                      <FaCog /> Painel Admin
                    </button>
                  )}
                  
                  <button onClick={() => {
                  router.push('/carrinho');
                  setUserMenuOpen(false);
                   }}>
                  <FaShoppingCart /> Carrinho
                  </button>

                  <button onClick={() => {
                    router.push('/favoritos');
                    setUserMenuOpen(false);
                  }}>
                    <FaHeart /> Favoritos
                  </button>
                   
                  
                  <button onClick={() => {
                    handleLogout();
                    setUserMenuOpen(false);
                  }}>
                    <FaSignOutAlt /> Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button 
            className={styles.loginButton}
            onClick={() => {
              setRedirectPath('/');
              router.push("/login");
            }}
          >
            Entrar
          </button>
        )}
      </div>
      {selectedProduct && (
        <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalImageContainer}>
              <ProductImage
                image={selectedProduct.image}
                alt={selectedProduct.name}
                style={{ 
                  width: '300px', 
                  height: '300px', 
                  objectFit: 'contain' 
                }}
              />
            </div>
            <div className={styles.modalContent}>
              <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
              <div className={styles.modalSpecs}>
                {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                  <div key={key} className={styles.modalSpec}>
                    <span className={styles.modalSpecLabel}>{key}</span>
                    <span className={styles.modalSpecValue}>{value}</span>
                  </div>
                ))}
              </div>
              <div className={styles.modalPrice}>
                {formatPrice(selectedProduct.price)}
              </div>
              <div className={styles.modalInstallments}>
                Em até 10x de {formatPrice(selectedProduct.price / 10)} sem juros
              </div>
              <button 
                className={styles.modalBuyButton}
                onClick={() => handleBuy(selectedProduct)}
              >
                Adicionar ao Carrinho
              </button>
              <button 
                className={styles.modalFavoriteButton}
                onClick={(e) => handleFavorite(e, selectedProduct.id)}
                title={isFavorite(selectedProduct.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                {isFavorite(selectedProduct.id) ? <FaHeart color="#e74c3c" /> : <FaRegHeart />}
                {isFavorite(selectedProduct.id) ? " Remover dos Favoritos" : " Adicionar aos Favoritos"}
              </button>
            </div>
            <button 
              className={styles.modalCloseButton}
              onClick={() => setSelectedProduct(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
