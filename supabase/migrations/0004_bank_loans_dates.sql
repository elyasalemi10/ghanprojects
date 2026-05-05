-- Replace IO / P&I "period in months" with explicit date ranges,
-- and split the "pegged to" text field into a benchmark + margin pair.
-- Idempotent: safe to re-run.

-- Date ranges for repayment phases
alter table public.bank_loans add column if not exists io_start_date date;
alter table public.bank_loans add column if not exists io_end_date   date;
alter table public.bank_loans add column if not exists pi_start_date date;
alter table public.bank_loans add column if not exists pi_end_date   date;

-- Benchmark + margin (replaces the free-text interest_rate_pegged_to)
alter table public.bank_loans add column if not exists interest_rate_benchmark text;  -- BBSY / BBSW / RBA / OTHER
alter table public.bank_loans add column if not exists interest_rate_margin    numeric(5,2); -- e.g. 2.50 means + 2.5%

-- Old "_months" columns and the free-text "pegged to" stay in place for now —
-- safer than dropping. They're simply unused going forward; you can drop them
-- by running:
--   alter table public.bank_loans drop column io_period_months;
--   alter table public.bank_loans drop column pi_period_months;
--   alter table public.bank_loans drop column interest_rate_pegged_to;
