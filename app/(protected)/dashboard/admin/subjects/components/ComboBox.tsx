"use client"
import { useTeachersList } from "@/src/hooks/queries/useAdmin";
import { useDebounce } from "@/src/hooks/useUtils";
import { SelectedTeacher, TeacherComboboxProps } from "@/app/(protected)/dashboard/teacher/components/teacher";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TeacherListItem } from "@/src/types";

export function TeacherCombobox({
  value,
  onChange,
  placeholder = 'Search teacher by name or employee number...',
}: TeacherComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: teachersData, isLoading, isFetching } = useTeachersList({
    search: debouncedQuery || undefined, 
    limit: 20,
  });
  const teachers = teachersData?.data.data ?? [];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (teacher: SelectedTeacher) => {
    onChange(teacher);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger / search input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={isOpen ? query : value ? `${value.firstName} ${value.lastName}` : ''}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <ChevronDown
          size={16}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Selected teacher chip (shown when closed and a value exists) */}
      {value && !isOpen && (
        <p className="mt-1.5 text-xs text-gray-500">
          {value.firstName} {value.lastName} ({value.employeeNumber})
        </p>
      )}

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              Loading teachers...
            </div>
          ) : teachers.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-400">
              {debouncedQuery ? `No teachers match "${debouncedQuery}"` : 'No teachers found'}
            </div>
          ) : (
            <ul>
              {teachers.map((teacher) => {
                const isSelected = value?.id === teacher.id;
                return (
                  <li key={teacher.id}>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelect({
                          id: teacher.id,
                          employeeNumber: teacher.employeeNumber,
                          firstName: teacher.firstName,
                          lastName: teacher.lastName,
                        })
                    
                      }
                      disabled={teacher.classAssignment && teacher.classAssignment.isClassTeacher}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                        }
                        ${teacher.classAssignment && teacher.classAssignment.isClassTeacher
                          ? 'opacity-50 cursor-not-allowed'
                          : ''}`
                        }
                    >
                      <span>
                        <span className="font-medium">
                          {teacher.firstName} {teacher.lastName}
                        </span>
                        <span className="text-gray-400 ml-2 text-xs">
                          {teacher.employeeNumber}
                        </span>
                      </span>
                      {isSelected && <Check size={15} className="text-blue-600 shrink-0" />}
                    </button>
                  </li>
                );
              })}
              {isFetching && !isLoading && (
                <li className="px-3 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
                  Updating...
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}