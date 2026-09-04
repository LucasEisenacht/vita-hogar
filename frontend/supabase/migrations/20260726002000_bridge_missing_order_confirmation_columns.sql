-- Bridge missing order confirmation columns on environments that drifted before
-- the checkout/order-email outbox migrations were applied in full.
--
-- This migration is intentionally additive and does not recreate orders, orders
-- data, outbox data, functions, or triggers.

create extension if not exists pgcrypto;

alter table public.orders
  add column if not exists confirmation_token_hash text,
  add column if not exists confirmation_token_secret_version integer,
  add column if not exists idempotency_key text;

alter table public.orders
  alter column confirmation_token_hash
  set default encode(digest(encode(gen_random_bytes(24), 'hex'), 'sha256'), 'hex');

alter table public.orders
  alter column confirmation_token_secret_version
  set default 1;

update public.orders
set confirmation_token_hash = encode(digest(encode(gen_random_bytes(24), 'hex'), 'sha256'), 'hex')
where confirmation_token_hash is null;

update public.orders
set confirmation_token_secret_version = 1
where confirmation_token_secret_version is null;

alter table public.orders
  alter column confirmation_token_hash set not null,
  alter column confirmation_token_secret_version set not null;

alter table public.orders
  drop constraint if exists orders_confirmation_token_hash_shape,
  drop constraint if exists orders_confirmation_token_secret_version_valid,
  add constraint orders_confirmation_token_hash_shape check (
    confirmation_token_hash ~ '^[0-9a-f]{64}$'
  ),
  add constraint orders_confirmation_token_secret_version_valid check (
    confirmation_token_secret_version >= 1 and confirmation_token_secret_version <= 100
  );

create unique index if not exists orders_idempotency_key_idx
on public.orders (idempotency_key)
where idempotency_key is not null;

notify pgrst, 'reload schema';
