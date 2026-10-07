import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useCreateFeeStructureMutation } from "@/src/hooks/queries/useFees";
import { CreateFeeStructureFormData, createFeeStructureSchema } from "@/src/validators/feePaymentSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { selectClass } from "../methodbadge";
import { Class } from "@/src/types";
import { ClassDetail } from "@/src/types/admin";



interface CreateFeeStructureModalProps {
  termId:    string;
  termPeriod: string;
  classes:   ClassDetail[]
  onClose:   () => void;
  onSuccess: () => void;
}

export function CreateFeeStructureModal({
  termId,
  termPeriod,
  classes,
  onClose,
  onSuccess,
}: CreateFeeStructureModalProps) {
  const mutation = useCreateFeeStructureMutation(termId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFeeStructureFormData>({
    resolver: zodResolver(createFeeStructureSchema),
    defaultValues: { termId, isOptional: false },
  });

  const onSubmit = (data: CreateFeeStructureFormData) => {
    mutation.mutate(
      { ...data, classId: data.classId || undefined },
      { onSuccess },
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign size={17} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Create Fee Structure</h2>
              <p className="text-xs text-gray-400 mt-0.5">{termPeriod}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={17} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Fee Name *</label>
            <Input
              placeholder="e.g. School Fees, Development Levy"
              {...register('name')}
              error={errors.name?.message}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Amount (₦) *</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount')}
              error={errors.amount?.message}
            />
          </div>

          {/* Class — leave empty for school-wide fee */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Class (leave blank for all classes)
            </label>
            <select {...register('classId')} className={selectClass}>
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.level}</option>
              ))}
            </select>
          </div>

          {/* Optional toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('isOptional')} className="w-4 h-4 rounded accent-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-800">Optional fee</p>
              <p className="text-xs text-gray-400">Students can opt out of this fee</p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create Fee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}