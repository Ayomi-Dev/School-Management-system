'use client';

import { useState, useMemo } from 'react';
import { useParentsList, useLinkStudentToParentMutation } from '@/src/hooks/queries/useAdmin';
import type { ParentListItem } from '@/src/types/admin';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Loader } from '@/src/components/ui/Loader';
import { X, Search, UserCheck, AlertCircle, Phone, Users } from 'lucide-react';

interface Props {
  studentUserId: string;
  studentName:   string;
  onClose:       () => void;
}

export default function LinkParentModal({ studentUserId, studentName, onClose }: Props) {
  const [search, setSearch]           = useState('');
  const [selectedId, setSelectedId]   = useState<string | null>(null);

  // Only fetch when modal is mounted — the enabled flag is always true here
  // since the modal doesn't render until the admin clicks the action.
  const { data: parents = [], isLoading, isError } = useParentsList(true);
  const linkMutation = useLinkStudentToParentMutation(studentUserId);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return parents.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone ?? '').includes(q),
    );
  }, [parents, search]);

  const selectedParent = parents.find((p) => p.id === selectedId) ?? null;

  const handleConfirm = () => {
    if (!selectedId) return;
    linkMutation.mutate(selectedId, {
      onSuccess: () => onClose(),
    });
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Link Parent</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select a parent to link to <span className="font-medium text-gray-700">{studentName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* Parent list */}
        <div className="overflow-y-auto flex-1 p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-red-500">
              <AlertCircle size={24} />
              <p className="text-sm">Failed to load parents list.</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              {search ? 'No parents match your search.' : 'No parents found in this school.'}
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((parent) => (
                <ParentRow
                  key={parent.id}
                  parent={parent}
                  isSelected={selectedId === parent.id}
                  onSelect={() =>
                    setSelectedId((prev) => (prev === parent.id ? null : parent.id))
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Selected preview + confirm */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {selectedParent && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3">
              <UserCheck size={16} className="text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 truncate">
                  {selectedParent.firstName} {selectedParent.lastName}
                </p>
                <p className="text-xs text-blue-600 truncate">{selectedParent.email}</p>
              </div>
              {selectedParent.linkedCount > 0 && (
                <span className="text-xs text-blue-500 shrink-0">
                  {selectedParent.linkedCount} student{selectedParent.linkedCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={linkMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleConfirm}
              disabled={!selectedId || linkMutation.isPending}
            >
              {linkMutation.isPending ? 'Linking…' : 'Confirm Link'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Row sub-component ────────────────────────────────────────────────────────

function ParentRow({
  parent,
  isSelected,
  onSelect,
}: {
  parent: ParentListItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
        isSelected
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {parent.firstName[0]}{parent.lastName[0]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
          {parent.firstName} {parent.lastName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 truncate">{parent.email}</span>
          {parent.phone && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5 shrink-0">
              <Phone size={10} />{parent.phone}
            </span>
          )}
        </div>
      </div>

      {/* Guardian context */}
      <div className="shrink-0 text-right">
        {parent.linkedCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <Users size={10} />
            {parent.linkedCount} linked
          </span>
        ) : (
          <span className="text-[10px] text-gray-300">No links yet</span>
        )}
      </div>
    </button>
  );
}
