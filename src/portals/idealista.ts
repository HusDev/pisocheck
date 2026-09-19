/* idealista.com — Spain's largest portal, ~42M visits/month.
   Server-rendered HTML. utag_data (its own analytics payload) is preferred when present,
   but it is missing on some pages, so every field falls back to a selector. */
import type { Listing } from '../types.js';
import {
  allText, baseListing, num, roomDetailFrom, roomListingFrom, studioFrom, text,
  type PortalAdapter
} from './shared.js';

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

function features(): string[] {
  const groups = [
    ...document.querySelectorAll(
      '.details-property-feature-one, .details-property-feature-two, .info-features'
    )
  ];
  const items = groups.flatMap((g) => allText('li, span', g));
  return [...new Set(items)].filter((t) => t.length > 1).slice(0, 40);
}

/** Only professional accounts get a /pro/ profile page, so the link's presence is
 *  the one identity claim the page can actually back up. */
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

export const idealista: PortalAdapter = {
  id: 'idealista',

  handles: (host) => /(^|\.)idealista\.com$/.test(host),

  isListingPage: () => /\/inmueble\/\d+/.test(location.pathname),

  extract(): Listing {
    const l = baseListing('idealista');
    const ad: UtagAd = utagData()?.ad ?? {};
    const chars = ad.characteristics ?? {};
    const agency = agencyInfo();
    const desc = text('.comment .adCommentsLanguage') || text('.comment div') || text('.comment');
    const body = document.body.textContent ?? '';
    const feats = features();
    const headline = (text('.main-info__title-main') || text('h1') || document.title || '').trim();

    const roomsText = feats.find((f) => /\bhab\.?|habitacion|dormitor|bedroom/i.test(f));
    const isStudio = studioFrom(roomsText);
    const isRoom = roomListingFrom(headline, ad.typology);
    const room = isRoom ? roomDetailFrom(feats) : null;
    const photoCount = document.querySelectorAll('.image-gallery img, .detail-multimedia img').length;

    l.listing_id = ad.id ?? location.pathname.match(/\d{5,}/)?.[0] ?? null;
    l.operation = ad.operation ?? (/alquiler|habitacion/.test(location.pathname) ? 'rent' : null);
    l.property_type = ad.typology ?? (isStudio ? 'studio / loft (open plan, no separate bedroom)' : null);
    l.is_studio = isStudio;
    l.is_room_listing = isRoom;
    l.price_covers = isRoom ? 'this room only, in a shared flat' : 'the whole property';
    l.title = headline || null;
    l.location_line = text('.main-info__title-minor');
    l.city = ad.address?.municipality ?? null;
    l.district = ad.address?.district ?? ad.address?.locationName ?? null;
    l.price_eur_month = num(ad.price) ?? num(text('.info-data-price'));
    l.size_m2 = isRoom ? room!.room_size_m2 : num(chars.constructedArea) ?? num(feats.find((f) => /m²/.test(f)));
    l.room_detail = room;
    l.rooms = isRoom ? null : num(chars.roomNumber) ?? (isStudio ? null : num(roomsText));
    l.bathrooms = num(chars.bathNumber);
    l.floor = feats.find((f) => /planta|bajo|entreplanta|floor/i.test(f)) ?? null;
    l.advertiser_type =
      ad.owner?.type === 'professional' || agency.profile_url || document.querySelector('.professional-name')
        ? 'professional'
        : 'private';
    l.advertiser_name =
      agency.name || text('.professional-name .name') || text('.advertiser-name-container');
    l.agency_profile_url = agency.profile_url;
    l.agency_has_idealista_profile = !!agency.profile_url;
    l.photo_count = photoCount;
    l.has_photos = photoCount > 0;
    l.has_description = !!desc;
    l.contact_phone_available =
      !/they have not provided a phone number|no ha facilitado (un )?tel[eé]fono/i.test(body);
    l.last_updated = text('.date-update-text');
    l.features = feats;
    l.price_details = allText('#details .details-property_features li').slice(0, 20);
    l.description = desc;
    return l;
  }
};
