"use client"

import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Loader } from "@/src/components/ui/Loader";
import { useCurrentTerm } from "@/src/hooks/queries/useAcademic";
import { useClassesList } from "@/src/hooks/queries/useClasses";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Clock, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { naira } from "../components/methodbadge";
import { useStudentList } from "@/src/hooks/queries/useStudent";
const selectCls =
  'appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm';

export default function StudentsPage() {
  const router = useRouter();
 
  // ── All hooks unconditionally at the top ──────────────────────────────────
  const {
    isLoading: termsLoading,
    terms,
    currentTerm,
    termId: defaultTermId,
  } = useCurrentTerm();
 
  const { data: classes = [], isLoading: classesLoading } = useClassesList();
 
  const [selectedTermId,  setSelectedTermId]  = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState<'ALL' | 'CLEARED' | 'PENDING'>('ALL');
 
  const activeTermId  = selectedTermId  || defaultTermId;
  const activeClassId = selectedClassId; // empty = all classes
 
  const { data: students = [], isLoading: studentsLoading, isError } =
   useStudentList();
   console.log(students)
 
  // ── Client-side filters ───────────────────────────────────────────────────
 
  // const clearedCount = students?.filter((s) => s.isCleared).length;
  // const pendingCount = students.length - clearedCount;
 
  // ── Guards — after all hooks ──────────────────────────────────────────────
  if (termsLoading || classesLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <Loader />
      </div>
    );
  }
 
  if (terms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-3">
        <AlertCircle size={30} className="text-amber-400" />
        <p className="text-sm text-gray-500">No terms found. Create a term first.</p>
      </div>
    );
  }
 
  const activeTerm = terms.find((t) => t.id === activeTermId) ?? currentTerm;
 
  return (
    <div className="space-y-5">
      <p>students page</p>
    </div>
  );
}