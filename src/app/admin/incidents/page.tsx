"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, ChevronDown, ChevronUp, ChevronRight, Image as ImageIcon, Play } from "lucide-react";
import { subscribeToIncidents, updateIncidentStatus } from "@/lib/firestore";
import { Incident } from "@/lib/types";

const MapWrapper = dynamic(() => import("@/components/shared/MapWrapper"), {
  ssr: false,
  loading: () => <div className="w-full h-48 bg-white animate-pulse rounded-wenav" />,
});

interface MockIncident {
  id: string;
  date: string;
  location: string;
  type: string;
  status: "In-process" | "Completed" | "Rejected";
  lastUpdated: string;
  verificationNote: string;
}

const MOCK_INCIDENTS: MockIncident[] = [
  {
    id: "mock-1",
    date: "March 1, 2026 3:45 PM (MT)",
    location: "1234 W Maple Dr, Salt Lake City, UT 84101, USA",
    type: "Under Construction",
    status: "In-process",
    lastUpdated: "March 20, 2026",
    verificationNote: "Insufficient information to verify the reported obstacle.",
  },
  {
    id: "mock-2",
    date: "March 1, 2026 3:45 PM (MT)",
    location: "1234 W Maple Dr, Salt Lake City, UT 84101, USA",
    type: "Under Construction",
    status: "In-process",
    lastUpdated: "March 20, 2026",
    verificationNote: "Area under active construction, multiple reports received.",
  },
  {
    id: "mock-3",
    date: "March 1, 2026 3:45 PM (MT)",
    location: "1234 W Maple Dr, Salt Lake City, UT 84101, USA",
    type: "Under Construction",
    status: "Completed",
    lastUpdated: "March 20, 2026",
    verificationNote: "Verified and confirmed by field inspection.",
  },
  {
    id: "mock-4",
    date: "February 28, 2026 10:15 AM (MT)",
    location: "567 E State St, Salt Lake City, UT 84102, USA",
    type: "Blocked Path",
    status: "In-process",
    lastUpdated: "March 18, 2026",
    verificationNote: "Awaiting photo evidence from reporter.",
  },
  {
    id: "mock-5",
    date: "February 25, 2026 2:30 PM (MT)",
    location: "890 S Main St, Salt Lake City, UT 84101, USA",
    type: "Uneven Sidewalk",
    status: "Completed",
    lastUpdated: "March 15, 2026",
    verificationNote: "Confirmed. Sidewalk repair scheduled.",
  },
];

const TYPE_LABELS: Record<Incident["type"], string> = {
  blocked_path: "Blocked Path",
  construction: "Under Construction",
  uneven_sidewalk: "Uneven Sidewalk",
  low_obstacle: "Low Obstacle",
  other: "Other",
};

// Adapts a Firestore Incident to the display shape used by mock rows
function firestoreToDisplay(inc: Incident): MockIncident {
  return {
    id: inc.id,
    date: inc.reportedAt,
    location: inc.address,
    type: TYPE_LABELS[inc.type] ?? inc.type,
    status: inc.status === "approved" ? "Completed" : inc.status === "not_confirmed" ? "Rejected" : "In-process",
    lastUpdated: inc.lastUpdated ?? "",
    verificationNote: inc.verificationNote ?? "",
  };
}

export default function AdminIncidentsPage() {
  const [expandedId, setExpandedId] = useState<string | null>("mock-1");
  const [mockIncidents, setMockIncidents] = useState<MockIncident[]>(MOCK_INCIDENTS);
  // Real Firestore incidents — empty until data arrives; replaces mocks when populated
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    const unsub = subscribeToIncidents(setLiveIncidents);
    return unsub;
  }, []);

  // Use live Firestore data when available, otherwise fall back to mocks
  const usingLive = liveIncidents.length > 0;
  const displayIncidents: MockIncident[] = usingLive
    ? liveIncidents.map(firestoreToDisplay)
    : mockIncidents;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAction = async (id: string, action: "confirm" | "reject") => {
    if (usingLive) {
      const status = action === "confirm" ? "approved" : "not_confirmed";
      await updateIncidentStatus(id, status as Incident["status"]);
    } else {
      setMockIncidents((prev) =>
        prev.map((inc) =>
          inc.id === id ? { ...inc, status: (action === "confirm" ? "Completed" : "Rejected") as MockIncident["status"] } : inc
        )
      );
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Map section */}
      <div className="h-48 rounded-wenav overflow-hidden flex-shrink-0">
        <MapWrapper scrollWheelZoom={false} zoom={11} />
      </div>

      {/* Total incidents header */}
      <h1 className="text-2xl font-bold text-wenav-dark">
        Total Incidents {displayIncidents.length.toLocaleString()}
      </h1>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] flex items-center bg-white border border-gray-200 rounded-wenav px-4 py-2.5">
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 outline-none text-sm text-gray-600 placeholder:text-gray-400"
          />
          <Search size={16} className="text-gray-400" />
        </div>
        <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-wenav text-sm text-gray-600 outline-none">
          <option>Status</option>
          <option>In-process</option>
          <option>Completed</option>
        </select>
        <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-wenav text-sm text-gray-600 outline-none">
          <option>Date</option>
          <option>Newest first</option>
          <option>Oldest first</option>
        </select>
        <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-wenav text-sm text-gray-600 outline-none">
          <option>Type</option>
          <option>Under Construction</option>
          <option>Blocked Path</option>
          <option>Uneven Sidewalk</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-wenav border border-gray-100 flex-1 overflow-auto">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr_0.8fr_auto] gap-4 px-6 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span>Submitted Date</span>
          <span>Location</span>
          <span>Type</span>
          <span>Status</span>
          <span>Last Updated</span>
          <span className="text-right pr-2">
            Showing 1 – {Math.min(10, displayIncidents.length)} of {displayIncidents.length}{" "}
            <ChevronRight size={12} className="inline" />
          </span>
        </div>

        {/* Rows */}
        {displayIncidents.map((incident) => {
          const isExpanded = expandedId === incident.id;
          return (
            <div key={incident.id} className="border-b border-gray-50 last:border-0">
              {/* Main row */}
              <div
                className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr_0.8fr_auto] gap-4 px-6 py-4 items-center hover:bg-gray-50/50 cursor-pointer"
                onClick={() => toggleExpand(incident.id)}
              >
                <span className="text-sm text-gray-700">{incident.date}</span>
                <span className="text-sm text-gray-700">{incident.location}</span>
                <span className="text-sm text-gray-700">{incident.type}</span>
                <span
                  className={`text-sm font-medium ${
                    incident.status === "In-process"
                      ? "text-orange-500"
                      : incident.status === "Rejected"
                      ? "text-red-500"
                      : "text-emerald-500"
                  }`}
                >
                  {incident.status}
                </span>
                <span className="text-sm text-gray-500">{incident.lastUpdated}</span>
                <div className="flex items-center gap-2">
                  {incident.status === "In-process" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(incident.id, "reject");
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-red-500 border border-red-300 rounded hover:bg-red-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(incident.id, "confirm");
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-500 rounded hover:bg-emerald-600 transition-colors"
                      >
                        Confirm
                      </button>
                    </>
                  )}
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 bg-gray-50/30">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Verification Note</p>
                      <p className="text-sm text-gray-700">
                        {incident.verificationNote}
                      </p>
                    </div>
                    <button className="text-xs text-gray-400 hover:text-wenav-purple transition-colors">
                      edit
                    </button>
                  </div>

                  <div className="flex gap-8">
                    {/* Media */}
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Media</p>
                      <div className="w-40 h-28 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Play size={28} className="text-gray-400" />
                      </div>
                    </div>

                    {/* Photos */}
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Photos</p>
                      <div className="flex gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-28 h-28 bg-gray-200 rounded-lg flex items-center justify-center"
                          >
                            <ImageIcon size={24} className="text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
