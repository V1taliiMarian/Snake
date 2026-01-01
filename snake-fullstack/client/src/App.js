import React, { useState, useEffect } from 'react';
import SnakeGame from './SnakeGame';
import Auth from './Auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Додаємо стан завантаження

  // ПЕРЕВІРКА ПРИ ПЕРЕЗАВАНТАЖЕННІ
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:5000/me', {
          method: 'GET',
          credentials: 'include' // ВАЖЛИВО: дозволяє відправити куки на сервер
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.username); // Якщо сервер підтвердив куку, логінимо юзера
        }
      } catch (err) {
        console.error("Помилка автологіну", err);
      } finally {
        setLoading(false); // Завершуємо перевірку
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch('http://localhost:5000/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  // Поки ми чекаємо відповіді від сервера, краще нічого не показувати (або спінер)
  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Завантаження сесії...</div>;

  return (
    <div className="App">
      {/* ФОНОВА АНІМАЦІЯ */}
      <div className="background-wrapper">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <header style={{ padding: '20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>🐍 SNAKE<span style={{color: '#22c55e'}}>0001</span></h2>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Привіт, <strong style={{color: '#22c55e'}}>{user}</strong></span>
            <button className="modern-button" style={{ background: '#ef4444', padding: '8px 15px' }} onClick={handleLogout}>Вийти</button>
          </div>
        )}
      </header>

      <main style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        {!user ? (
          <div className="glass-card">
            <Auth onLoginSuccess={setUser} />
          </div>
        ) : (
          <SnakeGame />
        )}
      </main>
    </div>
  );
}

export default App;