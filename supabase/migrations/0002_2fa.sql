-- 2FA (TOTP) columns on users.
-- Idempotent: safe to re-run.

alter table public.users add column if not exists totp_secret text;
alter table public.users add column if not exists totp_enabled boolean not null default false;
