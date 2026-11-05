import { randomBytes } from "node:crypto";
import { processContext } from "@/lib/processes/server";
import { isProcessUuid } from "@/lib/processes/rules";
import { PROCESS_GRAPH_HTML } from "@/lib/processes/graph-template";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin", "X-Frame-Options": "SAMEORIGIN" };
  if (!isProcessUuid(id)) return new Response("Mapa indisponível.", { status: 404, headers });
  try {
    const { supabase } = await processContext();
    const { data, error } = await supabase.from("process_maps").select("content").eq("id", id).maybeSingle();
    if (error || !data) return new Response("Mapa indisponível para esta conta.", { status: 404, headers });
    const nonce = randomBytes(24).toString("base64");
    const payload = JSON.stringify(data.content).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    const html = PROCESS_GRAPH_HTML.replaceAll("__PROCESS_NONCE__", nonce).replace("__PROCESS_CONTENT__", () => payload);
    return new Response(html, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; connect-src 'none'` } });
  } catch { return new Response("Entre novamente na sua conta para consultar o mapa.", { status: 401, headers }); }
}
