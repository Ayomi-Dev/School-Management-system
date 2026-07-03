export const  attendanceColor = (rate: number) => {
  if (rate >= 90) return { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700' };
  if (rate >= 75) return { bar: 'bg-blue-500',    text: 'text-blue-700',    badge: 'bg-blue-50 text-blue-700'    };
  if (rate >= 60) return { bar: 'bg-amber-500',   text: 'text-amber-700',   badge: 'bg-amber-50 text-amber-700'  };
  return              { bar: 'bg-red-500',     text: 'text-red-700',     badge: 'bg-red-50 text-red-700'      };
}