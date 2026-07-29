import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const callbackSource = readFileSync(
  new URL("../app/auth/callback/page.tsx", import.meta.url),
  "utf8",
);

test("auth callback validates the user with the Supabase server", () => {
  assert.match(callbackSource, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(callbackSource, /supabase\.auth\.getSession\(\)/);
});

test("auth callback never claims administrator privileges", () => {
  assert.doesNotMatch(callbackSource, /claim_first_admin/);
});

test("auth callback checks the profile account status column", () => {
  assert.match(callbackSource, /account_status/);
  assert.doesNotMatch(callbackSource, /approval_status/);
});
