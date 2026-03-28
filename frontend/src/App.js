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
    </div>
  );
}

function Header({ user, page, setPage, itemCount, logout }) {
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
              <span className="user-greeting">Merhaba, {user.firstName}!</span>
              <button className="nav-btn" onClick={logout}>Çıkış</button>
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