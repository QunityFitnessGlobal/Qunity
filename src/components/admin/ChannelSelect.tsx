"use client";

import { useRouter } from "next/navigation";

interface ChannelSelectProps {
  value: string;
  options: { value: string; label: string; href: string }[];
}

// The channel filter: a native select that opens the same view for the chosen channel.
export function ChannelSelect({ value, options }: ChannelSelectProps) {
  const router = useRouter();
  return (
    <select
      aria-label="ערוץ"
      value={value}
      onChange={(e) => {
        const option = options.find((o) => o.value === e.target.value);
        if (option) router.push(option.href);
      }}
      className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12.5px] text-[#52514e]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
