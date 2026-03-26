"use client";

import dynamic from "next/dynamic";
import { Users } from "lucide-react";

const MapWrapper = dynamic(() => import("@/components/shared/MapWrapper"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-white animate-pulse rounded-wenav" />,
});

const MOCK_USERS = [
  { id: "1", name: "Guest1", status: "online" },
  { id: "2", name: "Guest2", status: "online" },
  { id: "3", name: "Guest3", status: "offline" },
  { id: "4", name: "Guest4", status: "offline" },
  { id: "5", name: "Guest5", status: "online" },
];

export default function AdminMyUsersPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-wenav-dark">My Users</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all registered users.</p>
      </div>

      <div className="flex-1 flex gap-6 min-h-[400px]">
        {/* User list */}
        <div className="w-72 flex-shrink-0 bg-white rounded-wenav border border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-500">All Users: {MOCK_USERS.length}</span>
          </div>
          <div className="flex-1 overflow-auto">
            {MOCK_USERS.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-wenav-gray cursor-pointer border-b border-gray-50">
                <div className="w-8 h-8 rounded-full bg-wenav-gray flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500">{user.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                </div>
                <span className="text-xs text-gray-400">—</span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <button className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors w-full">
              <Users size={16} />
              + Add User
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 rounded-wenav overflow-hidden">
          <MapWrapper scrollWheelZoom={true} />
        </div>
      </div>
    </div>
  );
}
