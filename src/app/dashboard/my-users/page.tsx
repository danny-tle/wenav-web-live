"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Users, Plus, X } from "lucide-react";
import type { Coordinate, TrackedUser, } from "@/lib/types";
import UserDetailsPanel from "@/components/dashboard/UserDetailsPanel";

const MapWrapper = dynamic(() => import("@/components/shared/MapWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white animate-pulse rounded-wenav" />
  ),
});

const initialUsers: TrackedUser[] = [
  {
    id: "user-1",
    name: "Terra",
    status: "walking",
    avatar: undefined,
    lastLocation: {
      lat: 40.7707,
      lng: -111.891,
    },
    lastUpdated: "12min ago",
    route: [
      { lat: 40.744, lng: -111.905 },
      { lat: 40.751, lng: -111.898 },
      { lat: 40.759, lng: -111.901 },
      { lat: 40.7707, lng: -111.891 },
    ],
    vestBattery: 78,
    vestConnected: true,
    homeAddress: "123 Main St, Salt Lake City, UT",
    emergencyContact: {
      name: "John Doe",
      phone: "555-123-4567",
      email: "t.park@utah.edu",
    },
    history: [
      {
        id: "terra-activity-1",
        title: "434 Main St",
        recordedAt: "2026-09-13T09:00:00-06:00",
        time: "7:00 AM",
        location: {
          lat: 40.744,
          lng: -111.905,
        },
      },
      {
        id: "terra-activity-2",
        title: "25 Main St",
        recordedAt: "2026-09-13T10:00:00-06:00",
        time: "10:00 AM",
        location: {
          lat: 40.751,
          lng: -111.898,
        },
      },
      {
        id: "terra-activity-3",
        title: "Near UT Hospital",
        recordedAt: "2026-09-13T11:00:00-06:00",
        time: "11:00 AM",
        location: {
          lat: 40.759,
          lng: -111.901,
        },
      },
      {
        id: "terra-activity-4",
        title: "Regional Medical Center",
        recordedAt: "2026-09-13T12:00:00-06:00",
        time: "12:00 PM",
        location: {
          lat: 40.7707,
          lng: -111.891,
        },
      },
    ],
  },
  
  {
    id: "user-2",
    name: "Danny",
    status: "idle",
    avatar: undefined,
    lastLocation: {
      lat: 40.762,
      lng: -111.884,
    },
    lastUpdated: "3hr ago",
    route: [],
    vestBattery: 64,
    vestConnected: true,
  },
  {
    id: "user-3",
    name: "Ethan",
    status: "offline",
    avatar: undefined,
    lastLocation: {
      lat: 40.755,
      lng: -111.895,
    },
    lastUpdated: "5min ago",
    route: [],
    vestBattery: 42,
    vestConnected: false,
  },
  {
    id: "user-4",
    name: "Tommy",
    status: "walking",
    avatar: undefined,
    lastLocation: {
      lat: 40.748,
      lng: -111.902,
    },
    lastUpdated: "2hr ago",
    route: [],
    vestBattery: 91,
    vestConnected: true,
  },
  {
    id: "user-5",
    name: "Jewan",
    status: "idle",
    avatar: undefined,
    lastLocation: {
      lat: 40.765,
      lng: -111.91,
    },
    lastUpdated: "15min ago",
    route: [],
    vestBattery: 83,
    vestConnected: true,
  },
];

export default function MyUsersPage() {
  const [users, setUsers] =
    useState<TrackedUser[]>(initialUsers);

  const [selectedUserId, setSelectedUserId] =
    useState<string | null>(initialUsers[0]?.id ?? null);

  const [focusedLocation, setFocusedLocation] =
    useState<Coordinate | null>(null);

  const [showPairing, setShowPairing] = useState(false);
  const [pairingCode, setPairingCode] = useState(["", "", "", ""]);

  const selectedUser =
    users.find((user) => user.id === selectedUserId) ?? null;

  const today = new Date();

  const todayHistory =
    selectedUser?.history
      ?.filter((activity) => {
        const recordedDate = new Date(activity.recordedAt);

        return (
          recordedDate.getFullYear() === today.getFullYear() &&
          recordedDate.getMonth() === today.getMonth() &&
          recordedDate.getDate() === today.getDate()
        );
      })
      .sort(
        (first, second) =>
          new Date(first.recordedAt).getTime() -
          new Date(second.recordedAt).getTime()
      ) ?? [];
  
  const todayRoute = todayHistory.map((activity) => activity.location);


  const updateSelectedUser = (
    updates: Partial<TrackedUser>
  ) => {
    if (!selectedUserId) return;

    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        user.id === selectedUserId
          ? { ...user, ...updates }
          : user
      )
    );
  };

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...pairingCode];
    newCode[index] = value;
    setPairingCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      const next = document.getElementById(`code-${index + 1}`);
      next?.focus();
    }
  };

  return (
    <div className="h-full flex flex-col">

      <div className="flex min-h-[400px] flex-1">
        {/* User list panel */}
        <div className="flex w-72 flex-shrink-0 flex-col bg-white">
          {/* Header */}
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                My Users: {users.length}
              </span>

              <button
                type="button"
                onClick={() => setShowPairing(true)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-wenav-purple transition-colors hover:bg-wenav-purple/10"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Paring UserLists */}
          {users.length > 0 && (
          <ul className="flex-1 space-y-2 overflow-y-auto p-4">
            {users.map((user) => {
              const isSelected = selectedUserId === user.id;

              return (
                <li key={user.id} className="border-b border-gray-300">
                  <button
                    type="button"
                    onClick={() =>  setSelectedUserId(user.id)}
                    className={`flex w-full items-center rounded-md gap-3 px-3 py-4 text-left transition-colors ${
                      isSelected
                        ? "bg-purple-100"
                        : "hover:bg-gray-50" 
                    }`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {user.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <span className="flex-1 text-sm font-medium text-gray-800">
                      {user.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

          {/* Empty state */}
          {users.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-wenav-gray">
                <Users size={20} className="text-gray-400" />
              </div>

              <p className="text-sm text-gray-500">
                No users paired yet
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Add a user to start monitoring their location.
              </p>
            </div>
          )}
        </div>

        {/* Map panel */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <MapWrapper
            scrollWheelZoom={true}
            selectedLocation={selectedUser?.lastLocation}
            historyPoints={todayHistory}
            route={todayRoute}
            flyToLocation={
              focusedLocation
                ? [
                    focusedLocation.lat,
                    focusedLocation.lng,
                  ]
                : selectedUser
                  ? [
                      selectedUser.lastLocation.lat,
                      selectedUser.lastLocation.lng,
                    ]
                  : undefined
            }
            flyToZoom={focusedLocation ? 17 : 14}
          />

          {selectedUser && (
            <UserDetailsPanel 
              user={selectedUser}
              onUpdateUser={updateSelectedUser}
              onSelectHistory={setFocusedLocation}
            />
          )}
        </div>
      </div>

      {/* Pairing Code Modal */}
      {showPairing && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[2000]"
            onClick={() => setShowPairing(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2010] bg-white rounded-wenav p-8 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-wenav-dark">
                Enter pairing code
              </h2>
              <button
                onClick={() => setShowPairing(false)}
                className="p-1 hover:bg-wenav-gray rounded-lg"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Enter the code provided by your user to connect to their account.
            </p>

            <div className="flex gap-3 justify-center mb-8">
              {pairingCode.map((digit, i) => (
                <input
                  key={i}
                  id={`code-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeInput(i, e.target.value)}
                  className="w-16 h-20 text-center text-2xl font-bold border-2 border-gray-200 rounded-wenav focus:border-wenav-purple focus:ring-2 focus:ring-wenav-purple/20 outline-none transition-colors"
                />
              ))}
            </div>

            <button className="w-full py-3.5 bg-wenav-dark text-white font-semibold rounded-wenav hover:bg-wenav-dark/90 transition-colors">
              Connect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
