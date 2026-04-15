"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Card from "@/components/shared/Card";

export default function SettingsPage() {
  const { user, role, logout, updateName, changePassword } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const nameChanged = name !== (user?.displayName || "");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-wenav-dark">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account and notification preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <h2 className="font-semibold text-wenav-dark mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaved(false); }}
                className="w-full px-4 py-2.5 bg-wenav-gray rounded-wenav text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {nameChanged && (
                <button
                  onClick={async () => {
                    setSaving(true);
                    await updateName(name);
                    setSaving(false);
                    setSaved(true);
                  }}
                  disabled={saving}
                  className="mt-2 text-sm text-wenav-purple font-medium hover:text-wenav-purple/80 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save name"}
                </button>
              )}
              {saved && !nameChanged && (
                <p className="mt-1 text-xs text-green-600">Name updated!</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="w-full px-4 py-2.5 bg-wenav-gray rounded-wenav text-sm text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Role
              </label>
              <input
                type="text"
                value={role === "admin" ? "Admin" : "User"}
                readOnly
                className="w-full px-4 py-2.5 bg-wenav-gray rounded-wenav text-sm text-gray-700"
              />
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <h2 className="font-semibold text-wenav-dark mb-4">
            Notification Preferences
          </h2>
          <div className="space-y-3">
            {[
              "Incident reports",
              "Status updates",
              "Low battery alerts",
              "Walking activity",
              "Location sharing changes",
            ].map((pref) => (
              <label
                key={pref}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-gray-700">{pref}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-wenav-purple transition-colors cursor-pointer" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform cursor-pointer" />
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Account actions */}
        <Card>
          <h2 className="font-semibold text-wenav-dark mb-4">Account</h2>
          <div className="space-y-3">
            <button
              onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordError(""); setPasswordSuccess(false); }}
              className="text-sm text-wenav-purple font-medium hover:text-wenav-purple/80 transition-colors"
            >
              Change password
            </button>
            {showPasswordForm && (
              <div className="space-y-3 pt-2">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full px-4 py-2.5 bg-wenav-gray rounded-wenav text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 characters)"
                  className="w-full px-4 py-2.5 bg-wenav-gray rounded-wenav text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
                {passwordSuccess && <p className="text-green-600 text-xs">Password updated!</p>}
                <button
                  onClick={async () => {
                    setPasswordError("");
                    setPasswordSuccess(false);
                    if (newPassword.length < 8) {
                      setPasswordError("New password must be at least 8 characters");
                      return;
                    }
                    setChangingPassword(true);
                    try {
                      await changePassword(currentPassword, newPassword);
                      setPasswordSuccess(true);
                      setCurrentPassword("");
                      setNewPassword("");
                    } catch (err: unknown) {
                      const code = (err as { code?: string }).code;
                      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
                        setPasswordError("Current password is incorrect");
                      } else {
                        setPasswordError("Failed to change password. Please try again");
                      }
                    } finally {
                      setChangingPassword(false);
                    }
                  }}
                  disabled={changingPassword || !currentPassword || !newPassword}
                  className="text-sm bg-wenav-dark text-white px-4 py-2 rounded-wenav font-medium hover:bg-wenav-dark/90 disabled:opacity-50"
                >
                  {changingPassword ? "Updating..." : "Update password"}
                </button>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3">
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 font-medium hover:text-red-600 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
