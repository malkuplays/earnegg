import React from 'react';
import './HtmlPopup.css';
import { X } from 'lucide-react';

interface HtmlPopupProps {
  html: string;
  onClose: () => void;
}

const HtmlPopup: React.FC<HtmlPopupProps> = ({ html, onClose }) => {
  if (!html || html.trim() === '') return null;

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <button className="popup-close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        <div 
          className="popup-content" 
          dangerouslySetInnerHTML={{ __html: html }} 
        />
      </div>
    </div>
  );
};

export default HtmlPopup;
