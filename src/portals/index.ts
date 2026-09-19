// The registry. Everything downstream — scoring, panel, worker — is portal-agnostic;
// only these adapters know what a given site's HTML looks like.
import type { Listing } from '../types.js';
import { fotocasa } from './fotocasa.js';
import { habitaclia } from './habitaclia.js';
import { idealista } from './idealista.js';
import { pisos } from './pisos.js';
import type { PortalAdapter } from './shared.js';

export const ADAPTERS: readonly PortalAdapter[] = [idealista, fotocasa, pisos, habitaclia];

export function adapterFor(host = location.host): PortalAdapter | null {
  return ADAPTERS.find((a) => a.handles(host)) ?? null;
}

export function isListingPage(): boolean {
  return adapterFor()?.isListingPage() ?? false;
}

export function extract(): Listing {
  const adapter = adapterFor();
  if (!adapter) throw new Error(`PisoCheck does not read ${location.host}`);
  return adapter.extract();
}
