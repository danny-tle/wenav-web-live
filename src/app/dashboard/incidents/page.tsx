"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { FileText, ArrowDownUp, Plus, MapPin, X, Loader, Search, ChevronDown, ChevronUp,  } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { subscribeToUserIncidents, createIncident } from "@/lib/firestore";
import { Incident } from "@/lib/types";

const MapWrapper = dynamic(
  () => import("@/components/shared/MapWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-gray-100" />
    ),
  },
);

const TYPE_OPTIONS: { value: Incident["type"]; label: string }[] = [
  { value: "blocked_path", label: "Blocked Path" },
  { value: "construction", label: "Under Construction" },
  { value: "uneven_sidewalk", label: "Uneven Sidewalk" },
  { value: "low_obstacle", label: "Low Obstacle" },
  { value: "other", label: "Other" },
];

const TYPE_LABELS: Record<Incident["type"], string> = {
  blocked_path: "Blocked Path",
  construction: "Under Construction",
  uneven_sidewalk: "Uneven Sidewalk",
  low_obstacle: "Low Obstacle",
  other: "Other",
};

const STATUS_STYLES: Record<Incident["status"], string> = {
  approved: "text-emerald-600 bg-emerald-50",
  not_confirmed: "text-red-500 bg-red-50",
  under_review: "text-orange-500 bg-orange-50",
};

const STATUS_LABELS: Record<Incident["status"], string> = {
  approved: "Approved",
  not_confirmed: "Not confirmed",
  under_review: "In process",
};

export default function IncidentsPage() {
  const { user } = useAuth();
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  const [typeFilter, setTypeFilter] =
    useState<"all" | Incident["type"]>("all");
  const [statusFilter, setStatusFilter] =
    useState<"all" | Incident["status"]>("all");
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIncidentId, setExpandedIncidentId] =
    useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] =
    useState<Incident | null>(null);
  const [sortOrder, setSortOrder] =
    useState<"newest" | "oldest">("newest");
  const filteredIncidents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = userIncidents.filter((incident) => {
      const matchesSearch =
        !query ||
        incident.address.toLowerCase().includes(query) ||
        TYPE_LABELS[incident.type]
          .toLowerCase()
          .includes(query) ||
        STATUS_LABELS[incident.status]
          .toLowerCase()
          .includes(query);

      const matchesType =
        typeFilter === "all" ||
        incident.type === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        incident.status === statusFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });

  return [...filtered].sort((first, second) => {
    const firstDate = new Date(first.reportedAt).getTime();
    const secondDate = new Date(second.reportedAt).getTime();

    return sortOrder === "newest"
      ? secondDate - firstDate
      : firstDate - secondDate;
  });
}, [
  searchQuery,
  typeFilter,
  statusFilter,
  sortOrder,
  userIncidents,
]);

  function handleIncidentClick(incident: Incident) {
    setSelectedIncident(incident);

    setExpandedIncidentId((currentId) =>
      currentId === incident.id ? null : incident.id,
    );
  }

  // Form state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [incidentType, setIncidentType] = useState<Incident["type"]>("blocked_path");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToUserIncidents(user.uid, setUserIncidents);
    return unsub;
  }, [user?.uid]);

  function getGpsLocation() {
    setGpsLoading(true);
    setGpsError("");
    setLocation(null);
    setAddress("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude }= pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          setAddress(data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setGpsLoading(false);
      },
      () => {
        setGpsError("Could not get your location. Please enable location access and try again.");
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  }

  function openModal() {
    setShowModal(true);
    setIncidentType("blocked_path");
    setDescription("");
    setSubmitError("");
    getGpsLocation();
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleSubmit() {
    if (!location || !user) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await createIncident({
        type: incidentType,
        status: "under_review",
        location,
        address,
        description,
        reportedBy: user.uid,
      });
      closeModal();
    } catch {
      setSubmitError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
    {/* Map */}
      <div className="absolute inset-0">
        <MapWrapper
          scrollWheelZoom
          selectedLocation={selectedIncident?.location}
          flyToLocation={
            selectedIncident
              ? [
                  selectedIncident.location.lat,
                  selectedIncident.location.lng,
                ]
              : undefined
          }
          flyToZoom={16}
        />
      </div>

      {/* Incident content */}
      <section className="absolute inset-x-0 bottom-0 top-56 z-[500] overflow-y-auto rounded-t-[40px] bg-white px-8 py-8 shadow-[0_-6px_24px_rgba(0,0,0,0.06)]">
        <div className="mx-auto max-w-[1500px]">
          {/* Title */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-wenav-dark">
              Total Incidents {filteredIncidents.length}
            </h1>

            <button
              type="button"
              onClick={openModal}
              className="flex items-center gap-2 rounded-wenav bg-wenav-purple px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={16} />
              Report Incident
            </button>
          </div>

          {/* Search and filters */}
          <div className="mb-6 flex gap-3">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search..."
                className="h-11 w-full rounded-xl border border-gray-200 px-4 pr-11 text-sm outline-none transition-colors focus:border-wenav-purple"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | "all"
                        | Incident["status"],
                    )
                  }
                  className="h-11 cursor-pointer appearance-none rounded-full border border-gray-200 bg-white pl-5 pr-11 text-sm text-gray-700 outline-none hover:bg-gray-50 focus:border-wenav-purple"
                >
                  <option value="all">All Statuses</option>
                  <option value="under_review">In process</option>
                  <option value="approved">Complete</option>
                  <option value="not_confirmed">
                    Missing information
                  </option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setSortOrder((current) =>
                    current === "newest" ? "oldest" : "newest",
                  )
                }
                className="flex h-11 items-center gap-2 whitespace-nowrap rounded-full border border-gray-200 bg-white px-5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <ArrowDownUp size={15} />
                {sortOrder === "newest" ? "Newest" : "Oldest"}
              </button>

              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value as "all" | Incident["type"],
                    )
                  }
                  className="h-11 appearance-none rounded-full border border-gray-200 bg-white pl-5 pr-11 text-sm text-gray-700 outline-none focus:border-wenav-purple"
                >
                  <option value="all">All Types</option>

                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>
          </div>

          {/* Column labels */}
          <div className="grid grid-cols-[1.25fr_2fr_1fr_1fr_1fr_0.8fr_24px] gap-4 border-b border-gray-100 px-5 py-3 text-xs font-medium text-gray-400">
            <span>Submitted Date</span>
            <span>Location</span>
            <span>Type</span>
            <span>Status</span>
            <span>Last Updated</span>
            <span>User</span>
            <span />
          </div>

          {/* Incidents */}
          {filteredIncidents.length > 0 ? (
            <div>
              {filteredIncidents.map((incident) => {
                const isExpanded =
                  expandedIncidentId === incident.id;

                return (
                  <div
                    key={incident.id}
                    className={`border-b border-gray-100 ${
                      isExpanded
                        ? "border-transparent"
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleIncidentClick(incident)
                      }
                      className="grid w-full grid-cols-[1.25fr_2fr_1fr_1fr_1fr_0.8fr_24px] items-center gap-4 px-5 py-5 text-left"
                    >
                      <span className="text-sm text-gray-700">
                        {incident.reportedAt}
                      </span>

                      <span className="truncate text-sm text-gray-700">
                        {incident.address}
                      </span>

                      <span className="text-sm text-gray-700">
                        {TYPE_LABELS[incident.type]}
                      </span>

                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_STYLES[incident.status]
                        }`}
                      >
                        {STATUS_LABELS[incident.status]}
                      </span>

                      <span className="text-sm text-gray-700">
                        {incident.lastUpdated ?? "—"}
                      </span>

                      <span className="truncate text-sm text-gray-700">
                        {incident.reportedBy}
                      </span>

                      {isExpanded ? (
                        <ChevronUp size={17} />
                      ) : (
                        <ChevronDown size={17} />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-6">
                        <div className="mb-6">
                          <p className="mb-2 text-xs text-gray-400">
                            Verification Note
                          </p>

                          <p className="text-sm text-gray-700">
                            {incident.verificationNote ||
                              incident.description ||
                              "No verification note provided."}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <p className="mb-3 text-xs text-gray-400">
                              Media
                            </p>

                            <div className="flex h-36 w-40 items-center justify-center rounded-2xl bg-gray-200">
                              <div className="h-0 w-0 border-b-[18px] border-l-[28px] border-t-[18px] border-b-transparent border-l-gray-500 border-t-transparent" />
                            </div>
                          </div>

                          <div>
                            <p className="mb-3 text-xs text-gray-400">
                              Photos
                            </p>

                            <div className="flex gap-3">
                              {[1, 2, 3].map((photo) => (
                                <div
                                  key={photo}
                                  className="flex h-36 w-36 items-center justify-center rounded-2xl bg-gray-200 text-gray-400"
                                >
                                  <FileText size={28} />
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
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-wenav-gray">
                <FileText size={20} className="text-gray-400" />
              </div>

              <p className="text-sm font-medium text-gray-600">
                No incidents found
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Your incident reports will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Report */}
      {showModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-wenav shadow-xl w-full max-w-md">
            {/*  header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-wenav-dark">Report Incident</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Location */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Location</p>
                {gpsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader size={14} className="animate-spin" />
                    Getting your location...
                  </div>
                ) : gpsError ? (
                  <div className="space-y-2">
                    <p className="text-sm text-red-500">{gpsError}</p>
                    <button
                      onClick={getGpsLocation}
                      className="text-xs text-wenav-purple font-semibold hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-wenav-purple mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 leading-snug">{address}</p>
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Incident Type
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as Incident["type"])}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-wenav text-sm text-gray-700 outline-none focus:border-wenav-purple transition-colors"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Description <span className="font-normal normal-case text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the obstacle or hazard..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-wenav text-sm text-gray-700 outline-none focus:border-wenav-purple transition-colors resize-none"
                />
              </div>

              {submitError && (
                <p className="text-sm text-red-500">{submitError}</p>
              )}
            </div>

            {/*  Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 rounded-wenav hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!location || submitting}
                className="flex-1 px-4 py-2.5 bg-wenav-purple text-white text-sm font-semibold rounded-wenav hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader size={14} className="animate-spin" />}
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
