// Service worker: holds the API key, makes the one Jev call, caches verdicts.
import { MODEL, QUESTIONS, verdictFrom } from './questions.js';
import type {
  AnalysisResult,
  AnalyzeResponse,
  Listing,
  ListingSummary,
  Message,
  Settings,
  SystemOneResponse
} from './types.js';

// Where checks go when the user has set nothing. Point this at your deployed Worker
// and the extension works on install: no key, no setup. Direct calls to TypeSafe
// happen only when someone supplies their own key in the options page.
const DEFAULT_PROXY = 'https://pisocheck-proxy.hussein-saad-hasan.workers.dev';
const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const HISTORY_MAX = 50;

interface HistoryEntry {
  url: string;
  at: number;
  title: string | null;
  price: number | null;
  verdict: AnalysisResult['verdict'];
  scam: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
  }
}

async function settings(): Promise<Settings> {
  const { apiKey = '', proxyUrl = '', autoRun = true, license = '' } = await chrome.storage.sync.get([
    'apiKey',
    'proxyUrl',
    'autoRun',
    'license'
  ]);
  return { apiKey, proxyUrl: proxyUrl || DEFAULT_PROXY, autoRun, license };
}

/** An anonymous per-install id so the proxy can meter a free tier. It identifies a
 *  browser profile, never a person: no account, no email, nothing tied to the user. */
async function deviceId(): Promise<string> {
  const { deviceId } = (await chrome.storage.local.get('deviceId')) as { deviceId?: string };
  if (deviceId) return deviceId;
  const fresh = crypto.randomUUID();
  await chrome.storage.local.set({ deviceId: fresh });
  return fresh;
}

async function cacheGet(url: string): Promise<AnalysisResult | null> {
  const key = 'cache:' + url;
  const store = await chrome.storage.local.get(key);
  const hit = store[key] as { at: number; result: AnalysisResult } | undefined;
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.result;
  return null;
}

async function cachePut(url: string, result: AnalysisResult, listing: Listing): Promise<void> {
  await chrome.storage.local.set({ ['cache:' + url]: { at: Date.now(), result } });
  const { history = [] } = (await chrome.storage.local.get('history')) as {
    history?: HistoryEntry[];
  };
  const entry: HistoryEntry = {
    url,
    at: Date.now(),
    title: listing.title,
    price: listing.price_eur_month,
    verdict: result.verdict,
    scam: result.scam
  };
  const next = [entry, ...history.filter((h) => h.url !== url)].slice(0, HISTORY_MAX);
  await chrome.storage.local.set({ history: next });
}

function summarize(listing: Listing): ListingSummary {
  return {
    advertiser_name: listing.advertiser_name,
    advertiser_type: listing.advertiser_type,
    agency_profile_url: listing.agency_profile_url,
    agency_has_idealista_profile: listing.agency_has_idealista_profile,
    portal: listing.portal,
    city: listing.city,
    price_eur_month: listing.price_eur_month,
    size_m2: listing.size_m2,
    has_photos: listing.has_photos,
    has_description: listing.has_description,
    contact_phone_available: listing.contact_phone_available
  };
}

async function askJev(listing: Listing): Promise<AnalysisResult> {
  const { apiKey, proxyUrl, license } = await settings();
  // A user's own key always wins: it is direct, unmetered and costs the project nothing.
  const useOwnKey = !!apiKey;
  const endpoint = useOwnKey ? ENDPOINT : proxyUrl;
  if (!endpoint) {
    throw new ApiError(
      'No TypeSafe API key set. Open the PisoCheck options page and paste your key.',
      'NO_KEY'
    );
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (useOwnKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else {
    headers['X-PisoCheck-Device'] = await deviceId();
    if (license) headers['X-PisoCheck-License'] = license;
  }

  const started = Date.now();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ state: listing, model: MODEL, questions: QUESTIONS })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 429) {
      let message = 'Daily free checks used up. Try again tomorrow.';
      try {
        const parsed = JSON.parse(body) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        /* keep the default */
      }
      throw new ApiError(message, 'QUOTA');
    }
    throw new ApiError(
      res.status === 401
        ? 'TypeSafe rejected the API key (401). Check it in the options page.'
        : `TypeSafe returned ${res.status}. ${body.slice(0, 200)}`,
      'HTTP_' + res.status
    );
  }

  const quotaUsed = Number(res.headers.get('X-PisoCheck-Used'));
  const quotaLimit = Number(res.headers.get('X-PisoCheck-Limit'));

  const data = (await res.json()) as SystemOneResponse;
  return {
    ...verdictFrom(data.answers ?? {}, listing),
    listing: summarize(listing),
    latency_ms: Date.now() - started,
    usage: data.usage ?? null,
    model: data.model || MODEL,
    at: Date.now(),
    quota:
      Number.isFinite(quotaUsed) && Number.isFinite(quotaLimit) && quotaLimit > 0
        ? { used: quotaUsed, limit: quotaLimit, plan: res.headers.get('X-PisoCheck-Plan') ?? 'free' }
        : null
  };
}

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  if (msg.type === 'pisocheck:settings') {
    void settings().then(sendResponse);
    return true;
  }

  if (msg.type === 'pisocheck:analyze') {
    void (async () => {
      try {
        if (!msg.force) {
          const cached = await cacheGet(msg.listing.url);
          if (cached) {
            sendResponse({ ok: true, result: { ...cached, cached: true } } satisfies AnalyzeResponse);
            return;
          }
        }
        const result = await askJev(msg.listing);
        await cachePut(msg.listing.url, result, msg.listing);
        sendResponse({ ok: true, result } satisfies AnalyzeResponse);
      } catch (e) {
        sendResponse({
          ok: false,
          error: e instanceof Error ? e.message : String(e),
          code: e instanceof ApiError ? e.code : 'ERROR'
        } satisfies AnalyzeResponse);
      }
    })();
    return true;
  }

  if (msg.type === 'pisocheck:openOptions') {
    chrome.runtime.openOptionsPage();
  }
  return false;
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'pisocheck:run', force: true } satisfies Message);
  } catch {
    chrome.runtime.openOptionsPage();
  }
});
