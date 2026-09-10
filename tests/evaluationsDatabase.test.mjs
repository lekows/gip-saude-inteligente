import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Reproduce the Supabase roles, auth helpers, storage tables and legacy public
// grants before replaying the real migrations. No application policy is mocked.
// PGlite executes PostgreSQL locally; this never connects to a hosted project.
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

test("migrações completas e cenários SQL de avaliações executam com RLS real", { timeout: 120000 }, async (t) => {
  const db = await PGlite.create();
  try {
    await db.exec(bootstrap);
    const migrationDirectory = new URL("../supabase/migrations/", import.meta.url);
    const migrations = (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort();
    assert.ok(migrations.length >= 10, "A suíte exige o histórico existente e a migração de avaliações.");
    for (const name of migrations) {
      const source = await readFile(new URL(name, migrationDirectory), "utf8");
      // PGlite lacks the pgcrypto extension; gen_random_uuid is built into its
      // PostgreSQL engine. This is the only adaptation to migration source.
      const sql = source.replace(/^\s*create extension if not exists pgcrypto\s*;\s*$/gim, "");
      try {
        await db.exec(sql);
      } catch (error) {
        throw new Error(`Falha na migração ${name}: ${error.message}`, { cause: error });
      }
    }
    t.diagnostic(`${migrations.length} migrações aplicadas em banco temporário.`);
    const suite = await readFile(new URL("../supabase/tests/evaluations.sql", import.meta.url), "utf8");
    assert.match(suite, /\bbegin\s*;/i, "Fixtures devem usar transação.");
    assert.match(suite, /\brollback\s*;/i, "Fixtures não podem permanecer no banco.");
    await db.exec(suite);
    const { rows } = await db.query("select count(*)::integer as total from auth.users");
    assert.equal(rows[0].total, 0, "O rollback deve remover todos os usuários fictícios.");
  } finally {
    await db.close();
  }
});
