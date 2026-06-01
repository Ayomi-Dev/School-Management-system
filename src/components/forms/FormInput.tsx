'use client';

import React from 'react';
import { useController, Control, FieldPath, FieldValues } from 'react-hook-form';
import { Input } from '@/src/components/ui/Input';
import { clsx } from 'clsx';
import { SelectOption } from '@/src/types/ui';

interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
}


export const FormInput = <TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  helperText,
  icon,
}: FormInputProps<TFieldValues, TName>) => {
    const { field, fieldState } = useController({ control, name });

    return (
      <Input
        {...field}
        type={type}
        label={label}
        placeholder={placeholder}
        required={required}
        error={fieldState.error?.message}
        helperText={helperText}
        icon={icon}
      />
    );
}

FormInput.displayName = 'FormInput';

interface FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    { control, name, label, options, placeholder, required = false, disabled = false },
    ref
  ) => {
    const { field, fieldState } = useController({ control, name });

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <select
          {...field}
          ref={ref}
          disabled={disabled}
          className={clsx(
            'w-full px-4 py-2.5 rounded-md border transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'text-gray-900',
            fieldState.error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'bg-gray-100 cursor-not-allowed'
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {fieldState.error && (
          <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
