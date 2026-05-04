-- Bank loans (facilities the company takes from banks).
-- Distinct from `loans`, which are investor loans (lenders giving money to the company).
-- Idempotent: safe to re-run.

-- ============================================
-- Project line-item breakdowns (cost + revenue)
-- ============================================
alter table public.projects add column if not exists cost_line_items jsonb;
alter table public.projects add column if not exists revenue_line_items jsonb;

-- ============================================
-- BANK_LOANS
-- ============================================
create table if not exists public.bank_loans (
  id                          uuid primary key default gen_random_uuid(),
  project_id                  uuid references public.projects(id) on delete set null,

  -- Lender identification
  bank_key                    text not null,                       -- maps to /public/bank-logos
  bank_name                   text not null,                       -- denormalised for history
  loan_account_number         text,

  -- Type & security
  loan_type                   text not null check (loan_type in ('CONSTRUCTION','OTHER')),
  loan_type_other             text,                                -- when loan_type = OTHER
  secured                     boolean not null default true,
  secured_to                  text,                                -- description if secured

  -- Facility amounts
  facility_limit              numeric(14,2),
  amount_drawn                numeric(14,2),
  amount_available            numeric(14,2),

  -- Interest
  interest_rate               numeric(6,3),                        -- e.g. 7.250
  interest_rate_type          text not null default 'FIXED' check (interest_rate_type in ('FIXED','VARIABLE')),
  interest_rate_pegged_to     text,                                -- e.g. "BBSY + 2.5%"
  interest_rate_date          date,                                -- date the rate was set

  -- Dates
  settlement_date             date,
  maturity_date               date,

  -- Repayment terms
  io_period_months            integer,                             -- interest-only period
  pi_period_months            integer,                             -- principal+interest period
  repayment_frequency         text check (repayment_frequency in ('MONTHLY','FORTNIGHTLY','WEEKLY','QUARTERLY','OTHER')),
  min_monthly_repayment       numeric(14,2),
  direct_debit_day            integer,                             -- day of month
  debit_bsb                   text,
  debit_account_number        text,

  -- Fees
  establishment_fee           numeric(14,2),
  ongoing_fees                text,                                -- description
  early_repayment_terms       text,

  -- Documents (URLs)
  loan_agreement_url          text,
  mortgage_documents_url      text,
  valuation_report_url        text,

  -- Covenants & extras
  covenants                   text,

  notes                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index if not exists bank_loans_project_idx on public.bank_loans (project_id);
create index if not exists bank_loans_bank_idx on public.bank_loans (bank_key);

-- updated_at trigger
do $$ begin
  drop trigger if exists set_updated_at on public.bank_loans;
  create trigger set_updated_at before update on public.bank_loans
    for each row execute function public.set_updated_at();
end $$;

-- RLS: same policy as the rest — service role only.
alter table public.bank_loans enable row level security;
revoke all on public.bank_loans from anon, authenticated;
