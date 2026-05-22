import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";

function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <div className="space-y-2">
      {chats.map((chat) => {
        const isOnline = onlineUsers.includes(chat._id);
        return (
          <div
            key={chat._id}
            className="bg-purple-500/10 p-3 rounded-xl cursor-pointer hover:bg-purple-500/20 transition-all duration-300"
            onClick={() => setSelectedUser(chat)}
          >
            <div className="flex items-center gap-3">
              <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                <div className="size-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500">
                  <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium truncate">{chat.fullName}</h4>
                  {chat.unreadCount > 0 && (
                    <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center shadow-md shadow-pink-500/20 shrink-0 animate-pulse">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-purple-300 text-xs truncate mt-0.5">{chat.lastMessage || "Click to start chatting"}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ChatsList;