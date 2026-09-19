/* PisoCheck — glue: detect a listing page, extract it, ask the worker, render the panel.
   Idealista navigates client-side, so the URL is polled and the panel re-runs on change. */
import { extract, isListingPage } from './extract.js';
import { Panel } from './panel.js';
import type { AnalyzeResponse, Message, Settings } from './types.js';

let panel: Panel | null = null;
let currentUrl: string | null = null;
let running = false;

function ensurePanel(): Panel {
  if (!panel || !panel.host.isConnected) {
    panel = new Panel();
    panel.onRecheck = () => void run(true);
  }
  return panel;
}

async function run(force: boolean): Promise<void> {
  if (running) return;
  running = true;
  const p = ensurePanel();
  p.loading();
  try {
    const listing = extract();
    const res = (await chrome.runtime.sendMessage({
      type: 'pisocheck:analyze',
      listing,
      force
    } satisfies Message)) as AnalyzeResponse | undefined;

    if (!res) throw new Error('No response from the PisoCheck background worker.');
    if (res.ok) p.result(res.result);
    else p.error(res.error, res.code);
  } catch (e) {
    p.error(e instanceof Error ? e.message : String(e));
  } finally {
    running = false;
  }
}

async function onPage(): Promise<void> {
  if (!isListingPage()) {
    if (panel?.host.isConnected) panel.host.remove();
    panel = null;
    return;
  }
  const settings = (await chrome.runtime.sendMessage({
    type: 'pisocheck:settings'
  } satisfies Message)) as Settings | undefined;

  if (settings?.autoRun === false) ensurePanel().idle();
  else void run(false);
}

function watch(): void {
  if (location.href === currentUrl) return;
  currentUrl = location.href;
  void onPage();
}

chrome.runtime.onMessage.addListener((msg: Message) => {
  if (msg.type === 'pisocheck:run') void run(msg.force ?? false);
});

watch();
setInterval(watch, 1000);
