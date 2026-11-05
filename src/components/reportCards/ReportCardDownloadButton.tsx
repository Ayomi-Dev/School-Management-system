import { Download } from "lucide-react";
import { API_ENDPOINTS } from "@/src/config/constants";

export function ReportCardDownloadButton({
  reportCardId,
  compact = false,
  className = "",
}: {
  reportCardId: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <a
      href={API_ENDPOINTS.DOWNLOAD_REPORT_CARD(reportCardId)}
      download
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white font-medium text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 ${compact ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"} ${className}`}
      aria-label="Download report card as PDF"
    >
      <Download size={compact ? 14 : 16} />
      {compact ? "PDF" : "Download PDF"}
    </a>
  );
}
