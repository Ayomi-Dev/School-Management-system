'use client';

import { useState } from 'react';
import { useForm, Controller, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as Popover from '@radix-ui/react-popover';
import { useCreateUserMutation } from '@/src/hooks/queries/useAdmin';
import { useSubjectsList } from '@/src/hooks/queries/useAdmin';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { X, ChevronDown, ChevronLeft, Check } from 'lucide-react';
import {
  adminCreateUserSchema,
  CreateUserFormData,
} from '@/src/validators/adminSchema';
import { Gender, ClassLevel } from '@/app/generated/prisma/enums';

/* ─────────────────────────────────────────────────────────
   Enum-derived options
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

type Role = 'STUDENT' | 'TEACHER' | 'PARENT' | 'BURSAR';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/* ─────────────────────────────────────────────────────────
   Role config — label + step count
───────────────────────────────────────────────────────── */

const ROLE_CONFIG: Record<Role, { label: string; steps: number }> = {
  STUDENT: { label: 'Student',  steps: 3 },
  TEACHER: { label: 'Teacher',  steps: 3 },
  PARENT:  { label: 'Parent',   steps: 2 },
  BURSAR:  { label: 'Bursar',   steps: 2 },
};

const ROLES: Role[] = ['STUDENT', 'TEACHER', 'PARENT', 'BURSAR'];

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function SectionDivider({ label }: { label: string }) {
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

function StepIndicator({ current, total }: { current: number; total: number }) {
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

function RadixSelect({
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
                    data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700
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

function RoleSelector({
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

function StudentStep2({ register, errors, control }: any) {
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

function StudentStep3({ register, errors }: any) {
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

function TeacherStep2({ register, errors, control }: any) {
  return (
    <>
      <SectionDivider label="Employment info" />

      <div>
        <FieldLabel>Department</FieldLabel>
        <Input
          {...register('department', { setValueAs: (v: any) => v === '' ? undefined : v })}
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

    </>
  );
}

function ParentStep2({ errors, control }: any) {
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

/* ─────────────────────────────────────────────────────────
   Main modal
───────────────────────────────────────────────────────── */

export default function CreateUserModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserModalProps) {
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createUserMutation = useCreateUserMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(adminCreateUserSchema),
  });

  const selectedRole = watch('role') as Role | undefined;
  const totalSteps = selectedRole ? ROLE_CONFIG[selectedRole].steps : 2;

  const handleClose = () => {
    reset();
    setStep(1);
    setSubmitError(null);
    onOpenChange(false);
  };

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setSubmitError(null);
      await createUserMutation.mutateAsync(data);
      handleClose();
      onSuccess();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? err?.message ?? 'Failed to create user. Please try again.');
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      const valid = await trigger(['firstName', 'lastName', 'email', 'role']);
      if (!valid) return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  /* ── Step 1: base fields + role selector ── */
  const renderStep1 = () => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>First name</FieldLabel>
          <Input
            {...register('firstName')}
            placeholder="John"
            error={errors.firstName?.message}
          />
        </div>
        <div>
          <FieldLabel required>Last name</FieldLabel>
          <Input
            {...register('lastName')}
            placeholder="Doe"
            error={errors.lastName?.message}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Email</FieldLabel>
        <Input
          {...register('email')}
          type="email"
          placeholder="john@school.com"
          error={errors.email?.message}
        />
      </div>

      <div>
        <FieldLabel required={selectedRole === 'PARENT'}>
          Phone {selectedRole === 'PARENT' && <span className="text-xs text-gray-400 font-normal">(required for parents)</span>}
        </FieldLabel>
        <Input
          {...register('phone')}
          placeholder="+234 800 000 0000"
          error={errors.phone?.message}
        />
      </div>

      <SectionDivider label="Role" />

      <div>
        <RoleSelector
          value={selectedRole}
          onChange={(role) => {
            setValue('role', role);
            // reset role-specific fields when switching
          }}
        />
        {errors.role && <FieldError message={errors.role.message} />}
      </div>
    </>
  );

  /* ── Step 2+ per role ── */
  const renderRoleStep = () => {
    if (!selectedRole) return null;

    if (step === 2) {
      if (selectedRole === 'STUDENT') return <StudentStep2 register={register} errors={errors} control={control} />;
      if (selectedRole === 'TEACHER') return <TeacherStep2 register={register} errors={errors} control={control} />;
      if (selectedRole === 'PARENT')  return <ParentStep2  errors={errors} control={control} />;
      // BURSAR / ADMIN — no extra fields
      return (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">No additional information required for this role.</p>
          <p className="text-xs text-gray-400 mt-1">Review and submit to create the account.</p>
        </div>
      );
    }

    if (step === 3) {
      if (selectedRole === 'STUDENT') return <StudentStep3 register={register} errors={errors} />;
      if (selectedRole === 'TEACHER') return null; // teacher only has 3 steps but step 3 is submit
    }

    return null;
  };

  const isLastStep = step === totalSteps;

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="
            fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
            w-full max-w-md max-h-[90vh] overflow-y-auto
            bg-white rounded-xl shadow-xl border border-gray-100
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
            data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2
            data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]
            duration-200
          "
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 -ml-1"
                  type="button"
                >
                  <ChevronLeft size={17} />
                </button>
              )}
              <Dialog.Title className="text-base font-semibold text-gray-900">
                {step === 1
                  ? 'Add new user'
                  : selectedRole
                  ? `${ROLE_CONFIG[selectedRole].label} — step ${step} of ${totalSteps}`
                  : 'Add new user'}
              </Dialog.Title>
            </div>

            <Dialog.Close asChild>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
            <StepIndicator current={step} total={totalSteps} />

            {step === 1 && renderStep1()}
            {step > 1  && renderRoleStep()}

            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {submitError}
              </p>
            )}

            {/* Footer actions */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}

              {isLastStep ? (
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={createUserMutation.isPending}
                  disabled={!selectedRole}
                >
                  Create {selectedRole ? ROLE_CONFIG[selectedRole].label : 'user'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  onClick={handleNext}
                  disabled={!selectedRole}
                >
                  Next
                </Button>
              )}
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
