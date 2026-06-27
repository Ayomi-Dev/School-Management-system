export function ActionCard({
  icon,
  title,
  description,
  onClick,
  loading,
  variant,
  disabled,
  disabledLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  loading: boolean;
  variant: 'success' | 'danger' | 'warning' | 'info';
  disabled?: boolean;
  disabledLabel?: string;
}) {
  const bg: Record<string, string> = {
    success: 'hover:border-green-300 hover:bg-green-50',
    danger: 'hover:border-red-300 hover:bg-red-50',
    warning: 'hover:border-yellow-300 hover:bg-yellow-50',
    info: 'hover:border-blue-300 hover:bg-blue-50',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full text-left p-4 rounded-xl border border-gray-200 transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : bg[variant]
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {loading ? 'Please wait...' : disabled ? (disabledLabel ?? title) : title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
}