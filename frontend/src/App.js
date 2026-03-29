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
    </div>
  );
}

function Header({ user, page, setPage, itemCount, logout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo" onClick={() => setPage('home')}>
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
  const checkout = async () => {
    await fetch(`${GATEWAY}/api/Basket/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
      body: JSON.stringify({ userName: user.email, firstName: user.firstName, lastName: '', emailAddress: user.email })
    });
    setBasket({ items: [] });
    alert('Siparişiniz alındı!');
    setPage('shop');
  };

  const total = basket.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <main className="basket-page">
      <h2>Sepetim</h2>
      {basket.items.length === 0 ? (
        <div className="empty-basket">
          <p>🛒 Sepetiniz boş</p>
          <button className="add-btn" onClick={() => setPage('shop')}>Alışverişe Başla</button>
        </div>
      ) : (
        <div className="basket-layout">
          <div className="basket-items">
            {basket.items.map(i => (
              <div className="basket-item" key={i.productId}>
                <div className="item-icon">📦</div>
                <div className="item-info"><h4>{i.productName}</h4><span>{i.quantity} adet</span></div>
                <span className="item-price">{(i.price * i.quantity).toLocaleString('tr-TR')} ₺</span>
              </div>
            ))}
          </div>
          <div className="basket-summary">
            <h3>Sipariş Özeti</h3>
            <div className="summary-row"><span>Ara Toplam</span><span>{total.toLocaleString('tr-TR')} ₺</span></div>
            <div className="summary-row"><span>Kargo</span><span className="free">Ücretsiz</span></div>
            <div className="summary-total"><span>Toplam</span><span>{total.toLocaleString('tr-TR')} ₺</span></div>
            <button className="checkout-btn" onClick={checkout}>Siparişi Tamamla</button>
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

  useEffect(() => {
    if (!user) { setPage('login'); return; }
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${GATEWAY}/api/Ordering/orders/${user.email}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        } else {
          setOrders(getDemoOrders());
        }
      } catch {
        setOrders(getDemoOrders());
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user, setPage]);

  const getDemoOrders = () => [
    {
      id: 'ORD-2026-001', date: '2026-03-28', status: 'shipped', total: 2499.90,
      items: [
        { productName: 'Kablosuz Kulaklık', quantity: 1, price: 1299.90 },
        { productName: 'Telefon Kılıfı', quantity: 2, price: 600.00 }
      ],
      trackingCode: 'TR12345678901'
    },
    {
      id: 'ORD-2026-002', date: '2026-03-25', status: 'delivered', total: 4599.00,
      items: [{ productName: 'Mekanik Klavye', quantity: 1, price: 4599.00 }],
      trackingCode: 'TR98765432101'
    },
    {
      id: 'ORD-2026-003', date: '2026-03-20', status: 'processing', total: 899.00,
      items: [{ productName: 'USB-C Hub', quantity: 1, price: 899.00 }],
      trackingCode: null
    },
    {
      id: 'ORD-2026-004', date: '2026-03-15', status: 'cancelled', total: 3200.00,
      items: [{ productName: 'Bluetooth Hoparlör', quantity: 1, price: 3200.00 }],
      trackingCode: null
    }
  ];

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
                    <div className="order-total">Toplam: <strong>{order.total.toLocaleString('tr-TR')} ₺</strong></div>
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