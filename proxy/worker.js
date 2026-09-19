/* PisoCheck proxy — keeps the TypeSafe key server-side.
   Deploy on Cloudflare Workers; the extension points at it via the "Proxy endpoint" option.
   Set the secret with:  wrangler secret put TYPESAFE_API_KEY  */

const UPSTREAM = 'https://api.typesafe.ai/v1/systemone';

// Only this extension may call the proxy. Replace with your published extension id.
const ALLOWED_ORIGINS = [/^chrome-extension:\/\/[a-p]{32}$/];

const RATE_LIMIT = 30; // requests per IP per window
const WINDOW_SECONDS = 3600;

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function originAllowed(origin) {
  return !!origin && ALLOWED_ORIGINS.some((re) => re.test(origin));
}

// Rate limit per IP using a Workers KV namespace bound as RL.
async function overLimit(env, ip) {
  if (!env.RL) return false;
  const key = `rl:${ip}:${Math.floor(Date.now() / 1000 / WINDOW_SECONDS)}`;
  const used = Number((await env.RL.get(key)) || 0);
  if (used >= RATE_LIMIT) return true;
  await env.RL.put(key, String(used + 1), { expirationTtl: WINDOW_SECONDS });
  return false;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return originAllowed(origin)
        ? new Response(null, { status: 204, headers: corsHeaders(origin) })
        : new Response('Forbidden', { status: 403 });
    }

    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    if (!originAllowed(origin)) return new Response('Forbidden', { status: 403 });

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (await overLimit(env, ip)) {
      return new Response(JSON.stringify({ error: 'Rate limit reached. Try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad JSON', { status: 400, headers: corsHeaders(origin) });
    }

    // Never let a caller swap the model or send an oversized payload.
    if (JSON.stringify(body).length > 60_000) {
      return new Response('Payload too large', { status: 413, headers: corsHeaders(origin) });
    }
    body.model = 'jev-latest';

    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.TYPESAFE_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
    });
  }
};
