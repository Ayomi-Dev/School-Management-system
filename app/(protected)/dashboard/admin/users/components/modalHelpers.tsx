'use client';

import { useFieldArray, Controller } from 'react-hook-form';
import * as Select from '@radix-ui/react-select';
import { Input } from '@/src/components/ui/Input';
import { X, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Gender, ClassLevel } from '@/app/generated/prisma/enums';

/* ─────────────────────────────────────────────────────────
   Transform Enum into usable-derived options
───────────────────────────────────────────────────────── */

const GENDER_OPTIONS = Object.values(Gender).map((v) => ({
  value: v,
  label: v.charAt(0) + v.slice(1).toLowerCase(),
}));

const CLASS_LEVEL_OPTIONS = Object.values(ClassLevel).map((v) => ({
  value: v,
  label: v,
}));

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

export type Role = 'STUDENT' | 'TEACHER' | 'PARENT' | 'BURSAR';

export interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/* ─────────────────────────────────────────────────────────
   Role config — label + step count
───────────────────────────────────────────────────────── */

export const ROLE_CONFIG: Record<Role, { label: string; steps: number }> = {
  STUDENT: { label: 'Student',  steps: 3 },
  TEACHER: { label: 'Teacher',  steps: 3 },
  PARENT:  { label: 'Parent',   steps: 2 },
  BURSAR:  { label: 'Bursar',   steps: 2 },
};

const ROLES: Role[] = ['STUDENT', 'TEACHER', 'PARENT', 'BURSAR'];

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Step indicator
───────────────────────────────────────────────────────── */

export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            i < current ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Radix Select wrapper
───────────────────────────────────────────────────────── */

export function RadixSelect({
  value,
  onValueChange,
  placeholder,
  options,
  error,
}: {
  value?: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  error?: string;
}) {
  console.log("Rendering RadixSelect with value:", value);
  return (
    <div>
      <Select.Root value={value} onValueChange={onValueChange}>
        <Select.Trigger
          className={`
            flex w-full items-center justify-between
            px-3 py-2 text-sm rounded-lg border
            bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error ? 'border-red-400' : 'border-gray-300'}
            ${!value ? 'text-gray-400' : 'text-gray-900'}
          `}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon>
            <ChevronDown size={16} className="text-gray-400" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="z-200 overflow-hidden bg-white rounded-lg border border-gray-200 shadow-lg"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {options.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  className="
                    flex items-center px-3 py-2 text-sm rounded-md cursor-pointer
                    text-gray-800 select-none
                    data-highlighted:bg-blue-50 data-highlighted:text-blue-700
                    data-[state=checked]:font-medium
                    focus:outline-none
                  "
                >
                  <Select.ItemText>{opt.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <FieldError message={error} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Role selector card grid (Step 1 for all roles)
───────────────────────────────────────────────────────── */

export function RoleSelector({
  value,
  onChange,
}: {
  value: Role | undefined;
  onChange: (role: Role) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ROLES.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => onChange(role)}
          className={`
            py-3 px-2 rounded-lg border text-sm font-medium transition-all duration-150
            ${
              value === role
                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          {ROLE_CONFIG[role].label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Step content per role
───────────────────────────────────────────────────────── */

// Step 1 is always role selection — rendered outside this component.
// stepIndex here is 2-based (step 2, 3).

export function StudentStep2({ register, errors, control }: any) {
  return (
    <>
      <SectionDivider label="Academic info" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Gender</FieldLabel>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <RadixSelect
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Select gender"
                options={GENDER_OPTIONS}
                error={errors.gender?.message}
              />
            )}
          />
        </div>

        <div>
          <FieldLabel required>Class level</FieldLabel>
          <Controller
            name="level"
            control={control}
            render={({ field }) => (
              <RadixSelect
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Select level"
                options={CLASS_LEVEL_OPTIONS}
                error={errors.level?.message}
              />
            )}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Date of birth</FieldLabel>
        <Input
          {...register('dateOfBirth')}
          type="date"
          error={errors.dateOfBirth?.message}
        />
      </div>

      <div>
        <FieldLabel>State of origin</FieldLabel>
        <Input
          {...register('stateOfOrigin')}
          placeholder="e.g. Lagos"
          error={errors.stateOfOrigin?.message}
        />
      </div>
    </>
  );
}

export function StudentStep3({ register, errors }: any) {
  return (
    <>
      <SectionDivider label="Additional info" />

      <div>
        <FieldLabel>Middle name</FieldLabel>
        <Input
          {...register('middleName')}
          placeholder="Optional"
          error={errors.middleName?.message}
        />
      </div>

      <div>
        <FieldLabel>Previous school</FieldLabel>
        <Input
          {...register('previousSchool')}
          placeholder="Optional"
          error={errors.previousSchool?.message}
        />
      </div>

      <div>
        <FieldLabel>Medical notes</FieldLabel>
        <textarea
          {...register('medicalNotes')}
          rows={3}
          placeholder="Any relevant medical information…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-400"
        />
        <FieldError message={errors.medicalNotes?.message} />
      </div>
    </>
  );
}

export function TeacherStep2({ register, errors, control }: any) {
  const { fields, append, remove } = useFieldArray({ control, name: 'subjects' });

  return (
    <>
      <SectionDivider label="Employment info" />

      <div>
        <FieldLabel>Department</FieldLabel>
        <Input
          {...register('department')}
          placeholder="e.g. Sciences"
          error={errors.department?.message}
        />
      </div>

      <div>
        <FieldLabel>Joining date</FieldLabel>
        <Input
          {...register('joiningDate')}
          type="date"
          error={errors.joiningDate?.message}
        />
      </div>

      <div>
        <FieldLabel>Qualification</FieldLabel>
        <Input
          {...register('qualification')}
          placeholder="e.g. B.Ed Mathematics"
          error={errors.qualification?.message}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel>Subjects</FieldLabel>
          <button
            type="button"
            onClick={() => append('')}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus size={13} />
            Add subject
          </button>
        </div>

        <div className="space-y-2">
          {fields.length === 0 && (
            <p className="text-xs text-gray-400 py-2 text-center border border-dashed border-gray-200 rounded-lg">
              No subjects added yet
            </p>
          )}
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-center">
              <Input
                {...register(`subjects.${index}`)}
                placeholder={`Subject ${index + 1}`}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function ParentStep2({ errors, control }: any) {
  return (
    <>
      <SectionDivider label="Guardian info" />

      <div>
        <FieldLabel>Relationship to student</FieldLabel>
        <Controller
          name="relationship"
          control={control}
          render={({ field }) => (
            <RadixSelect
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Select relationship"
              options={[
                { value: 'FATHER',   label: 'Father'   },
                { value: 'MOTHER',   label: 'Mother'   },
                { value: 'GUARDIAN', label: 'Guardian' },
                { value: 'SIBLING',  label: 'Sibling'  },
                { value: 'OTHER',    label: 'Other'    },
              ]}
              error={errors.relationship?.message}
            />
          )}
        />
      </div>

      <p className="text-xs text-gray-400 mt-1">
        Students can be linked to this guardian after account creation.
      </p>
    </>
  );
}