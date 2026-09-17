import { Card } from '@/src/components/ui/Card';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  Clock,
  Receipt,
  ChevronRight,
} from 'lucide-react';
import { MethodBadge, naira } from './methodbadge';



export function DashboardContent({
  data,
  termLabel,
  onClassClick,
}: {
  data: {
    totalCollected:  number;
    totalOutstanding: number;
    totalDue:        number;
    totalStudents:   number;
    clearedCount:    number;
    pendingCount:    number;
    recentPayments:  Array<{
      id:            string;
      receiptNumber: string;
      amount:        number;
      paymentDate:   string;
      paymentMethod: string;
      student:       { firstName: string; lastName: string; studentNumber: string };
      term:          { period: string };
    }>;
    classBreakdown: Array<{
      classId:     string;
      level:       string;
      collected:   number;
      outstanding: number;
      total:       number;
    }>;
  };
  termLabel:    string;
  onClassClick: (classId: string) => void;
}) {
    if(!data) {
        console.log("No dashboard data found");
        return null;
    }
  const collectionRate =
    data.totalDue > 0
      ? ((data.totalCollected / data.totalDue) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Collected',
            value: naira(data.totalCollected),
            sub:   `${collectionRate}% of total due`,
            icon:  <TrendingUp size={18} className="text-emerald-600" />,
            bg:    'bg-emerald-50',
            text:  'text-emerald-700',
          },
          {
            label: 'Outstanding',
            value: naira(data.totalOutstanding),
            sub:   `Across ${data.pendingCount} student(s)`,
            icon:  <TrendingDown size={18} className="text-red-500" />,
            bg:    'bg-red-50',
            text:  'text-red-700',
          },
          {
            label: 'Cleared',
            value: String(data.clearedCount),
            sub:   `of ${data.totalStudents} students`,
            icon:  <CheckCircle2 size={18} className="text-blue-600" />,
            bg:    'bg-blue-50',
            text:  'text-blue-700',
          },
          {
            label: 'Pending',
            value: String(data.pendingCount),
            sub:   'Have outstanding balance',
            icon:  <Clock size={18} className="text-amber-600" />,
            bg:    'bg-amber-50',
            text:  'text-amber-700',
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="flex items-start gap-4 p-4">
            <div
              className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}
            >
              {kpi.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className={`text-xl font-black mt-0.5 truncate ${kpi.text}`}>
                {kpi.value}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{kpi.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Collection progress bar */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">
            Collection Progress — {termLabel}
          </p>
          <span className="text-sm font-bold text-emerald-700">{collectionRate}%</span>
        </div>
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${Math.min(parseFloat(collectionRate), 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>
            Collected: <b className="text-gray-700">{naira(data.totalCollected)}</b>
          </span>
          <span>
            Outstanding: <b className="text-red-600">{naira(data.totalOutstanding)}</b>
          </span>
          <span>
            Total: <b className="text-gray-700">{naira(data.totalDue)}</b>
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class breakdown */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Users size={15} className="text-gray-400" />
            Class Breakdown
          </h2>
          {data.classBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No fee data yet.</p>
          ) : (
            <div className="space-y-4">
              {data.classBreakdown.map((cls) => {
                const pct =
                  cls.total > 0 ? (cls.collected / cls.total) * 100 : 0;
                return (
                  <button
                    key={cls.classId}
                    onClick={() => onClassClick(cls.classId)}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                        {cls.level}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {pct.toFixed(0)}%
                        </span>
                        <ChevronRight
                          size={13}
                          className="text-gray-300 group-hover:text-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 80
                            ? 'bg-emerald-500'
                            : pct >= 50
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[10px] text-gray-400">
                        {naira(cls.collected)} collected
                      </span>
                      <span className="text-[10px] text-red-400">
                        {naira(cls.outstanding)} outstanding
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent payments */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Receipt size={15} className="text-gray-400" />
            Recent Payments
          </h2>
          {data.recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No payments recorded yet.
            </p>
          ) : (
            <div className="space-y-0">
              {data.recentPayments.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-3 py-3 ${
                    i !== 0 ? 'border-t border-gray-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {p.student.firstName} {p.student.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <MethodBadge method={p.paymentMethod} />
                        <span className="text-[10px] text-gray-400">
                            {new Date(p.paymentDate).toLocaleDateString('en-NG', {
                            dateStyle: 'medium',
                            })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-700">
                      {naira(p.amount)}
                    </p>
                    <p className="text-[10px] text-gray-400">{p.receiptNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}