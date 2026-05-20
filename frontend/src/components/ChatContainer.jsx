import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function BlinkMessage({ msg, authUser, selectedUser, deleteMessage }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!msg.isBlink) return;

    // If it's not seen yet, it hasn't started counting down
    if (!msg.isSeen) {
      return;
    }

    const seenTime = new Date(msg.seenAt || msg.createdAt).getTime();
    const durationMs = msg.blinkDuration * 1000;

    const calculateTimeLeft = () => {
      const elapsed = Date.now() - seenTime;
      const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      return remaining;
    };

    const initialRemaining = calculateTimeLeft();
    setTimeLeft(initialRemaining);

    if (initialRemaining <= 0) {
      deleteMessage(msg._id);
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        deleteMessage(msg._id);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [msg.isBlink, msg.isSeen, msg.seenAt, msg.createdAt, msg.blinkDuration, msg._id, deleteMessage]);

  // If blink message is expired (timer reached 0), return null to hide it immediately
  if (msg.isBlink && timeLeft !== null && timeLeft <= 0) {
    return null;
  }

  const isSender = msg.senderId === authUser._id;

  return (
    <div
      className={`chat ${isSender ? "chat-end" : "chat-start"} group animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      <div className="chat-image avatar hidden sm:block">
        <div className="w-9 h-9 rounded-full border border-purple-800 shadow-sm">
          <img 
            src={isSender 
              ? authUser.profilePic || "/avatar.png" 
              : selectedUser.profilePic || "/avatar.png"} 
            alt="Avatar" 
            className="object-cover"
          />
        </div>
      </div>
      
      <div className="chat-header mb-1 flex items-center gap-1.5">
        <time className="text-xs text-purple-400 opacity-80 px-1">
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
        {msg.isBlink && (
          <span className="text-[9px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded-full border border-pink-500/30 flex items-center gap-1">
            ⚡ Blink
          </span>
        )}
      </div>

      <div
        className={`chat-bubble flex flex-col relative ${
          isSender
            ? "bg-purple-500 text-white shadow-sm"
            : "bg-purple-800 text-purple-50 shadow-sm"
        } ${msg.image && !msg.text ? "p-1.5 bg-purple-500/80" : ""} ${
          msg.isBlink ? "border border-pink-500/40" : ""
        }`}
      >
        {msg.image && (
          <img 
            src={msg.image} 
            alt="Attachment" 
            className="sm:max-w-[220px] rounded-lg object-cover" 
          />
        )}
        {msg.text && <p className={`leading-relaxed ${msg.image ? "mt-2" : ""}`}>{msg.text}</p>}

        {msg.isBlink && (
          <div className="mt-1 flex items-center justify-end text-[9px] text-pink-300 font-semibold gap-1 select-none">
            {msg.isSeen ? (
              <span className="animate-pulse flex items-center gap-1">
                ⏱️ Disappearing in {timeLeft !== null ? `${timeLeft}s` : `${msg.blinkDuration}s`}
              </span>
            ) : (
              <span className="flex items-center gap-1 opacity-70">
                🔒 Locked until read
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatContainer() {
  const { selectedUser, getMessagesByUserId, messages, isMessagesLoading, deleteMessage, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

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
              <BlinkMessage 
                key={msg._id} 
                msg={msg} 
                authUser={authUser} 
                selectedUser={selectedUser} 
                deleteMessage={deleteMessage} 
              />
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