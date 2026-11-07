-- Ejecutar una vez en SQL Editor de un proyecto Supabase propio.
-- No borra tablas ni datos. Repetirlo conserva filas y actualiza políticas.
begin;

create table if not exists public.gyms (
  id text primary key check (id ~ '^[a-z0-9_-]+$'),
  name text not null check (length(btrim(name)) between 1 and 120),
  address text not null check (length(btrim(address)) between 1 and 240)
);
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 60),
  owner_id uuid not null references auth.users(id),
  members uuid[] not null,
  check (cardinality(members) between 1 and 20),
  check (owner_id = any(members))
);
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null
);
create table if not exists public.reports (
  id uuid primary key,
  gym_id text not null references public.gyms(id),
  user_id uuid not null references auth.users(id),
  level text not null check (level in ('empty','medium','full')),
  photo_path text not null,
  created_at timestamptz not null default now(),
  check (photo_path = user_id::text || '/' || id::text || '.jpg')
);
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id),
  user_id uuid not null references auth.users(id),
  name text not null check (length(btrim(name)) between 1 and 60),
  gym_id text not null references public.gyms(id),
  created_at timestamptz not null default now()
);
create index if not exists reports_gym_time on public.reports(gym_id, created_at desc);
create index if not exists checkins_group_time on public.checkins(group_id, created_at desc);

alter table public.gyms enable row level security;
alter table public.reports enable row level security;
alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.checkins enable row level security;

-- Los grants son explícitos: no dependen de los defaults del proyecto.
revoke all on public.gyms, public.reports, public.groups, public.profiles, public.checkins from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.gyms, public.reports, public.groups, public.profiles, public.checkins to authenticated;
-- created_at no es escribible por clientes; PostgreSQL asigna la hora.
grant insert(id,gym_id,user_id,level,photo_path) on public.reports to authenticated;
grant insert(group_id,user_id,name,gym_id) on public.checkins to authenticated;

drop policy if exists gyms_read on public.gyms;
create policy gyms_read on public.gyms for select to authenticated using (true);
drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports for select to authenticated using (true);
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists groups_read on public.groups;
create policy groups_read on public.groups for select to authenticated using ((select auth.uid()) = any(members));
drop policy if exists checkins_read on public.checkins;
create policy checkins_read on public.checkins for select to authenticated using (
  exists(select 1 from public.groups g where g.id = group_id)
);
drop policy if exists checkins_create on public.checkins;
create policy checkins_create on public.checkins for insert to authenticated with check (
  user_id = (select auth.uid()) and exists(select 1 from public.groups g where g.id = group_id)
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('report-photos','report-photos',false,5242879,array['image/jpeg'])
on conflict(id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists fitcrew_photos_read on storage.objects;
create policy fitcrew_photos_read on storage.objects for select to authenticated using (bucket_id = 'report-photos');
drop policy if exists fitcrew_photos_create on storage.objects;
create policy fitcrew_photos_create on storage.objects for insert to authenticated with check (
  bucket_id = 'report-photos'
  and split_part(name,'/',1) = (select auth.uid())::text
  and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}[.]jpg$'
);
drop policy if exists reports_create on public.reports;
create policy reports_create on public.reports for insert to authenticated with check (
  user_id = (select auth.uid()) and exists(
    select 1 from storage.objects o where o.bucket_id = 'report-photos' and o.name = photo_path
  )
);

-- Crear/unirse es una transacción: no deja grupos sin perfil al fallar la red.
-- SECURITY DEFINER sólo en estas dos funciones de alcance acotado y search_path fijo.
create or replace function public.create_group(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  current_group uuid;
  new_group uuid;
begin
  if uid is null then raise exception 'Inicia sesión para crear un grupo.'; end if;
  if p_name is null or length(btrim(p_name)) not between 1 and 60 then
    raise exception 'Escribe un nombre de grupo entre 1 y 60 caracteres.';
  end if;
  insert into public.profiles(id) values(uid) on conflict(id) do nothing;
  select group_id into current_group from public.profiles where id = uid for update;
  if current_group is not null then raise exception 'Ya tienes un grupo activo. Recarga la pantalla.'; end if;
  insert into public.groups(name,owner_id,members) values(btrim(p_name),uid,array[uid]) returning id into new_group;
  update public.profiles set group_id = new_group where id = uid;
  return new_group;
end;
$$;
create or replace function public.join_group(p_code uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  current_group uuid;
  crew public.groups%rowtype;
begin
  if uid is null then raise exception 'Inicia sesión para unirte al grupo.'; end if;
  insert into public.profiles(id) values(uid) on conflict(id) do nothing;
  select group_id into current_group from public.profiles where id = uid for update;
  if current_group is not null and current_group <> p_code then
    raise exception 'Ya tienes un grupo activo. Recarga la pantalla.';
  end if;
  select * into crew from public.groups where id = p_code for update;
  if not found then raise exception 'La invitación no es válida.'; end if;
  if not (uid = any(crew.members)) then
    if cardinality(crew.members) >= 20 then raise exception 'El grupo ya tiene 20 integrantes.'; end if;
    update public.groups set members = array_append(members,uid) where id = p_code;
  end if;
  update public.profiles set group_id = p_code where id = uid;
  return p_code;
end;
$$;
revoke all on function public.create_group(text), public.join_group(uuid) from public, anon;
grant execute on function public.create_group(text), public.join_group(uuid) to authenticated;

-- Suscripciones con RLS; los SELECT posteriores vuelven a comprobar permisos.
do $$
declare t text;
begin
  if not exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['gyms','reports','groups','checkins'] loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I',t);
    end if;
  end loop;
end;
$$;
commit;
