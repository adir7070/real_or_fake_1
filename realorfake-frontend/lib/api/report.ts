import { apiRequestBlob } from "./client";
import type { ReportRequest } from "./types";

export async function downloadReport(req: ReportRequest): Promise<Blob> {
  return apiRequestBlob("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
}
