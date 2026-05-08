import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const alreadyDismissed = localStorage.getItem('pwa_dismissed');
    if (alreadyDismissed) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const inStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

    if (inStandaloneMode) return;

    if (ios) {
      setIsIOS(true);
      setTimeout(() => setShow(true), 3000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pwa_dismissed', '1');
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
      localStorage.setItem('pwa_dismissed', '1');
    }
  }

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-40 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <img src="/logo.svg" alt="Veritas" className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Add Veritas to Home Screen</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {isIOS
              ? 'Tap the Share button then "Add to Home Screen" for quick access'
              : 'Install Veritas as an app for faster access and a better experience'}
          </p>
        </div>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 text-lg shrink-0 mt-0.5">x</button>
      </div>
      {!isIOS && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={dismiss}
            className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-500 text-sm py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Not now
          </button>
          <button
            onClick={install}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-xl transition"
          >
            Install App
          </button>
        </div>
      )}
      {isIOS && (
        <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <p className="text-xs text-gray-500 text-center">
            Tap <span className="text-brand-500">Share</span> then <span className="text-brand-500">Add to Home Screen</span>
          </p>
        </div>
      )}
    </div>
  );
}