# PisoCheck proxy

Holds the TypeSafe key so the extension can ship publicly. Users install it and it
works — no key, no account, no setup.

## Deploy

```bash
npm install -g wrangler
wrangler login
wrangler kv namespace create RL          # then uncomment the binding in wrangler.toml
wrangler secret put TYPESAFE_API_KEY     # paste the key
wrangler deploy
```

Put the resulting URL into `DEFAULT_PROXY` in `src/background.ts`, rebuild, and the
extension uses it for everyone. Replace `ALLOWED_ORIGINS` in `worker.js` with your
published extension id once the Web Store assigns one.

## What it costs

Jev bills **$0.042 per Mtok of input**; output tokens are free. One PisoCheck call is
~1,700 input tokens.

| | Checks | Cost |
| --- | --- | --- |
| One listing | 1 | $0.00007 |
| One dollar | ~14,000 | $1 |
| 1,000 users × 20 checks/day | 20,000/day | ~$43/month |

Cheap enough that the product is free and the limits exist to stop abuse, not to
control cost.

## Limits

Free for everyone, no account, no key. The limits are there to stop a script, not a
flat-hunter:

| Limit | Value | Why |
| --- | --- | --- |
| Per device / day | 100 | A hard evening of searching is ~30 checks |
| Per IP / day | 1,000 | A reinstall cannot reset this |
| Whole project / day | 20,000 (~$1.40) | A viral morning costs a coffee, not a surprise |

Raise the project cap with a `GLOBAL_DAILY_CAP` var in `wrangler.toml` once you know
what real traffic looks like.

The device id is a random UUID minted in the extension and stored locally. It
identifies a browser profile, never a person — no account, no email, nothing
personal crosses the wire.

## Selling a higher tier

The Worker already reads an `X-PisoCheck-License` header and looks up
`license:<key>` in KV:

```json
{ "plan": "pro", "limit": 200, "expires": 1790000000000 }
```

To turn that into a paid tier you need a checkout and something that writes those
rows. The smallest version that works:

1. A **Stripe Payment Link** — no backend, Stripe hosts the page.
2. A **Stripe webhook** on `checkout.session.completed` that generates a key and
   writes the KV row. This can be another Worker route, ~30 lines.
3. The buyer pastes the key into the extension's options page.

Chrome Web Store payments no longer exist, so Stripe (or similar) is the route.
Nothing in the extension needs to change: the licence field and the header are
already there.
