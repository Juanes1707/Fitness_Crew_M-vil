-- Gimnasios y direcciones proporcionados por el usuario para el piloto.
-- Ejecutar en SQL Editor después de 001_fitcrew.sql. No crea reportes.
begin;
insert into public.gyms(id,name,address) values
  ('smartfit-central-park-chia','Smart Fit - Central Park Chía','Cra. 10 #6-130, Chía.'),
  ('bodytech-plaza-mayor-chia','Bodytech Plaza Mayor Chía','Centro Comercial Plaza Mayor, Local 121, Av. Pradilla No. 5 - 31 Este, Chía.'),
  ('athletic-gym-chia','Athletic Gym Chía','Cra. 1 #5-30, Chía.')
on conflict(id) do update set name=excluded.name,address=excluded.address;
commit;
select id,name,address from public.gyms order by name;
