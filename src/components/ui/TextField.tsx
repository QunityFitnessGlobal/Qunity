import type { InputHTMLAttributes } from "react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  onChange: (value: string) => void;
};

export function TextField({ label, onChange, id, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <input
        id={fieldId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        {...props}
      />
    </div>
  );
}
