import { ArrowRightLeft, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Wallet.css';

export default function Wallet() {
  const { balance } = useApp();
  // Let's say 10000 coins = $1.00
  const MONEY_CONVERSION = balance / 10000;

  return (
    <div className="page-container wallet-page animate-fade-in">
      <div className="wallet-hero glass-panel">
        <h2 className="caption text-dim">Current Balance</h2>
        <div className="wallet-balance-row">
          <span className="coin-large">💰</span>
          <span className="wallet-balance">{balance.toLocaleString()}</span>
        </div>
        <div className="usd-equivalent">
          ~ ${MONEY_CONVERSION.toFixed(2)} USD
        </div>
      </div>

      <div className="withdraw-section">
        <h3 className="h3 section-title">Withdraw Options</h3>
        
        <div className="withdraw-cards">
          <div className="withdraw-card glass-panel interactive-btn">
            <div className="w-icon-wrapper crypto-icon">
              <ArrowRightLeft size={24} />
            </div>
            <div className="w-info">
              <span className="w-title">Crypto Wallet</span>
              <span className="w-subtitle">USDT (TON Network)</span>
            </div>
            <span className="w-fee">0% fee</span>
          </div>

          <div className="withdraw-card glass-panel interactive-btn">
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
      </div>

      <div className="transaction-history">
        <h3 className="h3 section-title">Recent Activity</h3>
        <div className="history-empty">
          <span className="text-dim">No transactions yet.</span>
        </div>
      </div>
    </div>
  );
}
