'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useUserById,
  useUpdateUserStatusMutation,
  useAdminPublishReportCardMutation,
  useStudentAcademicSummary,
} from '@/src/hooks/queries/useAdmin';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Loader } from '@/src/components/ui/Loader';
import {
  ArrowLeft, User, Mail, Phone, Calendar,
  BookOpen, BarChart2, CheckCircle2, XCircle,
  Clock, FileText, Send, AlertCircle,
  GraduationCap, Users, ChevronDown,
} from 'lucide-react';
import { UserStatus } from '@/src/types/admin';
import { StatusBadge } from '../../components/statusBadge';
import { InfoRow } from '../../components/infoRow';
import { ActionCard } from '../../components/actionGrade';
import { TermSelector } from '../../components/termSelector';
import { KpiBox } from '../../components/kpiBox';
import { GradeChip } from '../../components/gradeChip';
import { ReportCard, ScoreRecord } from '@/src/types';
import { useAuthStore } from '@/src/stores/authStore';



export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const schoolId = useAuthStore((state) => state.user?.schoolId ?? '' )
  const router     = useRouter();

  const [summaryEnabled, setSummaryEnabled] = useState(false);
  // termId for the summary query — undefined means all-time
  const [summaryTermId, setSummaryTermId]   = useState<string | undefined>(undefined);
  // termId for the score-table filter — client-side only, no refetch
  const [scoreTermId, setScoreTermId]       = useState<string | undefined>(undefined);

  const { data: userData, isLoading: userLoading, isError: userError } = useUserById(id);
  const user = userData?.data
  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER';

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useStudentAcademicSummary(id, schoolId, summaryTermId);

  const statusMutation  = useUpdateUserStatusMutation(id);
  const publishMutation = useAdminPublishReportCardMutation(id);

  // Scores filtered to the currently-selected term (client-side, instant)
  const visibleScores = useMemo(() => {
    if (!summary) return [];
    if (!scoreTermId) return summary?.data?.scores;
    return summary?.data?.scores?.filter((s) => s.termId === scoreTermId);
  }, [summary, scoreTermId]);

  // The report card matching the current term filter (if any)
  const matchingReportCard: ReportCard | undefined = useMemo(() => {
    if (!summary) return undefined;
    if (!scoreTermId) return undefined; // show publish action only when a term is selected
    return summary?.data?.reportCards.find((rc) => rc.termId === scoreTermId);
  }, [summary, scoreTermId]);

  // Derived KPIs for the visible score set
  const avgScore = useMemo(() => {
    const scored = visibleScores?.filter((s) => s.totalScore !== null);
    if (!scored?.length) return null;
    return (scored?.reduce((acc, s) => acc + (s.totalScore ?? 0), 0) / scored?.length).toFixed(1);
  }, [visibleScores]);

  const handleFetchSummary = () => {
    if (!summaryEnabled) { setSummaryEnabled(true); }
    else { refetchSummary(); }
  };

  // ── Loading / error states 

  if (userLoading) return <div className="flex items-center justify-center h-96"><Loader /></div>;

  if (userError || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-gray-600">Could not load user profile.</p>
        <Button variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const nextStatus: Record<UserStatus, UserStatus> = {
    ACTIVE: 'INACTIVE', INACTIVE: 'ACTIVE', PENDING: 'ACTIVE',
  };
  const statusActionLabel: Record<UserStatus, string> = {
    ACTIVE: 'Deactivate Account', INACTIVE: 'Activate Account', PENDING: 'Approve Account',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Back ── */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={16} />Back to Users
      </button>

      {/* ── Profile header ── */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
              <StatusBadge status={user.status} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Mail size={13} />{user.email}</span>
              {user.phone && <span className="flex items-center gap-1.5"><Phone size={13} />{user.phone}</span>}
              <span className="flex items-center gap-1.5">
                <User size={13} />
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {user?.role.charAt(0) + user?.role.slice(1).toLowerCase()}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                Joined {new Date(user.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <Button
              variant={user.status === 'ACTIVE' ? 'outline' : 'primary'}
              size="sm"
              className={user.status === 'ACTIVE' ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}
              onClick={() => statusMutation.mutate(nextStatus[user.status])}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? 'Updating…' : statusActionLabel[user.status]}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Left column: profile details ── */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Profile Details</h2>
            <InfoRow label="First Name"  value={user.firstName} />
            <InfoRow label="Last Name"   value={user.lastName} />
            <InfoRow label="Email"       value={user.email} />
            <InfoRow label="Phone"       value={user.phone} />
            <InfoRow label="Role"        value={user.role.charAt(0) + user.role.slice(1).toLowerCase()} />
            <InfoRow label="Status"      value={<StatusBadge status={user.status} />} />
          </Card>

          {isStudent && user.studentProfile && (
            <Card>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <GraduationCap size={15} />Student Info
              </h2>
              <InfoRow label="Admission No."  value={user.studentProfile.studentNumber} />
              <InfoRow
                label="Date of Birth"
                value={user.studentProfile.dateOfBirth
                  ? new Date(user.studentProfile.dateOfBirth).toLocaleDateString('en-NG', { dateStyle: 'medium' })
                  : undefined}
              />
              <InfoRow label="Current Class"  value={user.studentProfile.level} />
            </Card>
          )}

          {isTeacher && user.teacherProfile && (
            <Card>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Users size={15} />Teacher Info
              </h2>
              <InfoRow label="Staff ID"       value={user.teacherProfile.staffId} />
              <InfoRow label="Qualification"  value={user.teacherProfile.qualification} />
              <InfoRow label="Class Assigned" value={user.teacherProfile.classAssignment?.class.level} />
            </Card>
          )}

          {/* Enrollment history (student only, shown after summary loads) */}
          {isStudent && summary?.data?.enrollments && summary?.data?.enrollments.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Enrollment History</h2>
              <div className="space-y-2">
                {summary?.data.enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700">{e.class.level}</span>
                    <span className="text-xs text-gray-400">{e.academicYear.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── Right column: actions + academic summary ── */}
        <div className="space-y-6 md:col-span-2">

          {/* Actions */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user.status !== 'ACTIVE' && (
                <ActionCard
                  icon={<CheckCircle2 size={18} className="text-green-600" />}
                  title="Activate Account"
                  description="Grant this user full system access"
                  onClick={() => statusMutation.mutate('ACTIVE')}
                  loading={statusMutation.isPending}
                  variant="success"
                />
              )}
              {user.status !== 'INACTIVE' && (
                <ActionCard
                  icon={<XCircle size={18} className="text-red-500" />}
                  title="Deactivate Account"
                  description="Block login — e.g. unpaid school fees"
                  onClick={() => statusMutation.mutate('INACTIVE')}
                  loading={statusMutation.isPending}
                  variant="danger"
                />
              )}
              {user.status !== 'PENDING' && (
                <ActionCard
                  icon={<Clock size={18} className="text-yellow-600" />}
                  title="Set to Pending"
                  description="Flag account for review or revalidation"
                  onClick={() => statusMutation.mutate('PENDING')}
                  loading={statusMutation.isPending}
                  variant="warning"
                />
              )}

              {isStudent && (
                <ActionCard
                  icon={<BarChart2 size={18} className="text-blue-600" />}
                  title="Fetch Academic Summary"
                  description="Load scores, attendance & report cards"
                  onClick={handleFetchSummary}
                  loading={summaryLoading}
                  variant="info"
                />
              )}

              {isTeacher && (
                <ActionCard
                  icon={<BookOpen size={18} className="text-purple-600" />}
                  title="View Assigned Class"
                  description="Go to this teacher's class details"
                  onClick={() => {
                    const classId = user.teacherProfile?.classAssignment?.class.id;
                    if (classId) router.push(`/admin/classes/${classId}`);
                  }}
                  loading={false}
                  variant="info"
                  disabled={!user.teacherProfile?.classAssignment}
                  disabledLabel="No class assigned"
                />
              )}
            </div>
          </Card>

          {/* Academic Summary panel */}
          {isStudent && summaryEnabled && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <FileText size={15} />Academic Summary
                </h2>
                {/* {summary && (
                  <TermSelector
                    scores={summary?.data?.scores}
                    selectedTermId={scoreTermId}
                    onChange={setScoreTermId}
                  />
                )} */}
              </div>

              {summaryLoading ? (
                <div className="flex items-center justify-center h-32"><Loader /></div>
              ) : summary ? (
                <div className="space-y-6">
                  {/* ── KPI strip ── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KpiBox
                      label="Avg Score"
                      value={avgScore !== null ? `${avgScore}%` : '—'}
                      color="text-blue-600"
                    />
                    <KpiBox
                      label="Subjects"
                      value={String(visibleScores?.length)}
                      color="text-gray-800"
                    />
                    <KpiBox
                      label="Attendance"
                      value={`${summary?.data?.attendance?.rate}%`}
                      sub={`${summary?.data?.attendance?.present + summary?.data?.attendance?.late}/${summary?.data?.attendance?.total} sessions`}
                      color={summary?.data?.attendance?.rate >= 75 ? 'text-green-600' : 'text-red-600'}
                    />
                    <KpiBox
                      label="Absences"
                      value={String(summary?.data?.attendance?.absent)}
                      color={summary?.data?.attendance?.absent > 5 ? 'text-red-600' : 'text-gray-700'}
                    />
                  </div>

                  {/* ── Score table ── */}
                  {visibleScores?.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left">
                            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Term</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">CA</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Exam</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Total</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Grade</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Published</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {visibleScores?.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {row.subject.name}
                                {row.subject.code && <span className="ml-1 text-xs text-gray-400">({row.subject.code})</span>}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                {row.term.period} · {row.term.academicYear.label}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600">{row.caScore   ?? '—'}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{row.examScore ?? '—'}</td>
                              <td className="px-4 py-3 text-center font-semibold text-gray-800">{row.totalScore ?? '—'}</td>
                              <td className="px-4 py-3 text-center">
                                {row.grade ? <GradeChip grade={row.grade} /> : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {row.isPublished
                                  ? <CheckCircle2 size={14} className="text-green-500 mx-auto" />
                                  : <Clock size={14} className="text-gray-300 mx-auto" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">No scores for this term.</p>
                  )}

                  {/* ── Report cards ── */}
                  {summary?.data?.reportCards?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Report Cards</h3>
                      <div className="space-y-2">
                        {summary?.data?.reportCards
                          .filter((rc) => !scoreTermId || rc.termId === scoreTermId)
                          .map((rc) => (
                            <div
                              key={rc.id}
                              className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-200"
                            >
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {rc.term.period} — {rc.academicYear.label}
                                </p>
                                <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                                  {rc.average !== null && <span>Avg: {rc.average}%</span>}
                                  {rc.position !== null && <span>Position: {rc.position}</span>}
                                  {rc.totalScore !== null && <span>Total: {rc.totalScore}</span>}
                                </div>
                                {rc.teacherRemark && (
                                  <p className="text-xs text-gray-400 mt-1 italic">"{rc.teacherRemark}"</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {rc.status === 'PUBLISHED' ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full">
                                    <CheckCircle2 size={11} />
                                    Published {rc.publishedAt
                                      ? new Date(rc.publishedAt).toLocaleDateString('en-NG', { dateStyle: 'short' })
                                      : ''}
                                  </span>
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex items-center gap-1.5"
                                    onClick={() => publishMutation.mutate(rc.id)}
                                    disabled={publishMutation.isPending}
                                  >
                                    <Send size={13} />
                                    {publishMutation.isPending ? 'Publishing…' : 'Publish'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No academic data? available.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
