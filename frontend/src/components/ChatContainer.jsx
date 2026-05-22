import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { Lock, Eye, Clock, Smile, CornerUpRight, Trash2, Search, X, Check } from "lucide-react";
import toast from "react-hot-toast";

function BlinkMessage({
  msg,
  authUser,
  selectedUser,
  deleteMessage,
  deleteMessageForMyself,
  toggleReaction,
  markMessageAsSeen,
  onForward,
  onShowReactionDetails,
  allContacts = [],
}) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const bubbleRef = useRef(null);

  useEffect(() => {
    if (!msg.isBlink) return;

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

  const handleMouseLeave = () => {
    setShowEmojiPicker(false);
    setShowDeleteMenu(false);
  };

  useEffect(() => {
    if (!showEmojiPicker && !showDeleteMenu) return;

    const handleDocumentClick = (e) => {
      // If clicking inside the message bubble (including the action buttons or picker), do nothing
      if (bubbleRef.current && bubbleRef.current.contains(e.target)) {
        return;
      }
      setShowEmojiPicker(false);
      setShowDeleteMenu(false);
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [showEmojiPicker, showDeleteMenu]);

  if (msg.isBlink && timeLeft !== null && timeLeft <= 0) {
    return null;
  }

  const isSender = msg.senderId === authUser._id;

  const handleReveal = async () => {
    if (isRevealing || msg.isSeen) return;
    setIsRevealing(true);
    try {
      await markMessageAsSeen(msg._id);
    } catch (err) {
      console.error("Failed to reveal message:", err);
    } finally {
      setIsRevealing(false);
    }
  };

  const canInteract = !msg.isBlink || isSender || msg.isSeen;

  return (
    <div
      className={`chat ${isSender ? "chat-end" : "chat-start"} group/message relative animate-in fade-in slide-in-from-bottom-2 duration-300`}
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
        {/* Seen / Sent / Pending indicator for sender messages */}
        {isSender && !msg.isBlink && (
          <span 
            className="inline-flex items-center ml-0.5 select-none animate-in fade-in duration-200" 
            title={msg.isOptimistic ? "Sending..." : msg.isSeen ? `Seen at ${new Date(msg.seenAt || msg.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Sent"}
          >
            {msg.isOptimistic ? (
              <Clock className="w-3.5 h-3.5 text-purple-400 opacity-40 animate-spin" />
            ) : msg.isSeen ? (
              <span className="flex text-pink-400 opacity-90 transition-all duration-300 scale-105">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <Check className="w-3.5 h-3.5 stroke-[3] -ml-2" />
              </span>
            ) : (
              <span className="text-purple-400 opacity-50">
                <Check className="w-3.5 h-3.5 stroke-[2]" />
              </span>
            )}
          </span>
        )}
      </div>

      {msg.isBlink && !isSender && !msg.isSeen ? (
        /* Secured Locked View for Receiver */
        <div className="chat-bubble bg-purple-950/40 border border-pink-500/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 max-w-xs shadow-lg shadow-purple-950/50">
          <div className="p-3 bg-pink-500/10 rounded-full text-pink-400 border border-pink-500/20 animate-pulse">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-xs text-purple-100 font-semibold">Disappearing Message</p>
            <p className="text-[10px] text-purple-400 mt-0.5">Disappears {msg.blinkDuration}s after opening</p>
          </div>
          <button
            onClick={handleReveal}
            disabled={isRevealing}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:from-purple-800 disabled:to-pink-800 text-white rounded-full text-xs font-semibold tracking-wide transition-all duration-300 shadow-md shadow-pink-900/10 active:scale-95 disabled:scale-100 disabled:opacity-60"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isRevealing ? "Revealing..." : "Reveal Message"}</span>
          </button>
        </div>
      ) : (
        /* Regular Message View */
        <div
          ref={bubbleRef}
          onMouseLeave={handleMouseLeave}
          className={`chat-bubble flex flex-col relative group/bubble ${
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
            <div className="mt-1.5 flex items-center justify-end text-[9px] text-pink-300 font-semibold gap-1 select-none">
              {msg.isSeen ? (
                <span className="animate-pulse flex items-center gap-1 bg-pink-500/15 px-1.5 py-0.5 rounded-md border border-pink-500/20">
                  <Clock className="w-2.5 h-2.5" />
                  Disappearing in {timeLeft !== null ? `${timeLeft}s` : `${msg.blinkDuration}s`}
                </span>
              ) : (
                <span className="flex items-center gap-1 opacity-70 bg-purple-900/45 px-1.5 py-0.5 rounded-md">
                  <Lock className="w-2.5 h-2.5" />
                  Sent (Locked until read)
                </span>
              )}
            </div>
          )}

          {/* Reactions display */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onShowReactionDetails(msg);
              }}
              className="absolute -bottom-2.5 right-2.5 flex flex-wrap gap-1 bg-purple-900/95 backdrop-blur-md rounded-full px-2 py-0.5 border border-purple-500/40 text-[10px] shadow-md select-none z-10 group/reactions-badge cursor-pointer hover:bg-purple-850 hover:border-purple-400/50 transition-all duration-200"
            >
              {/* Custom Animated Reactions Tooltip on Hover */}
              <div className="absolute bottom-[calc(100%-2px)] right-0 hidden group-hover/reactions-badge:flex flex-col bg-purple-950/95 backdrop-blur-md border border-purple-500/45 text-[10px] text-purple-100 rounded-xl p-2.5 shadow-2xl z-30 whitespace-nowrap min-w-[120px] animate-in fade-in slide-in-from-bottom-1 duration-200 pointer-events-auto">
                <span className="font-bold text-pink-400 border-b border-purple-500/20 pb-1 mb-1.5 flex items-center justify-between">
                  <span>Reactions</span>
                  <span className="text-[8px] opacity-75 font-normal text-purple-300 ml-2">Click to view all</span>
                </span>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {msg.reactions.map((r, idx) => {
                    const isMe = r.userId === authUser._id;
                    const name = isMe ? "You" : ((allContacts && allContacts.find((u) => u._id === r.userId)) || selectedUser).fullName;
                    return (
                      <div key={idx} className="flex items-center justify-between gap-3 py-0.5 hover:bg-purple-900/40 px-1 rounded transition-colors">
                        <span className="text-purple-200 font-medium">{name}</span>
                        <span className="text-xs">{r.emoji}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {Object.entries(
                msg.reactions.reduce((acc, react) => {
                  acc[react.emoji] = (acc[react.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <span
                  key={emoji}
                  className="flex items-center gap-0.5 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReaction(msg._id, emoji);
                  }}
                  title="Click to toggle your reaction. Click badge body to see details."
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-[9px] font-semibold text-purple-200">{count}</span>}
                </span>
              ))}
            </div>
          )}

          {/* Hover Action Menu */}
          {canInteract && (
            <div
              className={`absolute top-1 ${
                isSender ? "right-full pr-2" : "left-full pl-2"
              } flex items-center gap-1 z-20 transition-all duration-200 ${
                showEmojiPicker || showDeleteMenu
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none group-hover/message:opacity-100 group-hover/message:pointer-events-auto delay-75 group-hover/message:delay-0"
              }`}
            >
              {/* Reactions Smiley Face */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
                  className="p-1.5 rounded-full bg-purple-900/80 border border-purple-700 text-purple-300 hover:text-white hover:bg-purple-700 transition-all shadow-sm"
                  title="Add Reaction"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-purple-950/95 border border-purple-500/40 rounded-full px-2 py-1 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-100">
                    {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReaction(msg._id, emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="hover:scale-125 active:scale-95 transition-transform duration-100 text-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Forward Message */}
              <button
                onClick={(e) => { e.stopPropagation(); onForward(msg); }}
                className="p-1.5 rounded-full bg-purple-900/80 border border-purple-700 text-purple-300 hover:text-white hover:bg-purple-700 transition-all shadow-sm"
                title="Forward Message"
              >
                <CornerUpRight className="w-3.5 h-3.5" />
              </button>

              {/* Delete Options */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteMenu(!showDeleteMenu); }}
                  className="p-1.5 rounded-full bg-purple-900/80 border border-purple-700 text-purple-300 hover:text-red-400 hover:bg-red-950/25 hover:border-red-900 transition-all shadow-sm"
                  title="Delete Options"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {showDeleteMenu && (
                  <div
                    className={`absolute bottom-8 ${
                      isSender ? "left-0" : "right-0"
                    } bg-purple-950/95 border border-purple-700 rounded-xl py-1 shadow-2xl z-30 w-32 text-[10px] text-purple-200 animate-in fade-in zoom-in-95 duration-100 flex flex-col`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessageForMyself(msg._id);
                        setShowDeleteMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-purple-850/60 transition-colors"
                    >
                      Delete for myself
                    </button>
                    {isSender && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMessage(msg._id);
                          setShowDeleteMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-red-950/50 text-red-400 border-t border-purple-900/50 transition-colors"
                      >
                        Delete for everyone
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    deleteMessage,
    deleteMessageForMyself,
    toggleReaction,
    markMessageAsSeen,
    allContacts,
    chats,
    sendMessage,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // States for Forwarding message
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [selectedForwardUsers, setSelectedForwardUsers] = useState([]);
  const [forwardSearchQuery, setForwardSearchQuery] = useState("");
  const [reactionDetailMessage, setReactionDetailMessage] = useState(null);

  const handleForwardOpen = (msg) => {
    setMessageToForward(msg);
    setForwardModalOpen(true);
    setSelectedForwardUsers([]);
    setForwardSearchQuery("");
  };

  const handleToggleForwardUser = (userId) => {
    if (selectedForwardUsers.includes(userId)) {
      setSelectedForwardUsers(selectedForwardUsers.filter((id) => id !== userId));
    } else {
      setSelectedForwardUsers([...selectedForwardUsers, userId]);
    }
  };

  const handleSendForward = async () => {
    if (!messageToForward) return;
    const text = messageToForward.text || "";
    const image = messageToForward.image || null;

    try {
      for (const targetId of selectedForwardUsers) {
        await sendMessage({ text, image }, targetId);
      }
      toast.success(`Message forwarded successfully`);
    } catch (err) {
      toast.error("Failed to forward message");
    } finally {
      setForwardModalOpen(false);
      setMessageToForward(null);
      setSelectedForwardUsers([]);
    }
  };

  // Filter contacts by search query
  const filteredContacts = allContacts.filter((contact) =>
    contact.fullName.toLowerCase().includes(forwardSearchQuery.toLowerCase())
  );

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
  }, [selectedUser, getMessagesByUserId]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online! Reconnecting...", { icon: "📶" });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Connection lost. Working offline.", { icon: "📶" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-purple-950/20 relative">
      <ChatHeader />
      {!isOnline && (
        <div className="bg-red-500/25 border-b border-red-500/40 text-red-200 px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 select-none animate-in slide-in-from-top duration-300">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>No internet connection. Waiting for network...</span>
        </div>
      )}
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
                deleteMessageForMyself={deleteMessageForMyself}
                toggleReaction={toggleReaction}
                markMessageAsSeen={markMessageAsSeen}
                onForward={handleForwardOpen}
                onShowReactionDetails={setReactionDetailMessage}
                allContacts={allContacts}
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

      {/* Forward Message Modal */}
      {forwardModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-purple-950/95 border border-purple-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-100 flex items-center gap-2">
                <CornerUpRight className="w-5 h-5 text-pink-400 animate-pulse" />
                Forward Message
              </h3>
              <button
                onClick={() => {
                  setForwardModalOpen(false);
                  setMessageToForward(null);
                  setSelectedForwardUsers([]);
                }}
                className="p-1 rounded-full text-purple-400 hover:text-purple-100 hover:bg-purple-900/50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-purple-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search contacts..."
                value={forwardSearchQuery}
                onChange={(e) => setForwardSearchQuery(e.target.value)}
                className="w-full bg-purple-900/40 border border-purple-700/60 rounded-xl py-2 pl-9 pr-4 text-sm text-purple-100 placeholder-purple-405 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredContacts.length === 0 ? (
                <p className="text-center text-purple-400 text-sm py-4">No contacts found</p>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedForwardUsers.includes(contact._id);
                  return (
                    <div
                      key={contact._id}
                      onClick={() => handleToggleForwardUser(contact._id)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-200 ${
                        isSelected
                          ? "bg-purple-500/20 border-purple-500"
                          : "bg-purple-900/20 border-transparent hover:bg-purple-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={contact.profilePic || "/avatar.png"}
                          alt={contact.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-purple-800"
                        />
                        <span className="text-sm font-medium text-purple-100">{contact.fullName}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-pink-500 border-transparent text-white"
                            : "border-purple-500/50"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer / Send Button */}
            <div className="mt-4 pt-4 border-t border-purple-900/60 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setForwardModalOpen(false);
                  setMessageToForward(null);
                  setSelectedForwardUsers([]);
                }}
                className="px-4 py-2 rounded-xl text-purple-300 hover:text-purple-100 hover:bg-purple-900/30 transition-all text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={selectedForwardUsers.length === 0}
                onClick={handleSendForward}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:from-purple-900 disabled:to-pink-950 disabled:opacity-50 text-white font-semibold text-xs tracking-wide transition-all shadow-md active:scale-95 disabled:scale-100"
              >
                Forward ({selectedForwardUsers.length})
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reactions Detail Modal */}
      {reactionDetailMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-purple-950/95 border border-purple-500/30 rounded-2xl w-full max-w-xs p-5 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[400px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-purple-900/60 pb-3">
              <h3 className="text-md font-semibold text-purple-100 flex items-center gap-2">
                <span>Message Reactions</span>
              </h3>
              <button
                onClick={() => setReactionDetailMessage(null)}
                className="p-1 rounded-full text-purple-400 hover:text-purple-100 hover:bg-purple-900/50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of reactions */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {reactionDetailMessage.reactions.map((react, idx) => {
                const isMe = react.userId === authUser._id;
                const user = isMe ? authUser : ((allContacts && allContacts.find((u) => u._id === react.userId)) || selectedUser);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-purple-900/20 border border-purple-800/40 hover:bg-purple-900/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-purple-800"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-purple-100">
                          {isMe ? `${user.fullName} (You)` : user.fullName}
                        </span>
                        <span className="text-[10px] text-purple-400">
                          {isMe ? "Sent a reaction" : "Reacted to your message"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl filter drop-shadow animate-bounce">{react.emoji}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatContainer;