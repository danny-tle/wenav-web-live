"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Users } from "lucide-react";
import { subscribeToUserProfiles } from "@/lib/firestore";
import { UserProfile } from "@/lib/types";

const MapWrapper = dynamic(() => import("@/components/shared/MapWrapper"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-white animate-pulse rounded-wenav" />,
});

export default function AdminMyUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsub = subscribeToUserProfiles(setUsers);
    return unsub;
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-wenav-dark">My Users</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all of your paired users.</p>
      </div>

      <div className="flex-1 flex gap-6 min-h-[400px]">
        {/* User list */}
        <div className="w-72 flex-shrink-0 bg-white rounded-wenav border border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-500">All Users: {users.length}</span>
          </div>
          <div className="flex-1 overflow-auto">
            {users.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No users yet.
              </div>
            )}
            {users.map((user) => (
              <div
                key={user.uid}
                className="flex items-center gap-3 px-4 py-3 hover:bg-wenav-gray cursor-pointer border-b border-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-wenav-gray flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500">
                    {user.displayName[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{user.displayName}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    user.status === "online" ? "bg-emerald-400" : "bg-gray-300"
                  }`}
                />
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
