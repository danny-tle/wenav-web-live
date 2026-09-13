import Card from "@/components/shared/Card";
import type { User } from "@/components/dashboard/UserList";

type SelectedUserCardProps = {
  user: User;
};

export default function SelectedUserCard({
  user,
}: SelectedUserCardProps) {
  const statusColor =
    user.status === "ACTIVE"
      ? "bg-green-500"
      : user.status === "IDLE"
        ? "bg-orange-400"
        : "bg-gray-400";

  return (
    <Card className="w-full">
      <p className="mb-4 text-sm text-gray-400">
        Selected User
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Profile */}
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-purple-300">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-purple-900">
                {user.name.charAt(0)}
              </span>
            )}
          </div>

          <p className="text-sm font-medium">
            {user.name}
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${statusColor}`}
          />

          <span className="text-xs capitalize text-gray-500">
            {user.status.toLowerCase()}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Last updated {user.lastUpdated}
      </p>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          Vest battery
        </span>

        <span className="text-gray-500">
          {user.battery}%
        </span>
      </div>
    </Card>
  );
}