import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";

function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser } = useChatStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <div
          key={chat._id}
          className="bg-purple-500/10 p-3 rounded-xl cursor-pointer hover:bg-purple-500/20 transition-all duration-300"
          onClick={() => setSelectedUser(chat)}
        >
          <div className="flex items-center gap-3">
            <div className="avatar online">
              <div className="size-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500">
                <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium truncate">{chat.fullName}</h4>
              <p className="text-purple-300 text-xs truncate">{chat.lastMessage || "Click to start chatting"}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatsList;