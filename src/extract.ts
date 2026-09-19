/* PisoCheck — pulls the facts Jev needs out of an Idealista listing page.
   Selectors are best-effort: every field falls back to null rather than throwing,
   and utag_data (Idealista's own analytics payload) is preferred when present. */
import type { Listing, RoomDetail } from './types.js';

/** Idealista's inline analytics blob. Untyped by nature — it is someone else's payload,
 *  so every read goes through a guard rather than being trusted. */
interface UtagAd {
  id?: string;
  price?: number | string;
  operation?: string;
  typology?: string;
  characteristics?: {
    constructedArea?: number | string;
    roomNumber?: number | string;
    bathNumber?: number | string;
  };
  address?: { municipality?: string; district?: string; locationName?: string };
  owner?: { type?: string };
}

const text = (sel: string, root: ParentNode = document): string | null => {
  const el = root.querySelector(sel);
  const t = el?.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  return t || null;
};

const allText = (sel: string, root: ParentNode = document): string[] =>
  [...root.querySelectorAll(sel)]
    .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

// Idealista formats numbers per locale: "1.000 €" on /es, "1,000 €" on /en.
// Decide what each separator means instead of assuming one locale.
export const num = (s: string | number | null | undefined): number | null => {
  if (s == null) return null;
  if (typeof s === 'number') return Number.isFinite(s) ? s : null;
  const m = String(s).match(/-?\d[\d.,]*/);
  if (!m) return null;
  let t = m[0];
  const lastDot = t.lastIndexOf('.');
  const lastComma = t.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    // Both present: the rightmost one is the decimal separator.
    const dec = Math.max(lastDot, lastComma);
    t = t.slice(0, dec).replace(/[.,]/g, '') + '.' + t.slice(dec + 1).replace(/[.,]/g, '');
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? '.' : ',';
    const parts = t.split(sep);
    const tail = parts[parts.length - 1] ?? '';
    // A single separator with exactly three trailing digits is a thousands grouping
    // ("1,000"), as is any repeated separator ("1.234.567").
    t = parts.length > 2 || tail.length === 3 ? parts.join('') : parts.join('.');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

// Idealista ships an inline `utag_data = {...}` blob with clean, structured fields.
function utagData(): { ad?: UtagAd } | null {
  for (const s of document.querySelectorAll('script:not([src])')) {
    const src = s.textContent;
    if (!src || src.indexOf('utag_data') === -1) continue;
    const start = src.indexOf('{', src.indexOf('utag_data'));
    if (start === -1) continue;
    let depth = 0;
    for (let i = start; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}' && --depth === 0) {
        try {
          return JSON.parse(src.slice(start, i + 1)) as { ad?: UtagAd };
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function description(): string | null {
  return text('.comment .adCommentsLanguage') || text('.comment div') || text('.comment');
}

function features(): string[] {
  const groups = [
    ...document.querySelectorAll(
      '.details-property-feature-one, .details-property-feature-two, .info-features'
    )
  ];
  const items = groups.flatMap((g) => allText('li, span', g));
  return [...new Set(items)].filter((t) => t.length > 1).slice(0, 40);
}

// The advertiser's own Idealista profile link is the one identity claim the page
// can actually back up; everything else about an agency has to be checked off-site.
function agencyInfo(): { name: string | null; profile_url: string | null } {
  const link = [...document.querySelectorAll('a[href*="/pro/"]')].find((a) =>
    /\/pro\/[a-z0-9-]+\/?$/i.test(a.getAttribute('href') || '')
  );
  const href = link?.getAttribute('href');
  if (!href) return { name: null, profile_url: null };
  const named = [...document.querySelectorAll(`a[href="${href}"]`)]
    .map((a) => (a.textContent ?? '').replace(/\s+/g, ' ').trim())
    .find((t) => t.length > 2);
  return {
    name: named || null,
    profile_url: href.startsWith('http') ? href : location.origin + href
  };
}

// Room lets describe two things at once: the room being rented and the flat around it.
// Sending only the flat's 99 m² against the room's 850 EUR asks Jev the wrong question.
function roomDetail(feats: string[]): RoomDetail {
  const find = (re: RegExp): string | null => feats.find((f) => re.test(f)) ?? null;
  const owner = find(/the owner (does\s*n[o']?t live|lives)/i);
  return {
    room_size_m2: num(find(/^room size/i) || find(/tamaño de la habitaci[oó]n/i)),
    flat_size_m2: num(find(/room in (flat|apartment|piso)|apartment of|piso de/i)),
    flat_bedrooms: num(find(/^\d+\s*(bedrooms?|habitaciones?)$/i)),
    flatmates: find(/maximum capacity|capacidad m[aá]xima/i),
    housemates_profile: find(/males?\/females?|hombres?\/mujeres?/i),
    minimum_stay: find(/minimum stay|estancia m[ií]nima/i),
    maximum_stay: find(/maximum stay|estancia m[aá]xima/i),
    availability: find(/^available/i),
    owner_lives_in_property: owner ? !/does\s*n[o']?t/i.test(owner) : null
  };
}

export function isListingPage(): boolean {
  return /\/(inmueble|imobile|imovel)\/\d+/.test(location.pathname);
}

export function extract(): Listing {
  const u = utagData() ?? {};
  const agency = agencyInfo();
  const desc = description();
  const body = document.body.textContent ?? '';
  const photoCount = document.querySelectorAll(
    '.image-gallery img, .detail-multimedia img'
  ).length;
  const phoneAvailable =
    !/they have not provided a phone number|no ha facilitado (un )?tel[eé]fono/i.test(body);
  const ad: UtagAd = u.ad ?? {};
  const chars = ad.characteristics ?? {};
  const feats = features();
  const priceText = text('.info-data-price') || text('[data-testid="price"]');
  const headline = (text('.main-info__title-main') || text('h1') || document.title || '').trim();

  const sizeFromFeatures = num(feats.find((f) => /m²/.test(f)));
  const roomsText = feats.find((f) => /\bhab\.?|habitacion|dormitor|bedroom/i.test(f));
  // "No bedroom" / "Sin dormitorio" means a studio, not a flat with zero rooms —
  // sending 0 reads as a contradiction against the description.
  const isStudio = !!(roomsText && /^(no|sin)\b/i.test(roomsText));
  const roomsFromFeatures = isStudio ? null : num(roomsText);

  // Never test the feature list here: "3 bedrooms" and "3 habitaciones" both describe
  // a whole flat. Only the URL, the typology and the headline identify a room let.
  const isRoom =
    /\/habitacion\//.test(location.pathname) ||
    /^(room|habitacion|habitación)$/i.test(ad.typology ?? '') ||
    /^\s*(room\b|habitaci[oó]n\b|chambre\b)/i.test(headline) ||
    /\b(shared flat|piso compartido|pis compartit|coliving)\b/i.test(headline);
  const room = isRoom ? roomDetail(feats) : null;

  const advertiserType = ad.owner?.type;
  const isProfessional =
    advertiserType === 'professional' ||
    !!agency.profile_url ||
    !!document.querySelector('.professional-name');

  return {
    url: location.href.split('?')[0] ?? location.href,
    portal: 'idealista',
    listing_id: ad.id ?? location.pathname.match(/\d{5,}/)?.[0] ?? null,
    operation: ad.operation ?? (/alquiler|habitacion/.test(location.pathname) ? 'rent' : null),
    property_type:
      ad.typology ?? (isStudio ? 'studio / loft (open plan, no separate bedroom)' : null),
    is_studio: isStudio,
    is_room_listing: isRoom,
    price_covers: isRoom ? 'this room only, in a shared flat' : 'the whole property',
    title: headline || null,
    location_line: text('.main-info__title-minor'),
    city: ad.address?.municipality ?? null,
    district: ad.address?.district ?? ad.address?.locationName ?? null,
    price_eur_month: num(ad.price) ?? num(priceText),
    // For a room let, size_m2 is the room; the flat's own size sits in room_detail.
    size_m2: isRoom ? room!.room_size_m2 : num(chars.constructedArea) ?? sizeFromFeatures,
    room_detail: room,
    rooms: isRoom ? null : num(chars.roomNumber) ?? roomsFromFeatures, // null for a studio
    bathrooms: num(chars.bathNumber),
    floor: feats.find((f) => /planta|bajo|entreplanta/i.test(f)) ?? null,
    advertiser_type: isProfessional ? 'professional' : 'private',
    advertiser_name:
      agency.name || text('.professional-name .name') || text('.advertiser-name-container'),
    // Only professional accounts get an /pro/ profile page on Idealista.
    agency_profile_url: agency.profile_url,
    agency_has_idealista_profile: !!agency.profile_url,
    // Absences are the signal here, so state them explicitly. `count || null` would
    // turn "zero photos" into "unknown", which reads as nothing to worry about.
    photo_count: photoCount,
    has_photos: photoCount > 0,
    has_description: !!desc,
    contact_phone_available: phoneAvailable,
    last_updated: text('.date-update-text'),
    features: feats,
    price_details: allText('#details .details-property_features li').slice(0, 20),
    description: desc,
    page_language: document.documentElement.lang || 'es'
  };
}
