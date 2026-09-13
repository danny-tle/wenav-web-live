"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

import UserList, {type User,} from "@/components/dashboard/UserList";
import SelectedUserCard from "@/components/dashboard/SelectedUserCard";
import RiskAreasCard, { type RiskArea, } from "@/components/dashboard/RiskAreasCard";

const users: User[] = [
  {
    id: "1",
    name: "Alex Johnson",
    status: "ACTIVE",
    profileImage: null,
    battery: 78,
    lastUpdated: "2 min ago",
  },
  {
    id: "2",
    name: "Jamie Lee",
    status: "IDLE",
    profileImage: null,
    battery: 89,
    lastUpdated: "5 min ago",
  },
];

const riskAreas: RiskArea[] = [
  {
    id: "risk-1",
    address: "234 Main St, Salt Lake City, UT",
    latitude: 40.7608,
    longitude: -111.891,
  },
  {
    id: "risk-2",
    address: "742 Evergreen Terrace, Salt Lake City, UT",
    latitude: 40.767,
    longitude: -111.884,
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
    useState<User | null>(null);

  const [selectedRiskArea, setSelectedRiskArea] =
    useState<RiskArea | null>(null);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapWrapper
        scrollWheelZoom={true}
        riskAreas={riskAreas}
        flyToLocation={
          selectedRiskArea
            ? [
                selectedRiskArea.latitude,
                selectedRiskArea.longitude,
              ]
            : undefined
        }
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