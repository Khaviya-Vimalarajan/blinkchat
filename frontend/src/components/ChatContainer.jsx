import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
  const { selectedUser, getMessagesByUserId, messages, isMessagesLoading } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
  }, [selectedUser, getMessagesByUserId]);
  return (
    <div className="flex flex-col h-full bg-purple-950/20">
      <ChatHeader />
      <div className="flex-1 px-6 overflow-y-auto py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-4xl mx-auto space-y-6 pb-4">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"} group animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className="chat-image avatar hidden sm:block">
                  <div className="w-9 h-9 rounded-full border border-purple-800 shadow-sm">
                    <img 
                      src={msg.senderId === authUser._id 
                        ? authUser.profilePic || "/avatar.png" 
                        : selectedUser.profilePic || "/avatar.png"} 
                      alt="Avatar" 
                      className="object-cover"
                    />
                  </div>
                </div>
                
                <div className="chat-header mb-1 text-[11px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div
                  className={`chat-bubble flex flex-col relative shadow-md ${
                    msg.senderId === authUser._id
                      ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl rounded-tr-sm"
                      : "bg-purple-900 border border-purple-800/50 text-purple-100 rounded-2xl rounded-tl-sm"
                  } ${msg.image && !msg.text ? "p-1 bg-transparent border-none shadow-none" : ""}`}
                >
                  {msg.image && (
                    <div className={`${msg.text ? "mb-2 mt-1" : ""}`}>
                      <img 
                        src={msg.image} 
                        alt="Shared" 
                        className="rounded-xl max-w-[240px] sm:max-w-xs md:max-w-sm h-auto object-cover shadow-sm border border-purple-800/30" 
                      />
                    </div>
                  )}
                  {msg.text && <p className="text-[15px] leading-relaxed">{msg.text}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      <MessageInput />
    </div>
  );
}

export default ChatContainer;