"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Card from "@/components/shared/Card";

export default function AdminSettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-wenav-dark">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your admin account and preferences.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="font-semibold text-wenav-dark mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              <input type="text" value="Admin" readOnly className="w-full px-4 py-2.5 bg-wenav-gray rounded-wenav text-sm text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value="placeholder@email.com" readOnly className="w-full px-4 py-2.5 bg-wenav-gray rounded-wenav text-sm text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
              <input type="text" value="Administrator" readOnly className="w-full px-4 py-2.5 bg-wenav-gray rounded-wenav text-sm text-gray-700" />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-wenav-dark mb-4">Notification Preferences</h2>
          <div className="space-y-3">
            {["New incident reports", "Status changes", "User activity alerts", "System notifications"].map((pref) => (
              <label key={pref} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">{pref}</span>
                <div className="relative">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-emerald-500 transition-colors cursor-pointer" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform cursor-pointer" />
                </div>
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-wenav-dark mb-4">Account</h2>
          <div className="space-y-3">
            <button className="text-sm text-wenav-purple font-medium hover:text-wenav-purple/80 transition-colors">Change password</button>
            <div className="border-t border-gray-100 pt-3">
              <button onClick={handleLogout} className="text-sm text-red-500 font-medium hover:text-red-600 transition-colors">Log out</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
