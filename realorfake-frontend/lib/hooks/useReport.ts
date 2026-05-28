"use client";
import { useMutation } from "@tanstack/react-query";
import { downloadReport } from "@/lib/api/report";
import { saveAs } from "file-saver";
import type { ReportRequest } from "@/lib/api/types";

export function useReport() {
  return useMutation({
    mutationFn: async (req: ReportRequest) => {
      const blob = await downloadReport(req);
      saveAs(blob, "realorfake-report.pdf");
      return blob;
    },
  });
}
