"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Users, Plus, X } from "lucide-react";
import type { Coordinate, TrackedUser, } from "@/lib/types";
import UserDetailsPanel from "@/components/dashboard/UserDetailsPanel";
import PairingCodeInput from "@/components/shared/PairingCodeInput";
import {
  redeemPairingCode,
  subscribeToTrackedUsers,
  subscribeToUserTrack,
} from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import { PAIRING_CODE_LENGTH, pairingMessageFor } from "@/lib/pairing";

const MapWrapper = dynamic(() => import("@/components/shared/MapWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white animate-pulse rounded-wenav" />
  ),
});

export default function MyUsersPage() {
  const { user: caregiver } = useAuth();

  const [liveUsers, setLiveUsers] = useState<TrackedUser[]>([]);
  const [selectedUserId, setSelectedUserId] =
    useState<string | null>(null);

  /**
   * Profile edits made in the details panel. Live fields (position, status,
   * vest) always come from Firestore; these sit on top so an edit isn't wiped
   * by the next position update. They are not persisted yet.
   */
  const [profileEdits, setProfileEdits] =
    useState<Record<string, Partial<TrackedUser>>>({});

  // Every person this caregiver is linked to, merged with their live position.
  useEffect(() => {
    if (!caregiver) return;
    return subscribeToTrackedUsers(caregiver.uid, setLiveUsers);
  }, [caregiver]);

  const users = useMemo(
    () =>
      liveUsers.map((liveUser) => ({
        ...liveUser,
        ...(profileEdits[liveUser.id] ?? {}),
      })),
    [liveUsers, profileEdits]
  );

  // Select the first person once the list arrives, and drop the selection if
  // that link is revoked.
  useEffect(() => {
    if (users.length === 0) {
      setSelectedUserId(null);
      return;
    }
    if (!users.some((u) => u.id === selectedUserId)) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  const [focusedLocation, setFocusedLocation] =
    useState<Coordinate | null>(null);

  const [showPairing, setShowPairing] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [pairingError, setPairingError] = useState("");
  const [pairingBusy, setPairingBusy] = useState(false);
  const [pairedName, setPairedName] = useState("");

  const selectedUser =
    users.find((user) => user.id === selectedUserId) ?? null;

  // Today's breadcrumbs for the selected person, for the route line.
  const [selectedRoute, setSelectedRoute] = useState<Coordinate[]>([]);

  useEffect(() => {
    setSelectedRoute([]);
    if (!selectedUserId) return;
    return subscribeToUserTrack(selectedUserId, setSelectedRoute);
  }, [selectedUserId]);

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
  
  const todayRoute = selectedRoute;


  const updateSelectedUser = (
    updates: Partial<TrackedUser>
  ) => {
    if (!selectedUserId) return;

    setProfileEdits((previous) => ({
      ...previous,
      [selectedUserId]: { ...(previous[selectedUserId] ?? {}), ...updates },
    }));
  };

  const closePairing = () => {
    setShowPairing(false);
    setPairingCode("");
    setPairingError("");
    setPairedName("");
  };

  /** Redeems the code the cared-for person read out of the mobile app. */
  const submitPairingCode = async (code: string) => {
    if (code.length !== PAIRING_CODE_LENGTH || pairingBusy) return;

    setPairingBusy(true);
    setPairingError("");
    try {
      const name = await redeemPairingCode(code);
      setPairedName(name);
      setPairingCode("");
    } catch (err) {
      setPairingError(pairingMessageFor(err));
    } finally {
      setPairingBusy(false);
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
            selectedLocation={
              selectedUser?.hasLocation === false
                ? undefined
                : selectedUser?.lastLocation
            }
            selectedLocationLabel={
              selectedUser && selectedUser.status !== "offline"
                ? "Current user location"
                : `Last known location${
                    selectedUser?.lastUpdated
                      ? ` · ${selectedUser.lastUpdated}`
                      : ""
                  }`
            }
            historyPoints={todayHistory}
            route={todayRoute}
            flyToLocation={
              focusedLocation
                ? [
                    focusedLocation.lat,
                    focusedLocation.lng,
                  ]
                : selectedUser && selectedUser.hasLocation !== false
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
            onClick={closePairing}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2010] bg-white rounded-wenav p-8 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-wenav-dark">
                Enter pairing code
              </h2>
              <button
                onClick={closePairing}
                className="p-1 hover:bg-wenav-gray rounded-lg"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {pairedName ? (
              <>
                <p className="text-sm text-gray-600 mb-8">
                  You&apos;re now connected to{" "}
                  <span className="font-semibold text-wenav-dark">
                    {pairedName}
                  </span>
                  . Their location appears here while they&apos;re walking, for
                  as long as they keep sharing it.
                </p>
                <button
                  onClick={closePairing}
                  className="w-full py-3.5 bg-wenav-dark text-white font-semibold rounded-wenav hover:bg-wenav-dark/90 transition-colors"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-6">
                  Enter the {PAIRING_CODE_LENGTH}-character code from the WeNav
                  app on your user&apos;s phone. Codes expire ten minutes after
                  they&apos;re generated.
                </p>

                <div className="mb-6">
                  <PairingCodeInput
                    value={pairingCode}
                    onChange={(next) => {
                      setPairingCode(next);
                      setPairingError("");
                    }}
                    onComplete={submitPairingCode}
                    length={PAIRING_CODE_LENGTH}
                    disabled={pairingBusy}
                    autoFocus
                    aria-describedby={
                      pairingError ? "pairing-error" : undefined
                    }
                  />
                </div>

                {pairingError && (
                  <p
                    id="pairing-error"
                    role="alert"
                    className="text-sm text-red-600 mb-4 text-center"
                  >
                    {pairingError}
                  </p>
                )}

                <button
                  onClick={() => submitPairingCode(pairingCode)}
                  disabled={
                    pairingCode.length !== PAIRING_CODE_LENGTH || pairingBusy
                  }
                  className="w-full py-3.5 bg-wenav-dark text-white font-semibold rounded-wenav hover:bg-wenav-dark/90 transition-colors disabled:opacity-40"
                >
                  {pairingBusy ? "Connecting…" : "Connect"}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
