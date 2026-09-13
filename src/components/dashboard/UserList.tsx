import Card from "@/components/shared/Card";
import type { TrackedUser } from "@/lib/types";

type UserListProps = {
  users: TrackedUser[];
  selectedUserId: string | null;
  onSelectUser: (user: TrackedUser) => void;
};

export default function UserList({
  users,
  selectedUserId,
  onSelectUser,
}: UserListProps) {
  return (
    <Card className="w-40 px-2 py-2">
      <h2 className="text-sm text-gray-400">
        My Users ({users.length})
      </h2>

      <ul className="space-y-0">
        {users.map((user) => {
          const isSelected = selectedUserId === user.id;

          return (
            <li
              key={user.id}
              className="border-b border-gray-100"
            >
              <button
                type="button"
                onClick={() => onSelectUser(user)}
                className={`flex w-full items-center gap-2 rounded-lg text-left transition-colors ${
                  isSelected ? "bg-purple-100" : "hover:bg-gray-50"
                }`}
              >
                {/* Profile */}
                <div className="h-6 w-6 text-gray-800 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full text-gray-800 items-center justify-center text-xs font-medium text-gray-500">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* User information */}
                <div className="flex flex-1 items-center justify-between">
                  <p className="text-sm text-gray-800 font-medium">{user.name}</p>

                  <div className="flex items-center gap-1.5">
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                        user.status === "walking"
                          ? "bg-green-500"
                          : user.status === "idle"
                            ? "bg-orange-400"
                            : "bg-gray-400"
                      }`}
                    />

                    <span className="text-[11px] capitalize text-gray-400">
                      {user.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
