import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, CreditCard, Landmark, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import './Wallet.css';

export default function Wallet() {
  const { balance, user } = useApp();
  const navigate = useNavigate();
  // 1000 coins = 1 Rupee -> 1 coin = 0.001 Rupees -> balance / 1000
  const MONEY_CONVERSION = balance / 1000;

  const [withdrawMethod, setWithdrawMethod] = useState<string | null>(null);
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [history, setHistory] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [newSupportMsg, setNewSupportMsg] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
      fetchSupportMessages();
    }
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

  const fetchSupportMessages = async () => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('player_id', user.id.toString())
      .order('created_at', { ascending: false });
    if (data) setSupportMessages(data);
  };

  const sendSupportMessage = async () => {
    if (!newSupportMsg.trim() || !user?.id) return;
    
    setSupportLoading(true);
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        player_id: user.id.toString(),
        message: newSupportMsg.trim()
      })
      .select()
      .single();

    if (!error && data) {
      setSupportMessages(prev => [data, ...prev]);
      setNewSupportMsg('');
    }
    setSupportLoading(false);
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
    if (amountCoins < 100000) {
      setMessage({ text: 'Minimum withdrawal is 100,000 coins (₹100)', type: 'error' });
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
              placeholder="Amount in Coins (min 100,000)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            {withdrawAmount && !isNaN(Number(withdrawAmount)) && (
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '15px', marginTop: '-10px' }}>
                You will receive: ₹{(Number(withdrawAmount) / 1000).toFixed(2)} INR
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', marginTop: '4px' }}>
                    <span style={{ 
                      color: (item.status === 'pending' || item.status === 'processing') ? '#fbbf24' : (item.status === 'completed' || item.status === 'approved') ? '#4ade80' : '#ff4d4d', 
                      fontSize: '12px', 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textTransform: 'capitalize'
                    }}>
                      {(item.status === 'pending' || item.status === 'processing') ? <Clock size={12} /> : (item.status === 'completed' || item.status === 'approved') ? <CheckCircle2 size={12} /> : null}
                      {item.status}
                    </span>
                    {item.admin_message && (
                      <span style={{ color: '#fbbf24', fontSize: '11px', fontStyle: 'italic', maxWidth: '150px', textAlign: 'right' }}>
                        {item.admin_message}
                      </span>
                    )}
                  </div>
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

      {/* Support System */}
      <div className="support-section" style={{ marginTop: '32px' }}>
        <h3 className="h3 section-title">Support & Queries</h3>
        <div className="support-history glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
          {supportMessages.length > 0 ? (
            <div className="support-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
              {supportMessages.map(msg => (
                <div key={msg.id} className="support-thread" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="user-message" style={{ alignSelf: 'flex-end', background: 'var(--accent-primary)', color: '#000', padding: '10px 14px', borderRadius: '18px 18px 2px 18px', fontSize: '14px', maxWidth: '85%' }}>
                    {msg.message}
                  </div>
                  {msg.reply && (
                    <div className="admin-reply" style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '18px 18px 18px 2px', fontSize: '14px', maxWidth: '85%', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--accent-primary)', marginBottom: '4px', fontWeight: 'bold' }}>ADMIN REPLY</div>
                      {msg.reply}
                    </div>
                  )}
                  {!msg.reply && (
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'right', marginTop: '-4px' }}>
                      Pending reply...
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-dim" style={{ textAlign: 'center', fontSize: '14px' }}>
              No messages sent yet. How can we help?
            </div>
          )}
        </div>

        <div className="support-input-area glass-panel" style={{ padding: '16px' }}>
          <textarea 
            className="input-field" 
            placeholder="Describe your issue or question..." 
            style={{ minHeight: '80px', resize: 'none', marginBottom: '12px' }}
            value={newSupportMsg}
            onChange={(e) => setNewSupportMsg(e.target.value)}
          />
          <button 
            className="w-btn w-btn-primary" 
            style={{ width: '100%' }}
            onClick={sendSupportMessage}
            disabled={supportLoading || !newSupportMsg.trim()}
          >
            {supportLoading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>

      <div className="legal-section" style={{ marginTop: '32px', textAlign: 'center' }}>
        <button 
          className="interactive-btn" 
          onClick={() => navigate('/legal')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            textDecoration: 'underline',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          View Privacy Policy & Terms
        </button>
      </div>

    </div>
  );
}
