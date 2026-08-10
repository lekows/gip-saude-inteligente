export type AccessDevice = "mobile" | "desktop";

export function detectAccessDevice(headers: Headers): AccessDevice {
  const clientHint = headers.get("sec-ch-ua-mobile");
  if (clientHint === "?1") return "mobile";
  if (clientHint === "?0") return "desktop";

  const userAgent = headers.get("user-agent") ?? "";
  const mobilePattern = /Android|iPhone|iPad|iPod|IEMobile|Mobile|Tablet|Silk/i;

  return mobilePattern.test(userAgent) ? "mobile" : "desktop";
}

export function getAuthenticatedHome(headers: Headers): "/mobile" | "/manager-dashboard" {
  return detectAccessDevice(headers) === "mobile" ? "/mobile" : "/manager-dashboard";
}
