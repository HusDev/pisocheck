/* pisos.com — ~3.4M visits/month. Server-rendered HTML with stable, readable class
   names. It also prints the Spanish rent-reference-index rules on the page, which is
   useful context for the price judgment. */
import type { Listing } from '../types.js';
import {
  allText, baseListing, num, roomDetailFrom, roomListingFrom, studioFrom, text,
  type PortalAdapter
} from './shared.js';

export const pisos: PortalAdapter = {
  id: 'pisos',

  handles: (host) => /(^|\.)pisos\.com$/.test(host),

  isListingPage: () => /^\/(alquilar|comprar)\/[^/]+\d+_\d+\/?$/.test(location.pathname),

  extract(): Listing {
    const l = baseListing('pisos');
    const headline = (text('h1') || document.title || '').trim();
    const feats = [
      ...allText('.features-summary__item'),
      ...allText('.charblock-left li, .charblock-right li, .details__block li')
    ]
      .filter((t) => t.length > 1 && t.length < 90)
      .slice(0, 40);

    const desc = text('.js-description') || text('.description-block') || text('[class*="description"]');
    const roomsText = feats.find((f) => /\bhabs?\.|habitacion|dormitor|bedroom/i.test(f));
    const isStudio = studioFrom(roomsText) || /estudio|loft/i.test(headline);
    const isRoom = roomListingFrom(headline);
    const room = isRoom ? roomDetailFrom(feats) : null;
    const photos = document.querySelectorAll('.gallery img, [class*="gallery"] img, .mainphoto img').length;
    const owner =
      text('.owner-info__name') ||
      text('.owner-info__title') ||
      text('[class*="owner"] [class*="name"]');
    const ownerLink = document.querySelector<HTMLAnchorElement>('.owner-info a[href*="/inmobiliaria"], .owner a[href*="/inmobiliaria"]');

    l.listing_id = location.pathname.match(/(\d{6,})_/)?.[1] ?? null;
    l.operation = /^\/alquilar\//.test(location.pathname) ? 'rent' : 'sale';
    l.property_type = isStudio ? 'studio / loft (open plan, no separate bedroom)' : null;
    l.is_studio = isStudio;
    l.is_room_listing = isRoom;
    l.price_covers = isRoom ? 'this room only, in a shared flat' : 'the whole property';
    l.title = headline || null;
    l.location_line = text('.details__block h2') || text('.position__location');
    l.city = (text('.position__location') || '').split(',').pop()?.trim() || null;
    l.district = (text('.position__location') || headline).split(' en ').pop()?.trim() || null;
    // The price block has moved between releases, so try each known home for it and
    // fall back to the first element on the page that looks like a monthly rent.
    const priceText =
      text('.details-featured__price') ||
      text('.price__value') ||
      allText('[class*="price"]').find((t) => /€/.test(t) && /\d/.test(t)) ||
      null;
    l.price_eur_month = num(priceText);
    l.size_m2 = isRoom ? room!.room_size_m2 : num(feats.find((f) => /m²|m2/.test(f)));
    l.room_detail = room;
    l.rooms = isRoom || isStudio ? null : num(roomsText);
    l.bathrooms = num(feats.find((f) => /baño/i.test(f)));
    l.floor = feats.find((f) => /planta|bajo|entresuelo/i.test(f)) ?? null;
    l.advertiser_type = owner ? 'professional' : 'private';
    l.advertiser_name = owner;
    l.agency_profile_url = ownerLink?.href ?? null;
    l.agency_has_idealista_profile = !!ownerLink;
    l.photo_count = photos;
    l.has_photos = photos > 0;
    l.has_description = !!desc;
    l.features = feats;
    l.description = desc;
    return l;
  }
};
