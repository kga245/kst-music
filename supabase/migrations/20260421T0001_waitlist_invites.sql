-- KST-5: waitlist + invite-code schema.
-- Service-role-only writes. RLS on with no public policies.

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_lower text generated always as (lower(email)) stored unique,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  uses_allowed integer not null default 10 check (uses_allowed > 0),
  uses_remaining integer not null check (uses_remaining >= 0),
  note text,
  created_at timestamptz not null default now(),
  created_by text
);

create table if not exists public.invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.invite_codes(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  context jsonb
);

create index if not exists invite_redemptions_code_id_idx
  on public.invite_redemptions (code_id);

create index if not exists waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at desc);

alter table public.waitlist_signups enable row level security;
alter table public.invite_codes enable row level security;
alter table public.invite_redemptions enable row level security;

-- Atomic: claim one use from a code and record a redemption, or return null
-- if the code is missing / exhausted. Runs as definer so the server-side
-- service-role caller can invoke it; anon callers cannot because RLS has
-- no public policies and there is no grant to anon.
-- `uses_remaining` is both a column and an OUT parameter name — qualify every
-- column reference with the `ic` alias so PL/pgSQL doesn't complain about
-- ambiguity.
create or replace function public.redeem_invite_code(
  p_code text,
  p_context jsonb default null
)
returns table (
  code_id uuid,
  uses_remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code_id uuid;
  v_remaining integer;
begin
  update public.invite_codes ic
     set uses_remaining = ic.uses_remaining - 1
   where ic.code = p_code
     and ic.uses_remaining > 0
   returning ic.id, ic.uses_remaining
        into v_code_id, v_remaining;

  if v_code_id is null then
    return;
  end if;

  insert into public.invite_redemptions (code_id, context)
  values (v_code_id, p_context);

  code_id := v_code_id;
  uses_remaining := v_remaining;
  return next;
end;
$$;

revoke all on function public.redeem_invite_code(text, jsonb) from public;
revoke all on function public.redeem_invite_code(text, jsonb) from anon;
