import { useState, useEffect } from 'react';
import { ArrowRightLeft, CreditCard, Landmark, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import './Wallet.css';

export default function Wallet() {
  const { balance, user } = useApp();
  // 1000 coins = 10 Rupees -> 1 coin = 0.01 Rupees -> balance / 100
  const MONEY_CONVERSION = balance / 100;

  const [withdrawMethod, setWithdrawMethod] = useState<string | null>(null);
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('player_id', user.id.toString())
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setHistory(data);
  };

  const handleWithdraw = async () => {
    if (!withdrawMethod || !withdrawDetails || !withdrawAmount) return;
    
    const amountCoins = Number(withdrawAmount);
    if (isNaN(amountCoins) || amountCoins <= 0) {
      setMessage({ text: 'Invalid amount', type: 'error' });
      return;
    }
    if (amountCoins > balance) {
      setMessage({ text: 'Insufficient coin balance', type: 'error' });
      return;
    }
    if (amountCoins < 1000) {
      setMessage({ text: 'Minimum withdrawal is 1,000 coins (₹10)', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    
    const { data, error } = await supabase.rpc('request_withdrawal', {
      p_player_id: user.id.toString(),
      p_amount_coins: amountCoins,
      p_method: withdrawMethod,
      p_details: withdrawDetails
    });

    if (error || !data) {
      setMessage({ text: 'Withdrawal failed. Try again.', type: 'error' });
    } else {
      setMessage({ text: 'Success! Request is pending.', type: 'success' });
      setWithdrawMethod(null);
      setWithdrawDetails('');
      setWithdrawAmount('');
      // Force reload to update global context balance
      setTimeout(() => window.location.reload(), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="page-container wallet-page animate-fade-in" style={{ paddingBottom: '100px'}}>
      <div className="wallet-hero glass-panel">
        <h2 className="caption text-dim">Current Balance</h2>
        <div className="wallet-balance-row">
          <span className="coin-large">💰</span>
          <span className="wallet-balance">{balance.toLocaleString()}</span>
        </div>
        <div className="usd-equivalent">
          ~ ₹{MONEY_CONVERSION.toFixed(2)} INR
        </div>
      </div>

      <div className="withdraw-section">
        <h3 className="h3 section-title">Withdraw Options</h3>
        
        {withdrawMethod ? (
          <div className="withdraw-form glass-panel animate-fade-in">
            <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)'}}>
              Withdraw via {withdrawMethod.toUpperCase()}
            </h4>
            
            <input 
              type="number" 
              className="input-field" 
              placeholder="Amount in Coins (min 1000)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            {withdrawAmount && !isNaN(Number(withdrawAmount)) && (
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '15px', marginTop: '-10px' }}>
                You will receive: ₹{(Number(withdrawAmount) / 100).toFixed(2)} INR
              </div>
            )}
            
            <input 
              type="text" 
              className="input-field" 
              placeholder={
                withdrawMethod === 'crypto' ? "USDT (TON) Address" :
                withdrawMethod === 'upi' ? "Enter UPI ID (e.g. name@bank)" :
                "Bank Account / Card Number"
              }
              value={withdrawDetails}
              onChange={(e) => setWithdrawDetails(e.target.value)}
            />
            
            {message.text && (
              <div style={{ 
                color: message.type === 'error' ? '#ff4d4d' : '#4ade80', 
                fontSize: '14px', 
                textAlign: 'center',
                padding: '8px',
                borderRadius: '8px',
                background: message.type === 'error' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(74, 222, 128, 0.1)',
                marginBottom: '4px' 
              }}>
                {message.text}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                className="w-btn w-btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setWithdrawMethod(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="w-btn w-btn-primary" 
                style={{ flex: 1 }}
                onClick={handleWithdraw}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        ) : (
          <div className="withdraw-cards">
            <div className="withdraw-card glass-panel interactive-btn" onClick={() => setWithdrawMethod('upi')}>
              <div className="w-icon-wrapper fiat-icon" style={{ background: 'rgba(74, 222, 128, 0.2)' }}>
                <Landmark size={24} style={{ color: '#4ade80' }} />
              </div>
              <div className="w-info">
                <span className="w-title">UPI Payment</span>
                <span className="w-subtitle">Instant INR Transfer</span>
              </div>
              <span className="w-fee">0% fee</span>
            </div>

            <div className="withdraw-card glass-panel interactive-btn" onClick={() => setWithdrawMethod('crypto')}>
              <div className="w-icon-wrapper crypto-icon">
                <ArrowRightLeft size={24} />
              </div>
              <div className="w-info">
                <span className="w-title">Crypto Wallet</span>
                <span className="w-subtitle">USDT (TON Network)</span>
              </div>
              <span className="w-fee">0% fee</span>
            </div>

            <div className="withdraw-card glass-panel interactive-btn" onClick={() => setWithdrawMethod('bank')}>
              <div className="w-icon-wrapper fiat-icon">
                <CreditCard size={24} />
              </div>
              <div className="w-info">
                <span className="w-title">Bank Card</span>
                <span className="w-subtitle">Direct withdrawal</span>
              </div>
              <span className="w-fee">2% fee</span>
            </div>
          </div>
        )}
      </div>

      <div className="transaction-history">
        <h3 className="h3 section-title">Recent Activity</h3>
        <div className="history-list">
          {history.length > 0 ? (
            history.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'var(--glass-bg)', borderRadius: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{item.method.toUpperCase()} Withdrawal</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '4px' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>- {item.amount_coins} coins</span>
                  <span style={{ 
                    color: item.status === 'pending' ? '#fbbf24' : item.status === 'completed' ? '#4ade80' : '#ff4d4d', 
                    fontSize: '12px', 
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {item.status === 'pending' ? <Clock size={12} /> : item.status === 'completed' ? <CheckCircle2 size={12} /> : null}
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="history-empty">
              <span className="text-dim">No transactions yet.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
