/* PisoCheck — the on-page panel. Lives in a shadow root so Idealista's CSS can't touch it. */
import type { AnalysisResult, Factor } from './types.js';

const STYLE = `
:host { all: initial; }
* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.wrap {
  position: fixed; right: 20px; bottom: 20px; width: 340px; z-index: 2147483000;
  background: #fff; color: #10151c; border-radius: 14px; overflow: hidden;
  box-shadow: 0 12px 40px rgba(12, 20, 33, .22), 0 0 0 1px rgba(12, 20, 33, .07);
  font-size: 13px; line-height: 1.45;
  /* Never grow past the viewport: the head and foot stay put, the middle scrolls. */
  max-height: calc(100vh - 40px); display: flex; flex-direction: column;
}
.head, .foot { flex: 0 0 auto; }
.head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #10151c; color: #fff; }
.brand { font-weight: 700; letter-spacing: .2px; font-size: 13px; }
.spacer { flex: 1; }
.iconbtn { background: none; border: 0; color: #9aa6b5; cursor: pointer; font-size: 15px; padding: 2px 5px; border-radius: 6px; }
.iconbtn:hover { color: #fff; background: rgba(255,255,255,.1); }
.body { padding: 14px; flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.body::-webkit-scrollbar { width: 8px; }
.body::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, .35); border-radius: 4px; }
.body::-webkit-scrollbar-track { background: transparent; }
.top { display: flex; align-items: center; gap: 14px; }
.ring { position: relative; width: 74px; height: 74px; flex: 0 0 74px; }
.ring svg { transform: rotate(-90deg); }
.ring .val { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ring .pct { font-size: 19px; font-weight: 700; }
.ring .cap { font-size: 9px; text-transform: uppercase; letter-spacing: .5px; color: #64748b; }
.verdict { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
.sub { color: #64748b; font-size: 12px; }
.pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.skip { background: #fde8e8; color: #b42318; }
.caution { background: #fef3c7; color: #92400e; }
.strong { background: #dcfce7; color: #166534; }
.reasons { margin: 12px 0 0; padding: 0; list-style: none; }
.reasons li { display: flex; gap: 7px; padding: 4px 0; color: #334155; }
.reasons li::before { content: "▲"; color: #d92d20; font-size: 9px; line-height: 1.7; }
.factors { margin-top: 12px; border-top: 1px solid #eef1f5; padding-top: 10px; }
.factor.muted .fname, .factor.muted .fval { color: #94a3b8; font-style: italic; }
.factor { display: grid; grid-template-columns: 1fr 42px; gap: 8px; align-items: center; padding: 3px 0; }
.fname { font-size: 12px; color: #475569; }
.bar { grid-column: 1 / -1; height: 5px; border-radius: 3px; background: #eef1f5; overflow: hidden; }
.bar i { display: block; height: 100%; border-radius: 3px; }
.fval { font-size: 11px; font-weight: 600; text-align: right; color: #64748b; }
.adv { margin-top: 12px; border-top: 1px solid #eef1f5; padding-top: 10px; }
.advname { font-weight: 600; font-size: 12px; display: flex; align-items: center; gap: 6px; }
.badge { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 999px; background: #dcfce7; color: #166534; }
.badge.grey { background: #eef1f5; color: #64748b; }
.links { margin-top: 6px; display: flex; gap: 12px; }
.links a { color: #2563eb; font-size: 11px; text-decoration: none; }
.links a:hover { text-decoration: underline; }
.gap { margin-top: 10px; padding: 8px 10px; border-radius: 8px; background: #fef3c7; color: #92400e; font-size: 11.5px; line-height: 1.4; }
.note { margin-top: 6px; font-size: 10.5px; color: #94a3b8; line-height: 1.4; }
details.more { margin-top: 12px; border-top: 1px solid #eef1f5; padding-top: 8px; }
details.more > summary {
  cursor: pointer; list-style: none; font-size: 11.5px; font-weight: 600; color: #64748b;
  display: flex; align-items: center; gap: 5px; padding: 2px 0; user-select: none;
}
details.more > summary::-webkit-details-marker { display: none; }
details.more > summary::after { content: "\\25be"; font-size: 9px; }
details.more[open] > summary::after { content: "\\25b4"; }
details.more > summary:hover { color: #334155; }
.foot { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: #f8fafc; border-top: 1px solid #eef1f5; color: #94a3b8; font-size: 11px; }
.btn { border: 1px solid #d8dfe8; background: #fff; color: #334155; border-radius: 7px; padding: 4px 9px; font-size: 11px; font-weight: 600; cursor: pointer; }
.btn:hover { background: #f1f5f9; }
.msg { padding: 6px 0; color: #475569; }
.err { color: #b42318; }
.loading { display: flex; align-items: center; gap: 9px; color: #475569; }
.spin { width: 15px; height: 15px; border: 2px solid #e2e8f0; border-top-color: #10151c; border-radius: 50%; animation: s .7s linear infinite; }
@keyframes s { to { transform: rotate(360deg); } }
.collapsed .body, .collapsed .foot { display: none; }
@media (prefers-color-scheme: dark) {
  .wrap { background: #151a21; color: #e8edf3; }
  .fname, .msg, .sub { color: #9aa6b5; }
  .factors, .foot { border-color: #232a33; }
  .bar { background: #232a33; }
  .foot { background: #11161c; }
  .btn { background: #1c232b; border-color: #2c353f; color: #e8edf3; }
  .reasons li { color: #cbd5e1; }
  .adv, details.more { border-color: #232a33; }
  .gap { background: #3a2f12; color: #fbbf24; }
  details.more > summary:hover { color: #e8edf3; }
  .badge.grey { background: #232a33; color: #9aa6b5; }
  .links a { color: #7aa7ff; }
}
`;

const RISK_COLOR = (v: number): string => (v >= 0.6 ? '#d92d20' : v >= 0.35 ? '#f79009' : '#12b76a');
const TRUST_COLOR = (v: number): string => (v >= 0.6 ? '#12b76a' : v >= 0.35 ? '#f79009' : '#98a2b3');
const pct = (v: number): string => Math.round(v * 100) + '%';

const VERDICT_TEXT: Record<AnalysisResult['verdict'], [string, string]> = {
  skip: ['Skip this one', 'skip'],
  caution: ['Proceed with caution', 'caution'],
  strong: ['Strong candidate', 'strong']
};

export class Panel {
  readonly host: HTMLDivElement;
  private readonly root: ShadowRoot;
  private readonly wrap: HTMLDivElement;
  onRecheck: () => void = () => {};

  constructor() {
    this.host = document.createElement('div');
    this.host.id = 'pisocheck-root';
    this.root = this.host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    this.root.appendChild(style);
    this.wrap = document.createElement('div');
    this.wrap.className = 'wrap';
    this.root.appendChild(this.wrap);
    document.documentElement.appendChild(this.host);
  }

  private shell(inner: string, foot = ''): void {
    this.wrap.innerHTML = `
        <div class="head">
          <span class="brand">PisoCheck</span>
          <span class="spacer"></span>
          <button class="iconbtn" data-act="collapse" title="Collapse">\u2013</button>
          <button class="iconbtn" data-act="close" title="Close">\u00d7</button>
        </div>
        <div class="body">${inner}</div>
        ${foot ? `<div class="foot">${foot}</div>` : ''}`;

    const on = (act: string, fn: () => void): void => {
      const el = this.wrap.querySelector<HTMLElement>(`[data-act="${act}"]`);
      if (el) el.onclick = fn;
    };
    on('close', () => this.host.remove());
    on('collapse', () => this.wrap.classList.toggle('collapsed'));
    on('recheck', () => this.onRecheck());
    on('options', () => void chrome.runtime.sendMessage({ type: 'pisocheck:openOptions' }));
  }

  loading(): void {
    this.shell('<div class="loading"><span class="spin"></span> Asking Jev about this listing\u2026</div>');
  }

  error(message: string, code?: string): void {
    const action =
      code === 'QUOTA' || code === 'GLOBAL_CAP'
        ? '<button class="btn" data-act="recheck">Try again</button>'
        : code === 'NO_KEY' || code === 'HTTP_401'
          ? '<button class="btn" data-act="options">Open settings</button>'
          : '<button class="btn" data-act="recheck">Retry</button>';
    this.shell(`<div class="msg err">${message}</div><div style="margin-top:8px">${action}</div>`);
  }

  idle(): void {
    this.shell(
      '<div class="msg">Check this listing for scam and rental risk.</div>' +
        '<div style="margin-top:8px"><button class="btn" data-act="recheck">Check listing</button></div>'
    );
  }

  result(r: AnalysisResult): void {
    const [label, cls] = VERDICT_TEXT[r.verdict];
    const c = RISK_COLOR(r.composite);
    const circ = 2 * Math.PI * 31;

    const gapNote = r.tooThin
      ? `<div class="gap"><b>Little to verify:</b> ${r.gaps.join(
          ', '
        )}. The risk score reflects that you cannot check this advert, not that something specific is wrong with it.</div>`
      : '';

    const reasons = r.reasons.length
      ? `<ul class="reasons">${r.reasons
          .map((f) => `<li>${f.label} \u2014 ${pct(f.value)}</li>`)
          .join('')}</ul>`
      : '<div class="msg" style="margin-top:10px">No individual risk factor stands out.</div>';

    const factorRow = (f: Factor): string =>
      f.muted
        ? `<div class="factor muted">
              <span class="fname">${f.label}</span>
              <span class="fval">n/a</span>
              <span class="bar"><i style="width:100%;background:repeating-linear-gradient(90deg,#cbd5e1 0 4px,transparent 4px 8px)"></i></span>
            </div>`
        : `<div class="factor">
              <span class="fname">${f.label}</span>
              <span class="fval">${pct(f.value)}</span>
              <span class="bar"><i style="width:${Math.max(2, f.value * 100)}%;background:${RISK_COLOR(
            f.value
          )}"></i></span>
            </div>`;

    const factors = r.factors.map(factorRow).join('');
    const mutedCount = r.factors.filter((f) => f.muted).length;
    const mutedNote = mutedCount
      ? `<div class="note" style="margin-top:8px">${mutedCount} signals cannot be assessed: this advert has no description to read.</div>`
      : '';

    const tenancy = r.tenancy
      ? `<div class="sub" style="margin-top:10px">Tenancy on offer: <b>${r.tenancy.choice.replace(
          /_/g,
          ' '
        )}</b> \u00b7 confidence ${pct(r.tenancy.confidence)}</div>`
      : '';

    const l = r.listing;
    const advName =
      l?.advertiser_name || (l?.advertiser_type === 'private' ? 'Private advertiser' : 'Advertiser not named');
    const searchUrl =
      'https://www.google.com/search?q=' +
      encodeURIComponent(`${l?.advertiser_name ?? ''} inmobiliaria ${l?.city ?? ''} opiniones`.trim());
    const trustRows = r.trust
      .map(
        (t) => `<div class="factor">
              <span class="fname">${t.label}</span>
              <span class="fval">${pct(t.value)}</span>
              <span class="bar"><i style="width:${Math.max(2, t.value * 100)}%;background:${TRUST_COLOR(
          t.value
        )}"></i></span>
            </div>`
      )
      .join('');
    const advertiser = `<div class="adv">
          <div class="advname">${advName}
            <span class="badge ${l?.agency_has_idealista_profile ? '' : 'grey'}">${
      l?.agency_has_idealista_profile ? 'Idealista pro profile' : 'no pro profile'
    }</span>
          </div>
          ${trustRows}
          <div class="links">
            ${l?.agency_profile_url ? `<a href="${l.agency_profile_url}" target="_blank" rel="noopener">Their listings</a>` : ''}
            ${l?.advertiser_name ? `<a href="${searchUrl}" target="_blank" rel="noopener">Search reviews</a>` : ''}
          </div>
          <div class="note">PisoCheck does not verify companies. These are pointers so you can check the advertiser yourself before paying anything.</div>
        </div>`;

    this.shell(
      `<div class="top">
           <div class="ring">
             <svg width="74" height="74">
               <circle cx="37" cy="37" r="31" fill="none" stroke="#eef1f5" stroke-width="7"></circle>
               <circle cx="37" cy="37" r="31" fill="none" stroke="${c}" stroke-width="7"
                 stroke-linecap="round" stroke-dasharray="${circ}"
                 stroke-dashoffset="${circ * (1 - r.composite)}"></circle>
             </svg>
             <div class="val"><span class="pct" style="color:${c}">${pct(r.composite)}</span><span class="cap">risk</span></div>
           </div>
           <div>
             <div class="verdict">${label}</div>
             <span class="pill ${cls}">${pct(r.scam)} scam likelihood</span>
           </div>
         </div>
         ${reasons}
         ${gapNote}
         ${tenancy}
         <details class="more"><summary>All ${r.factors.length} risk signals</summary>
           <div class="factors" style="border:0;padding-top:4px">${factors}</div>
           ${mutedNote}
         </details>
         ${advertiser}`,
      `<span>${r.cached ? 'cached' : r.latency_ms + ' ms'} \u00b7 ${r.model}${
        r.quota && r.quota.used > r.quota.limit * 0.8
          ? ` \u00b7 ${r.quota.used}/${r.quota.limit} today`
          : ''
      }</span>
         <span class="spacer" style="flex:1"></span>
         <button class="btn" data-act="recheck">Re-check</button>`
    );
  }
}
