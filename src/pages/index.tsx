'use client';

import { useState } from 'react';
import { searchAmazonProducts } from '../services/amazonProductsSearch';

export default function Home() {
  const [quote, setQuote] = useState('');
  const [tags, setTags] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      const results = await searchAmazonProducts(quote);
      setProducts(results);
    } catch (err) {
      console.error(err);
      setError('商品検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>名言から探す商品</h1>

      <div>
        <label>名言：</label>
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="名言を入力してください"
          style={{ width: '100%', height: '80px' }}
        />
      </div>

      <div>
        <label>タグ：</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="タグをコンマ区切りで入力してください"
          style={{ width: '100%' }}
        />
      </div>

      <button onClick={handleSearch} style={{ marginTop: '20px' }}>
        商品を探す
      </button>

      {loading && <p>検索中です...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginTop: '30px' }}>
        <h2>商品候補：</h2>
        {products.map((product, index) => (
          <div key={index} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <img src={product.image} alt="商品画像" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
            <div>
              <a href={product.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', textDecoration: 'none', color: 'blue' }}>
                {product.title}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
