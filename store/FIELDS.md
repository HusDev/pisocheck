# Store listing — exact values for each field

Everything below is copy-paste ready. Graphics are in `store/assets/`.

---

## Product details

**Title from package** — already set from the manifest:
`PisoCheck — Idealista scam check`

**Summary from package** — already set from the manifest:
`Instant scam and risk probabilities for Idealista rental listings in Barcelona, powered by Jev.`

**Description** (paste all of this):

```
Finding a long-term flat in Barcelona means opening hundreds of listings, most of which waste your time. PisoCheck reads the listing you are already looking at and tells you, in about a second, whether it is worth contacting.

Open any Idealista rental listing and a panel appears with:

• An overall risk score and a clear verdict — strong candidate, caution, or skip
• A scam likelihood, calibrated rather than guessed
• The individual risk signals behind it, so you can see why, not just a number
• The kind of tenancy actually on offer — the one that catches people out

WHAT IT LOOKS FOR

• Temporada and seasonal contracts dressed up as long-term rentals
• Prices too low to be real for that barrio
• Pressure and urgency tactics in the description
• Requests for money before a viewing, or by transfer, cash or crypto
• Signs of subletting (relloguer) rather than a real landlord
• Adverts that contradict themselves on price, size or terms
• Copy-pasted or machine-translated text hiding a relisting
• Missing basics: no photos, no description, no phone number

HONEST BY DESIGN

An advert with nothing in it is not a safe bet, it is an unjudgeable one — PisoCheck says so instead of scoring it low. Questions it cannot answer are marked "n/a" rather than guessed. And it never tells you an agency is fraudulent: it shows you their profile and a way to check them yourself.

WORKS ON ROOMS TOO

Room listings are scored on the room's own size and price, not the whole flat's, and the stay limits buried in the details are read as the temporary-contract signals they are.

FREE, NO ACCOUNT

No sign-up, no email, no API key, no payment. Install it and it works.

PRIVACY

PisoCheck reads only the Idealista listing page you have open, and only sends that advert's public content in order to score it. No account, no analytics, no tracking, nothing about you.

Powered by Jev from TypeSafe AI. Open source: https://github.com/HusDev/pisocheck

Not affiliated with idealista.
```

**Category:** `Productivity`

**Language:** `English`

---

## Graphic assets

| Field | File | Size |
| --- | --- | --- |
| Store icon | `store/assets/icon-128.png` | 128×128 |
| Small promo tile | `store/assets/promo-small-440x280.png` | 440×280 |
| Marquee promo tile | `store/assets/promo-marquee-1400x560.png` | 1400×560 |
| Screenshots | you capture — see below | 1280×800 |

**Global promo video:** leave empty.

### Screenshots (at least 1, up to 5) — 1280×800

Capture these in order; the first is the one most people will look at.

1. A **temporada listing** — a real agency, a real flat, caught as a short-term contract.
   The most convincing single image, because the listing looks fine until you read it.
2. A **scam-shaped listing** — high scam score with the reasons visible.
3. The **expanded risk-signal list**, showing that every number is itemised.
4. A listing with **nothing to verify** — shows the honest "little to verify" note.
5. The **options page** — proves it needs no setup.

Before uploading: **blur your own name and phone number.** They appear in Idealista's
"Ask the advertiser" sidebar on every listing while you are logged in.

To get an exact 1280×800: resize the Chrome window, screenshot, then crop. Or take any
screenshot and scale it down — the store accepts 1280×800 or 640×400 only.

---

## Additional fields

| Field | Value |
| --- | --- |
| Official URL | `None` — unless you verify a domain in Search Console |
| Homepage URL | `https://github.com/HusDev/pisocheck` |
| Support URL | `https://github.com/HusDev/pisocheck/issues` |
| Mature content | **off** |

Both GitHub URLs require the repo to be **public**. It is private right now.

---

## Privacy tab (a separate page in the console)

**Single purpose:**

```
PisoCheck analyses the rental listing the user is currently viewing on idealista.com and shows a risk assessment for that listing on the page.
```

**Permission justifications:**

| Permission | Justification |
| --- | --- |
| `storage` | Saves the user's settings and caches each listing's result for 24 hours so reopening a listing does not repeat the analysis. |
| `activeTab` | Lets the toolbar button re-run the check on the listing the user is currently viewing. |
| `api.typesafe.ai` | The AI service that scores listings. Used only when a user supplies their own API key in the options page. |
| `pisocheck-proxy...workers.dev` | The extension's own service, which scores listings so that users do not need an API key of their own. |
| Host access to `idealista.com` | The extension reads the listing page to extract the advert's public details (price, size, area, description). It runs only on listing pages. |
| Remote code | **No**, the extension does not use remote code. All logic is in the package. |

**Data usage — tick only:**
- ☑ **Website content** — the public text of the listing being analysed

**Do not tick:** personally identifiable information, health, financial, authentication,
personal communications, location, web history, user activity.

**Certify all three:**
- ☑ Not being sold to third parties
- ☑ Not being used or transferred for purposes unrelated to the item's single purpose
- ☑ Not being used to determine creditworthiness or for lending

**Privacy policy URL:** host `store/PRIVACY.md` and paste the URL. Fastest route:
make the repo public → Settings → Pages → deploy from `main` → the file is served at
`https://husdev.github.io/pisocheck/store/PRIVACY`

---

## Distribution tab

| Field | Value |
| --- | --- |
| Visibility | `Unlisted` to start — a working link, no public search. Switch to Public later. |
| Regions | All, or just Spain while it is Barcelona-only |
| Pricing | Free |
