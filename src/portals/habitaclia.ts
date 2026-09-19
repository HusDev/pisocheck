/* habitaclia.com — ~2.1M visits/month, strongest in Catalonia. Adevinta-owned but
   still on its own server-rendered stack rather than Fotocasa's React app. */
import type { Listing } from '../types.js';
import {
  allText, baseListing, num, roomDetailFrom, roomListingFrom, studioFrom, text,
  type PortalAdapter
} from './shared.js';

export const habitaclia: PortalAdapter = {
  id: 'habitaclia',

  handles: (host) => /(^|\.)habitaclia\.com$/.test(host),

  isListingPage: () => /\/i\d+\.htm$/.test(location.pathname),

  extract(): Listing {
    const l = baseListing('habitaclia');
    const headline = (text('h1') || document.title || '').trim();
    const feats = [
      ...allText('.feature-container li'),
      ...allText('.detail-feature li, .feature li, #js-detail-description-features li')
    ]
      .filter((t) => t.length > 1 && t.length < 90)
      .slice(0, 40);

    const desc = text('.detail-description') || text('.descripcion');
    const roomsText = feats.find((f) => /\bhab\.|habitacion|dormitor/i.test(f));
    const isStudio = studioFrom(roomsText) || /estudio|loft/i.test(headline);
    const isRoom = roomListingFrom(headline);
    const room = isRoom ? roomDetailFrom(feats) : null;
    const photos = document.querySelectorAll('#slider img, [class*="gallery"] img').length;
    // The agency name is the first line of the contact box; strip the call-to-action
    // links that share the element.
    const contactBlock = text('.contact-top') || text('.contact');
    const owner = contactBlock
      ? (contactBlock.split(/Ver todos sus anuncios|Contactar/)[0] ?? '').trim() || null
      : null;
    const zone = text('.txt-geo');

    // The price block carries a price-drop notice too, so take the first amount only.
    const priceText = (text('.price') || '').split('€')[0] + '€';

    l.listing_id = location.pathname.match(/i(\d+)\.htm/)?.[1] ?? null;
    l.operation = /alquiler|lloguer/i.test(location.pathname + ' ' + headline) ? 'rent' : null;
    l.property_type = isStudio ? 'studio / loft (open plan, no separate bedroom)' : null;
    l.is_studio = isStudio;
    l.is_room_listing = isRoom;
    l.price_covers = isRoom ? 'this room only, in a shared flat' : 'the whole property';
    l.title = headline || null;
    // "Zona Sant Gervasi - Galvany" is the neighbourhood; the city comes off the title tag.
    l.location_line = zone ?? text('.detail-location');
    l.city = (document.title.split(' - ').slice(-2)[0] ?? '').replace('habitaclia', '').trim() || null;
    l.district = zone ? zone.replace(/^Zona\s+/i, '') : null;
    l.price_eur_month = num(priceText);
    l.size_m2 = isRoom ? room!.room_size_m2 : num(feats.find((f) => /m2|m²/.test(f)));
    l.room_detail = room;
    l.rooms = isRoom || isStudio ? null : num(roomsText);
    l.bathrooms = num(feats.find((f) => /baño/i.test(f)));
    l.floor = feats.find((f) => /planta|bajos/i.test(f)) ?? null;
    l.advertiser_type = owner ? 'professional' : 'private';
    l.advertiser_name = owner;
    l.photo_count = photos;
    l.has_photos = photos > 0;
    l.has_description = !!desc;
    l.features = feats;
    l.description = desc;
    return l;
  }
};
