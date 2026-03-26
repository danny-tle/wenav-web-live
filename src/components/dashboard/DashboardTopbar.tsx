"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";

export default function DashboardTopbar() {
  const { logout, role } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Image
            src="/assets/logo.png"
            alt="WeNav"
            width={100}
            height={30}
            priority
          />
        </Link>
        {role === "admin" && (
          <span className="text-xs font-medium text-gray-400 bg-wenav-gray px-2 py-0.5 rounded">
            admin-confirm
          </span>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}
