import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const callbackSource = readFileSync(
  new URL("../app/auth/callback/route.ts", import.meta.url),
  "utf8",
);
const loginSource = readFileSync(
  new URL("../app/entrar/page.tsx", import.meta.url),
  "utf8",
);
const middlewareSource = readFileSync(
  new URL("../middleware.ts", import.meta.url),
  "utf8",
);
const supabaseMiddlewareSource = readFileSync(
  new URL("../lib/supabase/middleware.ts", import.meta.url),
  "utf8",
);
const homePageSource = readFileSync(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);
const mobileScreeningSource = readFileSync(
  new URL("../components/mobile/QuickScreeningCard.tsx", import.meta.url),
  "utf8",
);
const adminActionsSource = readFileSync(
  new URL("../app/admin/usuarios/actions.ts", import.meta.url),
  "utf8",
);

test("auth callback route exchanges code for session", () => {
  assert.match(callbackSource, /exchangeCodeForSession\(/);
});

test("auth callback never claims administrator privileges", () => {
  assert.doesNotMatch(callbackSource, /claim_first_admin/);
});

test("middleware uses server-side getUser", () => {
  assert.match(supabaseMiddlewareSource, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(supabaseMiddlewareSource, /supabase\.auth\.getSession\(\)/);
});

test("auth and profile failures do not crash public pages", () => {
  assert.match(supabaseMiddlewareSource, /try\s*\{[\s\S]*supabase\.auth\.getUser\(\)/);
  assert.match(supabaseMiddlewareSource, /catch\s*\{/);
  assert.match(middlewareSource, /consulta de autorização falhar/);
});

test("operational homepage tolerates unavailable data summary", () => {
  assert.match(homePageSource, /function getOperationalSummary\(\)/);
  assert.match(homePageSource, /qualityScore: null/);
});

test("middleware enforces account_status and blocks pending users", () => {
  assert.match(middlewareSource, /account_status/);
  assert.match(middlewareSource, /aguardando-aprovacao/);
});

test("OAuth buttons require an explicit provider flag", () => {
  assert.match(loginSource, /NEXT_PUBLIC_SUPABASE_AUTH_GOOGLE_ENABLED/);
  assert.match(loginSource, /NEXT_PUBLIC_SUPABASE_AUTH_AZURE_ENABLED/);
  assert.match(loginSource, /NEXT_PUBLIC_SUPABASE_AUTH_FACEBOOK_ENABLED/);
  assert.match(loginSource, /\.filter\(\(\{ enabled \}\) => enabled\)/);
});

test("triagem mobile nao coleta nome de paciente", () => {
  assert.doesNotMatch(mobileScreeningSource, /patientName|Nome do paciente/i);
});

test("acoes administrativas nao fazem fallback para update direto em profiles", () => {
  assert.match(adminActionsSource, /supabase\.rpc\("admin_update_profile_/);
  assert.doesNotMatch(adminActionsSource, /\.from\("profiles"\)\s*\.update\(/s);
});
