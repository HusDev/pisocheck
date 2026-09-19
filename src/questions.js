// The single Jev request behind every verdict: one narrow judgment per question,
// all asked together over the same listing state.
export const MODEL = 'jev-latest';

export const QUESTIONS = {
  scam: {
    type: 'noul',
    instructions:
      'Is this rental advert likely to be a scam? A scam means the advertiser has no genuine, available property to rent at these terms, or intends to collect a deposit, reservation fee or rent without ever delivering a real tenancy.',
    criteria: {
      true: 'Clear fraud pattern: price far below anything plausible for the area, landlord unreachable in person, money requested before a viewing, keys promised by courier, copy-pasted or stock-looking content, contact pushed off-portal immediately.',
      false: 'Reads like a genuine advert from a real landlord or agency: plausible price for the area and size, concrete property details, normal viewing and contracting process.'
    }
  },
  price_below_market: {
    type: 'noul',
    instructions:
      'Is the monthly price implausibly low for a rental of this size, type and neighbourhood in this city, to the point of being a red flag rather than a good deal?',
    criteria: {
      true: 'Price is far below the realistic market rent for that barrio and size (roughly half or less of what comparable listings ask).',
      false: 'Price is within, or only modestly below, the normal range for that barrio, size and property type.'
    }
  },
  pressure_language: {
    type: 'noul',
    instructions:
      'Does the advert use pressure or urgency tactics to push the reader into acting fast (for example "first to pay gets it", "many people interested", "decide today", "reserve now to hold it")?',
    criteria: {
      true: 'Explicit urgency, scarcity or pay-now framing aimed at the reader.',
      false: 'Neutral, descriptive wording with no push to commit quickly.'
    }
  },
  temporary_seasonal: {
    type: 'noul',
    instructions:
      'Does this advert signal a temporary or seasonal rental (alquiler de temporada / lloguer de temporada, months-limited, students-only term, mid-term, monthly stays) rather than a standard long-term permanent-residence contract?',
    criteria: {
      true: 'Fixed short term, seasonal or monthly framing, stated maximum number of months, tourist or student-season contract.',
      false: 'Standard long-term residential tenancy with no stated time limit.'
    }
  },
  subletting: {
    type: 'noul',
    instructions:
      'Are there signs that the advertiser is subletting rather than renting as the owner or an authorised agent — for example the current tenant re-renting rooms (relloguer), a "coliving" operator on someone else\'s lease, or a contract offered by a person who lives there?',
    criteria: {
      true: 'Advertiser presents as a tenant, flatmate or intermediary re-renting the property or a room within it.',
      false: 'Advertiser is the owner or an identified professional agency acting for the owner.'
    }
  },
  missing_details: {
    type: 'noul',
    instructions:
      'Are essential details missing or evasive for a genuine rental advert — no real address or area, no photos of the actual property, vague or very short description, no mention of contract terms, deposit or requirements?',
    criteria: {
      true: 'Key facts a real landlord would state are absent, generic, or deliberately withheld until contact.',
      false: 'The advert gives concrete, checkable detail about the property and the terms.'
    }
  },
  inconsistencies: {
    type: 'noul',
    instructions:
      'Do the stated facts contradict each other — for example price, surface area, number of rooms, property type, photos and description that cannot all describe the same property?',
    criteria: {
      true: 'At least one clear internal contradiction between the structured fields and the description.',
      false: 'The numbers and the description are mutually consistent.'
    }
  },
  remote_landlord: {
    type: 'noul',
    instructions:
      'Does the advert indicate the landlord cannot meet in person — abroad, travelling, keys to be sent, viewing only after a transfer or reservation payment?',
    criteria: {
      true: 'Any claim that an in-person viewing or handover with the landlord is not possible or comes after payment.',
      false: 'Normal in-person viewing is offered or implied.'
    }
  },
  payment_demand: {
    type: 'noul',
    instructions:
      'Does the advert ask for money up front in a way a genuine landlord would not — a deposit, reservation or first rent paid before any viewing or signed contract, or payment by bank transfer, cash, crypto, gift card or money-transfer service instead of the portal\'s own booking flow?',
    criteria: {
      true: 'Money is requested to hold or reserve the property, or an irreversible payment method is named, before a viewing or contract.',
      false: 'No payment is requested in the advert, or payment follows a normal viewing and contract.'
    }
  },
  text_quality: {
    type: 'noul',
    instructions:
      'Does the written advert look copy-pasted, machine-translated or carelessly assembled in a way that does not match who the advertiser claims to be — spelling errors, paragraphs left in another language, sentences describing a different property?',
    criteria: {
      true: 'Text reads as auto-translated, duplicated from elsewhere, or internally mismatched, unlike an advert written by the person letting the property.',
      false: 'Coherent text written for this property, whatever its language.'
    }
  },
  offsite_contact: {
    type: 'noul',
    instructions:
      'Does the advert push the reader to contact the advertiser outside the portal (a WhatsApp number, personal email, Telegram) instead of using the portal messaging?',
    criteria: {
      true: 'Direct off-portal contact details or an instruction to write elsewhere appear in the text.',
      false: 'No off-portal contact channel is pushed.'
    }
  },
  // Trust signals. Deliberately kept out of WEIGHTS: a high value reassures the reader,
  // a low value never inflates the risk score. "We could not verify" is not "suspicious".
  advertiser_identifiable: {
    type: 'noul',
    instructions:
      'Does this advert identify who is letting the property well enough that a tenant could check them out before paying anything — a named agency or company, a professional account, an office, a business identity that exists outside this advert?',
    criteria: {
      true: 'A named professional agency or clearly identified landlord with a checkable business presence.',
      false: 'An anonymous or first-name-only advertiser with nothing a tenant could verify.'
    }
  },
  known_agency_brand: {
    type: 'noul',
    instructions:
      'Is the named advertiser an established real-estate agency, franchise or brand that operates a real business, rather than an unknown private individual?',
    criteria: {
      true: 'A recognisable agency, franchise or established local estate-agent business.',
      false: 'A private individual, or a name with no sign of being an operating business.'
    }
  },
  long_term_fit: {
    type: 'choice',
    instructions:
      'What kind of tenancy is actually on offer here, judged from the whole advert?',
    criteria: {
      long_term_home: 'A standard long-term rental of a home as a permanent residence.',
      room_in_shared_flat: 'A room inside a shared flat, rented long term.',
      temporary_or_seasonal: 'A time-limited seasonal, mid-term or student-season rental.',
      tourist_or_short_stay: 'Nightly or weekly tourist accommodation.',
      unclear: 'The advert does not make the type of tenancy identifiable.'
    }
  }
};

// Risk policy lives in code, not in the model: weights and thresholds are ours to tune.
export const WEIGHTS = {
  payment_demand: 0.18,
  price_below_market: 0.16,
  pressure_language: 0.14,
  temporary_seasonal: 0.12,
  subletting: 0.12,
  missing_details: 0.12,
  inconsistencies: 0.1,
  remote_landlord: 0.14,
  offsite_contact: 0.08,
  text_quality: 0.05
};

export const LABELS = {
  scam: 'Scam likelihood',
  price_below_market: 'Price too low for the barrio',
  pressure_language: 'Pressure / urgency language',
  temporary_seasonal: 'Temporary or seasonal contract',
  subletting: 'Possible subletting (relloguer)',
  missing_details: 'Missing or evasive details',
  inconsistencies: 'Inconsistent price / size / description',
  remote_landlord: 'Landlord cannot meet in person',
  offsite_contact: 'Pushes contact off-portal',
  payment_demand: 'Money asked for before viewing',
  text_quality: 'Copy-pasted or machine-translated text'
};

export const TRUST_LABELS = {
  advertiser_identifiable: 'Advertiser is identifiable',
  known_agency_brand: 'Looks like an established agency'
};

// These questions can only be answered from the advert's own text. With no description
// there is nothing to read, so their answers are noise and must not reach the score.
const TEXT_ONLY = [
  'pressure_language',
  'text_quality',
  'inconsistencies',
  'payment_demand',
  'remote_landlord',
  'offsite_contact'
];

// How much unverifiability alone is worth. A listing you cannot check carries real risk
// to the reader even when no single factor fires.
const GAP_FLOOR = { 0: 0, 1: 0.22, 2: 0.36, 3: 0.46 };

export function verdictFrom(answers, listing = {}) {
  const noul = (k) => (answers[k] && typeof answers[k].noul === 'number' ? answers[k].noul : 0);
  const scam = noul('scam');

  const noText = listing.has_description === false;
  const muted = noText ? TEXT_ONLY : [];
  const usable = (key) => !muted.includes(key);

  let weighted = 0;
  let total = 0;
  for (const [key, w] of Object.entries(WEIGHTS)) {
    if (!usable(key)) continue;
    weighted += noul(key) * w;
    total += w;
  }
  weighted = total ? weighted / total : 0;

  const gaps = [];
  if (listing.has_photos === false) gaps.push('no photos');
  if (listing.has_description === false) gaps.push('no description');
  if (listing.contact_phone_available === false) gaps.push('no phone number');
  const tooThin = gaps.length >= 2;

  const evidence = 0.6 * scam + 0.4 * weighted;
  // The ring must never read "low risk" on an advert nobody can verify.
  const composite = Math.max(evidence, GAP_FLOOR[Math.min(gaps.length, 3)] || 0);

  let verdict = 'strong';
  if (scam >= 0.6 || composite >= 0.5) verdict = 'skip';
  else if (scam >= 0.3 || composite >= 0.25) verdict = 'caution';

  // A clearly temporary or tourist tenancy is never a strong candidate for someone
  // looking for a long-term home, however clean the rest of the listing is.
  const tenancyChoice = answers.long_term_fit && answers.long_term_fit.choice;
  const shortTerm =
    noul('temporary_seasonal') >= 0.7 ||
    tenancyChoice === 'temporary_or_seasonal' ||
    tenancyChoice === 'tourist_or_short_stay';
  if (shortTerm && verdict === 'strong') verdict = 'caution';

  // An advert with no photos and no text is not a safe bet, it is an unjudgeable one.
  // Low risk scores on an empty listing mean "nothing to go on", never "nothing wrong".
  if (tooThin && verdict === 'strong') verdict = 'caution';

  // Scam is shown alongside the weighted factors, but only the weighted ones drive `weighted`.
  // Muted factors keep their place in the list, marked as unassessable rather than scored.
  const factors = ['scam', ...Object.keys(WEIGHTS)]
    .map((key) => ({
      key,
      label: LABELS[key],
      value: noul(key),
      muted: !usable(key)
    }))
    .sort((a, b) => (a.muted === b.muted ? b.value - a.value : a.muted ? 1 : -1));

  const tenancy = answers.long_term_fit || null;

  const trust = Object.keys(TRUST_LABELS).map((key) => ({
    key,
    label: TRUST_LABELS[key],
    value: noul(key)
  }));

  return {
    scam,
    composite,
    verdict,
    gaps,
    tooThin,
    factors,
    trust,
    reasons: factors.filter((f) => !f.muted && f.value >= 0.4).slice(0, 3),
    tenancy: tenancy ? { choice: tenancy.choice, confidence: tenancy.confidence } : null
  };
}
