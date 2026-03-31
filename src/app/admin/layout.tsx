"use client";

import { AdminGuard } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardTopbar from "@/components/shared/DashboardTopbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex flex-col h-screen">
        <DashboardTopbar />
        <div className="flex flex-1 overflow-hidden bg-wenav-gray">
          <AdminSidebar />
          <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
