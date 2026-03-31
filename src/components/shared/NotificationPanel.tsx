"use client";

import { X, Bell } from "lucide-react";

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-wenav-dark">Notifications</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-wenav-gray rounded-lg transition-colors"
            aria-label="Close notifications"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-wenav-gray flex items-center justify-center mb-4">
            <Bell size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No notifications yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Notifications from your users will appear here.
          </p>
        </div>
      </div>
    </>
  );
}
