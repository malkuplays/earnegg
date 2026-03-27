import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { getTelegramUser } from './lib/telegram';

// Pages
import Earn from './pages/Earn';
import Tasks from './pages/Tasks';
import Friends from './pages/Friends';
import Wallet from './pages/Wallet';
import Legal from './pages/Legal';
import Boosts from './pages/Boosts';
import Leaderboard from './pages/Leaderboard';
import Games from './pages/Games';
import Wheel from './pages/Wheel';
import EggCatcher from './pages/EggCatcher';
import EggTower from './pages/EggTower';

// Components
import BottomNav from './components/BottomNav';
import DailyRewardModal from './components/DailyRewardModal';
import PageTransition from './components/PageTransition';
import HtmlPopup from './components/HtmlPopup';
import { MonetagService } from './lib/monetag';

import './App.css';

function AppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/earn" replace />} />
        <Route path="/earn" element={<PageTransition><Earn /></PageTransition>} />
        <Route path="/tasks" element={<PageTransition><Tasks /></PageTransition>} />
        <Route path="/boosts" element={<PageTransition><Boosts /></PageTransition>} />
        <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
        <Route path="/games" element={<PageTransition><Games /></PageTransition>} />
        <Route path="/wheel" element={<PageTransition><Wheel /></PageTransition>} />
        <Route path="/egg-catcher" element={<PageTransition><EggCatcher /></PageTransition>} />
        <Route path="/egg-tower" element={<PageTransition><EggTower /></PageTransition>} />
        <Route path="/friends" element={<PageTransition><Friends /></PageTransition>} />
        <Route path="/wallet" element={<PageTransition><Wallet /></PageTransition>} />
        <Route path="/legal" element={<PageTransition><Legal /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function DailyRewardTrigger() {
  const { dailyRewardData, setDailyRewardData } = useApp();
  
  if (!dailyRewardData) return null;

  return (
    <DailyRewardModal 
      reward={dailyRewardData.reward} 
      streak={dailyRewardData.streak} 
      onClose={() => setDailyRewardData(null)} 
    />
  );
}

function PopupTrigger() {
  const { popupHtml, dismissPopup } = useApp();
  
  if (!popupHtml || popupHtml.trim() === '') return null;

  return (
    <HtmlPopup 
      html={popupHtml} 
      onClose={dismissPopup} 
    />
  );
}

function MonetagInitializer() {
  const { monetagInAppId } = useApp();
  
  useEffect(() => {
    if (monetagInAppId) {
      console.log('Initializing Monetag In-App Ads with Zone:', monetagInAppId);
      MonetagService.initInApp(monetagInAppId);
    }
  }, [monetagInAppId]);

  return null;
}

function App() {
  const [tgUser, setTgUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Notify Telegram that the app has loaded
    const app = (window as any).Telegram?.WebApp;
    app?.ready?.();
    
    // Allow SDK to parse URL hash on iOS devices before validating
    setTimeout(() => {
      const user = getTelegramUser();
      setTgUser(user);
      setIsReady(true);
      
      if (user) {
        // Expands the WebApp to take the full screen
        app?.expand?.();
      }
    }, 100);
  }, []);

  if (!isReady) {
    return <div style={{ backgroundColor: '#0d0f14', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />;
  }

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
      </div>
    );
  }

  return (
    <AppProvider initialUser={tgUser}>
      <BrowserRouter>
        <div className="app-layout">
          <AppRoutes />
          
          {/* Persistent Bottom Nav */}
          <BottomNav />

          {/* Overlays */}
          <DailyRewardTrigger />
          <PopupTrigger />
          <MonetagInitializer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
