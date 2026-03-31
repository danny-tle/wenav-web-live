"use client";

import { AuthGuard } from "@/lib/auth";
import UserSidebar from "@/components/user/UserSidebar";
import DashboardTopbar from "@/components/shared/DashboardTopbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <DashboardTopbar />
        <div className="flex flex-1 overflow-hidden bg-wenav-gray">
          <UserSidebar />
          <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
