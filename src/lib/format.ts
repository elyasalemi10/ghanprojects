// Human-readable labels for the uppercase enums stored in the database.
// Database values stay as-is; only the display layer changes.

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ON_HOLD: 'On hold',
};

export const LOAN_TYPE_LABELS: Record<string, string> = {
  FIXED_MONTHLY: 'Fixed monthly',
  FIXED_END: 'Fixed at end',
  PROFIT_SHARE: 'Profit share',
};

export const LOAN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DEFAULTED: 'Defaulted',
};

export const TX_TYPE_LABELS: Record<string, string> = {
  INTEREST_PAYMENT: 'Interest payment',
  PRINCIPAL_PAYMENT: 'Principal payment',
  PROFIT_DISTRIBUTION: 'Profit distribution',
  DISBURSEMENT: 'Disbursement',
  TOP_UP: 'Top-up',
  EARLY_REPAYMENT: 'Early repayment',
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

export const CONFIDENCE_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  LIKELY: 'Likely',
  POSSIBLE: 'Possible',
};

// Generic fallback: ON_HOLD → "On hold", FIXED_MONTHLY → "Fixed monthly".
export function humanise(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

// Resolve a label using a known map first, falling back to humanise.
export function label(value: string | null | undefined, map?: Record<string, string>): string {
  if (!value) return '—';
  if (map && value in map) return map[value];
  return humanise(value);
}
