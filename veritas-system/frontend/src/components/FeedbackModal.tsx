import { useState } from 'react';
import toast from 'react-hot-toast';
import { useI18n } from '../App';

const API = import.meta.env.VITE_API_BASE_URL ?? '';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  wallet: string | null;
}

export default function FeedbackModal({ open, onClose, wallet }: FeedbackModalProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), wallet }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(t('feedback.success'));
      setMessage('');
      onClose();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {t('feedback.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('feedback.placeholder')}
            rows={4}
            maxLength={1000}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />

          <p className="text-xs text-gray-400 text-right">
            {message.length}/1000
          </p>

          {!wallet && (
            <p className="text-xs text-gray-400 italic">{t('feedback.anonymous')}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={sending || message.trim().length === 0}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
          >
            {sending ? '…' : t('feedback.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
