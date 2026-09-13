"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Users, Plus, X } from "lucide-react";

const MapWrapper = dynamic(() => import("@/components/shared/MapWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white animate-pulse rounded-wenav" />
  ),
});

type PairedUser = {
  id: string;
  name: string;
};

const users: PairedUser[] = [];

export default function MyUsersPage() {
  const [showPairing, setShowPairing] = useState(false);
  const [pairingCode, setPairingCode] = useState(["", "", "", ""]);

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...pairingCode];
    newCode[index] = value;
    setPairingCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      const next = document.getElementById(`code-${index + 1}`);
      next?.focus();
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
                <Plus size={16} />
                Add User
              </button>
            </div>
          </div>

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
          <MapWrapper scrollWheelZoom={true} />
        </div>
      </div>

      {/* Pairing Code Modal */}
      {showPairing && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[2000]"
            onClick={() => setShowPairing(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2010] bg-white rounded-wenav p-8 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-wenav-dark">
                Enter pairing code
              </h2>
              <button
                onClick={() => setShowPairing(false)}
                className="p-1 hover:bg-wenav-gray rounded-lg"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Enter the code provided by your user to connect to their account.
            </p>

            <div className="flex gap-3 justify-center mb-8">
              {pairingCode.map((digit, i) => (
                <input
                  key={i}
                  id={`code-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeInput(i, e.target.value)}
                  className="w-16 h-20 text-center text-2xl font-bold border-2 border-gray-200 rounded-wenav focus:border-wenav-purple focus:ring-2 focus:ring-wenav-purple/20 outline-none transition-colors"
                />
              ))}
            </div>

            <button className="w-full py-3.5 bg-wenav-dark text-white font-semibold rounded-wenav hover:bg-wenav-dark/90 transition-colors">
              Connect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
