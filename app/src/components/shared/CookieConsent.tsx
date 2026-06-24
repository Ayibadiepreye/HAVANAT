import { useEffect, useState } from 'react';
import { X, Cookie } from 'lucide-react';
import { BRAND } from '@/config/brand';

const STORAGE_KEY = 'havanat-cookie-consent';

interface CookiePrefs {
  essential: true; // always true; non-toggleable
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: number;
}

const CURRENT_VERSION = 1;
const DEFAULT_PREFS: Omit<CookiePrefs, 'timestamp'> = {
  essential: true,
  analytics: false,
  marketing: false,
  version: CURRENT_VERSION,
};

function readPrefs(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== CURRENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePrefs(prefs: CookiePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function hasConsent(category: 'analytics' | 'marketing'): boolean {
  const prefs = readPrefs();
  if (!prefs) return false;
  return prefs[category];
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readPrefs();
    if (!existing) {
      // Small delay so the banner doesn't flash on first paint
      const t = window.setTimeout(() => setVisible(true), 600);
      return () => window.clearTimeout(t);
    }
    setAnalytics(existing.analytics);
    setMarketing(existing.marketing);
    return undefined;
  }, []);

  function save(prefs: { analytics: boolean; marketing: boolean }) {
    writePrefs({
      ...DEFAULT_PREFS,
      ...prefs,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
    // Trigger a custom event so analytics scripts can react
    window.dispatchEvent(new CustomEvent('havanat-cookie-consent-update'));
  }

  function acceptAll() {
    save({ analytics: true, marketing: true });
  }
  function rejectAll() {
    save({ analytics: false, marketing: false });
  }
  function saveCustom() {
    save({ analytics, marketing });
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop dim when customize is open */}
      {showCustomize && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 transition-opacity"
          onClick={() => setShowCustomize(false)}
        />
      )}

      {/* Customize panel (slides up from bottom) */}
      {showCustomize && (
        <div className="fixed inset-x-0 bottom-0 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md z-[61] bg-white border border-gray-200 shadow-2xl animate-in slide-in-from-bottom-2">
          <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] tracking-[0.25em] text-gray-400 uppercase mb-1">Cookie Preferences</p>
                <h3 className="font-serif text-xl">Your choices</h3>
              </div>
              <button onClick={() => setShowCustomize(false)} className="text-gray-400 hover:text-black" aria-label="Close preferences">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              {BRAND.name} uses cookies to make this site work, to measure how it performs, and to tailor marketing.
              You can choose which optional categories to allow. Essential cookies cannot be disabled.
            </p>

            <div className="space-y-3">
              <PrefRow
                title="Essential"
                desc="Required for cart, checkout, sign-in, and security. Cannot be disabled."
                enabled
                locked
                onChange={() => undefined}
              />
              <PrefRow
                title="Analytics"
                desc="Anonymous usage data so we can understand which pages and products are most popular."
                enabled={analytics}
                onChange={setAnalytics}
              />
              <PrefRow
                title="Marketing"
                desc="Personalised ads and product recommendations on other sites."
                enabled={marketing}
                onChange={setMarketing}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-5">
              <button
                onClick={() => { setAnalytics(false); setMarketing(false); }}
                className="px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium border border-gray-300 hover:border-black flex-1"
              >
                Reject all
              </button>
              <button
                onClick={saveCustom}
                className="px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium bg-black text-white hover:bg-gray-900 flex-1"
              >
                Save choices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main banner */}
      {!showCustomize && (
        <div className="fixed inset-x-0 bottom-0 sm:bottom-4 sm:left-4 sm:right-4 z-[60] bg-white border border-gray-200 shadow-2xl">
          <div className="max-w-6xl mx-auto p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Cookie className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  We use cookies
                </p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {BRAND.name} uses essential cookies to run this site and optional cookies to understand how you use it.{' '}
                  <a href="/privacy" className="underline underline-offset-2 hover:text-black">Privacy Policy</a>
                  {' · '}
                  <a href="/privacy#cookies" className="underline underline-offset-2 hover:text-black">Cookie details</a>
                </p>
              </div>
              <button
                onClick={() => setVisible(false)}
                className="text-gray-400 hover:text-black flex-shrink-0"
                aria-label="Dismiss cookie banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={() => setShowCustomize(true)}
                className="px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium border border-gray-300 hover:border-black"
              >
                Customize
              </button>
              <button
                onClick={rejectAll}
                className="px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium border border-gray-300 hover:border-black"
              >
                Reject non-essential
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium bg-black text-white hover:bg-gray-900 sm:ml-auto"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PrefRow({
  title,
  desc,
  enabled,
  locked,
  onChange,
}: {
  title: string;
  desc: string;
  enabled: boolean;
  locked?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 border border-gray-200">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium flex items-center gap-2">
          {title}
          {locked && <span className="text-[9px] uppercase tracking-wider text-gray-400">Always on</span>}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => !locked && onChange(!enabled)}
        disabled={locked}
        className={`relative w-11 h-6 flex-shrink-0 transition-colors ${
          enabled ? 'bg-black' : 'bg-gray-300'
        } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={`${title} cookies ${enabled ? 'enabled' : 'disabled'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}