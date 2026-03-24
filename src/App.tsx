import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Earn from './pages/Earn';
import Tasks from './pages/Tasks';
import Friends from './pages/Friends';
import Wallet from './pages/Wallet';

// Components
import BottomNav from './components/BottomNav';
import { AppProvider } from './context/AppContext';

function App() {

  useEffect(() => {
    // Notify Telegram that the app has loaded
    WebApp.ready();
    
    // Check if we are inside Telegram
    if (WebApp.initDataUnsafe.user) {
      // Optional: Expands the WebApp to take the full screen
      WebApp.expand();
      
      // Setup telegram theme colors based on CSS variables instead
      // but we force our own premium dark theme in index.css anyway
    }
  }, []);

  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
