# PisoCheck privacy policy

_Last updated: 19 September 2026_

PisoCheck analyses rental listings you are already looking at and shows you a risk
assessment. This page explains exactly what it sends, where, and what it keeps.

## What PisoCheck collects

**Nothing about you.** There is no account, no sign-up, no email address, no analytics,
no advertising and no tracking of any kind. PisoCheck does not read your browsing
history, your other tabs, your bookmarks or your saved passwords.

## What is sent, and when

PisoCheck acts only on Idealista listing pages, and only for the listing you have open.
When a listing is analysed it sends the **public content of that advert** — price, size,
rooms, neighbourhood, features, the advertiser's public name and the description text —
to its analysis service at `pisocheck-proxy.hussein-saad-hasan.workers.dev`, which
forwards it to TypeSafe (`api.typesafe.ai`) for scoring.

That information is public on the listing page. PisoCheck does not send your name, your
messages to advertisers, your Idealista account details, or anything you type.

Nothing is sent on any other page, and nothing is sent until a listing is analysed.

## The device identifier

So that the free service cannot be abused, PisoCheck generates a **random identifier**
on install and includes it with each analysis. It is a random number stored on your
device. It is not derived from you, your hardware or your browser, and it cannot be
used to identify you. It is used only to count checks per day. Uninstalling the
extension or clearing its storage discards it permanently.

## What is stored, and where

| Data | Where | For how long |
| --- | --- | --- |
| Results of listings you checked | Your browser only | 24 hours |
| Your settings and optional API key | Your browser (Chrome sync storage) | Until you remove them |
| Random device identifier | Your browser | Until you uninstall |
| Daily check counts | Analysis service | 24 hours, then deleted |

PisoCheck does not keep copies of the listings you check. TypeSafe states that it does
not train on API requests or responses; see https://docs.typesafe.ai/legal.

## Sharing and selling

PisoCheck does not sell, rent or share any data with anyone. There are no third-party
trackers, no advertising networks and no data brokers. The only external services
involved are the two named above, both of which are needed to produce the score.

## Your control

- Turn off automatic analysis in the options page: nothing is sent until you click.
- Use your own TypeSafe API key and requests go directly to TypeSafe, never through
  the PisoCheck service.
- Uninstall the extension and everything stored locally is removed with it.

## Accuracy

PisoCheck gives an automated, probabilistic estimate to help you decide where to spend
your time. It is not a verdict about any advertiser, agency or property, it is not
professional or legal advice, and it can be wrong in both directions. Always check a
property and a landlord yourself before paying anything.

## Contact

Questions or removal requests: open an issue at
https://github.com/HusDev/pisocheck/issues
