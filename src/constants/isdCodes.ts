export interface ISDCode {
  country:   string;
  code:      string;   // e.g. "+91"
  iso:       string;   // ISO 3166-1 alpha-2
  flag:      string;   // emoji flag
  minLength: number;   // min digits (excluding ISD code)
  maxLength: number;   // max digits (excluding ISD code)
}

/** Sorted: India first, then alphabetically by region/popularity. */
export const ISD_CODES: ISDCode[] = [
  // ── South Asia (most common for this app) ───────────────────────────────
  { country: 'India',          code: '+91',  iso: 'IN', flag: '🇮🇳', minLength: 10, maxLength: 10 },
  { country: 'Pakistan',       code: '+92',  iso: 'PK', flag: '🇵🇰', minLength: 10, maxLength: 10 },
  { country: 'Bangladesh',     code: '+880', iso: 'BD', flag: '🇧🇩', minLength: 10, maxLength: 10 },
  { country: 'Sri Lanka',      code: '+94',  iso: 'LK', flag: '🇱🇰', minLength: 9,  maxLength: 9  },
  { country: 'Nepal',          code: '+977', iso: 'NP', flag: '🇳🇵', minLength: 10, maxLength: 10 },

  // ── Middle East ─────────────────────────────────────────────────────────
  { country: 'UAE',            code: '+971', iso: 'AE', flag: '🇦🇪', minLength: 9,  maxLength: 9  },
  { country: 'Saudi Arabia',   code: '+966', iso: 'SA', flag: '🇸🇦', minLength: 9,  maxLength: 9  },
  { country: 'Qatar',          code: '+974', iso: 'QA', flag: '🇶🇦', minLength: 8,  maxLength: 8  },
  { country: 'Kuwait',         code: '+965', iso: 'KW', flag: '🇰🇼', minLength: 8,  maxLength: 8  },
  { country: 'Bahrain',        code: '+973', iso: 'BH', flag: '🇧🇭', minLength: 8,  maxLength: 8  },
  { country: 'Oman',           code: '+968', iso: 'OM', flag: '🇴🇲', minLength: 8,  maxLength: 8  },

  // ── North America ────────────────────────────────────────────────────────
  { country: 'United States',  code: '+1',   iso: 'US', flag: '🇺🇸', minLength: 10, maxLength: 10 },
  { country: 'Canada',         code: '+1',   iso: 'CA', flag: '🇨🇦', minLength: 10, maxLength: 10 },

  // ── Europe ──────────────────────────────────────────────────────────────
  { country: 'United Kingdom', code: '+44',  iso: 'GB', flag: '🇬🇧', minLength: 10, maxLength: 10 },
  { country: 'Germany',        code: '+49',  iso: 'DE', flag: '🇩🇪', minLength: 10, maxLength: 11 },
  { country: 'France',         code: '+33',  iso: 'FR', flag: '🇫🇷', minLength: 9,  maxLength: 9  },
  { country: 'Italy',          code: '+39',  iso: 'IT', flag: '🇮🇹', minLength: 9,  maxLength: 10 },

  // ── South East Asia ──────────────────────────────────────────────────────
  { country: 'Singapore',      code: '+65',  iso: 'SG', flag: '🇸🇬', minLength: 8,  maxLength: 8  },
  { country: 'Malaysia',       code: '+60',  iso: 'MY', flag: '🇲🇾', minLength: 9,  maxLength: 10 },
  { country: 'Hong Kong',      code: '+852', iso: 'HK', flag: '🇭🇰', minLength: 8,  maxLength: 8  },

  // ── East Asia ───────────────────────────────────────────────────────────
  { country: 'Japan',          code: '+81',  iso: 'JP', flag: '🇯🇵', minLength: 10, maxLength: 11 },
  { country: 'South Korea',    code: '+82',  iso: 'KR', flag: '🇰🇷', minLength: 9,  maxLength: 10 },

  // ── Oceania ─────────────────────────────────────────────────────────────
  { country: 'Australia',      code: '+61',  iso: 'AU', flag: '🇦🇺', minLength: 9,  maxLength: 9  },
  { country: 'New Zealand',    code: '+64',  iso: 'NZ', flag: '🇳🇿', minLength: 8,  maxLength: 9  },

  // ── Africa ──────────────────────────────────────────────────────────────
  { country: 'South Africa',   code: '+27',  iso: 'ZA', flag: '🇿🇦', minLength: 9,  maxLength: 9  },
];

/** Returns phone length hint string, e.g. "10 digits" or "9–10 digits". */
export function phoneLengthHint(isd: ISDCode): string {
  return isd.minLength === isd.maxLength
    ? `${isd.minLength} digits`
    : `${isd.minLength}–${isd.maxLength} digits`;
}

/** Validate a phone number's digit count against the selected ISD code. */
export function validatePhoneLength(digits: string, isd: ISDCode): string | null {
  if (!digits) return null; // phone is optional
  if (digits.length < isd.minLength || digits.length > isd.maxLength) {
    return `${isd.country} numbers require ${phoneLengthHint(isd)}`;
  }
  return null;
}
