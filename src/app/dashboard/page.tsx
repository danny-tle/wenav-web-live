"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import { DEMO_RISK_AREA, demoPerson } from "@/components/onboarding/demoData";

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

  const [realUsers, setUsers] = useState<TrackedUser[]>([]);
  const [realRiskAreas, setRiskAreas] = useState<HighRiskArea[]>([]);

  // During the hands-on tour, give a brand-new caregiver something to click.
  const { tourActive } = useOnboarding();
  const showExamples = tourActive;
  const example = useMemo(() => demoPerson(), []);
  const users = showExamples && realUsers.length === 0 ? [example] : realUsers;
  const riskAreas =
    showExamples && realRiskAreas.length === 0 ? [DEMO_RISK_AREA] : realRiskAreas;

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
    <div data-tour="dashboard-map" className="relative h-full w-full overflow-hidden">
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

      {/* Phones: a scrollable stack along the bottom, so the map and its zoom
          controls stay visible up top. md and up: the top-right column. */}
      <div className="absolute inset-x-3 bottom-3 z-[500] flex max-h-[45%] flex-col gap-3 overflow-y-auto md:inset-x-auto md:bottom-auto md:right-4 md:top-4 md:max-h-[calc(100%-2rem)] md:w-72">
        <div data-tour="dashboard-users">
          <UserList
            users={users}
            selectedUserId={selectedUserId}
            onSelectUser={(trackedUser) => setSelectedUserId(trackedUser.id)}
          />
        </div>

        {selectedUser && (
          <SelectedUserCard user={selectedUser} />
        )}

        <div data-tour="dashboard-risk">
          <RiskAreasCard
            areas={riskAreas}
            onSelectArea={setSelectedRiskArea}
          />
        </div>
      </div>
    </div>
  );
}