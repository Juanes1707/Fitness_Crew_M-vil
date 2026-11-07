import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, after, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

// PostgreSQL real embebido. Sólo auth.uid y el esquema Storage se reproducen;
// no sustituye una prueba de Auth/Storage/Realtime en Supabase alojado.
let db;
const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const outsider = "33333333-3333-4333-8333-333333333333";
const reportId = "44444444-4444-4444-8444-444444444444";
let groupId;
async function asUser(uid, sql, params = [], role = "authenticated") {
  await db.exec(`begin; set local role ${role};`);
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
      uid ?? "",
    ]);
    const result = await db.query(sql, params);
    await db.exec("commit");
    return result.rows;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text references storage.buckets(id),name text,unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated;
    grant select,insert,update,delete on storage.objects to authenticated;
  `);
  const migration = await readFile(
    "backend/supabase/migrations/001_fitcrew.sql",
    "utf8",
  );
  await db.exec(migration);
  await db.exec(migration); // Reejecución no destruye datos ni duplica políticas.
  await db.query("insert into auth.users(id) values ($1),($2),($3)", [
    alice,
    bob,
    outsider,
  ]);
  await db.exec(
    "insert into public.gyms values ('pilot','Gimnasio de prueba SQL','Sólo fixture de pruebas');",
  );
});
after(async () => {
  await db?.close();
});

test("sin sesión no hay acceso a tablas ni RPC; gimnasio sólo lectura para clientes", async () => {
  await assert.rejects(
    asUser(null, "select * from public.gyms", [], "anon"),
    /permission denied/,
  );
  await assert.rejects(
    asUser(null, "select public.create_group('Intruso')", [], "anon"),
    /permission denied/,
  );
  assert.equal((await asUser(alice, "select * from public.gyms")).length, 1);
  await assert.rejects(
    asUser(alice, "insert into public.gyms values('fake','fake','fake')"),
    /permission denied/,
  );
});
test("crear grupo es atómico; perfil propio y membresía privada", async () => {
  const rows = await asUser(
    alice,
    "select public.create_group('Mi crew') as id",
  );
  groupId = rows[0].id;
  assert.equal((await asUser(alice, "select * from public.groups")).length, 1);
  assert.equal((await asUser(bob, "select * from public.groups")).length, 0);
  assert.equal((await asUser(bob, "select * from public.profiles")).length, 0);
  await assert.rejects(
    asUser(alice, "select public.create_group('Duplicado')"),
    /grupo activo/,
  );
  assert.equal((await db.query("select * from public.groups")).rows.length, 1);
});
test("invitación incorpora únicamente al usuario actual y no permite escrituras directas", async () => {
  await assert.rejects(
    asUser(bob, "select public.join_group($1)", [reportId]),
    /invitación no es válida/,
  );
  assert.equal((await asUser(bob, "select * from public.profiles")).length, 0); // rollback del perfil.
  await asUser(bob, "select public.join_group($1)", [groupId]);
  await asUser(bob, "select public.join_group($1)", [groupId]); // idempotente.
  const [group] = await asUser(bob, "select * from public.groups where id=$1", [
    groupId,
  ]);
  assert.deepEqual(group.members, [alice, bob]);
  await assert.rejects(
    asUser(
      bob,
      "update public.groups set members=array[$1::uuid] where id=$2",
      [bob, groupId],
    ),
    /permission denied/,
  );
  await assert.rejects(
    asUser(bob, "update public.profiles set group_id=null"),
    /permission denied/,
  );
});
test("sólo integrantes consultan y publican check-ins propios", async () => {
  await asUser(
    alice,
    "insert into public.checkins(group_id,user_id,name,gym_id) values($1,$2,'Alice','pilot')",
    [groupId, alice],
  );
  assert.equal((await asUser(bob, "select * from public.checkins")).length, 1);
  assert.equal(
    (await asUser(outsider, "select * from public.checkins")).length,
    0,
  );
  await assert.rejects(
    asUser(
      outsider,
      "insert into public.checkins(group_id,user_id,name,gym_id) values($1,$2,'Fuera','pilot')",
      [groupId, outsider],
    ),
    /row-level security/,
  );
  await assert.rejects(
    asUser(
      bob,
      "insert into public.checkins(group_id,user_id,name,gym_id) values($1,$2,'Suplantado','pilot')",
      [groupId, alice],
    ),
    /row-level security/,
  );
  await assert.rejects(
    asUser(alice, "delete from public.checkins"),
    /permission denied/,
  );
});
test("Storage restringe bucket y ruta propia, impide reemplazo y borrado", async () => {
  const path = `${alice}/${reportId}.jpg`;
  await asUser(
    alice,
    "insert into storage.objects(bucket_id,name) values('report-photos',$1)",
    [path],
  );
  await assert.rejects(
    asUser(
      bob,
      "insert into storage.objects(bucket_id,name) values('report-photos',$1)",
      [`${alice}/${bob}.jpg`],
    ),
    /row-level security/,
  );
  await assert.rejects(
    asUser(
      alice,
      "insert into storage.objects(bucket_id,name) values('report-photos',$1)",
      [`${alice}/mal.jpg`],
    ),
    /row-level security/,
  );
  assert.equal(
    (
      await asUser(
        alice,
        "update storage.objects set name='changed' returning id",
      )
    ).length,
    0,
  );
  assert.equal(
    (await asUser(alice, "delete from storage.objects returning id")).length,
    0,
  );
  const bucket = (
    await db.query("select * from storage.buckets where id='report-photos'")
  ).rows[0];
  assert.equal(bucket.public, false);
  assert.equal(Number(bucket.file_size_limit), 5242879);
  assert.deepEqual(bucket.allowed_mime_types, ["image/jpeg"]);
});
test("reporte exige autor, nivel y fotografía existente; fecha del servidor e inmutabilidad", async () => {
  const sql =
    "insert into public.reports(id,gym_id,user_id,level,photo_path) values($1,$2,$3,$4,$5) returning created_at";
  const path = `${alice}/${reportId}.jpg`;
  const rows = await asUser(alice, sql, [
    reportId,
    "pilot",
    alice,
    "medium",
    path,
  ]);
  assert.ok(rows[0].created_at);
  await assert.rejects(
    asUser(bob, sql, [bob, "pilot", alice, "full", `${alice}/${bob}.jpg`]),
    /row-level security/,
  );
  await assert.rejects(
    asUser(alice, sql, [
      alice,
      "pilot",
      alice,
      "empty",
      `${alice}/${alice}.jpg`,
    ]),
    /row-level security/,
  );
  await assert.rejects(
    asUser(
      alice,
      "insert into public.reports(id,gym_id,user_id,level,photo_path,created_at) values($1,'pilot',$2,'empty',$3,now())",
      [bob, alice, `${alice}/${bob}.jpg`],
    ),
    /permission denied/,
  );
  await assert.rejects(
    asUser(alice, "update public.reports set level='full'"),
    /permission denied/,
  );
  await assert.rejects(
    asUser(alice, "delete from public.reports"),
    /permission denied/,
  );
  // Fixture con foto propia para alcanzar los CHECK del modelo, no sólo el RLS.
  await db.query(
    "insert into storage.objects(bucket_id,name) values('report-photos',$1)",
    [`${alice}/${bob}.jpg`],
  );
  await assert.rejects(
    asUser(alice, sql, [
      bob,
      "pilot",
      alice,
      "inventado",
      `${alice}/${bob}.jpg`,
    ]),
    /check constraint/,
  );
  await assert.rejects(
    asUser(alice, sql, [bob, "pilot", alice, "full", path]),
    /check constraint/,
  );
});
test("el cupo de 20 no se puede saltar usando el RPC", async () => {
  // Completar con UUIDs de fixture sin hacerlos visibles a usuarios ajenos.
  const fixtureMembers = [
    alice,
    bob,
    ...Array.from(
      { length: 18 },
      (_, i) => `aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12, "0")}`,
    ),
  ];
  await db.query("update public.groups set members=$1::uuid[] where id=$2", [
    fixtureMembers,
    groupId,
  ]);
  await assert.rejects(
    asUser(outsider, "select public.join_group($1)", [groupId]),
    /20 integrantes/,
  );
  assert.equal(
    (await asUser(outsider, "select * from public.profiles")).length,
    0,
  );
});
