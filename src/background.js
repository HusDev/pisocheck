// Service worker: holds the API key, makes the one Jev call, caches verdicts.
import { MODEL, QUESTIONS, verdictFrom } from './questions.js';

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const HISTORY_MAX = 50;

async function settings() {
  const { apiKey = '', proxyUrl = '', autoRun = true } = await chrome.storage.sync.get([
    'apiKey',
    'proxyUrl',
    'autoRun'
  ]);
  return { apiKey, proxyUrl, autoRun };
}

async function cacheGet(url) {
  const key = 'cache:' + url;
  const store = await chrome.storage.local.get(key);
  const hit = store[key];
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.result;
  return null;
}

async function cachePut(url, result, listing) {
  await chrome.storage.local.set({ ['cache:' + url]: { at: Date.now(), result } });
  const { history = [] } = await chrome.storage.local.get('history');
  const entry = {
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

async function askJev(listing) {
  const { apiKey, proxyUrl } = await settings();
  const endpoint = proxyUrl || ENDPOINT;
  if (!proxyUrl && !apiKey) {
    const err = new Error('No TypeSafe API key set. Open the PisoCheck options page and paste your key.');
    err.code = 'NO_KEY';
    throw err;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (!proxyUrl) headers.Authorization = `Bearer ${apiKey}`;

  const started = Date.now();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ state: listing, model: MODEL, questions: QUESTIONS })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(
      res.status === 401
        ? 'TypeSafe rejected the API key (401). Check it in the options page.'
        : `TypeSafe returned ${res.status}. ${body.slice(0, 200)}`
    );
    err.code = 'HTTP_' + res.status;
    throw err;
  }

  const data = await res.json();
  return {
    ...verdictFrom(data.answers || {}, listing),
    answers: data.answers || {},
    latency_ms: Date.now() - started,
    usage: data.usage || null,
    model: data.model || MODEL,
    at: Date.now()
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'pisocheck:settings') {
    settings().then(sendResponse);
    return true;
  }

  if (msg.type === 'pisocheck:analyze') {
    (async () => {
      try {
        if (!msg.force) {
          const cached = await cacheGet(msg.listing.url);
          if (cached) return sendResponse({ ok: true, result: { ...cached, cached: true } });
        }
        const result = await askJev(msg.listing);
        result.listing = {
          advertiser_name: msg.listing.advertiser_name,
          advertiser_type: msg.listing.advertiser_type,
          agency_profile_url: msg.listing.agency_profile_url,
          agency_has_idealista_profile: msg.listing.agency_has_idealista_profile,
          price_eur_month: msg.listing.price_eur_month,
          size_m2: msg.listing.size_m2,
          has_photos: msg.listing.has_photos,
          has_description: msg.listing.has_description,
          contact_phone_available: msg.listing.contact_phone_available
        };
        await cachePut(msg.listing.url, result, msg.listing);
        sendResponse({ ok: true, result });
      } catch (e) {
        sendResponse({ ok: false, error: e.message, code: e.code || 'ERROR' });
      }
    })();
    return true;
  }

  if (msg.type === 'pisocheck:openOptions') {
    chrome.runtime.openOptionsPage();
    return false;
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'pisocheck:run', force: true });
  } catch {
    chrome.runtime.openOptionsPage();
  }
});
