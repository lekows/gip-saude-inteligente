import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
// Replays the actual Supabase migrations and RLS. No hosted data or mocked policy.
const bootstrap = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create schema storage;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    )::uuid;
  $$;
  create function auth.role() returns text language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
    );
  $$;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text,
    owner uuid,
    owner_id text
  );
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1];
  $$;
  alter table storage.buckets enable row level security;
  alter table storage.objects enable row level security;
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant all on all tables in schema storage to anon, authenticated, service_role;
  grant execute on all functions in schema auth, storage to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;
test("process review enforces scoped access, authorship, versioning and immutable history", { timeout: 120000 }, async t => {
 const db=await PGlite.create();
 try {
  await db.exec(bootstrap);
  const directory=new URL("../supabase/migrations/",import.meta.url);
  const migrations=(await readdir(directory)).filter(x=>x.endsWith(".sql")).sort();
  for(const name of migrations){const sql=(await readFile(new URL(name,directory),"utf8")).replace(/^\s*create extension if not exists pgcrypto\s*;\s*$/gim,"");await db.exec(sql);}
  if(process.env.GIP_PROCESS_SQL)await db.exec(await readFile(process.env.GIP_PROCESS_SQL,"utf8"));
  assert.equal((await db.query("select count(*)::int as total from pg_tables where schemaname='public' and tablename in ('process_maps','process_review_members','process_feedback','process_feedback_reviews')")).rows[0].total,4);
  const editorialTests=await readFile(new URL("../supabase/tests/process_editorial.sql",import.meta.url),"utf8");
  const suite=(await readFile(new URL("../supabase/tests/process_review.sql",import.meta.url),"utf8")).replace(
    "do $$ begin for i in 1..29 loop",()=>editorialTests+"\ndo $$ begin for i in 1..29 loop");
  await db.exec(suite);
  assert.equal((await db.query("select count(*)::int as total from auth.users")).rows[0].total,0,"fixtures rolled back");
  t.diagnostic("Actual SQL policies, direct table attacks, feedback replay, cross-unit isolation, revocation, closure, coordination conflict and history verified.");
 }finally{await db.close();}
});
