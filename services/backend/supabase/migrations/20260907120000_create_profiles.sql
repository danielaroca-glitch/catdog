-- PBI: pbi-001-registro-e-confirmacao-de-conta (T4)
-- Cria a tabela profiles e o trigger que a popula automaticamente no signup.
-- Idempotente: seguro executar novamente mesmo que parte já exista.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'adotante');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role public.user_role not null default 'adotante',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Função + trigger: toda vez que um usuário é criado em auth.users,
-- cria automaticamente a linha correspondente em profiles com role 'adotante' (RN-01).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'adotante')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
