"use client";

import { useState } from "react";
import Card from "@/components/shared/Card";
import type { Coordinate, TrackedUser, } from "@/lib/types";

type UserDetailsPanelProps = {
  user: TrackedUser;
  onUpdateUser: (updates: Partial<TrackedUser>) => void;
  onSelectHistory: (location: Coordinate) => void;
};

export default function UserDetailsPanel({
  user,
  onUpdateUser,
  onSelectHistory,
}: UserDetailsPanelProps) {
  const statusColor =
    user.status === "walking"
      ? "bg-green-500"
      : user.status === "idle"
        ? "bg-orange-400"
        : "bg-gray-400";

  const statusLabel =
    user.status === "walking"
      ? "Active"
      : user.status === "idle"
        ? "Idle"
        : "Offline";

    const [showAllHistory, setShowAllHistory] = useState(false);

    const history = user.history ?? [];

    const sortedHistory = [...history].sort(
        (first, second) =>
            new Date(second.recordedAt).getTime() -
            new Date(first.recordedAt).getTime()
    );

    const visibleHistory = showAllHistory
    ? history
    : history.slice(0, 2);

    const [editingHome, setEditingHome] = useState(false);
    const [homeAddress, setHomeAddress] = useState(user.homeAddress ?? "");

    const [editingContact, setEditingContact] = useState(false);

    const [contact, setContact] = useState({
        name: user.emergencyContact?.name ?? "",
        phone: user.emergencyContact?.phone ?? "",
        email: user.emergencyContact?.email ?? "",
    });

  return (
    <div className="absolute bottom-1 right-1 top-4 z-[500] flex w-72 flex-col gap-3 overflow-y-auto pr-1">
      {/* Home */}
        <Card className="w-full">
        <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
            Home
            </p>

            {editingHome ? (
            <div className="flex items-center gap-3">
                <button
                type="button"
                onClick={() => {
                    setHomeAddress(user.homeAddress ?? "");
                    setEditingHome(false);
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
                >
                Cancel
                </button>

                <button
                type="button"
                onClick={() => {
                    onUpdateUser({
                    homeAddress: homeAddress.trim(),
                    });

                    setEditingHome(false);
                }}
                className="text-xs font-medium text-purple-500"
                >
                Save
                </button>
            </div>
            ) : (
            <button
                type="button"
                onClick={() => setEditingHome(true)}
                className="text-xs font-medium text-purple-500"
            >
                Edit
            </button>
            )}
        </div>

        {editingHome ? (
            <input
            type="text"
            value={homeAddress}
            onChange={(event) =>
                setHomeAddress(event.target.value)
            }
            placeholder="Enter home address"
            className="block w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
        ) : (
            <p className="break-words text-sm text-gray-700">
            {user.homeAddress || "No home address"}
            </p>
        )}
        </Card>

      {/* User status */}
      <Card className="w-full">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            User Status
          </p>

          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${statusColor}`}
            />

            <span className="text-sm text-gray-700">
              {statusLabel}
            </span>
          </div>
        </div>
      </Card>

      {/* Last activity */}
      <Card className="w-full">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Last activity
          </p>

          <p className="text-sm text-gray-700">
            {user.lastUpdated}
          </p>
        </div>
      </Card>

      {/* Emergency contact */}
      {/* Emergency contact */}
      <Card className="w-full">
        <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
            Emergency Contact
            </p>

            {editingContact ? (
            <div className="flex items-center gap-3">
                <button
                type="button"
                onClick={() => {
                    setContact({
                    name: user.emergencyContact?.name ?? "",
                    phone: user.emergencyContact?.phone ?? "",
                    email: user.emergencyContact?.email ?? "",
                            });

                    setEditingContact(false);
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
                >
                Cancel
                </button>

                <button
                type="button"
                onClick={() => {
                    onUpdateUser({
                    emergencyContact: {
                        name: contact.name.trim(),
                        phone: contact.phone.trim(),
                        email: contact.email.trim(),
                    },
                    });

                    setEditingContact(false);
                }}
                className="text-xs font-medium text-purple-500"
                >
                Save
                </button>
            </div>
            ) : (
            <button
                type="button"
                onClick={() => setEditingContact(true)}
                className="text-xs font-medium text-purple-500"
            >
                Edit
            </button>
            )}
        </div>

        {editingContact ? (
            <div className="w-full space-y-2">
            <input
                type="text"
                value={contact.name}
                placeholder="Name"
                onChange={(event) =>
                setContact((previous) => ({
                    ...previous,
                    name: event.target.value,
                }))
                }
                className="block w ww-full w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />

            <input
                type="tel"
                value={contact.phone}
                placeholder="Phone"
                onChange={(event) =>
                setContact((previous) => ({
                    ...previous,
                    phone: event.target.value,
                }))
                }
                className="block w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />

            <input
                type="email"
                value={contact.email}
                placeholder="Email"
                onChange={(event) =>
                setContact((previous) => ({
                    ...previous,
                    email: event.target.value,
                }))
                }
                className="block w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
            </div>
        ) : user.emergencyContact ? (
            <div className="space-y-1 text-sm text-gray-700">
            <p>{user.emergencyContact.name}</p>
            <p>{user.emergencyContact.phone}</p>

            {user.emergencyContact.email && (
                <p className="break-words">
                {user.emergencyContact.email}
                </p>
            )}
            </div>
        ) : (
            <p className="text-sm text-gray-400">
            No emergency contact
            </p>
        )}
        </Card>

      {/* History */}
      <Card className="w-full">
        <p className="mb-3 text-xs text-gray-400">
          History
        </p>

        {sortedHistory.length > 0 ? (
        <ul className="space-y-2">
            {visibleHistory.map((activity) => (
            <li
                key={activity.id}
                className="rounded-lg border border-gray-100 p-3"
            >
                <button
                    type="button"
                    onClick={() => onSelectHistory(activity.location)}
                    className="text-left text-sm font-medium text-gray-700 hover:text-purple-600 hover:underline"
                    >
                    {activity.title}
                </button>

                <div className="mt-1 flex justify-between gap-2">
                <span className="text-xs text-gray-400">
                    {activity.time}
                </span>

                {activity.duration && (
                    <span className="text-xs text-gray-400">
                    {activity.duration}
                    </span>
                )}
                </div>
            </li>
            ))}
        </ul>
        ) : (
        <p className="text-sm text-gray-400">
            No recent activity
        </p>
        )}

        {sortedHistory.length > 2 && (
        <button
            type="button"
            onClick={() => setShowAllHistory((previous) => !previous)}
            className="mx-auto mt-4 block rounded-full border border-gray-200 px-4 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
        >
            {showAllHistory ? "Show less" : "Show more"}
        </button>
        )}
      </Card>
    </div>
  );
}