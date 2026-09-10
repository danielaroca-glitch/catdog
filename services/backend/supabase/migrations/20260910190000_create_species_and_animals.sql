-- PBI: pbi-001-alta-de-animal (T1)
-- Cria as tabelas species e animals. Idempotente: seguro executar novamente
-- mesmo que parte já exista.

create table if not exists public.species (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.species enable row level security;

create table if not exists public.animals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species_id uuid not null references public.species (id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.animals enable row level security;

-- Sem policy permissiva em nenhuma das duas tabelas: todo acesso passa pela
-- API NestJS via SUPABASE_CLIENT (service role), que ignora RLS por padrão —
-- mesmo modelo de acesso já usado por `profiles`. RLS fica habilitado por
-- defesa em profundidade contra qualquer acesso direto client-side futuro.

-- Seed inicial (RN-04, DEC-02 de decisions.md): lista mínima de espécies até
-- o módulo futuro "Registro de espécies" assumir a gestão completa.
insert into public.species (name)
values ('Cachorro'), ('Gato'), ('Ave'), ('Outro')
on conflict (name) do nothing;
