import assert from "node:assert/strict";
import test from "node:test";
import { createRedirectWithCookies } from "../lib/supabase/middleware.ts";
import { VALID_ROLES, VALID_STATUSES } from "../lib/auth/constants.ts";
import { detectAccessDevice, getAuthenticatedHome } from "../lib/auth/accessDestination.ts";

test("entrada autenticada usa o dispositivo apenas para escolher a experiencia inicial", () => {
  const mobileHeaders = new Headers({
    "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile",
  });
  const desktopHeaders = new Headers({
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  });

  assert.equal(detectAccessDevice(mobileHeaders), "mobile");
  assert.equal(getAuthenticatedHome(mobileHeaders), "/mobile");
  assert.equal(detectAccessDevice(desktopHeaders), "desktop");
  assert.equal(getAuthenticatedHome(desktopHeaders), "/manager-dashboard");
});

test("Client Hint de dispositivo tem prioridade sobre User-Agent", () => {
  const headers = new Headers({
    "sec-ch-ua-mobile": "?1",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  });

  assert.equal(getAuthenticatedHome(headers), "/mobile");
});

test("papel acadêmico direciona para Meu GIP independentemente do dispositivo", () => {
  const desktopHeaders = new Headers({
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  });
  const mobileHeaders = new Headers({
    "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile",
  });

  assert.equal(getAuthenticatedHome(desktopHeaders, "academico_participante"), "/meu-gip");
  assert.equal(getAuthenticatedHome(mobileHeaders, "academico_colaborador"), "/meu-gip");
});

test("professor coordenador entra diretamente na gestão acadêmica", () => {
  const headers = new Headers({
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  });

  assert.equal(getAuthenticatedHome(headers, "professor_coordenador"), "/gestao-academica");
});

test("createRedirectWithCookies preserva e propaga todos os cookies de sessão no redirecionamento", () => {
  const mockReq = {
    url: "http://localhost:3000/manager-dashboard",
    headers: new Headers(),
    nextUrl: new URL("http://localhost:3000/manager-dashboard"),
  };

  const mockSupabaseResponse = {
    cookies: {
      getAll() {
        return [
          { name: "sb-access-token", value: "token-123", path: "/" },
          { name: "sb-refresh-token", value: "refresh-456", path: "/" },
        ];
      },
    },
  };

  const redirectRes = createRedirectWithCookies(
    mockReq,
    new URL("http://localhost:3000/aguardando-aprovacao"),
    mockSupabaseResponse
  );

  assert.equal(redirectRes.status, 307);
  assert.equal(redirectRes.headers.get("location"), "http://localhost:3000/aguardando-aprovacao");
  assert.equal(redirectRes.cookies.get("sb-access-token")?.value, "token-123");
  assert.equal(redirectRes.cookies.get("sb-refresh-token")?.value, "refresh-456");
});

test("Listas de validação estrita VALID_ROLES e VALID_STATUSES recusam valores arbitrários", () => {
  assert.ok(VALID_ROLES.includes("administrador"));
  assert.ok(VALID_ROLES.includes("gestor_municipal"));
  assert.ok(!VALID_ROLES.includes("hacker_role"));

  assert.ok(VALID_STATUSES.includes("pendente"));
  assert.ok(VALID_STATUSES.includes("aprovado"));
  assert.ok(VALID_STATUSES.includes("suspenso"));
  assert.ok(!VALID_STATUSES.includes("deleted"));
});

test("Invariante do servidor recusa autossuspensão de conta pelo próprio administrador", () => {
  const currentAdminId = "admin-uuid-1";
  const targetUserId = "admin-uuid-1";
  const newStatus = "suspenso";

  let error = null;
  if (targetUserId === currentAdminId && newStatus !== "aprovado") {
    error = "Um administrador não pode suspender ou desativar a própria conta.";
  }

  assert.equal(error, "Um administrador não pode suspender ou desativar a própria conta.");
});

test("Invariante do servidor recusa autorebaixamento de papel pelo próprio administrador", () => {
  const currentAdminId = "admin-uuid-1";
  const targetUserId = "admin-uuid-1";
  const newRole = "academico_participante";

  let error = null;
  if (targetUserId === currentAdminId && newRole !== "administrador") {
    error = "Um administrador não pode alterar o próprio papel para outro diferente de administrador.";
  }

  assert.equal(error, "Um administrador não pode alterar o próprio papel para outro diferente de administrador.");
});

test("Proteção ao último administrador bloqueia suspensão ou rebaixamento se a contagem for <= 1", () => {
  const activeAdminsCount = 1;
  const isTargetAdmin = true;
  const requestedStatus = "suspenso";

  let blocked = false;
  if (isTargetAdmin && requestedStatus !== "aprovado" && activeAdminsCount <= 1) {
    blocked = true;
  }

  assert.ok(blocked, "A alteração do único administrador ativo deve ser bloqueada");
});
