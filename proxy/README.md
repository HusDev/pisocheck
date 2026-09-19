# PisoCheck proxy

Keeps the TypeSafe API key off the client so the extension can ship publicly.

```bash
npm install -g wrangler
wrangler login
wrangler kv namespace create RL          # then uncomment the binding in wrangler.toml
wrangler secret put TYPESAFE_API_KEY     # paste the key
wrangler deploy
```

Put the resulting `https://pisocheck-proxy.<subdomain>.workers.dev` into the extension's
**Proxy endpoint** field (or hardcode it as the default in `src/background.js`). When a proxy
URL is set the extension sends no key at all.

Before deploying, replace `ALLOWED_ORIGINS` in `worker.js` with your published extension id:
`chrome-extension://<your-32-char-id>`. The id is fixed once the extension is on the Web Store.
