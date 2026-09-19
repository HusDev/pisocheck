/* fotocasa.es — ~8M visits/month, Adevinta.
   React app with unstable class names, but it ships a complete JSON payload in
   <script id="__initial_props__">, which is far more reliable than any selector.
   It even states isTemporaryRental and RENTAL_DURATION outright. */
import type { Listing } from '../types.js';
import { baseListing, num, roomDetailFrom, roomListingFrom, type PortalAdapter } from './shared.js';

interface FotocasaFeature { type?: string; value?: unknown }

interface FotocasaProps {
  propertyTitle?: string;
  realEstateAdDetailEntityV2?: {
    id?: number | string;
    // Note the US spelling, and that `municipality` holds the district here
    // ("Ciutat Vella") while `locality` holds the city ("Barcelona").
    address?: {
      neighborhood?: string;
      district?: string;
      locality?: string;
      municipality?: string;
      province?: string;
    };
    description?: string;
    features?: FotocasaFeature[];
    extraFeatures?: string[];
    price?: { amount?: number; periodicity?: number };
    transactionTypeId?: number;
    isTemporaryRental?: boolean;
    multimedias?: unknown[];
    publisher?: { name?: string; alias?: string; type?: string; url?: string; phone?: string };
    propertyTypeId?: number;
  };
  realEstate?: {
    features?: { rooms?: number; bathrooms?: number; surface?: number; floor?: number };
    extras?: string[];
    clientName?: string;
    clientTypeId?: number;
    clientUrl?: string;
    phone?: string;
    isTemporaryRental?: boolean;
    date?: string;
    alterDate?: string;
  };
}

function props(): FotocasaProps | null {
  const el = document.getElementById('__initial_props__');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as FotocasaProps;
  } catch {
    return null;
  }
}

export const fotocasa: PortalAdapter = {
  id: 'fotocasa',

  handles: (host) => /(^|\.)fotocasa\.es$/.test(host),

  isListingPage: () => /\/(vivienda|habitacion)\//.test(location.pathname) && /\/d\/?$/.test(location.pathname),

  extract(): Listing {
    const l = baseListing('fotocasa');
    const p = props() ?? {};
    const e = p.realEstateAdDetailEntityV2 ?? {};
    const r = p.realEstate ?? {};
    const f = r.features ?? {};

    const featureMap = new Map<string, unknown>(
      (e.features ?? []).map((x) => [String(x.type), x.value])
    );
    const typology = String(featureMap.get('TYPOLOGY') ?? '');
    const headline = p.propertyTitle || document.title || '';
    // Fotocasa states the rental duration itself, which no amount of text parsing beats.
    const duration = String(featureMap.get('RENTAL_DURATION') ?? '');

    const feats = [
      ...(e.extraFeatures ?? []),
      ...(r.extras ?? []),
      ...[...featureMap].map(([k, v]) => (typeof v === 'object' ? k : `${k}: ${String(v)}`)),
      duration ? `Rental duration: ${duration}` : '',
      e.isTemporaryRental || r.isTemporaryRental ? 'Marked as temporary rental by the portal' : ''
    ].filter(Boolean) as string[];

    const isRoom = roomListingFrom(headline, typology) || /\/habitacion\//.test(location.pathname);
    const room = isRoom ? roomDetailFrom(feats) : null;
    const isStudio = /stud|loft/i.test(typology) || f.rooms === 0;
    const photos = Array.isArray(e.multimedias) ? e.multimedias.length : 0;
    const publisher = e.publisher;

    l.listing_id = e.id != null ? String(e.id) : location.pathname.match(/\d{6,}/)?.[0] ?? null;
    l.operation = e.transactionTypeId === 3 ? 'rent' : /alquiler/.test(location.pathname) ? 'rent' : null;
    l.property_type = typology
      ? `${typology.toLowerCase()}${isStudio ? ' (open plan, no separate bedroom)' : ''}`
      : null;
    l.is_studio = isStudio;
    l.is_room_listing = isRoom;
    l.price_covers = isRoom ? 'this room only, in a shared flat' : 'the whole property';
    l.title = headline || null;
    l.location_line =
      [e.address?.neighborhood, e.address?.locality].filter(Boolean).join(', ') || null;
    l.city = e.address?.locality ?? e.address?.province ?? null;
    l.district = e.address?.neighborhood ?? e.address?.municipality ?? null;
    l.price_eur_month = num(e.price?.amount);
    l.size_m2 = isRoom ? room!.room_size_m2 : num(f.surface);
    l.room_detail = room;
    l.rooms = isRoom || isStudio ? null : num(f.rooms);
    l.bathrooms = num(f.bathrooms);
    l.floor = f.floor ? `Floor ${f.floor}` : null;
    l.advertiser_type =
      publisher?.type === 'professional' || r.clientTypeId === 3 ? 'professional' : 'private';
    l.advertiser_name = publisher?.name ?? publisher?.alias ?? r.clientName ?? null;
    l.agency_profile_url = publisher?.url
      ? publisher.url.startsWith('http') ? publisher.url : location.origin + publisher.url
      : null;
    l.agency_has_idealista_profile = !!l.agency_profile_url;
    l.photo_count = photos;
    l.has_photos = photos > 0;
    l.has_description = !!e.description;
    l.contact_phone_available = !!(publisher?.phone || r.phone);
    l.last_updated = r.alterDate ?? r.date ?? null;
    l.features = feats.slice(0, 40);
    l.description = e.description ?? null;
    return l;
  }
};
