export function GradeChip({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A1: 'bg-emerald-100 text-emerald-800',
    B2: 'bg-green-100 text-green-800',
    B3: 'bg-lime-100 text-lime-800',
    C4: 'bg-yellow-100 text-yellow-800',
    C5: 'bg-amber-100 text-amber-800',
    C6: 'bg-orange-100 text-orange-800',
    D7: 'bg-red-100 text-red-700',
    E8: 'bg-red-100 text-red-800',
    F9: 'bg-red-200 text-red-900',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[grade] ?? 'bg-gray-100 text-gray-700'}`}>
      {grade}
    </span>
  );
}