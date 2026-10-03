"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useTranslations } from "next-intl";

type FieldIcon = "mail" | "lock" | "user";

const ICON_PATHS: Record<FieldIcon, ReactNode> = {
  mail: (
    <>
      <path d="M3 5.5h14v9H3z" />
      <path d="M3.5 6l6.5 5 6.5-5" />
    </>
  ),
  lock: (
    <>
      <path d="M6 9V6.5a4 4 0 018 0V9" />
      <path d="M4.5 9h11v8.5h-11z" />
    </>
  ),
  user: (
    <>
      <circle cx="10" cy="6.5" r="3.3" />
      <path d="M3.8 17.5a6.2 6.2 0 0112.4 0" />
    </>
  ),
};

type EntryFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  icon: FieldIcon;
  onChange: (value: string) => void;
  invalid?: boolean;
  hint?: string;
  // Rendered at the end of the field (e.g. the password eye).
  trailing?: ReactNode;
};

// A labelled input on the entry screens: icon, roomy 52px field, and a red
// border when the last attempt failed. Email and password run left-to-right.
export function EntryField({ label, icon, onChange, invalid = false, hint, trailing, id, ...props }: EntryFieldProps) {
  const fieldId = id ?? props.name;
  const ltr = props.type === "email" || props.type === "password" || props.dir === "ltr";
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-[13px] font-semibold text-[#4f4960]">
        {label}
      </label>
      <span
        className={`flex h-[52px] items-center gap-2.5 rounded-[14px] border-[1.5px] bg-white px-3.5 transition-colors focus-within:border-brand-purple ${
          invalid ? "border-[#e5484d]" : "border-[#e4dfeb]"
        }`}
      >
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] flex-none" fill="none" stroke="#7d778e" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {ICON_PATHS[icon]}
        </svg>
        <input
          id={fieldId}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          className={`min-w-0 flex-1 bg-transparent text-base text-[#221a33] outline-none ${ltr ? "text-right [direction:ltr]" : ""}`}
          {...props}
        />
        {trailing}
      </span>
      {hint && <span className="text-xs text-text-muted">{hint}</span>}
    </div>
  );
}

type PasswordFieldProps = Omit<EntryFieldProps, "icon" | "type" | "trailing">;

// A password field with a show/hide eye.
export function PasswordField(props: PasswordFieldProps) {
  const t = useTranslations("entry");
  const [visible, setVisible] = useState(false);
  return (
    <EntryField
      {...props}
      icon="lock"
      type={visible ? "text" : "password"}
      dir="ltr"
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          aria-pressed={visible}
          className="flex p-1.5 text-[#6c6580]"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {visible ? (
              <>
                <path d="M3 3l14 14" />
                <path d="M8.2 5a8.6 8.6 0 011.8-.2c5.2 0 8.2 5.2 8.2 5.2a14 14 0 01-2.3 2.9M5.2 6.6A13.4 13.4 0 001.8 10S4.8 15.2 10 15.2a8 8 0 003.3-.7" />
              </>
            ) : (
              <>
                <path d="M1.8 10S4.8 4.8 10 4.8 18.2 10 18.2 10 15.2 15.2 10 15.2 1.8 10 1.8 10z" />
                <circle cx="10" cy="10" r="2.6" />
              </>
            )}
          </svg>
        </button>
      }
    />
  );
}
