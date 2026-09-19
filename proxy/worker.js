/* PisoCheck proxy — the key lives here, never in the extension.
   Users install the extension and it works: no key, no setup.

   Deploy:  wrangler secret put TYPESAFE_API_KEY && wrangler deploy
   Quota:   a KV namespace bound as RL, counting checks per anonymous device id.

   Economics, so the limits below are a deliberate choice rather than a guess:
   Jev bills $0.042 per Mtok of input and one check is ~1.7k tokens, so a check
   costs about $0.00007 — roughly 14,000 checks per dollar. */

const UPSTREAM = 'https://api.typesafe.ai/v1/systemone';
const MODEL = 'jev-latest';

// Only this extension may call the proxy. Replace with your published extension id
// once the Web Store assigns one; during development every unpacked install differs.
const ALLOWED_ORIGINS = [/^chrome-extension:\/\/[a-p]{32}$/];

// Free, and generous enough that a real user never meets the ceiling: a person
// screening flats hard might do 30 checks in an evening. These numbers exist to stop
// a script, not a searcher.
const FREE_CHECKS_PER_DAY = 100;
const DAY_SECONDS = 86400;
// A wider ceiling per network, which reinstalling cannot reset.
const MAX_CHECKS_PER_IP_PER_DAY = 1000;
// A whole-project budget cap. 20,000 checks is about $1.40 of Jev a day, so a viral
// morning costs the price of a coffee instead of a surprise. Raise it deliberately.
const GLOBAL_DAILY_CAP = 20000;
const MAX_BODY_BYTES = 60_000;

const json = (body, status, origin) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) }
  });

const cors = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-PisoCheck-Device, X-PisoCheck-License',
  'Access-Control-Max-Age': '86400'
});

const originAllowed = (origin) => !!origin && ALLOWED_ORIGINS.some((re) => re.test(origin));

/** Anonymous per-install id minted by the extension. It identifies a browser profile,
 *  not a person, and clearing storage resets it — which is why the IP counter below
 *  exists as a backstop rather than this being the only limit. */
function deviceId(request) {
  const raw = request.headers.get('X-PisoCheck-Device') || '';
  return /^[a-z0-9-]{8,64}$/i.test(raw) ? raw : null;
}

/** Everyone is on the free plan. The licence lookup stays because the wiring is
 *  already there and costs nothing, in case a higher tier is ever worth selling. */
async function plan(env, license) {
  if (!license || !env.RL) return { name: 'free', limit: FREE_CHECKS_PER_DAY };
  const record = await env.RL.get(`license:${license}`, 'json');
  if (!record || (record.expires && record.expires < Date.now())) {
    return { name: 'free', limit: FREE_CHECKS_PER_DAY };
  }
  return { name: record.plan || 'plus', limit: record.limit ?? 500 };
}

async function count(env, key, limit) {
  if (!env.RL) return { used: 0, allowed: true };
  const bucket = `${key}:${Math.floor(Date.now() / 1000 / DAY_SECONDS)}`;
  const used = Number((await env.RL.get(bucket)) || 0);
  if (used >= limit) return { used, allowed: false };
  await env.RL.put(bucket, String(used + 1), { expirationTtl: DAY_SECONDS });
  return { used: used + 1, allowed: true };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return originAllowed(origin)
        ? new Response(null, { status: 204, headers: cors(origin) })
        : new Response('Forbidden', { status: 403 });
    }
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    if (!originAllowed(origin)) return new Response('Forbidden', { status: 403 });

    const device = deviceId(request);
    if (!device) return json({ error: 'Missing device id.' }, 400, origin);

    const license = request.headers.get('X-PisoCheck-License') || null;
    const { name: planName, limit } = await plan(env, license);

    // Two counters: the device's daily allowance, and a wider IP ceiling that a
    // reinstall cannot reset.
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const perDevice = await count(env, `d:${device}`, limit);
    if (!perDevice.allowed) {
      return json(
        {
          error: `That is ${limit} checks today — the daily limit. Back tomorrow.`,
          code: 'QUOTA',
          plan: planName,
          limit
        },
        429,
        origin
      );
    }
    const perIp = await count(env, `i:${ip}`, MAX_CHECKS_PER_IP_PER_DAY);
    if (!perIp.allowed) return json({ error: 'Too many checks from this network today.' }, 429, origin);

    const global = await count(env, 'g:all', Number(env.GLOBAL_DAILY_CAP) || GLOBAL_DAILY_CAP);
    if (!global.allowed) {
      return json(
        { error: 'PisoCheck has hit its daily cap. Back tomorrow.', code: 'GLOBAL_CAP' },
        429,
        origin
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Bad JSON' }, 400, origin);
    }
    if (JSON.stringify(body).length > MAX_BODY_BYTES) {
      return json({ error: 'Payload too large' }, 413, origin);
    }
    // Never let a caller choose the model or smuggle in their own questions budget.
    body.model = MODEL;

    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.TYPESAFE_API_KEY}` },
      body: JSON.stringify(body)
    });

    const headers = {
      'Content-Type': 'application/json',
      'X-PisoCheck-Plan': planName,
      'X-PisoCheck-Used': String(perDevice.used),
      'X-PisoCheck-Limit': String(limit),
      ...cors(origin)
    };
    return new Response(upstream.body, { status: upstream.status, headers });
  }
};
