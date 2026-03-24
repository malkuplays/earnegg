import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { AppProvider } from './context/AppContext';
import { getTelegramUser } from './lib/telegram';

// Pages
import Earn from './pages/Earn';
import Tasks from './pages/Tasks';
import Friends from './pages/Friends';
import Wallet from './pages/Wallet';

// Components
import BottomNav from './components/BottomNav';

import './App.css';

function App() {
  const tgUser = getTelegramUser();

  useEffect(() => {
    // Notify Telegram that the app has loaded
    WebApp?.ready?.();
    
    if (tgUser) {
      // Expands the WebApp to take the full screen
      WebApp?.expand?.();
    }
  }, [tgUser]);

  // Completely block the application if not opened seamlessly within the Telegram Mobile/Desktop app
  if (!tgUser) {
    return (
      <div style={{
        display: 'flex', flex: 1, minHeight: '100vh', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d0f14', color: '#ffffff',
        padding: '24px', textAlign: 'center', fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📱</div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>Telegram Only</h2>
        <p style={{ color: '#9da3b4', fontSize: '16px', lineHeight: '1.5', maxWidth: '300px' }}>
          Please open this link directly inside the Telegram application to play Earnegg.
        </p>
        <a href="https://t.me/earneggbot" style={{
          marginTop: '32px', padding: '14px 28px', background: '#f0c929', color: '#0d0f14',
          borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none', fontSize: '16px',
          boxShadow: '0 4px 15px rgba(240, 201, 41, 0.3)'
        }}>
          Open Telegram Bot
        </a>
        
        {/* Debug Info */}
        <div style={{ marginTop: '40px', fontSize: '10px', color: '#555', wordBreak: 'break-all', maxWidth: '300px', textAlign: 'left' }}>
          <p>Debug payload:</p>
          <pre>{JSON.stringify(WebApp?.initDataUnsafe || {}, null, 2)}</pre>
          <p>User Agent: {navigator.userAgent}</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Routes>
            <Route path="/" element={<Navigate to="/earn" replace />} />
            <Route path="/earn" element={<Earn />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/wallet" element={<Wallet />} />
          </Routes>
          
          {/* Persistent Bottom Nav */}
          <BottomNav />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
