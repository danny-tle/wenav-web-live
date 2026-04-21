"use client";

import { useState } from "react";
import { LucideIcon } from "lucide-react";

interface AuthInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: LucideIcon;
  hint?: string;
}

export default function AuthInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  hint,
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1.5"
      >
        {label}
      </label>
      <div
        className={`flex items-center border rounded-lg px-3 py-3 transition-colors ${
          focused
            ? "border-blue-500 ring-1 ring-blue-500"
            : "border-gray-300"
        }`}
      >
        <Icon size={16}
          className={`mr-3 flex-shrink-0 transition-colors ${
            focused ? "text-blue-500" : "text-gray-400"
          }`}
        />

        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm text-gray-700 placeholder:text-gray-400"
        />
      </div>
      {hint && (
        <p className="text-xs text-gray-400 mt-1.5">{hint}</p>
      )}
    </div>
  );
}
