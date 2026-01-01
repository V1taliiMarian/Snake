import React, { useState } from 'react';

const Auth = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/register' : '/login';
    const response = await fetch(`https://snake-4tdl.onrender.com${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    const data = await response.json();
    if (response.ok) {
      if (isRegister) {
        alert('Акаунт створено! Можна входити.');
        setIsRegister(false);
      } else {
        onLoginSuccess(data.username);
      }
    } else {
      alert(data.error);
    }
  };

  return (
    <div style={{ textAlign: 'center', width: '320px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '25px', fontWeight: '500' }}>
        {isRegister ? 'Створити акаунт' : 'Вхід у систему'}
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          className="glass-input"
          type="text" 
          placeholder="Логін" 
          value={username}
          onChange={e => setUsername(e.target.value)} 
          required 
        />
        <input 
          className="glass-input"
          type="password" 
          placeholder="Пароль" 
          value={password}
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        
        <button className="modern-button" style={{ marginTop: '10px' }}>
          {isRegister ? 'Зареєструватися' : 'Увійти'}
        </button>
      </form>

      <div className="auth-toggle" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'Вже маєте акаунт?' : 'Немає акаунта?'}
        <span>{isRegister ? 'Увійти' : 'Створити'}</span>
      </div>
    </div>
  );
};

export default Auth;