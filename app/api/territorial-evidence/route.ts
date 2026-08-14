import { NextResponse } from "next/server";
import { loadCensusSectorEvidence } from "@/lib/dataLoaders/susFileRepository";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(loadCensusSectorEvidence(), {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "X-GIP-Data-Classification":
        "official-aggregate-with-demonstrative-access-and-vulnerability-scores"
    }
  });
}
