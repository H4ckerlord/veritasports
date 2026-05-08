import { useState } from 'react';
import toast from 'react-hot-toast';
import { useI18n } from '../App';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  wallet: string | null;
}

function isValidGmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim());
}

export default function FeedbackModal({ open, onClose, wallet }: FeedbackModalProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const [wantsResponse, setWantsResponse] = useState(false);
  const [contactMethod, setContactMethod] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  function handleClose() {
    setMessage('');
    setWantsResponse(false);
    setContactMethod('');
    setEmailError('');
    onClose();
  }

  function handleContactChange(val: string) {
    setContactMethod(val);
    if (val.includes('@')) {
      if (!isValidGmail(val)) {
        setEmailError('Please enter a valid Gmail address ending with @gmail.com');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }

  async function handleSubmit() {
    if (!message.trim()) return;
    if (wantsResponse) {
      if (!contactMethod.trim()) {
        toast.error('Please enter your Gmail or Telegram to receive a response');
        return;
      }
      if (contactMethod.includes('@') && !isValidGmail(contactMethod)) {
        setEmailError('Only Gmail addresses are accepted. Please use your @gmail.com address');
        return;
      }
    }
    setSending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          wallet,
          contactMethod: wantsResponse ? contactMethod.trim() : null,
        }),
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('feedback.title')}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
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
            {!wallet && <p className="text-xs text-gray-400 italic">{t('feedback.anonymous')}</p>}
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wantsResponse}
              onChange={(e) => { setWantsResponse(e.target.checked); if (!e.target.checked) { setContactMethod(''); setEmailError(''); } }}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">I would like a response</span>
          </label>
          {wantsResponse && (
            <div className="space-y-1">
              <label className="text-xs text-gray-500 block">Gmail address or Telegram username</label>
              <input
                type="text"
                value={contactMethod}
                onChange={(e) => handleContactChange(e.target.value)}
                placeholder="yourname@gmail.com or @yourtelegram"
                className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 text-sm ${
                  emailError
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-gray-200 dark:border-gray-700 focus:ring-brand-500'
                }`}
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              {!emailError && contactMethod.includes('@gmail.com') && (
                <p className="text-xs text-emerald-500">Valid Gmail address</p>
              )}
              <p className="text-xs text-gray-400">Only Gmail addresses are accepted for email contact.</p>
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={sending || !message.trim() || (wantsResponse && (!contactMethod.trim() || !!emailError))}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
          >
            {sending ? 'Sending...' : t('feedback.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}