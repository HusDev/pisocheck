#!/usr/bin/env bash
# One-shot deploy for the PisoCheck proxy.
# Prerequisite: `npx wrangler login` (or CLOUDFLARE_API_TOKEN in the environment).
set -euo pipefail
cd "$(dirname "$0")"

KEY_FILE="${KEY_FILE:-$HOME/lab/jevtest/.env}"

echo "==> Checking authentication"
npx wrangler whoami >/dev/null

# 1. KV namespace for quota counters and licence rows, created once.
if ! grep -q '^\[\[kv_namespaces\]\]' wrangler.toml; then
  echo "==> Creating KV namespace RL"
  OUT=$(npx wrangler kv namespace create RL 2>&1)
  echo "$OUT"
  ID=$(echo "$OUT" | grep -oE '"?id"? *= *"[a-f0-9]{32}"' | grep -oE '[a-f0-9]{32}' | head -1)
  if [ -z "$ID" ]; then
    echo "Could not parse the namespace id — add the binding to wrangler.toml by hand." >&2
    exit 1
  fi
  printf '\n[[kv_namespaces]]\nbinding = "RL"\nid = "%s"\n' "$ID" >> wrangler.toml
  echo "==> Bound RL = $ID"
fi

# 2. The TypeSafe key, stored as a Worker secret. Never committed, never in the bundle.
if ! npx wrangler secret list 2>/dev/null | grep -q TYPESAFE_API_KEY; then
  echo "==> Setting TYPESAFE_API_KEY from $KEY_FILE"
  grep -h '^TYPESAFE_API_KEY=' "$KEY_FILE" | head -1 | cut -d= -f2- | tr -d '\n' \
    | npx wrangler secret put TYPESAFE_API_KEY
fi

# 3. Deploy.
echo "==> Deploying"
npx wrangler deploy

echo
echo "Done. Copy the workers.dev URL above into DEFAULT_PROXY in src/background.ts,"
echo "then run: npm run build"
