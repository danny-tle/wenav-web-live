interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "filled" | "outlined" | "primary";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export default function Button({
  label,
  onClick,
  variant = "filled",
  disabled = false,
  className = "",
  type = "button",
}: ButtonProps) {
  const base =
    "px-6 py-3.5 rounded-wenav font-semibold text-sm transition-colors w-full";

  const variants = {
    filled: "bg-wenav-dark text-white hover:bg-wenav-dark/90",
    outlined:
      "border-2 border-wenav-dark text-wenav-dark hover:bg-wenav-dark hover:text-white",
    primary: "bg-wenav-purple text-white hover:bg-wenav-purple/90",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {label}
    </button>
  );
}
