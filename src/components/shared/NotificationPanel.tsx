"use client";

import { X, Bell } from "lucide-react";

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  return (
    <>
      {/* Backdrop */}
      {/* <div className="fixed inset-0 z-50 bg-black/20" onClick={onClose} /> */}

      {/* Panel */}
      <div className="flex h-full w-80 flex-shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-wenav-dark">Notifications</h2>

          <button
            type="button" 
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-wenav-gray hover:text-gray-600"
            aria-label="Close notifications"
          >
            <X size={18} />
          </button>
        </div>

        {/* Empty state */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 text-center">
          <Bell size={20} className="mb-3 text-gray-400" />
          <p className="text-sm text-gray-500">No notifications yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Notifications from your users will appear here.
          </p>
        </div>
      </div>
    </>
  );
}
