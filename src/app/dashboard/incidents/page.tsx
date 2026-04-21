"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, MapPin, X, Loader } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { subscribeToUserIncidents, createIncident } from "@/lib/firestore";
import { Incident } from "@/lib/types";

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
  not_confirmed: "Rejected",
  under_review: "Under Review",
};

export default function IncidentsPage() {
  const { user } = useAuth();
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  const [showModal, setShowModal] = useState(false);

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
        const { latitude, longitude } = pos.coords;
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wenav-dark">Incident History</h1>
          <p className="text-sm text-gray-500 mt-1">Review and report incidents.</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-wenav-purple text-white text-sm font-semibold rounded-wenav hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Report Incident
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-wenav border border-gray-100 flex-1">
        {userIncidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {userIncidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{inc.reportedAt}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{inc.address}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{TYPE_LABELS[inc.type]}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[inc.status]}`}>
                        {STATUS_LABELS[inc.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-wenav-gray flex items-center justify-center mb-3">
              <FileText size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No incidents reported</p>
            <p className="text-xs text-gray-400 mt-1">Your past incident reports will appear here.</p>
          </div>
        )}
      </div>

      {/* Report */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
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
