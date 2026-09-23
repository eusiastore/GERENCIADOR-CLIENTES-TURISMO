import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../Modal';

interface ExtratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  extratoTexto: string;
}

export const ExtratoModal: React.FC<ExtratoModalProps> = ({
  isOpen,
  onClose,
  extratoTexto
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyExtrato = () => {
    navigator.clipboard.writeText(extratoTexto);
    setCopied(true);
    toast.success('Extrato copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Extrato Financeiro do Cliente"
    >
      <div>
        <pre
          style={{
            background: '#f8fafc',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {extratoTexto}
        </pre>

        <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCopyExtrato}
            style={{ display: 'inline-flex', gap: '0.4rem' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copiado!' : 'Copiar para WhatsApp'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
