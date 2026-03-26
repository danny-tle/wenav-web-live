"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const MapWrapper = dynamic(() => import("@/components/shared/MapWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white animate-pulse rounded-wenav" />
  ),
});

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-wenav-dark">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor user locations and incidents in real time.
        </p>
      </div>

      <div className="flex-1 relative rounded-wenav overflow-hidden min-h-[400px]">
        <MapWrapper scrollWheelZoom={true} />

        {/* Empty state overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-[400] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-wenav px-6 py-4 shadow-sm text-center pointer-events-auto">
            <MapPin size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">
              No active users to display
            </p>
            <p className="text-xs text-gray-400 mt-1">
              User locations will appear here once connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
