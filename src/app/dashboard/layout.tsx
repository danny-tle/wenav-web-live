"use client";

import { AuthGuard } from "@/lib/auth";
import UserSidebar from "@/components/user/UserSidebar";
import DashboardTopbar from "@/components/shared/DashboardTopbar";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <OnboardingProvider>
      <div className="flex flex-col h-screen">
        {/* Same top bar as the admin console: the logo goes back to the homepage. */}
        <DashboardTopbar />
        <div className="flex flex-1 overflow-hidden bg-wenav-gray">
          <UserSidebar />
          <main className="min-w-0 flex-1 overflow-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
        </div>
      </div>
      </OnboardingProvider>
    </AuthGuard>
  );
}
