import { useState, useEffect } from 'react';
import './App.css';

const GATEWAY = 'https://localhost:7014';
const USER = 'vedat';

export default function App() {
  const [page, setPage] = useState('shop');
  const [basket, setBasket] = useState({ userName: USER, items: [] });

  return (
    <div className="app">
      <Header page={page} setPage={setPage} itemCount={basket.items.length} />
      {page === 'shop' && <ShopPage basket={basket} setBasket={setBasket} />}
      {page === 'basket' && <BasketPage basket={basket} setBasket={setBasket} setPage={setPage} />}
      {page === 'admin' && <AdminPage />}
    </div>
  );
}

function Header({ page, setPage, itemCount }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo" onClick={() => setPage('shop')}>
          <span className="logo-icon">⚡</span>
          <span className="logo-text">SwiftShop</span>
        </div>
        <nav className="nav">
          <button className={page === 'shop' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('shop')}>Mağaza</button>
          <button className="basket-btn" onClick={() => setPage('basket')}>
            🛒 Sepet {itemCount > 0 && <span className="badge">{itemCount}</span>}
          </button>
        </nav>
      </div>
    </header>
  );
}

function ShopPage({ basket, setBasket }) {
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
    const existing = basket.items.find(i => i.productId === product.id);
    const newItems = existing
      ? basket.items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...basket.items, { productId: product.id, productName: product.name, price: product.price, quantity: 1 }];
    const updated = { userName: USER, items: newItems };
    const res = await fetch(`${GATEWAY}/api/Basket`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
      <div className="hero">
        <h2>En İyi Fırsatlar</h2>
        <p>Binlerce ürün, en uygun fiyatlarla</p>
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

function BasketPage({ basket, setBasket, setPage }) {
  const checkout = async () => {
    await fetch(`${GATEWAY}/api/Basket/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: USER, firstName: 'Vedat', lastName: 'Koylahisar', emailAddress: 'vedat@test.com' })
    });
    setBasket({ userName: USER, items: [] });
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
                <div className="item-info">
                  <h4>{i.productName}</h4>
                  <span>{i.quantity} adet</span>
                </div>
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

function AdminPage() {
  const [form, setForm] = useState({ name: '', category: '', description: '', price: '' });
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    await fetch(`${GATEWAY}/api/Products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price) })
    });
    setForm({ name: '', category: '', description: '', price: '' });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <main className="admin-page">
      <div className="admin-card">
        <h2>➕ Yeni Ürün Ekle</h2>
        {success && <div className="success-msg">✅ Ürün başarıyla eklendi!</div>}
        {['name', 'category', 'description', 'price'].map(f => (
          <input key={f} className="admin-input"
            placeholder={f === 'name' ? 'Ürün Adı' : f === 'category' ? 'Kategori' : f === 'description' ? 'Açıklama' : 'Fiyat (₺)'}
            value={form[f]}
            onChange={e => setForm({ ...form, [f]: e.target.value })}
          />
        ))}
        <button className="checkout-btn" onClick={submit}>Ürünü Ekle</button>
      </div>
    </main>
  );
}