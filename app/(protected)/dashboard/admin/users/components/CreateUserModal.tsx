

/* ─────────────────────────────────────────────────────────
   Main modal
───────────────────────────────────────────────────────── */

import { useCreateUserMutation } from "@/src/hooks/queries/useAdmin";
import { adminCreateUserSchema, CreateUserFormData } from "@/src/validators/adminSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CreateUserModalProps, FieldError, FieldLabel, ParentStep2, Role, ROLE_CONFIG, RoleSelector, SectionDivider, StepIndicator, StudentStep2, StudentStep3, TeacherStep2 } from "./modalHelpers";
import { Input } from "@/src/components/ui/Input";
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, X } from "lucide-react";
import { Button } from "@/src/components/ui/Button";


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
      if (selectedRole === 'TEACHER') return <TeacherStep2 register={register} errors={errors} />;
    }

    return null; 
  };

  const isLastStep = step === totalSteps;

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content aria-description='Create User Form'
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
