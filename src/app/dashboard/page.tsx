"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type {
  TrackedUser,
  HighRiskArea,
} from "@/lib/types";

import UserList from "@/components/dashboard/UserList";
import SelectedUserCard from "@/components/dashboard/SelectedUserCard";
import RiskAreasCard from "@/components/dashboard/RiskAreasCard";

const users: TrackedUser[] = [
  {
    id: "1",
    name: "Alex Johnson",
    status: "walking",
    avatar: undefined,
    lastLocation: {
      lat: 40.7608,
      lng: -111.891,
    },
    lastUpdated: "2 min ago",
    route: [],
    vestBattery: 78,
    vestConnected: true,
  },
  {
    id: "2",
    name: "Jamie Lee",
    status: "idle",
    avatar: undefined,
    lastLocation: {
      lat: 40.767,
      lng: -111.884,
    },
    lastUpdated: "5 min ago",
    route: [],
    vestBattery: 89,
    vestConnected: true,
  },
];

const riskAreas: HighRiskArea[] = [
  {
    id: "risk-1",
    label: "234 Main St, Salt Lake City, UT",
    lat: 40.7608,
    lng: -111.891,
    createdBy: "system",
    createdAt: "2026-09-12T12:00:00Z",
  },
  {
    id: "risk-2",
    label: "742 Evergreen Terrace, Salt Lake City, UT",
    lat: 40.767,
    lng: -111.884,
    createdBy: "system",
    createdAt: "2026-09-12T12:00:00Z",
  },
];

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
  const [selectedUser, setSelectedUser] =
    useState<TrackedUser | null>(null);

  const [selectedRiskArea, setSelectedRiskArea] =
    useState<HighRiskArea | null>(null);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapWrapper
        scrollWheelZoom={true}
        riskAreas={riskAreas}
        flyToLocation={
          selectedRiskArea
            ? [selectedRiskArea.lat,selectedRiskArea.lng,]: undefined}
        flyToZoom={16}
      />

      <div className="absolute right-4 top-4 z-[500] flex w-72 flex-col gap-3">
        <UserList
          users={users}
          selectedUserId={selectedUser?.id ?? null}
          onSelectUser={setSelectedUser}
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