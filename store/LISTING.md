# Chrome Web Store listing — copy and paste

## Name (45 max)
PisoCheck — Idealista rental risk check

## Short description (132 max)
Instant scam and risk scores on Idealista rental listings in Spain. Spot temporada
contracts and red flags before you contact.

## Category
Productivity

## Language
English (add Spanish later — most of the audience reads Spanish)

## Detailed description

Finding a long-term flat in Spain means opening hundreds of listings, most of which
waste your time. PisoCheck reads the listing you are already looking at and tells you,
in about a second, whether it is worth contacting.

Open any Idealista rental listing and a panel appears with:

• An overall risk score and a clear verdict — strong candidate, caution, or skip
• A scam likelihood, calibrated rather than guessed
• Individual risk signals, so you can see WHY, not just a number
• The kind of tenancy actually on offer — this is the one that catches people out

WHAT IT LOOKS FOR

• Temporada and seasonal contracts dressed up as long-term rentals
• Prices too low to be real for that area
• Pressure and urgency tactics in the description
• Requests for money before a viewing, or by transfer, cash or crypto
• Signs of subletting (subarriendo) rather than a real landlord
• Adverts that contradict themselves on price, size or terms
• Copy-pasted or machine-translated text hiding a relisting
• Missing basics: no photos, no description, no phone number

HONEST BY DESIGN

An advert with nothing in it is not a safe bet, it is an unjudgeable one — PisoCheck
says so instead of scoring it low. Questions it cannot answer are marked "n/a" rather
than guessed. And it never tells you an agency is fraudulent: it shows you their
profile and a way to check them yourself.

FREE, NO ACCOUNT

No sign-up, no email, no API key, no payment. Install it and it works.

PRIVACY

PisoCheck reads only the Idealista listing page you have open, and only sends that
advert's public content to score it. No account, no analytics, no tracking, nothing
about you. Full policy: <PRIVACY POLICY URL>

Powered by Jev from TypeSafe AI. Open source: https://github.com/HusDev/pisocheck

Not affiliated with idealista.

## Permission justifications

**storage** — Saves your settings and caches each listing's result for 24 hours so
re-opening a listing does not re-run the analysis.

**activeTab** — Lets the toolbar button re-run the check on the listing you are
currently viewing.

**Host permission: https://api.typesafe.ai/** — The AI service that scores listings.
Used only when a user supplies their own API key.

**Host permission: https://pisocheck-proxy.hussein-saad-hasan.workers.dev/** — The
extension's own service, which scores listings so users do not need an API key.

**Host permission: idealista.com (content script)** — The extension reads the listing
page to extract the advert's public details. It runs only on listing pages and reads
nothing else.

**Remote code** — None. All code is bundled in the package.

**Data usage disclosures to tick:**
- Does NOT collect: personally identifiable info, health, financial, authentication,
  personal communications, location, browsing history, user activity
- DOES collect: "Website content" — the public text of the listing being analysed
- Certify: not sold to third parties; used only for the single purpose of the item;
  not used for creditworthiness or lending

## Screenshots needed (1280×800, at least one, up to five)

1. The panel on a temporada listing — the strongest story: a real agency, a real flat,
   caught as a short-term contract
2. The panel on a scam-shaped listing — high scam score with the reasons visible
3. The expanded risk-signal list
4. A listing with nothing to verify, showing the honest "little to verify" note
5. The options page, showing it needs no setup

Crop from real listings at 1280×800. Avoid capturing your own name or phone number in
the contact sidebar — blur it if it appears.
