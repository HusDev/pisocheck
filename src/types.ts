// Shapes shared across the extension: what we read off the page, what the Jev API
// returns, and what the panel renders.

/** A listing as extracted from an Idealista page. Every field can be absent: the page
 *  may not state it, and an absence is itself information the model should see. */
export interface Listing {
  url: string;
  portal: 'idealista';
  listing_id: string | null;
  operation: string | null;
  property_type: string | null;
  is_studio: boolean;
  is_room_listing: boolean;
  /** Spells out what the price buys, so a room's rent is never read as a flat's. */
  price_covers: 'this room only, in a shared flat' | 'the whole property';
  title: string | null;
  location_line: string | null;
  city: string | null;
  district: string | null;
  price_eur_month: number | null;
  /** The room's own size on a room let, the property's otherwise. */
  size_m2: number | null;
  room_detail: RoomDetail | null;
  rooms: number | null;
  bathrooms: number | null;
  floor: string | null;
  advertiser_type: 'professional' | 'private' | null;
  advertiser_name: string | null;
  agency_profile_url: string | null;
  agency_has_idealista_profile: boolean;
  /** Zero means zero, never "unknown" — see has_photos. */
  photo_count: number;
  has_photos: boolean;
  has_description: boolean;
  contact_phone_available: boolean;
  last_updated: string | null;
  features: string[];
  price_details: string[];
  description: string | null;
  page_language: string;
}

/** A room let describes two things at once: the room and the flat around it. */
export interface RoomDetail {
  room_size_m2: number | null;
  flat_size_m2: number | null;
  flat_bedrooms: number | null;
  flatmates: string | null;
  housemates_profile: string | null;
  minimum_stay: string | null;
  maximum_stay: string | null;
  availability: string | null;
  owner_lives_in_property: boolean | null;
}

/** The subset of Listing the panel needs; the rest never leaves the worker. */
export type ListingSummary = Pick<
  Listing,
  | 'advertiser_name'
  | 'advertiser_type'
  | 'agency_profile_url'
  | 'agency_has_idealista_profile'
  | 'city'
  | 'price_eur_month'
  | 'size_m2'
  | 'has_photos'
  | 'has_description'
  | 'contact_phone_available'
>;

// ---------------------------------------------------------------------------
// TypeSafe System One API — https://docs.typesafe.ai/api
// ---------------------------------------------------------------------------

export interface NoulQuestion {
  type: 'noul';
  instructions: string;
  criteria?: { true?: string; false?: string };
}

export interface ChoiceQuestion<Option extends string = string> {
  type: 'choice';
  instructions: string;
  criteria: Record<Option, string | null>;
}

export interface ScoreQuestion {
  type: 'score';
  instructions: string;
  criteria: string[];
}

export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export interface NoulAnswer {
  type: 'noul';
  noul: number;
}

export interface ChoiceAnswer<Option extends string = string> {
  type: 'choice';
  choice: Option;
  probabilities: Record<Option, number>;
  confidence: number;
}

export interface ScoreAnswer {
  type: 'score';
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
}

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export interface SystemOneResponse<K extends string = string> {
  model: string;
  answers: Partial<Record<K, Answer>>;
  usage: { input_tokens: number; output_tokens: number };
}

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

export type Verdict = 'strong' | 'caution' | 'skip';

export interface Factor {
  key: string;
  label: string;
  value: number;
  /** True when the advert gave nothing to judge this on, so it left the average. */
  muted: boolean;
}

export interface TrustSignal {
  key: string;
  label: string;
  value: number;
}

export interface VerdictResult {
  scam: number;
  composite: number;
  verdict: Verdict;
  gaps: string[];
  tooThin: boolean;
  factors: Factor[];
  trust: TrustSignal[];
  reasons: Factor[];
  tenancy: { choice: string; confidence: number } | null;
}

/** A verdict plus everything the panel shows about how it was produced. */
export interface AnalysisResult extends VerdictResult {
  listing?: ListingSummary;
  latency_ms: number;
  usage: SystemOneResponse['usage'] | null;
  model: string;
  at: number;
  cached?: boolean;
  /** Present only when the shared proxy answered; null when using your own key. */
  quota?: { used: number; limit: number; plan: string } | null;
}

// ---------------------------------------------------------------------------
// Messages between the content script and the service worker
// ---------------------------------------------------------------------------

export interface Settings {
  apiKey: string;
  proxyUrl: string;
  autoRun: boolean;
  /** Unlocks a higher daily allowance on the shared proxy. */
  license: string;
}

export type Message =
  | { type: 'pisocheck:settings' }
  | { type: 'pisocheck:analyze'; listing: Listing; force?: boolean }
  | { type: 'pisocheck:openOptions' }
  | { type: 'pisocheck:run'; force?: boolean };

export type AnalyzeResponse =
  | { ok: true; result: AnalysisResult }
  | { ok: false; error: string; code: string };
