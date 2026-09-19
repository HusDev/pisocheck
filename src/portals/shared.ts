// Helpers every portal adapter uses. Nothing here knows about a specific site.
import type { Listing, RoomDetail } from '../types.js';

export const text = (sel: string, root: ParentNode = document): string | null => {
  const el = root.querySelector(sel);
  const t = el?.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  return t || null;
};

export const allText = (sel: string, root: ParentNode = document): string[] =>
  [...root.querySelectorAll(sel)]
    .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

/** Spanish portals format numbers per locale and per language path: "1.000 €" on /es,
 *  "1,000 €" on /en. Decide what each separator means instead of assuming one. */
export const num = (s: string | number | null | undefined): number | null => {
  if (s == null) return null;
  if (typeof s === 'number') return Number.isFinite(s) ? s : null;
  const m = String(s).match(/-?\d[\d.,]*/);
  if (!m) return null;
  let t = m[0];
  const lastDot = t.lastIndexOf('.');
  const lastComma = t.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    const dec = Math.max(lastDot, lastComma);
    t = t.slice(0, dec).replace(/[.,]/g, '') + '.' + t.slice(dec + 1).replace(/[.,]/g, '');
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? '.' : ',';
    const parts = t.split(sep);
    const tail = parts[parts.length - 1] ?? '';
    t = parts.length > 2 || tail.length === 3 ? parts.join('') : parts.join('.');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

/** "No bedroom" / "Sin dormitorio" means a studio, not a flat with zero rooms —
 *  sending 0 reads as a contradiction against the description. */
export const studioFrom = (roomsText: string | null | undefined): boolean =>
  !!(roomsText && /^(no|sin)\b/i.test(roomsText));

/** Only the URL, the typology and the headline identify a room let. Never the feature
 *  list: "3 bedrooms" and "3 habitaciones" both describe a whole flat. */
export const roomListingFrom = (headline: string, typology = '', path = location.pathname): boolean =>
  /\/habitacion|\/habitaciones|\/room/.test(path) ||
  /^(room|habitacion|habitación)$/i.test(typology) ||
  /^\s*(room\b|habitaci[oó]n\b|chambre\b)/i.test(headline) ||
  /\b(shared flat|piso compartido|pis compartit|coliving)\b/i.test(headline);

export function roomDetailFrom(feats: string[]): RoomDetail {
  const find = (re: RegExp): string | null => feats.find((f) => re.test(f)) ?? null;
  const owner = find(/the owner (does\s*n[o']?t live|lives)|el propietario (no )?vive/i);
  return {
    room_size_m2: num(find(/^room size|tamaño de la habitaci[oó]n/i)),
    flat_size_m2: num(find(/room in (flat|apartment|piso)|apartment of|piso de/i)),
    flat_bedrooms: num(find(/^\d+\s*(bedrooms?|habitaciones?)$/i)),
    flatmates: find(/maximum capacity|capacidad m[aá]xima/i),
    housemates_profile: find(/males?\/females?|hombres?\/mujeres?/i),
    minimum_stay: find(/minimum stay|estancia m[ií]nima|duraci[oó]n m[ií]nima/i),
    maximum_stay: find(/maximum stay|estancia m[aá]xima|duraci[oó]n m[aá]xima/i),
    availability: find(/^available|^disponible/i),
    owner_lives_in_property: owner ? !/does\s*n[o']?t|no vive/i.test(owner) : null
  };
}

/** Every adapter returns a complete Listing; this fills the parts none of them vary. */
export function baseListing(portal: Listing['portal']): Listing {
  return {
    url: location.href.split('?')[0] ?? location.href,
    portal,
    listing_id: null,
    operation: null,
    property_type: null,
    is_studio: false,
    is_room_listing: false,
    price_covers: 'the whole property',
    title: null,
    location_line: null,
    city: null,
    district: null,
    price_eur_month: null,
    size_m2: null,
    room_detail: null,
    rooms: null,
    bathrooms: null,
    floor: null,
    advertiser_type: null,
    advertiser_name: null,
    agency_profile_url: null,
    agency_has_idealista_profile: false,
    photo_count: 0,
    has_photos: false,
    has_description: false,
    contact_phone_available: true,
    last_updated: null,
    features: [],
    price_details: [],
    description: null,
    page_language: document.documentElement.lang || 'es'
  };
}

export interface PortalAdapter {
  id: Listing['portal'];
  /** True when this adapter handles the current host. */
  handles(host: string): boolean;
  /** True when the current page is a single listing rather than a search page. */
  isListingPage(): boolean;
  extract(): Listing;
}
