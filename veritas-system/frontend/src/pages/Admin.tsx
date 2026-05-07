import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useI18n } from '../App';

interface MarketRow {
  id: number;
  question: string;
  end_time: string;
  publish_time: string;
  status: string;
  azuro_market_id: string | null;
  error_message: string | null;
}

interface Analytics {
  visitors: { today: number; week: number; month: number; year: number };
  referrals: { total: number; pendingRewards: number };
  dailyVisits: { day: string; count: number }[];
}

interface Volume {
  today: number;
  week: number;
  month: number;
  year: number;
}

interface StatusResponse {
  counts: { pending: number; published: number; failed: number };
  recent: MarketRow[];
  analytics: Analytics | null;
  volume: Volume | null;
}

const STATUS_COLORS: { [k: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function formatUsdc(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}K`;
  return `$${val.toFixed(2)}`;
}

export default function Admin() {
  const { t } = useI18n();
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('admin_token'));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logging, setLogging] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function login() {
    if (!password) return;
    setLogging(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json() as { token?: string; error?: string };
      if (!res.ok) { setLoginError(json.error ?? 'Invalid password'); return; }
      setToken(json.token!);
      sessionStorage.setItem('admin_token', json.token!);
      setPassword('');
    } catch {
      setLoginError('Cannot connect to server. Please try again.');
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
      const res = await fetch('/api/admin/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { logout(); return; }
      setStatus(await res.json() as StatusResponse);
    } catch { /* silent */ }
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
      const res = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json() as { inserted?: number; errors?: string[]; error?: string };
      if (!res.ok) { toast.error(json.error ?? 'Upload failed'); }
      else {
        toast.success(`Scheduled ${json.inserted} market(s)`);
        if (json.errors?.length) toast.error(`${json.errors.length} row(s) had errors`);
        setFile(null);
        fetchStatus();
      }
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }

  async function deleteMarket(id: number) {
    if (!token) return;
    if (!window.confirm('Delete this pending market? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/status?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success('Market deleted'); fetchStatus(); }
      else toast.error('Could not delete — only pending markets can be deleted');
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  }

  if (!token) {
    return (
      <div className="max-w-sm mx-auto pt-24 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">{t('admin.title')}</h1>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('admin.password')}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {showPassword && password && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3">
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">You are typing:</p>
              <p className="font-mono text-sm text-yellow-800 dark:text-yellow-200 break-all">{password}</p>
            </div>
          )}
          {loginError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{loginError}</p>
            </div>
          )}
          <button onClick={login} disabled={logging || !password} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition">
            {logging ? 'Checking...' : t('admin.login')}
          </button>
        </div>
      </div>
    );
  }

  const analytics = status?.analytics;
  const volume = status?.volume;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.title')}</h1>
        <div className="flex items-center gap-3">
          <button onClick={fetchStatus} className="text-xs text-gray-400 hover:text-brand-500 transition">Refresh</button>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500 transition">{t('admin.logout')}</button>
        </div>
      </div>

      {/* Trading Volume */}
      {volume && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Trading Volume (Azuro)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Today', value: formatUsdc(volume.today) },
              { label: 'This Week', value: formatUsdc(volume.week) },
              { label: 'This Month', value: formatUsdc(volume.month) },
              { label: 'This Year', value: formatUsdc(volume.year) },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visitor Analytics */}
      {analytics && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Visitor Analytics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Visitors Today', value: analytics.visitors.today },
              { label: 'This Week', value: analytics.visitors.week },
              { label: 'This Month', value: analytics.visitors.month },
              { label: 'This Year', value: analytics.visitors.year },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          {analytics.dailyVisits.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Daily Visits - Last 7 Days</p>
              <div className="flex items-end gap-2 h-24">
                {analytics.dailyVisits.map((d) => {
                  const max = Math.max(...analytics.dailyVisits.map((x) => Number(x.count)), 1);
                  const pct = Math.max((Number(d.count) / max) * 100, 4);
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-400">{d.count}</span>
                      <div className="w-full bg-brand-500 rounded-t" style={{ height: `${pct}%` }} />
                      <span className="text-xs text-gray-400 truncate w-full text-center">
                        {new Date(d.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Referrals', value: analytics.referrals.total, color: 'text-brand-600 dark:text-brand-400' },
              { label: 'Pending Rewards', value: analytics.referrals.pendingRewards, color: 'text-orange-600 dark:text-orange-400' },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Counts */}
      {status && (
        <div>
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Market Status</h2>
          <div className="grid grid-cols-3 gap-4">
            {(['pending', 'published', 'failed'] as const).map((key) => (
              <div key={key} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{status.counts[key]}</p>
                <p className="text-xs text-gray-400 capitalize mt-1">{t(`admin.${key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Upload */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('admin.uploadCsv')}</h2>
        <p className="text-xs text-gray-400">CSV columns: <code>question, end_time_utc, publish_time_utc</code></p>
        <div className="flex gap-3 items-start flex-wrap">
          <label className="flex-1">
            <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 cursor-pointer" />
          </label>
          <button onClick={uploadCsv} disabled={!file || uploading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition">
            {uploading ? t('common.loading') : t('admin.upload')}
          </button>
        </div>
      </div>

      {/* Markets Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('admin.scheduledMarkets')}</h2>
        </div>
        {!status?.recent.length ? (
          <p className="p-6 text-sm text-gray-400">No scheduled markets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Question</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Publish Time</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">End Time</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Azuro ID</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {status.recent.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-400">{row.id}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-gray-700 dark:text-gray-300" title={row.question}>{row.question}</p>
                      {row.error_message && <p className="text-red-500 truncate">{row.error_message}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400">{new Date(row.publish_time).toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400">{new Date(row.end_time).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] ?? ''}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-400 max-w-[100px] truncate">{row.azuro_market_id ?? '—'}</td>
                    <td className="px-4 py-3">
                      {row.status === 'pending' && (
                        <button
                          onClick={() => deleteMarket(row.id)}
                          disabled={deleting === row.id}
                          className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50 px-2 py-1 rounded border border-red-200 hover:border-red-400 transition"
                        >
                          {deleting === row.id ? '...' : 'Delete'}
                        </button>
                      )}
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