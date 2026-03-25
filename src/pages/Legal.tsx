import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import './Legal.css';

interface LegalDoc {
  id: string;
  type: string;
  title: string;
  content: string;
  updated_at: string;
}

export default function Legal() {
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      const { data } = await supabase.from('legal_documents').select('*');
      if (data) {
        setDocs(data);
      }
    };
    fetchDocs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => prev === id ? null : id);
  };

  return (
    <div className="page-container legal-page animate-fade-in">
      <div className="page-header" style={{ textAlign: 'center', marginTop: '16px' }}>
        <ShieldCheck size={48} className="text-accent" style={{ margin: '0 auto 16px' }} />
        <h1 className="h1">Legal & Privacy</h1>
        <p className="body text-dim" style={{ marginTop: '8px' }}>Review our policies and terms.</p>
      </div>

      <div className="legal-list">
        {docs.length > 0 ? docs.map((doc) => (
          <div key={doc.id} className="legal-card glass-panel">
            <div className="legal-header" onClick={() => toggleExpand(doc.id)}>
              <h3 className="h3">{doc.title}</h3>
              {expanded === doc.id ? <ChevronUp size={24} className="text-accent" /> : <ChevronDown size={24} className="text-accent" />}
            </div>
            {expanded === doc.id && (
              <div className="legal-content animate-fade-in">
                <p className="text-dim" style={{ fontSize: '12px', marginBottom: '12px' }}>
                  Last updated: {new Date(doc.updated_at).toLocaleDateString()}
                </p>
                <div className="legal-text body" style={{ whiteSpace: 'pre-wrap' }}>
                  {doc.content}
                </div>
              </div>
            )}
          </div>
        )) : (
          <p className="text-dim text-center">Loading documents...</p>
        )}
      </div>
    </div>
  );
}
