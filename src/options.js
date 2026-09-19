const $ = (id) => document.getElementById(id);

chrome.storage.sync.get(['apiKey', 'proxyUrl', 'autoRun']).then(({ apiKey = '', proxyUrl = '', autoRun = true }) => {
  $('apiKey').value = apiKey;
  $('proxyUrl').value = proxyUrl;
  $('autoRun').checked = autoRun !== false;
});

$('save').onclick = async () => {
  await chrome.storage.sync.set({
    apiKey: $('apiKey').value.trim(),
    proxyUrl: $('proxyUrl').value.trim(),
    autoRun: $('autoRun').checked
  });
  $('status').textContent = 'Saved';
  setTimeout(() => ($('status').textContent = ''), 1500);
};

chrome.storage.local.get('history').then(({ history = [] }) => {
  const rows = history
    .map(
      (h) => `<tr>
        <td><a href="${h.url}" target="_blank">${(h.title || h.url).slice(0, 48)}</a></td>
        <td>${h.price ? h.price + ' €' : '—'}</td>
        <td>${h.verdict}</td>
        <td>${Math.round(h.scam * 100)}%</td>
      </tr>`
    )
    .join('');
  document.getElementById('history').innerHTML = rows || '<tr><td>No listings checked yet.</td></tr>';
});
