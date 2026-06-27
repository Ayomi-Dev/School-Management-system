import { CheckCircle2, Clock, XCircle } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
    ACTIVE: { icon: <CheckCircle2 size={13} />, className: 'bg-green-100 text-green-800', label: 'Active' },
    INACTIVE: { icon: <XCircle size={13} />, className: 'bg-gray-100 text-gray-600', label: 'Inactive' },
    PENDING: { icon: <Clock size={13} />, className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  };
  const cfg = map[status] ?? map.INACTIVE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}