import { useState } from 'react';
import toast from 'react-hot-toast';
import { useI18n } from '../App';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  wallet: string | null;
}

export default function FeedbackModal({ open, onClose, wallet }: FeedbackModalProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const [wantsResponse, setWantsResponse] = useState(false);
  const [contactMethod, setContactMethod] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  function handleClose() {
    setMessage('');
    setWantsResponse(false);
    setContactMethod('');
    onClose();
  }

  async function handleSubmit() {
    if (!message.trim()) return;
    if (wantsResponse && !contactMethod.trim()) {
      toast.error('Please enter your contact method to receive a response');
      return;
    }
    setSending(true);
    try {
      const payload: Record<string, string | null> = {
        message: message.trim(),
        wallet,
        contactMethod: wantsResponse ? contactMethod.trim() : null,
      };
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(wantsResponse ? 'Thanks! We will get back to you.' : t('feedback.success'));
      handleClose();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">

        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {t('feedback.title')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
          >
            x
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

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{message.length}/1000</p>
            {!wallet && (
              <p className="text-xs text-gray-400 italic">{t('feedback.anonymous')}</p>
            )}
          </div>

          {/* Opt-in checkbox */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={wantsResponse}
                onChange={(e) => {
                  setWantsResponse(e.target.checked);
                  if (!e.target.checked) setContactMethod('');
                }}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition">
                I would like a response
              </span>
            </label>

            {wantsResponse && (
              <div className="space-y-1">
                <label className="text-xs text-gray-500 block">
                  How should we contact you? (email or Telegram)
                </label>
                <input
                  type="text"
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  placeholder="e.g. your@email.com or @yourtelegram"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
                <p className="text-xs text-gray-400">
                  Only used to reply to your feedback. Not stored permanently.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={sending || message.trim().length === 0 || (wantsResponse && !contactMethod.trim())}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
          >
            {sending ? 'Sending...' : t('feedback.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}