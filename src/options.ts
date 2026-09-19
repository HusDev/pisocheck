import type { Settings } from './types.js';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
};

interface HistoryEntry {
  url: string;
  title: string | null;
  price: number | null;
  verdict: string;
  scam: number;
}

let license = '';

void chrome.storage.sync
  .get(['apiKey', 'proxyUrl', 'autoRun', 'license'])
  .then(({ apiKey = '', proxyUrl = '', autoRun = true, license: stored = '' }: Partial<Settings>) => {
    license = stored;
    $<HTMLInputElement>('apiKey').value = apiKey;
    $<HTMLInputElement>('proxyUrl').value = proxyUrl;
    $<HTMLInputElement>('autoRun').checked = autoRun !== false;
  });

$<HTMLButtonElement>('save').onclick = async () => {
  await chrome.storage.sync.set({
    apiKey: $<HTMLInputElement>('apiKey').value.trim(),
    proxyUrl: $<HTMLInputElement>('proxyUrl').value.trim(),
    autoRun: $<HTMLInputElement>('autoRun').checked,
    license
  } satisfies Settings);
  const status = $('status');
  status.textContent = 'Saved';
  setTimeout(() => (status.textContent = ''), 1500);
};

void chrome.storage.local.get('history').then(({ history = [] }: { history?: HistoryEntry[] }) => {
  const rows = history
    .map(
      (h) => `<tr>
        <td><a href="${h.url}" target="_blank">${(h.title ?? h.url).slice(0, 48)}</a></td>
        <td>${h.price ? h.price + ' €' : '—'}</td>
        <td>${h.verdict}</td>
        <td>${Math.round(h.scam * 100)}%</td>
      </tr>`
    )
    .join('');
  $('history').innerHTML = rows || '<tr><td>No listings checked yet.</td></tr>';
});
