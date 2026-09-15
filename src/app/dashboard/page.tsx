"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type {
  TrackedUser,
  HighRiskArea,
} from "@/lib/types";

import {
  subscribeToHighRiskAreas,
  subscribeToTrackedUsers,
} from "@/lib/firestore";
import { useAuth } from "@/lib/auth";

import UserList from "@/components/dashboard/UserList";
import SelectedUserCard from "@/components/dashboard/SelectedUserCard";
import RiskAreasCard from "@/components/dashboard/RiskAreasCard";

const MapWrapper = dynamic(
  () => import("@/components/shared/MapWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-white" />
    ),
  }
);

export default function DashboardPage() {
  const { user: caregiver } = useAuth();

  const [users, setUsers] = useState<TrackedUser[]>([]);
  const [riskAreas, setRiskAreas] = useState<HighRiskArea[]>([]);

  // Everyone this caregiver is linked to, with their live position.
  useEffect(() => {
    if (!caregiver) return;
    return subscribeToTrackedUsers(caregiver.uid, setUsers);
  }, [caregiver]);

  useEffect(() => subscribeToHighRiskAreas(setRiskAreas), []);

  // Hold the id, not the object: the object in `users` is replaced on every
  // position update, so a stored snapshot would freeze at its first value and
  // outlive a revoked link.
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedUser =
    users.find((trackedUser) => trackedUser.id === selectedUserId) ?? null;

  // Everyone with a position on record gets a pin. Offline pins stay put and
  // read as "last known location" rather than vanishing.
  const people = users
    .filter((trackedUser) => trackedUser.hasLocation !== false)
    .map((trackedUser) => ({
      id: trackedUser.id,
      name: trackedUser.name,
      location: trackedUser.lastLocation,
      live: trackedUser.status !== "offline",
      lastUpdated: trackedUser.lastUpdated,
    }));

  const [selectedRiskArea, setSelectedRiskArea] =
    useState<HighRiskArea | null>(null);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapWrapper
        scrollWheelZoom={true}
        riskAreas={riskAreas}
        people={people}
        flyToLocation={
          selectedRiskArea
            ? [selectedRiskArea.lat, selectedRiskArea.lng]
            : selectedUser && selectedUser.hasLocation !== false
              ? [selectedUser.lastLocation.lat, selectedUser.lastLocation.lng]
              : undefined
        }
        flyToZoom={16}
      />

      <div className="absolute right-4 top-4 z-[500] flex w-72 flex-col gap-3">
        <UserList
          users={users}
          selectedUserId={selectedUserId}
          onSelectUser={(trackedUser) => setSelectedUserId(trackedUser.id)}
        />

        {selectedUser && (
          <SelectedUserCard user={selectedUser} />
        )}

        <RiskAreasCard
          areas={riskAreas}
          onSelectArea={setSelectedRiskArea}
        />
      </div>
    </div>
  );
}