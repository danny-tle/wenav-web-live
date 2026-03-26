"use client";

import dynamic from "next/dynamic";

const AdminDashboardMap = dynamic(
  () => import("@/components/dashboard/AdminDashboardMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-white animate-pulse rounded-wenav" />
    ),
  }
);

export default function AdminDashboardPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative rounded-wenav overflow-hidden min-h-[500px]">
        <AdminDashboardMap />
      </div>
    </div>
  );
}
