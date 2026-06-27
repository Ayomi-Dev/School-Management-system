export function KpiBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}