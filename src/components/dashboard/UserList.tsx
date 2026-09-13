import Card from "@/components/shared/Card";

export type User = {
  id: string;
  name: string;
  status: "ACTIVE" | "IDLE" | "OFFLINE";
  profileImage: string | null;
  battery: number;
  lastUpdated: string;
};

type UserListProps = {
  users: User[];
  selectedUserId: string | null;
  onSelectUser: (user: User) => void;
};

export default function UserList({
  users,
  selectedUserId,
  onSelectUser,
}: UserListProps) {
  return (
    <Card className="w-72">
      <h2 className="text-sm text-gray-400">
        My Users ({users.length})
      </h2>

      <ul>
        {users.map((user) => {
          const isSelected = selectedUserId === user.id;

          return (
            <li
              key={user.id}
              className="border-b border-gray-100 last:border-0"
            >
              <button
                type="button"
                onClick={() => onSelectUser(user)}
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors ${
                  isSelected ? "bg-purple-100" : "hover:bg-gray-50"
                }`}
              >
                {/* Profile */}
                <div className="h-9 w-9 text-gray-800 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full text-gray-800 items-center justify-center text-sm font-medium text-gray-500">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* User information */}
                <div className="flex flex-1 items-center justify-between">
                  <p className="text-sm text-gray-800 font-medium">{user.name}</p>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        user.status === "ACTIVE"
                          ? "bg-green-500"
                          : user.status === "IDLE"
                            ? "bg-orange-400"
                            : "bg-gray-400"
                      }`}
                    />

                    <span className="text-xs capitalize text-gray-400">
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