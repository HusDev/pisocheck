# PisoCheck

**A Chrome extension that instantly analyses Idealista rental listings in Barcelona and tells you whether they are worth contacting or should be skipped.**

---

## The Problem

People spend hours every day opening Idealista listings only to discover later that they are scams, illegal sublets, overpriced, or full of red flags.

Housing is still the biggest pain point in Barcelona, and most tools don't help at the exact moment of decision — while you're looking at the listing.

## The Solution

Install the PisoCheck Chrome extension.

When you open any Idealista long-term rental or room listing in Barcelona, a clean panel appears with an instant risk assessment powered by **Jev**.

No copy-pasting. The analysis happens right on the page.

## How It Works

1. **You browse Idealista** and open a listing
2. **The extension extracts** the key data from the page — price, size, rooms, barrio, description, contract type
3. **One call to Jev** evaluates the listing
4. **A floating panel (or sidebar) shows:**
   - **Overall recommendation** — Strong candidate / Caution / Skip
   - **Individual risk scores** with confidence
   - **Clear reasons why** it might be risky: price too low, pressure language, temporary contract signals, subletting indicators

## Key Features (MVP)

- Works directly on Idealista listing pages
- One-click or automatic analysis
- Clean, non-intrusive UI (floating card or side panel)
- Shows specific risk factors instead of a black-box score
- Fast — Jev responses are typically under 500 ms

## Risk Factors Analysed

| Factor | What it catches |
| --- | --- |
| Price vs. barrio market | Listings priced significantly below market for that barrio |
| Pressure language | Urgency tactics in the description |
| Temporary / seasonal signals | Contracts structured to bypass long-term protections |
| Subletting indicators | Possible illegal subletting (*relloguer*) |
| Missing or suspicious details | Vague or withheld information |
| Internal inconsistencies | Price, size and description that don't add up |

## Target Users

Anyone looking for a long-term flat or room in Barcelona who is tired of wasting time and risking deposits on bad listings.

---

## Install (unpacked)

1. `npm install && npm run build`
2. `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select **`dist/`**
3. Click the PisoCheck icon → **Options**, paste your TypeSafe API key (console.typesafe.ai/settings/keys), save
4. Open any Idealista listing — the panel analyses it automatically

## Project layout

Written in TypeScript, bundled with esbuild. **`dist/` is what Chrome loads**, not the repo root.

```
src/types.ts         Listing, the TypeSafe API shapes, verdict and message types
src/questions.ts     The Jev questions + the risk policy (weights, thresholds, labels)
src/extract.ts       Reads the listing off the page (utag_data first, DOM selectors as fallback)
src/background.ts    Service worker: holds the key, one call to api.typesafe.ai, caches + history
src/panel.ts         The on-page panel (shadow DOM, no clash with Idealista CSS)
src/content.ts       Glue: detect listing page → extract → ask → render, re-runs on SPA navigation
src/options.html/ts  API key, optional proxy, auto-run toggle, recent checks
scripts/build.mjs    esbuild bundle + static copy into dist/
```

```bash
npm install
npm run build       # → dist/
npm run watch       # rebuild on save (still reload the extension in chrome://extensions)
npm run typecheck   # tsc --noEmit
npm run check       # typecheck then build
```

`QUESTIONS` is declared `as const satisfies Record<string, Question>`, so its keys form a
union that `WEIGHTS` and `LABELS` must both cover. Adding a risk question without weighting
or labelling it is a compile error rather than an `undefined` rendered in the panel.

## The Jev call

One POST to `https://api.typesafe.ai/v1/systemone` per listing carries the whole analysis —
14 questions in a single request:

- **10 weighted risk Nouls** — scam, price below market, pressure language, temporary/seasonal,
  subletting, missing details, inconsistencies, remote landlord, off-portal contact,
  money demanded before viewing, copy-pasted/machine-translated text
- **2 trust Nouls** — advertiser identifiable, established agency. Deliberately **outside**
  the weights: a high value reassures, a low one never inflates risk. "Unverified" is not
  "suspicious"
- **1 Choice** — what tenancy is actually on offer (long-term home, room in shared flat,
  temporary/seasonal, tourist, unclear)

The model returns calibrated probabilities. Every verdict rule lives in `questions.js`, not in
the model:

```
composite = max( 0.6 × scam + 0.4 × weighted(risk factors),  gap floor )
skip     when scam ≥ 0.60 or composite ≥ 0.50
caution  when scam ≥ 0.30 or composite ≥ 0.25
```

Three rules exist because the raw score alone gets them wrong:

- **A temporada listing is never a "strong candidate."** A clean, honest, well-priced advert
  for a 6-month contract is exactly the trap a long-term searcher is trying to avoid.
- **An unverifiable advert cannot score low.** Missing photos, description or phone number set
  a floor (1 gap 22%, 2 gaps 36%, 3 gaps 46%). An empty listing scores low on every risk factor
  *because* it is empty — without this, the emptier the advert, the safer it looked.
- **Questions that need text are not scored when there is no text.** With no description, six
  factors return `n/a` and leave the average rather than inventing a number from nothing.

Measured on real Barcelona listings (`jev-1.13.0`, ~1.6k input tokens, 300–950 ms per call):

| Listing | Risk | Scam | Verdict |
| --- | --- | --- | --- |
| Agency temporada studio, Guinardó, 1000 €/34 m² | 25% | 24% | Caution — temporary 98% |
| Room in shared flat, Raval, 750 €/12 m² | 23% | 23% | Strong candidate |
| Uniplaces short-stay relisting, Fort Pienc | 46% | 41% | Caution — pay-before-viewing, self-contradicting terms |
| Private flat with no photos, text or phone | 46% | 26% | Caution — nothing to verify |
| Synthetic scam room, 350 € Eixample | 86% | 94% | Skip |

### Extraction is the hard part

Every bad score found in testing came from extraction, not from the model. Kept here as
regression cases: `1,000 €` parsed as `1` under Spanish locale rules; `"3 bedrooms"` matching
a `/room/` test and marking a penthouse as a room let; a room's price judged against the whole
flat's m²; `count || null` turning "zero photos" into "unknown". Test `/en/` and `/es/` pages
separately — they differ in number formatting and wording.

## Keys and privacy

**Users do not need a TypeSafe key.** The extension calls a small Cloudflare Worker
(`proxy/`) that holds the key as a secret and meters a free daily allowance per install.
The extension ships with no credentials in it.

Three ways it can run:

| Mode | Who pays | Setup for the user |
| --- | --- | --- |
| Shared proxy (default) | You | None — install and go, 15 checks/day |
| Licence key | You, higher allowance | Paste a key in options |
| Own API key | The user, unmetered | Paste a TypeSafe key in options |

A user's own key always takes priority and goes straight to `api.typesafe.ai`, never
through the proxy.

The proxy meters by an anonymous device id: a random UUID minted on install and stored
locally. It identifies a browser profile, not a person — no account, no email, no
personal data. Listing content leaves the browser only when a listing is analysed, and
verdicts are cached locally for 24 h.

See `proxy/README.md` for deployment, the cost model ($0.00007 per check) and how to
add a paid tier.

## Future Vision

- Support more portals (Badi, etc.)
- Save history of analysed listings
- Landlord mode
- Community-reported scam database
