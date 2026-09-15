"use client";

import { useRef, useState } from "react";

interface PairingCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired once the final character lands, so the caller can auto-submit. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  "aria-describedby"?: string;
}

/**
 * Segmented code field that is really one input.
 *
 * The boxes are presentation only — a single real `<input>` sits invisibly on
 * top of them. That keeps typing, backspace, arrow keys, select-all, paste and
 * password-manager autofill behaving exactly as they do in a normal field,
 * none of which work properly when each character is its own input. Screen
 * readers also announce one labelled field instead of six unlabelled ones.
 *
 * Input is filtered to A–Z and 0–9 and upper-cased, matching the alphabet
 * `createPairingCode` mints from (see wenav_web/functions/src/index.ts).
 */
export default function PairingCodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  autoFocus = false,
  "aria-describedby": describedBy,
}: PairingCodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const characters = Array.from({ length }, (_, i) => value[i] ?? "");
  // The box that will receive the next character, for the caret highlight.
  const activeIndex = Math.min(value.length, length - 1);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, length);

    onChange(cleaned);
    if (cleaned.length === length) onComplete?.(cleaned);
  }

  return (
    <div
      className="relative flex justify-center gap-3"
      onClick={() => inputRef.current?.focus()}
    >
      {characters.map((char, i) => {
        const isActive = focused && i === activeIndex && !disabled;
        return (
          <div
            key={i}
            aria-hidden="true"
            className={`flex h-20 w-16 items-center justify-center rounded-wenav border-2 text-2xl font-bold transition-colors ${
              isActive
                ? "border-wenav-purple ring-2 ring-wenav-purple/20"
                : "border-gray-200"
            } ${disabled ? "bg-wenav-gray text-gray-400" : "text-wenav-dark"}`}
          >
            {char}
          </div>
        );
      })}

      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        autoFocus={autoFocus}
        disabled={disabled}
        maxLength={length}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={`Pairing code, ${length} characters`}
        aria-describedby={describedBy}
        // Invisible but genuinely focusable and typable — never display:none,
        // which would take it out of the tab order and break autofill.
        className="absolute inset-0 h-full w-full cursor-pointer text-transparent caret-transparent opacity-0 outline-none"
      />
    </div>
  );
}
