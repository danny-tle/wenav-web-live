"use client";

import { AuthGuard } from "@/lib/auth";
import UserSidebar from "@/components/user/UserSidebar";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        {/* <DashboardTopbar /> */}
        <div className="flex flex-1 overflow-hidden bg-wenav-gray">
          <UserSidebar />
          <main className="min-w-0 flex-1 overflow-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
