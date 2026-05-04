-- Ghan Projects Lending Platform
-- Run this in the Supabase SQL editor (or psql against your DATABASE_URL).
-- Idempotent: safe to re-run.

create extension if not exists "pgcrypto";

-- ============================================
-- USERS (auth + role)
-- ============================================
create table if not exists public.users (
  id              uuid primary key default gen_random_uuid(),
  email           text unique not null,
  name            text not null,
  password_hash   text not null,
  role            text not null check (role in ('OWNER','ADMIN','LENDER')) default 'LENDER',
  phone           text,
  active          boolean not null default true,
  borrower_id     uuid,
  permissions     jsonb,
  reset_token     text,
  reset_token_expires timestamptz,
  last_login      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists users_email_idx on public.users (lower(email));
create index if not exists users_role_idx on public.users (role);

-- ============================================
-- BORROWERS (the investors / lenders)
-- ============================================
create table if not exists public.borrowers (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text unique not null,
  phone         text,
  address       text,
  id_number     text,
  id_type       text,
  notes         text,
  custom_fields jsonb,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists borrowers_email_idx on public.borrowers (lower(email));

-- Now wire users.borrower_id FK
do $$ begin
  alter table public.users
    add constraint users_borrower_id_fkey
    foreign key (borrower_id) references public.borrowers(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ============================================
-- PROJECTS (real estate developments)
-- ============================================
create table if not exists public.projects (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  description           text,
  address               text,
  status                text not null default 'PLANNING',
  total_cost            numeric(14,2),
  total_revenue         numeric(14,2),
  total_profit          numeric(14,2),
  start_date            date,
  estimated_completion  date,
  actual_completion     date,
  custom_fields         jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists projects_status_idx on public.projects (status);

-- ============================================
-- LOANS
-- ============================================
create table if not exists public.loans (
  id                    uuid primary key default gen_random_uuid(),
  reference             text unique not null default ('GP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  borrower_id           uuid not null references public.borrowers(id) on delete restrict,
  project_id            uuid references public.projects(id) on delete set null,
  loan_type             text not null check (loan_type in ('FIXED_MONTHLY','FIXED_END','PROFIT_SHARE')),
  principal             numeric(14,2) not null,
  current_balance       numeric(14,2) not null,
  interest_rate         numeric(5,2) not null,
  profit_share_percent  numeric(5,2),
  start_date            date not null,
  maturity_date         date not null,
  term_months           integer not null,
  payment_amount        numeric(14,2),
  payment_day           integer,
  status                text not null default 'PENDING' check (status in ('PENDING','ACTIVE','COMPLETED','CANCELLED','DEFAULTED')),
  notes                 text,
  custom_fields         jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists loans_borrower_idx on public.loans (borrower_id);
create index if not exists loans_project_idx on public.loans (project_id);
create index if not exists loans_status_idx on public.loans (status);

-- ============================================
-- TRANSACTIONS
-- ============================================
create table if not exists public.transactions (
  id                  uuid primary key default gen_random_uuid(),
  loan_id             uuid not null references public.loans(id) on delete cascade,
  type                text not null check (type in ('INTEREST_PAYMENT','PRINCIPAL_PAYMENT','PROFIT_DISTRIBUTION','DISBURSEMENT','TOP_UP','EARLY_REPAYMENT')),
  amount              numeric(14,2) not null,
  payment_date        date not null,
  reference           text,
  notes               text,
  interest_portion    numeric(14,2),
  principal_portion   numeric(14,2),
  created_at          timestamptz not null default now(),
  created_by_id       uuid references public.users(id) on delete set null
);
create index if not exists transactions_loan_idx on public.transactions (loan_id);
create index if not exists transactions_date_idx on public.transactions (payment_date);
create index if not exists transactions_type_idx on public.transactions (type);

-- ============================================
-- ESTIMATED INFLOWS (cash-flow forecast inputs)
-- ============================================
create table if not exists public.estimated_inflows (
  id            uuid primary key default gen_random_uuid(),
  description   text not null,
  amount        numeric(14,2) not null,
  expected_date date not null,
  project_id    uuid references public.projects(id) on delete set null,
  confidence    text not null default 'LIKELY' check (confidence in ('LIKELY','POSSIBLE','CONFIRMED')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists inflows_date_idx on public.estimated_inflows (expected_date);

-- ============================================
-- REPAYMENT REQUESTS (early payback)
-- ============================================
create table if not exists public.repayment_requests (
  id                uuid primary key default gen_random_uuid(),
  loan_id           uuid not null references public.loans(id) on delete cascade,
  requested_amount  numeric(14,2) not null,
  is_partial        boolean not null default true,
  reason            text,
  status            text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','COMPLETED')),
  requested_at      timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by_id    uuid references public.users(id) on delete set null,
  review_notes      text,
  completed_at      timestamptz,
  transaction_id    uuid references public.transactions(id) on delete set null
);
create index if not exists repayment_requests_loan_idx on public.repayment_requests (loan_id);
create index if not exists repayment_requests_status_idx on public.repayment_requests (status);

-- ============================================
-- TOP-UP REQUESTS (add more funds)
-- ============================================
create table if not exists public.topup_requests (
  id                uuid primary key default gen_random_uuid(),
  loan_id           uuid not null references public.loans(id) on delete cascade,
  amount            numeric(14,2) not null,
  notes             text,
  status            text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','COMPLETED')),
  requested_at      timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by_id    uuid references public.users(id) on delete set null,
  review_notes      text,
  completed_at      timestamptz,
  transaction_id    uuid references public.transactions(id) on delete set null
);
create index if not exists topup_requests_loan_idx on public.topup_requests (loan_id);
create index if not exists topup_requests_status_idx on public.topup_requests (status);

-- ============================================
-- DOCUMENTS
-- ============================================
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  type            text not null check (type in ('CONTRACT','TERMS','STATEMENT','ID_VERIFICATION','SIGNATURE_RECORD','OTHER')),
  url             text not null,
  file_size       integer,
  mime_type       text,
  loan_id         uuid references public.loans(id) on delete cascade,
  borrower_id     uuid references public.borrowers(id) on delete cascade,
  period_start    date,
  period_end      date,
  uploaded_by_id  uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists documents_loan_idx on public.documents (loan_id);
create index if not exists documents_borrower_idx on public.documents (borrower_id);
create index if not exists documents_type_idx on public.documents (type);

-- ============================================
-- SIGNATURES (e-sign audit trail, Phase 2 ready)
-- ============================================
create table if not exists public.signatures (
  id              uuid primary key default gen_random_uuid(),
  loan_id         uuid not null references public.loans(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete restrict,
  signature_data  text not null,
  photo_url       text,
  ip_address      text not null,
  user_agent      text not null,
  signed_at       timestamptz not null default now(),
  document_hash   text not null,
  document_name   text not null
);
create index if not exists signatures_loan_idx on public.signatures (loan_id);
create index if not exists signatures_user_idx on public.signatures (user_id);

-- ============================================
-- AUDIT LOG (every important action)
-- ============================================
create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete set null,
  action        text not null,
  entity_type   text not null,
  entity_id     text,
  details       jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz not null default now()
);
create index if not exists audit_log_user_idx on public.audit_log (user_id);
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- ============================================
-- updated_at triggers
-- ============================================
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ declare t text;
begin
  for t in select unnest(array['users','borrowers','projects','loans','estimated_inflows']) loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- The Express backend connects with SUPABASE_SERVICE_ROLE_KEY which bypasses RLS,
-- so application access is unaffected. Enabling RLS with no policies means the
-- `anon` and `authenticated` Supabase roles get no access — defense in depth
-- against accidental anon-key exposure or a future direct-from-browser query.
do $$ declare t text;
begin
  for t in select unnest(array[
    'users','borrowers','projects','loans','transactions',
    'estimated_inflows','repayment_requests','topup_requests',
    'documents','signatures','audit_log'
  ]) loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
