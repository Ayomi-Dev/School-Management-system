export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
        METHOD_COLORS[method] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {method.replace('_', ' ')}
    </span>
  );
}

const METHOD_COLORS: Record<string, string> = {
  CASH:          'bg-emerald-100 text-emerald-700',
  BANK_TRANSFER: 'bg-blue-100    text-blue-700',
  CARD:          'bg-violet-100  text-violet-700',
  CHEQUE:        'bg-amber-100   text-amber-700',
  ONLINE:        'bg-cyan-100    text-cyan-700',
};


export function naira(n: number) {
  return `₦${n.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const selectClass =
  'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white';
