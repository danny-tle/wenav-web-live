"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Bell,
  Search,
  ChevronDown,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";

import NotificationPanel from "@/components/shared/NotificationPanel";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Users",
    href: "/dashboard/my-users",
    icon: Users,
  },
  {
    label: "View Incidents",
    href: "/dashboard/incidents",
    icon: FileText,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [showNotifications, setShowNotifications] =
    useState(false);

  // Sidebar open/close
  const [isOpen, setIsOpen] = useState(false);

  const displayName = user?.displayName || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleToggleSidebar = () => {
    setIsOpen((previous) => !previous);
    setShowNotifications(false);
  };

  return (
    <>
      <aside
        className={`relative z-[1000] flex h-full flex-shrink-0 flex-col border-r border-gray-100 bg-white transition-[width] duration-300 ${
          isOpen ? "w-64" : "w-20"
        }`}
      >
        {/* User information */}
        <div className="h-[116px] flex-shrink-0 border-b border-gray-100 p-3">
          {/* Profile and notification row */}
          <div className="flex h-10 w-full flex-nowrap items-center justify-between">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-lg text-left"
              aria-label="Open user menu"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-wenav-gray">
                <span className="text-xs font-semibold text-gray-500">
                  {initial}
                </span>
              </div>

              {isOpen && (
                <div className="flex min-w-0 items-center gap-1">
                  <span className="truncate text-sm font-medium">
                    {displayName}
                  </span>

                  <ChevronDown
                    size={14}
                    className="flex-shrink-0 text-gray-400"
                  />
                </div>
              )}
            </button>

            {/* Right side notification */}
            {isOpen && (
              <button
                type="button"
                onClick={() =>
                  setShowNotifications((previous) => !previous)
                }
                className="relative flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-wenav-gray"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={18} />

                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </button>
            )}
          </div>

          {/* Search */}
          {isOpen ? (
            <div className="mt-3 flex h-10 items-center rounded-lg bg-wenav-gray px-3">
              <Search
                size={16}
                className="mr-2 flex-shrink-0 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search..."
                autoFocus
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="mt-3 flex h-10 w-full items-center justify-center rounded-lg bg-wenav-gray text-gray-400 transition-colors hover:bg-gray-200"
              aria-label="Open search"
              title="Search"
            >
              <Search size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!isOpen ? item.label : undefined}
                className={`mb-1 flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  isOpen
                    ? "gap-3 px-3"
                    : "justify-center px-2"
                } ${
                  isActive
                    ? "bg-wenav-purple text-white"
                    : "text-gray-600 hover:bg-wenav-gray"
                }`}
              >
                <Icon
                  size={18}
                  className="flex-shrink-0"
                />

                {isOpen && (
                  <span className="whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom open/close button */}
        <div className="flex-shrink-0 border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={handleToggleSidebar}
            className={`flex w-full items-center rounded-lg py-2.5 text-gray-500 transition-colors hover:bg-wenav-gray ${
              isOpen
                ? "gap-3 px-3"
                : "justify-center px-2"
            }`}
            aria-label={
              isOpen ? "Close sidebar" : "Open sidebar"
            }
            title={
              isOpen ? "Close sidebar" : "Open sidebar"
            }
          >
            {isOpen ? (
              <PanelLeftClose
                size={18}
                className="flex-shrink-0"
              />
            ) : (
              <PanelLeftOpen
                size={18}
                className="flex-shrink-0"
              />
            )}

            {isOpen && (
              <span className="whitespace-nowrap text-sm">
                Close sidebar
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Notification panel for closing */}
      {showNotifications && isOpen && (
        <NotificationPanel
          onClose={() => setShowNotifications(false)}
        />
      )}
    </>
  );
}