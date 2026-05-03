import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useI18n } from '../App';

const API = import.meta.env.VITE_API_BASE_URL ?? '';

interface MarketRow {
  id: number;
  question: string;
  end_time: string;
  publish_time: string;
  status: string;
  azuro_market_id: string | null;
  error_message: string | null;
}

interface StatusResponse {
  counts: { pending: number; published: number; failed: number };
  recent: MarketRow[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Admin() {
  const { t } = useI18n();
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('admin_token')
  );
  const [password, setPassword] = useState('');
  const [logging, setLogging] = useState(false);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function login() {
    setLogging(true);
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('Invalid password');
      const json = await res.json() as { token: string };
      setToken(json.token);
      sessionStorage.setItem('admin_token', json.token);
      setPassword('');
    } catch {
      toast.error('Invalid password');
    } finally {
      setLogging(false);
    }
  }

  function logout() {
    setToken(null);
    sessionStorage.removeItem('admin_token');
  }

  async function fetchStatus() {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/admin/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { logout(); return; }
      const json = await res.json() as StatusResponse;
      setStatus(json);
    } catch {
      // Silent
    }
  }

  useEffect(() => {
    if (token) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 30_000);
      return () => clearInterval(interval);
    }
  }, [token]);

  async function uploadCsv() {
    if (!file || !token) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/api/admin/schedule`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json() as { inserted?: number; errors?: string[]; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? 'Upload failed');
      } else {
        toast.success(`Scheduled ${json.inserted} market(s)`);
        if (json.errors?.length) {
          toast.error(`${json.errors.length} row(s) had errors`);
        }
        setFile(null);
        fetchStatus();
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // ── Login screen ──────────────────────────────────────────────────────────

  if (!token) {
    return (
      <div className="max-w-sm mx-auto pt-24 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
          {t('admin.title')}
        </h1>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <input
            type="password"
            placeholder={t('admin.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={login}
            disabled={logging || !password}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
          >
            {logging ? t('common.loading') : t('admin.login')}
          </button>
        </div>
      </div>
    );
  }

  // ── Admin dashboard ───────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('admin.title')}
        </h1>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-500 transition"
        >
          {t('admin.logout')}
        </button>
      </div>

      {/* Stats */}
      {status && (
        <div className="grid grid-cols-3 gap-4">
          {(['pending', 'published', 'failed'] as const).map((key) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center"
            >
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {status.counts[key]}
              </p>
              <p className="text-xs text-gray-400 capitalize mt-1">
                {t(`admin.${key}`)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* CSV upload */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          {t('admin.uploadCsv')}
        </h2>
        <p className="text-xs text-gray-400">
          CSV columns: <code>question, end_time_utc, publish_time_utc</code>
        </p>

        <div className="flex gap-3 items-start flex-wrap">
          <label className="flex-1">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 dark:file:bg-brand-900/30 dark:file:text-brand-400 hover:file:bg-brand-100 cursor-pointer"
            />
          </label>
          <button
            onClick={uploadCsv}
            disabled={!file || uploading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
          >
            {uploading ? t('common.loading') : t('admin.upload')}
          </button>
        </div>

        {/* Example CSV download */}
        <a
          href="data:text/csv;charset=utf-8,question%2Cend_time_utc%2Cpublish_time_utc%0A%22Will%20BTC%20reach%20100k%3F%22%2C2025-12-31T23%3A59%3A59Z%2C2025-12-01T12%3A00%3A00Z"
          download="example-markets.csv"
          className="text-xs text-brand-500 hover:underline"
        >
          Download example CSV
        </a>
      </div>

      {/* Markets table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {t('admin.scheduledMarkets')}
          </h2>
          <button
            onClick={fetchStatus}
            className="text-xs text-gray-400 hover:text-brand-500 transition"
          >
            ↻ Refresh
          </button>
        </div>

        {!status?.recent.length ? (
          <p className="p-6 text-sm text-gray-400">No scheduled markets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                <tr>
                  {['ID', t('admin.question'), t('admin.publishTime'), t('admin.endTime'), t('admin.status'), t('admin.azuroId')].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left px-4 py-3 font-medium whitespace-nowrap"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {status.recent.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-400">{row.id}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-gray-700 dark:text-gray-300" title={row.question}>
                        {row.question}
                      </p>
                      {row.error_message && (
                        <p className="text-red-500 truncate" title={row.error_message}>
                          {row.error_message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                      {new Date(row.publish_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                      {new Date(row.end_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[row.status] ?? ''
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-400 max-w-[120px] truncate">
                      {row.azuro_market_id ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
