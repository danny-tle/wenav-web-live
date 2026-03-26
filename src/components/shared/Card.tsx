import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  gray?: boolean;
}

export default function Card({
  children,
  className = "",
  gray = false,
}: CardProps) {
  return (
    <div
      className={`rounded-wenav p-5 ${gray ? "bg-wenav-gray" : "bg-white shadow-sm border border-gray-100"} ${className}`}
    >
      {children}
    </div>
  );
}
