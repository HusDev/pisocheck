/* PisoCheck — glue: detect a listing page, extract it, ask the worker, render the panel.
   Idealista navigates client-side, so the URL is polled and the panel re-runs on change. */
(() => {
  const { extract, isListingPage } = window.__pisocheckExtract;
  const Panel = window.__pisocheckPanel;

  let panel = null;
  let currentUrl = null;
  let running = false;

  function ensurePanel() {
    if (!panel || !panel.host.isConnected) {
      panel = new Panel();
      panel.onRecheck = () => run(true);
    }
    return panel;
  }

  async function run(force) {
    if (running) return;
    running = true;
    const p = ensurePanel();
    p.loading();
    try {
      const listing = extract();
      const res = await chrome.runtime.sendMessage({ type: 'pisocheck:analyze', listing, force });
      if (!res) throw new Error('No response from the PisoCheck background worker.');
      if (res.ok) p.result(res.result);
      else p.error(res.error, res.code);
    } catch (e) {
      p.error(e.message || String(e));
    } finally {
      running = false;
    }
  }

  async function onPage() {
    if (!isListingPage()) {
      if (panel && panel.host.isConnected) panel.host.remove();
      panel = null;
      return;
    }
    const { autoRun } = (await chrome.runtime.sendMessage({ type: 'pisocheck:settings' })) || {};
    if (autoRun === false) ensurePanel().idle();
    else run(false);
  }

  function watch() {
    if (location.href === currentUrl) return;
    currentUrl = location.href;
    onPage();
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'pisocheck:run') run(msg.force);
  });

  watch();
  setInterval(watch, 1000);
})();
