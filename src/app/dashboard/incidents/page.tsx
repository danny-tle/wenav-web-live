"use client";

import { FileText } from "lucide-react";

const INCIDENT_TYPES = [
  "All Types",
  "Blocked Path",
  "Construction",
  "Uneven Sidewalk",
  "Low Obstacle",
  "Other",
];

const INCIDENT_STATUSES = [
  "All Statuses",
  "Approved",
  "Not Confirmed",
  "Under Review",
];

export default function IncidentsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-wenav-dark">Incident History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review your past incidents.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-wenav text-sm text-gray-600 outline-none focus:border-wenav-purple transition-colors">
          {INCIDENT_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-wenav text-sm text-gray-600 outline-none focus:border-wenav-purple transition-colors">
          {INCIDENT_STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <input
          type="date"
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-wenav text-sm text-gray-600 outline-none focus:border-wenav-purple transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-wenav border border-gray-100 flex-1">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reported By
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Empty state */}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-wenav-gray flex items-center justify-center mb-3">
            <FileText size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">
            No incidents reported
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Your past incident reports will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
