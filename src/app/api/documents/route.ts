// GET /api/documents — List documents across all clients (from shared SharePoint sync)
// PRD IN6: "Document Storage: Microsoft OneDrive"

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { listDocuments, getDocumentStats } from "@/lib/db/queries/documents";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      const params = request.nextUrl.searchParams;
      const clientId = params.get("clientId") ?? undefined;
      const search = params.get("search") ?? undefined;
      const fileType = params.get("fileType") ?? undefined;

      const [documents, stats] = await Promise.all([
        listDocuments({ clientId, search, fileType }),
        getDocumentStats(),
      ]);

      return successResponse({ documents, stats });
    } catch (err) {
      console.error("[documents] failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
