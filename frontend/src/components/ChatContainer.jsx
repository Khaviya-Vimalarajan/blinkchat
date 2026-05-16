import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
  const { selectedUser, getMessagesByUserId, messages, isMessagesLoading } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
  }, [selectedUser, getMessagesByUserId]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
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
                
                <div className="chat-header mb-1">
                  <time className="text-xs text-purple-400 opacity-80 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>

                <div
                  className={`chat-bubble flex flex-col ${
                    msg.senderId === authUser._id
                      ? "bg-purple-500 text-white shadow-sm"
                      : "bg-purple-800 text-purple-50 shadow-sm"
                  } ${msg.image && !msg.text ? "p-1.5 bg-purple-500/80" : ""}`}
                >
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="Attachment" 
                      className="sm:max-w-[220px] rounded-lg object-cover" 
                    />
                  )}
                  {msg.text && <p className={`leading-relaxed ${msg.image ? "mt-2" : ""}`}>{msg.text}</p>}
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
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