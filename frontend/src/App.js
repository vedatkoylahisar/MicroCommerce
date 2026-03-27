import { useState, useEffect } from 'react';
import './App.css';

const GATEWAY = 'https://localhost:7014';
const USER = 'vedat';

function App() {
  const [products, setProducts] = useState([]);
  const [basket, setBasket] = useState(null);
  const [page, setPage] = useState('shop');

  useEffect(() => {
    fetch(`${GATEWAY}/api/Products`)
      .then(r => r.json())
      .then(setProducts);
  }, []);

  const addToBasket = async (product) => {
    const current = basket || { userName: USER, items: [] };
    const existing = current.items.find(i => i.productId === product.id);
    let newItems;
    if (existing) {
      newItems = current.items.map(i =>
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [...current.items, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1
      }];
    }
    const updated = { userName: USER, items: newItems };
    const res = await fetch(`${GATEWAY}/api/Basket`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setBasket(await res.json());
  };

  const checkout = async () => {
    await fetch(`${GATEWAY}/api/Basket/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: USER,
        firstName: 'Vedat',
        lastName: 'Koylahisar',
        emailAddress: 'vedat@test.com'
      })
    });
    setBasket(null);
    alert('Sipariş tamamlandı!');
  };

  return (
    <div className="app">
      <nav>
        <h1>MicroCommerce</h1>
        <button onClick={() => setPage('shop')}>Mağaza</button>
        <button onClick={() => setPage('basket')}>
          Sepet {basket?.items?.length > 0 && `(${basket.items.length})`}
        </button>
        <button onClick={() => setPage('admin')}>Admin</button>
      </nav>

      {page === 'shop' && (
        <div className="grid">
          {products.map(p => (
            <div className="card" key={p.id}>
              <h3>{p.name}</h3>
              <p>{p.category}</p>
              <p>{p.description}</p>
              <b>{p.price} ₺</b>
              <button onClick={() => addToBasket(p)}>Sepete Ekle</button>
            </div>
          ))}
        </div>
      )}

      {page === 'basket' && (
        <div className="basket">
          <h2>Sepetim</h2>
          {!basket || basket.items.length === 0 ? <p>Sepet boş</p> : (
            <>
              {basket.items.map(i => (
                <div key={i.productId} className="basket-item">
                  <span>{i.productName}</span>
                  <span>{i.quantity} adet</span>
                  <span>{i.price * i.quantity} ₺</span>
                </div>
              ))}
              <h3>Toplam: {basket.totalPrice} ₺</h3>
              <button onClick={checkout}>Satın Al</button>
            </>
          )}
        </div>
      )}

      {page === 'admin' && <AdminPanel gateway={GATEWAY} />}
    </div>
  );
}

function AdminPanel({ gateway }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  const addProduct = async () => {
    await fetch(`${gateway}/api/Products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, description, price: parseFloat(price) })
    });
    alert('Ürün eklendi!');
  };

  return (
    <div className="admin">
      <h2>Ürün Ekle</h2>
      <input placeholder="İsim" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Kategori" value={category} onChange={e => setCategory(e.target.value)} />
      <input placeholder="Açıklama" value={description} onChange={e => setDescription(e.target.value)} />
      <input placeholder="Fiyat" value={price} onChange={e => setPrice(e.target.value)} />
      <button onClick={addProduct}>Ekle</button>
    </div>
  );
}

export default App;