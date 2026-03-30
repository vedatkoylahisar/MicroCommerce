import { useState, useEffect } from 'react';
import './App.css';

const GATEWAY = 'https://localhost:7014';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [basket, setBasket] = useState({ items: [] });

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setBasket({ items: [] });
    setPage('home');
  };

  return (
    <div className="app">
      <Header user={user} page={page} setPage={setPage} itemCount={basket.items.length} logout={logout} />
      
      {page === 'home' && <HomePage setPage={setPage} />}
      {page === 'login' && <LoginPage setUser={setUser} setPage={setPage} />}
      {page === 'register' && <RegisterPage setPage={setPage} />}
      {page === 'shop' && <ShopPage user={user} basket={basket} setBasket={setBasket} setPage={setPage} />}
      {page === 'basket' && <BasketPage user={user} basket={basket} setBasket={setBasket} setPage={setPage} />}
      {page === 'profile' && <ProfilePage user={user} setUser={setUser} setPage={setPage} />}
      {page === 'orders' && <OrdersPage user={user} setPage={setPage} />}
      {page === 'messages' && <MessagesPage user={user} setPage={setPage} />}
      {page === 'admin' && <AdminPage gateway={GATEWAY} />}
    </div>
  );
}

function Header({ user, page, setPage, itemCount, logout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoClick, setLogoClick] = useState(0);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo" onClick={() => {
            const count = logoClick + 1;
            setLogoClick(count);
            if (count >= 5) { setPage('admin'); setLogoClick(0); }
            else setPage('home');
        }}>
          <span className="logo-icon">⚡</span>
          <span className="logo-text">SwiftShop</span>
        </div>
        <nav className="nav">
          <button className={page === 'shop' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('shop')}>Mağaza</button>
          {user ? (
            <>
              <div className="user-menu">
                <button
                  className="user-menu-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                >
                  <span className="user-avatar">{user.firstName?.charAt(0).toUpperCase()}</span>
                  <span className="user-name">{user.firstName}</span>
                  <span className="dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
                </button>
                {dropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <span className="dropdown-avatar">{user.firstName?.charAt(0).toUpperCase()}</span>
                      <div>
                        <div className="dropdown-name">{user.firstName}</div>
                        <div className="dropdown-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={() => { setPage('profile'); setDropdownOpen(false); }}>
                      👤 Profilim
                    </button>
                    <button className="dropdown-item" onClick={() => { setPage('orders'); setDropdownOpen(false); }}>
                      📦 Siparişlerim
                    </button>
                    <button className="dropdown-item" onClick={() => { setPage('messages'); setDropdownOpen(false); }}>
                      💬 Mesajlarım
                    </button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item logout-item" onClick={() => { logout(); setDropdownOpen(false); }}>
                      🚪 Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
              <button className="basket-btn" onClick={() => setPage('basket')}>
                🛒 {itemCount > 0 && <span className="badge">{itemCount}</span>}
              </button>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={() => setPage('login')}>Giriş Yap</button>
              <button className="register-btn" onClick={() => setPage('register')}>Kayıt Ol</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function HomePage({ setPage }) {
  return (
    <div>
      <div className="hero">
        <h2>En İyi Fırsatlar</h2>
        <p>Binlerce ürün, en uygun fiyatlarla</p>
        <button className="hero-btn" onClick={() => setPage('shop')}>Alışverişe Başla</button>
      </div>
      <div className="features">
        <div className="feature-card">🚀<h3>Hızlı Teslimat</h3><p>Aynı gün kargo</p></div>
        <div className="feature-card">🔒<h3>Güvenli Ödeme</h3><p>256-bit SSL şifreleme</p></div>
        <div className="feature-card">↩️<h3>Kolay İade</h3><p>30 gün içinde iade</p></div>
      </div>
    </div>
  );
}

function LoginPage({ setUser, setPage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${GATEWAY}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) { setError('E-posta veya şifre hatalı'); return; }
      const data = await res.json();
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setPage('shop');
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Giriş Yap</h2>
        {error && <div className="error-msg">{error}</div>}
        <input className="auth-input" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="auth-input" type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="auth-btn" onClick={login} disabled={loading}>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</button>
        <p className="auth-link">Hesabın yok mu? <span onClick={() => setPage('register')}>Kayıt Ol</span></p>
      </div>
    </div>
  );
}

function RegisterPage({ setPage }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const register = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${GATEWAY}/api/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) { setError('Kayıt başarısız, bilgileri kontrol edin'); return; }
      setPage('login');
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Kayıt Ol</h2>
        {error && <div className="error-msg">{error}</div>}
        <input className="auth-input" placeholder="Ad" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
        <input className="auth-input" placeholder="Soyad" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
        <input className="auth-input" placeholder="E-posta" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="auth-input" type="password" placeholder="Şifre" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <button className="auth-btn" onClick={register} disabled={loading}>{loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}</button>
        <p className="auth-link">Hesabın var mı? <span onClick={() => setPage('login')}>Giriş Yap</span></p>
      </div>
    </div>
  );
}

function ShopPage({ user, basket, setBasket, setPage }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${GATEWAY}/api/Products`)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addToBasket = async (product) => {
    if (!user) { setPage('login'); return; }
    const existing = basket.items.find(i => i.productId === product.id);
    const newItems = existing
      ? basket.items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...basket.items, { productId: product.id, productName: product.name, price: product.price, quantity: 1 }];
    const updated = { userName: user.email, items: newItems };
    const res = await fetch(`${GATEWAY}/api/Basket`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify(updated)
    });
    setBasket(await res.json());
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main>
      <div className="shop-header">
        <input className="search" placeholder="🔍  Ürün ara..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <div className="loading">Yükleniyor...</div> : (
        <div className="grid">
          {filtered.map(p => (
            <div className="card" key={p.id}>
              <div className="card-img">📦</div>
              <div className="card-body">
                <span className="category-tag">{p.category}</span>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <div className="card-footer">
                  <span className="price">{p.price.toLocaleString('tr-TR')} ₺</span>
                  <button className="add-btn" onClick={() => addToBasket(p)}>+ Sepete Ekle</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function BasketPage({ user, basket, setBasket, setPage }) {
  const [step, setStep] = useState('basket'); // basket | address | payment | success
  const [addresses, setAddresses] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('user') || '{}');
    setAddresses(saved.addresses || []);
    setCards(saved.cards || []);
  }, []);

  const updateBasket = async (newItems) => {
    const updated = { userName: user.email, items: newItems };
    const res = await fetch(`${GATEWAY}/api/Basket`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify(updated)
    });
    setBasket(await res.json());
  };

  const changeQty = (productId, delta) => {
    const newItems = basket.items
      .map(i => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0);
    updateBasket(newItems);
  };

  const removeItem = (productId) => {
    updateBasket(basket.items.filter(i => i.productId !== productId));
  };

  const placeOrder = async () => {
    await fetch(`${GATEWAY}/api/Basket/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify({ userName: user.email, firstName: user.firstName || '', lastName: user.lastName || '', emailAddress: user.email })
    });
    setBasket({ items: [] });
    setStep('success');
  };

  const total = basket.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const STEPS = ['basket', 'address', 'payment', 'success'];
  const stepLabels = ['Sepet', 'Adres', 'Ödeme', 'Onay'];

  if (step === 'success') {
    return (
      <main className="checkout-page">
        <div className="checkout-success">
          <div className="success-icon">✓</div>
          <h2>Siparişiniz Alındı!</h2>
          <p>Siparişiniz başarıyla oluşturuldu. Siparişlerim sayfasından takip edebilirsiniz.</p>
          <div className="success-actions">
            <button className="checkout-btn" onClick={() => setPage('orders')}>Siparişlerimi Gör</button>
            <button className="btn-secondary" onClick={() => setPage('home')}>Ana Sayfaya Dön</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-steps">
        {stepLabels.map((label, idx) => (
          <div key={label} className={`checkout-step ${STEPS[idx] === step ? 'active' : STEPS.indexOf(step) > idx ? 'done' : ''}`}>
            <div className="cs-dot">{STEPS.indexOf(step) > idx ? '✓' : idx + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {step === 'basket' && (
        <div className="checkout-body">
          <div className="checkout-main">
            <h3>Sepetim</h3>
            {basket.items.length === 0 ? (
              <div className="empty-basket">
                <p>Sepetiniz boş</p>
                <button className="add-btn" onClick={() => setPage('shop')}>Alışverişe Başla</button>
              </div>
            ) : (
              <div className="basket-items">
                {basket.items.map(i => (
                  <div className="basket-item" key={i.productId}>
                    <div className="item-icon">📦</div>
                    <div className="item-info"><h4>{i.productName}</h4><span>{i.price.toLocaleString('tr-TR')} ₺</span></div>
                    <div className="item-qty-controls">
                      <button onClick={() => changeQty(i.productId, -1)}>−</button>
                      <span>{i.quantity}</span>
                      <button onClick={() => changeQty(i.productId, +1)}>+</button>
                    </div>
                    <span className="item-price">{(i.price * i.quantity).toLocaleString('tr-TR')} ₺</span>
                    <button className="item-remove" onClick={() => removeItem(i.productId)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {basket.items.length > 0 && (
            <div className="checkout-sidebar">
              <h3>Sipariş Özeti</h3>
              <div className="summary-row"><span>Ara Toplam</span><span>{total.toLocaleString('tr-TR')} ₺</span></div>
              <div className="summary-row"><span>Kargo</span><span className="free">Ücretsiz</span></div>
              <div className="summary-total"><span>Toplam</span><span>{total.toLocaleString('tr-TR')} ₺</span></div>
              <button className="checkout-btn" onClick={() => setStep('address')}>Devam Et</button>
            </div>
          )}
        </div>
      )}

      {step === 'address' && (
        <div className="checkout-body">
          <div className="checkout-main">
            <h3>Teslimat Adresi</h3>
            {addresses.length === 0 ? (
              <div className="checkout-empty-notice">
                <p>Kayıtlı adresiniz yok. Profilden adres ekleyebilirsiniz.</p>
                <button className="btn-secondary" onClick={() => setPage('profile')}>Adres Ekle</button>
              </div>
            ) : (
              <div className="address-list">
                {addresses.map((a, idx) => (
                  <div key={idx} className={`address-card selectable ${selectedAddress === idx ? 'selected' : ''}`} onClick={() => setSelectedAddress(idx)}>
                    <div className="address-select-dot">{selectedAddress === idx ? '●' : '○'}</div>
                    <div>
                      <strong>{a.title}</strong>
                      <p>{a.fullName} — {a.phone}</p>
                      <p>{a.neighborhood}, {a.district}/{a.city}</p>
                      <p>{a.addressLine}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="checkout-sidebar">
            <h3>Sipariş Özeti</h3>
            <div className="summary-row"><span>Ara Toplam</span><span>{total.toLocaleString('tr-TR')} ₺</span></div>
            <div className="summary-row"><span>Kargo</span><span className="free">Ücretsiz</span></div>
            <div className="summary-total"><span>Toplam</span><span>{total.toLocaleString('tr-TR')} ₺</span></div>
            <button className="checkout-btn" disabled={selectedAddress === null} onClick={() => setStep('payment')}>Devam Et</button>
            <button className="btn-secondary" onClick={() => setStep('basket')}>Geri</button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="checkout-body">
          <div className="checkout-main">
            <h3>Ödeme Yöntemi</h3>
            {cards.length === 0 ? (
              <div className="checkout-empty-notice">
                <p>Kayıtlı kartınız yok. Profilden kart ekleyebilirsiniz.</p>
                <button className="btn-secondary" onClick={() => setPage('profile')}>Kart Ekle</button>
              </div>
            ) : (
              <div className="card-list">
                {cards.map((c, idx) => (
                  <div key={idx} className={`payment-card-option selectable ${selectedCard === idx ? 'selected' : ''}`} onClick={() => setSelectedCard(idx)}>
                    <div className="address-select-dot">{selectedCard === idx ? '●' : '○'}</div>
                    <div>
                      <strong>{c.cardName}</strong>
                      <p>{c.cardNumber?.replace(/(\d{4})/g, '$1 ').trim()} — {c.holderName}</p>
                      <p>Son Kullanma: {c.expiry}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="checkout-sidebar">
            <h3>Sipariş Özeti</h3>
            {addresses[selectedAddress] && (
              <div className="summary-address">
                <span className="summary-label">Adres</span>
                <span>{addresses[selectedAddress].title} — {addresses[selectedAddress].district}/{addresses[selectedAddress].city}</span>
              </div>
            )}
            <div className="summary-row"><span>Ara Toplam</span><span>{total.toLocaleString('tr-TR')} ₺</span></div>
            <div className="summary-row"><span>Kargo</span><span className="free">Ücretsiz</span></div>
            <div className="summary-total"><span>Toplam</span><span>{total.toLocaleString('tr-TR')} ₺</span></div>
            <button className="checkout-btn" disabled={selectedCard === null} onClick={placeOrder}>Siparişi Tamamla</button>
            <button className="btn-secondary" onClick={() => setStep('address')}>Geri</button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ─── PROFILE PAGE ─── */
function ProfilePage({ user, setUser, setPage }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [successMsg, setSuccessMsg] = useState('');

  // Kişisel bilgiler state
  const [personal, setPersonal] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Adresler state
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressIdx, setEditingAddressIdx] = useState(null);
  const [addressForm, setAddressForm] = useState({
    title: '', fullName: '', phone: '', city: '', district: '', neighborhood: '', addressLine: '', zipCode: ''
  });

  // Kart bilgileri state
  const [cards, setCards] = useState(user?.cards || []);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCardIdx, setEditingCardIdx] = useState(null);
  const [cardForm, setCardForm] = useState({
    cardName: '', cardNumber: '', expiry: '', cvv: '', holderName: ''
  });

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Kişisel Bilgiler ──
  const savePersonal = () => {
    const updatedUser = { ...user, ...personal };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    showSuccess('Kişisel bilgiler güncellendi!');
  };

  // ── Adres İşlemleri ──
  const resetAddressForm = () => {
    setAddressForm({ title: '', fullName: '', phone: '', city: '', district: '', neighborhood: '', addressLine: '', zipCode: '' });
    setShowAddressForm(false);
    setEditingAddressIdx(null);
  };

  const saveAddress = () => {
    let updated;
    if (editingAddressIdx !== null) {
      updated = addresses.map((a, i) => i === editingAddressIdx ? { ...addressForm } : a);
    } else {
      updated = [...addresses, { ...addressForm }];
    }
    setAddresses(updated);
    const updatedUser = { ...user, addresses: updated };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    resetAddressForm();
    showSuccess(editingAddressIdx !== null ? 'Adres güncellendi!' : 'Adres eklendi!');
  };

  const editAddress = (idx) => {
    setAddressForm({ ...addresses[idx] });
    setEditingAddressIdx(idx);
    setShowAddressForm(true);
  };

  const deleteAddress = (idx) => {
    const updated = addresses.filter((_, i) => i !== idx);
    setAddresses(updated);
    const updatedUser = { ...user, addresses: updated };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    showSuccess('Adres silindi!');
  };

  // ── Kart İşlemleri ──
  const resetCardForm = () => {
    setCardForm({ cardName: '', cardNumber: '', expiry: '', cvv: '', holderName: '' });
    setShowCardForm(false);
    setEditingCardIdx(null);
  };

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const saveCard = () => {
    let updated;
    if (editingCardIdx !== null) {
      updated = cards.map((c, i) => i === editingCardIdx ? { ...cardForm } : c);
    } else {
      updated = [...cards, { ...cardForm }];
    }
    setCards(updated);
    const updatedUser = { ...user, cards: updated };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    resetCardForm();
    showSuccess(editingCardIdx !== null ? 'Kart güncellendi!' : 'Kart eklendi!');
  };

  const editCard = (idx) => {
    setCardForm({ ...cards[idx] });
    setEditingCardIdx(idx);
    setShowCardForm(true);
  };

  const deleteCard = (idx) => {
    const updated = cards.filter((_, i) => i !== idx);
    setCards(updated);
    const updatedUser = { ...user, cards: updated };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    showSuccess('Kart silindi!');
  };

  const getCardBrand = (number) => {
    const n = number?.replace(/\s/g, '') || '';
    if (n.startsWith('4')) return { name: 'Visa', color: '#1a1f71' };
    if (n.startsWith('5')) return { name: 'Mastercard', color: '#eb001b' };
    if (n.startsWith('9')) return { name: 'Troy', color: '#00a651' };
    return { name: 'Kart', color: '#64748b' };
  };

  const maskCard = (number) => {
    const digits = number?.replace(/\s/g, '') || '';
    if (digits.length < 4) return '****';
    return '**** **** **** ' + digits.slice(-4);
  };

  if (!user) {
    setPage('login');
    return null;
  }

  return (
    <main className="profile-page">
      {successMsg && <div className="success-toast">{successMsg}</div>}

      {/* Profil Başlığı */}
      <div className="profile-header-card">
        <div className="profile-avatar">{user.firstName?.charAt(0).toUpperCase()}</div>
        <div className="profile-header-info">
          <h2>{user.firstName} {user.lastName || ''}</h2>
          <p>{user.email}</p>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="profile-tabs">
        <button className={activeTab === 'personal' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('personal')}>
          👤 Kişisel Bilgiler
        </button>
        <button className={activeTab === 'addresses' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('addresses')}>
          📍 Adreslerim
        </button>
        <button className={activeTab === 'cards' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('cards')}>
          💳 Kart Bilgilerim
        </button>
      </div>

      {/* ── Kişisel Bilgiler Tab ── */}
      {activeTab === 'personal' && (
        <div className="profile-section">
          <div className="section-header">
            <h3>Kişisel Bilgiler</h3>
            <p>Hesap bilgilerinizi güncelleyin</p>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Ad</label>
              <input className="profile-input" value={personal.firstName} onChange={e => setPersonal({ ...personal, firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Soyad</label>
              <input className="profile-input" value={personal.lastName} onChange={e => setPersonal({ ...personal, lastName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>E-posta</label>
              <input className="profile-input" type="email" value={personal.email} onChange={e => setPersonal({ ...personal, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input className="profile-input" placeholder="0(5XX) XXX XX XX" value={personal.phone} onChange={e => setPersonal({ ...personal, phone: e.target.value })} />
            </div>
          </div>
          <button className="save-btn" onClick={savePersonal}>Değişiklikleri Kaydet</button>
        </div>
      )}

      {/* ── Adreslerim Tab ── */}
      {activeTab === 'addresses' && (
        <div className="profile-section">
          <div className="section-header">
            <h3>Adreslerim</h3>
            <button className="add-new-btn" onClick={() => { resetAddressForm(); setShowAddressForm(true); }}>
              + Yeni Adres Ekle
            </button>
          </div>

          {showAddressForm && (
            <div className="inline-form">
              <h4>{editingAddressIdx !== null ? 'Adresi Düzenle' : 'Yeni Adres'}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Adres Başlığı</label>
                  <input className="profile-input" placeholder="Ev, İş..." value={addressForm.title} onChange={e => setAddressForm({ ...addressForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Ad Soyad</label>
                  <input className="profile-input" value={addressForm.fullName} onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input className="profile-input" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>İl</label>
                  <input className="profile-input" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>İlçe</label>
                  <input className="profile-input" value={addressForm.district} onChange={e => setAddressForm({ ...addressForm, district: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Mahalle</label>
                  <input className="profile-input" value={addressForm.neighborhood} onChange={e => setAddressForm({ ...addressForm, neighborhood: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label>Açık Adres</label>
                  <textarea className="profile-textarea" rows={3} value={addressForm.addressLine} onChange={e => setAddressForm({ ...addressForm, addressLine: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Posta Kodu</label>
                  <input className="profile-input" value={addressForm.zipCode} onChange={e => setAddressForm({ ...addressForm, zipCode: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button className="save-btn" onClick={saveAddress}>Kaydet</button>
                <button className="cancel-btn" onClick={resetAddressForm}>İptal</button>
              </div>
            </div>
          )}

          {addresses.length === 0 && !showAddressForm ? (
            <div className="empty-state">
              <span className="empty-icon">📍</span>
              <p>Henüz kayıtlı adresiniz yok</p>
            </div>
          ) : (
            <div className="items-list">
              {addresses.map((a, idx) => (
                <div className="list-card" key={idx}>
                  <div className="list-card-header">
                    <span className="list-card-tag">{a.title || 'Adres'}</span>
                    <div className="list-card-actions">
                      <button className="icon-btn edit" onClick={() => editAddress(idx)} title="Düzenle">✏️</button>
                      <button className="icon-btn delete" onClick={() => deleteAddress(idx)} title="Sil">🗑️</button>
                    </div>
                  </div>
                  <div className="list-card-body">
                    <p className="list-card-name">{a.fullName}</p>
                    <p className="list-card-detail">{a.phone}</p>
                    <p className="list-card-detail">{a.neighborhood}, {a.district}, {a.city} {a.zipCode}</p>
                    <p className="list-card-detail">{a.addressLine}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Kart Bilgilerim Tab ── */}
      {activeTab === 'cards' && (
        <div className="profile-section">
          <div className="section-header">
            <h3>Kart Bilgilerim</h3>
            <button className="add-new-btn" onClick={() => { resetCardForm(); setShowCardForm(true); }}>
              + Yeni Kart Ekle
            </button>
          </div>

          {showCardForm && (
            <div className="inline-form">
              <h4>{editingCardIdx !== null ? 'Kartı Düzenle' : 'Yeni Kart'}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Kart Adı</label>
                  <input className="profile-input" placeholder="Maaş Kartım, Kredi Kartım..." value={cardForm.cardName} onChange={e => setCardForm({ ...cardForm, cardName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Kart Üzerindeki İsim</label>
                  <input className="profile-input" value={cardForm.holderName} onChange={e => setCardForm({ ...cardForm, holderName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Kart Numarası</label>
                  <input className="profile-input" placeholder="0000 0000 0000 0000" value={cardForm.cardNumber} onChange={e => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Son Kullanma</label>
                  <input className="profile-input" placeholder="AA/YY" value={cardForm.expiry} onChange={e => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input className="profile-input" type="password" placeholder="***" maxLength={4} value={cardForm.cvv} onChange={e => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                </div>
              </div>
              <div className="form-actions">
                <button className="save-btn" onClick={saveCard}>Kaydet</button>
                <button className="cancel-btn" onClick={resetCardForm}>İptal</button>
              </div>
            </div>
          )}

          {cards.length === 0 && !showCardForm ? (
            <div className="empty-state">
              <span className="empty-icon">💳</span>
              <p>Henüz kayıtlı kartınız yok</p>
            </div>
          ) : (
            <div className="items-list cards-list">
              {cards.map((c, idx) => {
                const brand = getCardBrand(c.cardNumber);
                return (
                  <div className="credit-card-visual" key={idx}>
                    <div className="cc-top">
                      <span className="cc-chip">▣</span>
                      <span className="cc-brand" style={{ color: brand.color }}>{brand.name}</span>
                    </div>
                    <div className="cc-number">{maskCard(c.cardNumber)}</div>
                    <div className="cc-bottom">
                      <div>
                        <span className="cc-label">Kart Sahibi</span>
                        <span className="cc-value">{c.holderName?.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="cc-label">Son Kullanma</span>
                        <span className="cc-value">{c.expiry}</span>
                      </div>
                    </div>
                    <div className="cc-name-tag">{c.cardName}</div>
                    <div className="cc-actions">
                      <button className="icon-btn edit" onClick={() => editCard(idx)}>✏️</button>
                      <button className="icon-btn delete" onClick={() => deleteCard(idx)}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/* ─── ORDERS PAGE ─── */
function OrdersPage({ user, setPage }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${GATEWAY}/api/Ordering/orders/${user.email}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        setOrders(await res.json());
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { setPage('login'); return; }
    fetchOrders();
  }, [user, setPage]);

  const cancelOrder = async (id) => {
    if (!window.confirm('Siparişi iptal etmek istediğinize emin misiniz?')) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
    await fetch(`${GATEWAY}/api/Ordering/orders/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Sipariş geçmişten silinsin mi?')) return;
    setOrders(prev => prev.filter(o => o.id !== id));
    await fetch(`${GATEWAY}/api/Ordering/orders/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
  };

  const statusMap = {
    processing: { label: 'Hazırlanıyor', color: '#f59e0b', bg: '#fffbeb', icon: '⏳' },
    shipped: { label: 'Kargoda', color: '#3b82f6', bg: '#eff6ff', icon: '🚚' },
    delivered: { label: 'Teslim Edildi', color: '#22c55e', bg: '#f0fdf4', icon: '✅' },
    cancelled: { label: 'İptal Edildi', color: '#ef4444', bg: '#fef2f2', icon: '❌' }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (!user) return null;

  return (
    <main className="orders-page">
      <div className="orders-top">
        <h2>Siparişlerim</h2>
        <div className="order-filters">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'processing', label: 'Hazırlanıyor' },
            { key: 'shipped', label: 'Kargoda' },
            { key: 'delivered', label: 'Teslim Edildi' },
            { key: 'cancelled', label: 'İptal' }
          ].map(f => (
            <button key={f.key} className={filter === f.key ? 'filter-btn active' : 'filter-btn'} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="loading">Yükleniyor...</div> : (
        filtered.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">📦</span><p>Sipariş bulunamadı</p></div>
        ) : (
          <div className="orders-list">
            {filtered.map(order => {
              const st = statusMap[order.status] || statusMap.processing;
              return (
                <div className="order-card" key={order.id}>
                  <div className="order-card-header">
                    <div className="order-id-row">
                      <span className="order-id">{order.id}</span>
                      <span className="order-date">{new Date(order.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <span className="order-status-badge" style={{ color: st.color, background: st.bg }}>
                      {st.icon} {st.label}
                    </span>
                  </div>

                  {order.status !== 'cancelled' && (
                    <div className="order-progress">
                      <div className="progress-step done"><div className="progress-dot" /><span>Onaylandı</span></div>
                      <div className={`progress-line ${order.status !== 'processing' ? 'done' : ''}`} />
                      <div className={`progress-step ${order.status !== 'processing' ? 'done' : ''}`}><div className="progress-dot" /><span>Kargoda</span></div>
                      <div className={`progress-line ${order.status === 'delivered' ? 'done' : ''}`} />
                      <div className={`progress-step ${order.status === 'delivered' ? 'done' : ''}`}><div className="progress-dot" /><span>Teslim Edildi</span></div>
                    </div>
                  )}

                  <div className="order-items-list">
                    {order.items.map((item, idx) => (
                      <div className="order-item-row" key={idx}>
                        <span className="oir-icon">📦</span>
                        <span className="oir-name">{item.productName}</span>
                        <span className="oir-qty">{item.quantity} adet</span>
                        <span className="oir-price">{item.price.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-card-footer">
                    <div className="order-footer-left">
                      {order.trackingCode && <span className="tracking-code">📮 Takip: {order.trackingCode}</span>}
                    </div>
                    <div className="order-footer-right">
                      <div className="order-total">Toplam: <strong>{order.total.toLocaleString('tr-TR')} ₺</strong></div>
                      <div className="order-actions">
                        {(order.status === 'processing' || order.status === 'pending') && (
                          <button className="order-cancel-btn" onClick={() => cancelOrder(order.id)}>İptal Et</button>
                        )}
                        {(order.status === 'cancelled' || order.status === 'delivered') && (
                          <button className="order-delete-btn" onClick={() => deleteOrder(order.id)}>Sil</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </main>
  );
}

function AdminPage({ gateway }) {
  const [tab, setTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', description: '', price: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [toast, setToast] = useState('');
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadProducts = () => fetch(`${gateway}/api/Products`).then(r => r.json()).then(setProducts).catch(() => {});
  const loadOrders = () => fetch(`${gateway}/api/Ordering/orders`).then(r => r.json()).then(setOrders).catch(() => {});
  const loadCustomers = () => fetch(`${gateway}/api/Auth/users`).then(r => r.json()).then(setCustomers).catch(() => {});

  useEffect(() => {
    if (!auth) return;
    loadProducts(); loadOrders(); loadCustomers();
  }, [auth]);

  if (!auth) return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Admin Girişi</h2>
        <input className="auth-input" type="password" placeholder="Admin şifresi"
          value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (pass === 'Admin123!' ? setAuth(true) : alert('Hatalı şifre'))} />
        <button className="auth-btn" onClick={() => { if (pass === 'Admin123!') setAuth(true); else alert('Hatalı şifre'); }}>Giriş</button>
      </div>
    </div>
  );

  const addProduct = async () => {
    if (!form.name || !form.price) return showToast('Ad ve fiyat zorunlu');
    await fetch(`${gateway}/api/Products`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price) })
    });
    setForm({ name: '', category: '', description: '', price: '' });
    showToast('Ürün eklendi');
    loadProducts();
  };

  const saveEditProduct = async () => {
    await fetch(`${gateway}/api/Products`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editingProduct, price: parseFloat(editingProduct.price) })
    });
    setEditingProduct(null);
    showToast('Ürün güncellendi');
    loadProducts();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Ürünü silmek istediğinize emin misiniz?')) return;
    await fetch(`${gateway}/api/Products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Ürün silindi');
  };

  const updateOrderStatus = async (id, status) => {
    await fetch(`${gateway}/api/Ordering/orders/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status)
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const statusMap = { processing: 'Hazırlanıyor', shipped: 'Kargoda', delivered: 'Teslim Edildi', cancelled: 'İptal', pending: 'Bekliyor' };
  const statusColors = { processing: '#f59e0b', shipped: '#3b82f6', delivered: '#22c55e', cancelled: '#ef4444', pending: '#8b5cf6' };
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const navItems = [
    { key: 'dashboard', icon: '◈', label: 'Dashboard' },
    { key: 'products', icon: '▦', label: 'Ürünler' },
    { key: 'orders', icon: '◉', label: 'Siparişler' },
    { key: 'customers', icon: '◎', label: 'Müşteriler' },
  ];

  return (
    <main className="admin-page">
      {toast && <div className="admin-toast">{toast}</div>}
      {editingProduct && (
        <div className="admin-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Ürünü Düzenle</h3>
              <button className="modal-close" onClick={() => setEditingProduct(null)}>✕</button>
            </div>
            {['name', 'category', 'description', 'price'].map(f => (
              <input key={f} className="admin-input"
                placeholder={f === 'name' ? 'Ürün Adı' : f === 'category' ? 'Kategori' : f === 'description' ? 'Açıklama' : 'Fiyat (₺)'}
                value={editingProduct[f] || ''}
                onChange={e => setEditingProduct({ ...editingProduct, [f]: e.target.value })}
              />
            ))}
            <div className="modal-actions">
              <button className="checkout-btn" onClick={saveEditProduct}>Kaydet</button>
              <button className="btn-secondary" onClick={() => setEditingProduct(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-layout">
        <div className="admin-sidebar">
          <div className="admin-brand">Admin Panel</div>
          {navItems.map(n => (
            <div key={n.key} className={`sidebar-item ${tab === n.key ? 'active' : ''}`} onClick={() => setTab(n.key)}>
              <span className="sidebar-icon">{n.icon}</span> {n.label}
            </div>
          ))}
        </div>

        <div className="admin-content">
          <div className="admin-topbar">
            <h2 className="admin-page-title">{navItems.find(n => n.key === tab)?.label}</h2>
          </div>

          {tab === 'dashboard' && (
            <div>
              <div className="admin-stats">
                <div className="stat-card"><div className="stat-value">{products.length}</div><div className="stat-label">Toplam Ürün</div></div>
                <div className="stat-card"><div className="stat-value">{orders.length}</div><div className="stat-label">Toplam Sipariş</div></div>
                <div className="stat-card green"><div className="stat-value">{totalRevenue.toLocaleString('tr-TR')} ₺</div><div className="stat-label">Toplam Gelir</div></div>
                <div className="stat-card purple"><div className="stat-value">{customers.length}</div><div className="stat-label">Kayıtlı Müşteri</div></div>
              </div>

              <div className="admin-dash-grid">
                <div className="admin-card-box">
                  <h3>Son Siparişler</h3>
                  <table className="admin-table">
                    <thead><tr><th>Takip</th><th>Müşteri</th><th>Tutar</th><th>Durum</th></tr></thead>
                    <tbody>
                      {orders.slice(0, 6).map(o => (
                        <tr key={o.id}>
                          <td><span className="mono">{o.trackingCode}</span></td>
                          <td>{o.firstName} {o.lastName}<div className="sub-text">{o.email}</div></td>
                          <td><strong>{o.total?.toLocaleString('tr-TR')} ₺</strong></td>
                          <td><span className="status-pill" style={{ background: statusColors[o.status] + '22', color: statusColors[o.status] }}>{statusMap[o.status] || o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-card-box">
                  <h3>Sipariş Dağılımı</h3>
                  <div className="order-dist">
                    {['processing', 'shipped', 'delivered', 'cancelled'].map(s => {
                      const count = orders.filter(o => o.status === s).length;
                      const pct = orders.length ? Math.round(count / orders.length * 100) : 0;
                      return (
                        <div key={s} className="dist-row">
                          <span className="dist-label">{statusMap[s]}</span>
                          <div className="dist-bar-wrap"><div className="dist-bar" style={{ width: pct + '%', background: statusColors[s] }} /></div>
                          <span className="dist-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div>
              <div className="admin-toolbar">
                <input className="admin-search" placeholder="Ürün veya kategori ara..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                <button className="admin-add-btn" onClick={() => setTab('add')}>+ Ürün Ekle</button>
              </div>
              <div className="admin-card-box">
                <table className="admin-table">
                  <thead><tr><th>Ürün Adı</th><th>Kategori</th><th>Açıklama</th><th>Fiyat</th><th>İşlem</th></tr></thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td><span className="category-tag">{p.category}</span></td>
                        <td className="desc-cell">{p.description}</td>
                        <td><strong>{p.price?.toLocaleString('tr-TR')} ₺</strong></td>
                        <td>
                          <div className="table-actions">
                            <button className="tbl-edit-btn" onClick={() => setEditingProduct({ ...p })}>Düzenle</button>
                            <button className="tbl-del-btn" onClick={() => deleteProduct(p.id)}>Sil</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'add' && (
            <div className="admin-card-box" style={{ maxWidth: 560 }}>
              <h3>Yeni Ürün Ekle</h3>
              {[['name','Ürün Adı'],['category','Kategori'],['description','Açıklama'],['price','Fiyat (₺)']].map(([f, ph]) => (
                <input key={f} className="admin-input" placeholder={ph} value={form[f]}
                  onChange={e => setForm({ ...form, [f]: e.target.value })} />
              ))}
              <div className="modal-actions">
                <button className="checkout-btn" onClick={addProduct}>Ürünü Ekle</button>
                <button className="btn-secondary" onClick={() => setTab('products')}>İptal</button>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div>
              <div className="admin-toolbar">
                <div className="order-filter-tabs">
                  {['all','processing','shipped','delivered','cancelled'].map(s => (
                    <button key={s} className={`filter-btn ${orderFilter === s ? 'active' : ''}`} onClick={() => setOrderFilter(s)}>
                      {s === 'all' ? 'Tümü' : statusMap[s]}
                      <span className="filter-count">{s === 'all' ? orders.length : orders.filter(o => o.status === s).length}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-card-box">
                <table className="admin-table">
                  <thead><tr><th>Takip Kodu</th><th>Müşteri</th><th>Tarih</th><th>Tutar</th><th>Durum</th><th>Güncelle</th></tr></thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id}>
                        <td><span className="mono">{o.trackingCode}</span></td>
                        <td>{o.firstName} {o.lastName}<div className="sub-text">{o.email}</div></td>
                        <td>{o.date}</td>
                        <td><strong>{o.total?.toLocaleString('tr-TR')} ₺</strong></td>
                        <td><span className="status-pill" style={{ background: statusColors[o.status] + '22', color: statusColors[o.status] }}>{statusMap[o.status] || o.status}</span></td>
                        <td>
                          <select className="status-select" value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                            {['processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{statusMap[s]}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'customers' && (
            <div className="admin-card-box">
              <table className="admin-table">
                <thead><tr><th>#</th><th>Ad Soyad</th><th>E-posta</th><th>Sipariş Sayısı</th><th>Toplam Harcama</th></tr></thead>
                <tbody>
                  {customers.map((c, idx) => {
                    const customerOrders = orders.filter(o => o.email === c.email && o.status !== 'cancelled');
                    return (
                      <tr key={c.email}>
                        <td className="sub-text">{idx + 1}</td>
                        <td><strong>{c.firstName} {c.lastName}</strong></td>
                        <td>{c.email}</td>
                        <td>{customerOrders.length}</td>
                        <td><strong>{customerOrders.reduce((s, o) => s + o.total, 0).toLocaleString('tr-TR')} ₺</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ─── MESSAGES PAGE ─── */
function MessagesPage({ user, setPage }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPage('login'); return; }
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${GATEWAY}/api/Messages/${user.email}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          setConversations(await res.json());
        } else {
          setConversations(getDemoConversations());
        }
      } catch {
        setConversations(getDemoConversations());
      }
      setLoading(false);
    };
    fetchMessages();
  }, [user, setPage]);

  const getDemoConversations = () => [
    {
      id: 1, sellerName: 'TechStore', sellerAvatar: 'T', orderId: 'ORD-2026-001',
      lastMessage: 'Siparişiniz kargoya verildi, iyi günler!', lastTime: '2026-03-28T14:30:00', unread: 1,
      messages: [
        { id: 1, from: 'user', text: 'Merhaba, siparişim ne zaman kargoya verilecek?', time: '2026-03-28T10:15:00' },
        { id: 2, from: 'seller', text: 'Merhaba! Siparişiniz bugün hazırlanıyor, öğleden sonra kargoya teslim edilecek.', time: '2026-03-28T11:20:00' },
        { id: 3, from: 'user', text: 'Teşekkürler, kargo takip numarasını paylaşabilir misiniz?', time: '2026-03-28T13:00:00' },
        { id: 4, from: 'seller', text: 'Siparişiniz kargoya verildi, iyi günler!', time: '2026-03-28T14:30:00' },
      ]
    },
    {
      id: 2, sellerName: 'GadgetWorld', sellerAvatar: 'G', orderId: 'ORD-2026-002',
      lastMessage: 'Rica ederim, iyi günler dilerim!', lastTime: '2026-03-26T09:45:00', unread: 0,
      messages: [
        { id: 1, from: 'user', text: 'Ürün hasarlı geldi, iade etmek istiyorum.', time: '2026-03-25T16:00:00' },
        { id: 2, from: 'seller', text: 'Çok özür dileriz. Hemen iade sürecini başlatıyoruz.', time: '2026-03-25T17:30:00' },
        { id: 3, from: 'user', text: 'Anladım, teşekkür ederim.', time: '2026-03-26T09:00:00' },
        { id: 4, from: 'seller', text: 'Rica ederim, iyi günler dilerim!', time: '2026-03-26T09:45:00' },
      ]
    },
    {
      id: 3, sellerName: 'ElektroMarket', sellerAvatar: 'E', orderId: 'ORD-2026-003',
      lastMessage: 'Ürününüz hazırlanıyor, tahmini 2 gün içinde kargoya verilecek.', lastTime: '2026-03-27T11:00:00', unread: 2,
      messages: [
        { id: 1, from: 'user', text: 'Sipariş durumum hakkında bilgi alabilir miyim?', time: '2026-03-27T09:00:00' },
        { id: 2, from: 'seller', text: 'Ürününüz hazırlanıyor, tahmini 2 gün içinde kargoya verilecek.', time: '2026-03-27T11:00:00' },
      ]
    }
  ];

  const sendMessage = () => {
    if (!newMessage.trim() || !activeConv) return;
    const msg = { id: Date.now(), from: 'user', text: newMessage.trim(), time: new Date().toISOString() };
    const updated = conversations.map(c =>
      c.id === activeConv.id ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastTime: msg.time } : c
    );
    setConversations(updated);
    setActiveConv({ ...activeConv, messages: [...activeConv.messages, msg] });
    setNewMessage('');
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Bugün';
    const y = new Date(today); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  if (!user) return null;

  return (
    <main className="messages-page">
      <h2>Mesajlarım</h2>
      {loading ? <div className="loading">Yükleniyor...</div> : (
        <div className="messages-layout">
          <div className="conv-list">
            {conversations.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}><span className="empty-icon">💬</span><p>Henüz mesajınız yok</p></div>
            ) : (
              conversations.map(conv => (
                <div key={conv.id} className={`conv-item ${activeConv?.id === conv.id ? 'active' : ''}`} onClick={() => setActiveConv(conv)}>
                  <div className="conv-avatar" style={{ background: conv.id === 1 ? '#3b82f6' : conv.id === 2 ? '#8b5cf6' : '#f59e0b' }}>
                    {conv.sellerAvatar}
                  </div>
                  <div className="conv-info">
                    <div className="conv-top-row">
                      <span className="conv-seller">{conv.sellerName}</span>
                      <span className="conv-time">{formatDate(conv.lastTime)}</span>
                    </div>
                    <div className="conv-bottom-row">
                      <span className="conv-preview">{conv.lastMessage}</span>
                      {conv.unread > 0 && <span className="conv-unread">{conv.unread}</span>}
                    </div>
                    <span className="conv-order">Sipariş: {conv.orderId}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="chat-panel">
            {activeConv ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-info">
                    <div className="conv-avatar sm" style={{ background: activeConv.id === 1 ? '#3b82f6' : activeConv.id === 2 ? '#8b5cf6' : '#f59e0b' }}>
                      {activeConv.sellerAvatar}
                    </div>
                    <div>
                      <div className="chat-seller-name">{activeConv.sellerName}</div>
                      <div className="chat-order-ref">Sipariş: {activeConv.orderId}</div>
                    </div>
                  </div>
                </div>
                <div className="chat-messages">
                  {activeConv.messages.map(msg => (
                    <div key={msg.id} className={`chat-bubble ${msg.from === 'user' ? 'mine' : 'theirs'}`}>
                      <p>{msg.text}</p>
                      <span className="bubble-time">{formatTime(msg.time)}</span>
                    </div>
                  ))}
                </div>
                <div className="chat-input-area">
                  <input className="chat-input" placeholder="Mesajınızı yazın..." value={newMessage}
                    onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                  <button className="chat-send-btn" onClick={sendMessage} disabled={!newMessage.trim()}>Gönder</button>
                </div>
              </>
            ) : (
              <div className="chat-placeholder"><span className="empty-icon">💬</span><p>Bir konuşma seçin</p></div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}