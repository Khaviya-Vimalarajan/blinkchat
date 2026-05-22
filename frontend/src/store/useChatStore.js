import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

// Pre-load a reusable Audio instance for notification sounds.
// Reusing one instance (instead of creating new Audio() each time) lets us
// "unlock" it once on the first user interaction, so subsequent plays work
// even if the page was reloaded and no gesture has occurred yet.
const notificationSound = new Audio("/sounds/notification.mp3");
notificationSound.preload = "auto";
let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  // A silent play+pause "unlocks" the Audio element for future use
  const p = notificationSound.play();
  if (p) {
    p.then(() => {
      notificationSound.pause();
      notificationSound.currentTime = 0;
    }).catch(() => {});
  }
  audioUnlocked = true;
}

// Unlock audio on the very first user interaction
if (typeof document !== "undefined") {
  const handleFirstInteraction = () => {
    unlockAudio();
    document.removeEventListener("click", handleFirstInteraction);
    document.removeEventListener("keydown", handleFirstInteraction);
  };
  document.addEventListener("click", handleFirstInteraction);
  document.addEventListener("keydown", handleFirstInteraction);
}

function playNotificationSound() {
  notificationSound.currentTime = 0;
  notificationSound.play().catch((err) => console.log("Failed to play sound:", err));
}

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  blinkMode: localStorage.getItem("blinkMode") !== null
    ? JSON.parse(localStorage.getItem("blinkMode"))
    : "off", // "off", 5, 10
  isSoundEnabled: localStorage.getItem("isSoundEnabled") !== null 
    ? JSON.parse(localStorage.getItem("isSoundEnabled")) 
    : true,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setBlinkMode: (blinkMode) => {
    localStorage.setItem("blinkMode", JSON.stringify(blinkMode));
    set({ blinkMode });
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      // Instantly clear the unreadCount badge for this partner locally
      set({
        chats: get().chats.map((c) =>
          c._id === userId ? { ...c, unreadCount: 0 } : c
        ),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData, receiverId = null) => {
    const targetUser = receiverId 
      ? (get().allContacts.find((c) => c._id === receiverId) || get().chats.find((c) => c._id === receiverId))
      : get().selectedUser;
      
    if (!targetUser) return;
    const { messages, blinkMode } = get();
    const { authUser } = useAuthStore.getState();
    const tempId = `temp-${Date.now()}`;
    
    const isBlink = blinkMode !== "off";
    const blinkDuration = blinkMode === "off" ? 5 : parseInt(blinkMode, 10);
    
    const payload = {
      ...messageData,
      isBlink,
      blinkDuration,
    };

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: targetUser._id,
      text: messageData.text,
      image: messageData.image,
      isBlink,
      blinkDuration,
      isSeen: false,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    
    const isCurrentChat = get().selectedUser && get().selectedUser._id === targetUser._id;
    if (isCurrentChat) {
      set({ messages: [...messages, optimisticMessage] });
    }
    try {
      const res = await axiosInstance.post(`/messages/send/${targetUser._id}`, payload);
      if (isCurrentChat) {
        set({ messages: get().messages.map(m => m._id === tempId ? res.data : m) });
      }
      get().getMyChatPartners(); // Update sidebar list!
    } catch (error) {
      if (isCurrentChat) {
        set({ messages: get().messages.filter(m => m._id !== tempId) });
      }
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  deleteMessage: async (messageId) => {
    set({ messages: get().messages.filter((msg) => msg._id !== messageId) });
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      get().getMyChatPartners(); // Update sidebar list!
    } catch (error) {
      console.warn("Failed to delete message for everyone on server:", error.message);
    }
  },

  deleteMessageForMyself: async (messageId) => {
    set({ messages: get().messages.filter((msg) => msg._id !== messageId) });
    try {
      await axiosInstance.delete(`/messages/${messageId}/myself`);
      get().getMyChatPartners(); // Update sidebar list!
    } catch (error) {
      console.warn("Failed to delete message for myself on server:", error.message);
    }
  },

  toggleReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}/react`, { emoji });
      const updatedMsg = res.data;
      set({
        messages: get().messages.map((msg) =>
          msg._id === messageId ? { ...msg, ...updatedMsg } : msg
        ),
      });
    } catch (error) {
      console.warn("Failed to toggle reaction:", error.message);
    }
  },

  markMessageAsSeen: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}/seen`);
      const updatedMsg = res.data;
      set({
        messages: get().messages.map((msg) =>
          msg._id === messageId ? { ...msg, ...updatedMsg } : msg
        ),
      });
    } catch (error) {
      console.warn("Failed to mark message as seen:", error.message);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.on("newMessage", (newMessage) => {
      const selectedUser = get().selectedUser;
      const isChattingWithSender = selectedUser && newMessage.senderId === selectedUser._id;
      const isTabFocused = document.hasFocus();
      const isTabActive = !document.hidden && isTabFocused;

      // Always play notification sound for the receiver on any incoming message
      if (get().isSoundEnabled) {
        playNotificationSound();
      }

      // Hide content in notifications for disappearing messages to preserve privacy
      const notificationBody = newMessage.isBlink
        ? "⚡ Sent a disappearing message"
        : (newMessage.text || "📷 Image");

      if (!isChattingWithSender || !isTabActive) {
        // Trigger notifications
        const senderContact = get().allContacts.find((c) => c._id === newMessage.senderId) || 
                              get().chats.find((c) => c._id === newMessage.senderId);
        const senderName = senderContact ? senderContact.fullName : "New message";

        // Show in-app toast only if they are not active in that specific chat
        if (!isChattingWithSender) {
          toast(`${senderName}: ${notificationBody}`, {
            icon: "💬",
            duration: 3500,
          });
          // Refetch chat list to update order/states
          get().getMyChatPartners();
        }

        // Update document title for visual alert if not focused
        if (!isTabFocused || document.hidden) {
          const originalTitle = document.title;
          if (!originalTitle.startsWith("💬")) {
            document.title = `💬 (1) New Message!`;
            const handleFocus = () => {
              document.title = originalTitle;
              window.removeEventListener("focus", handleFocus);
            };
            window.addEventListener("focus", handleFocus);
          }
        }

        // Always show desktop notification if document is hidden/unfocused and permission is granted
        if ((document.hidden || !isTabFocused) && Notification.permission === "granted") {
          new Notification(senderName, {
            body: notificationBody,
            icon: senderContact?.profilePic || "/avatar.png",
          });
        }
      }

      if (isChattingWithSender) {
        set({ messages: [...get().messages, newMessage] });

        if (!newMessage.isBlink) {
          socket.emit("markAsSeen", {
            messageId: newMessage._id,
            senderId: selectedUser._id,
          });
        }
      }
    });

    socket.off("messageDeleted");
    socket.on("messageDeleted", (messageId) => {
      set({ messages: get().messages.filter((msg) => msg._id !== messageId) });
      get().getMyChatPartners(); // Update sidebar list!
    });

    socket.off("messagesSeen");
    socket.on("messagesSeen", ({ senderId, receiverId, seenAt, messageId }) => {
      const selectedUser = get().selectedUser;
      if (selectedUser && selectedUser._id === receiverId) {
        const updatedMessages = get().messages.map((msg) => {
          // If a specific blink message was seen, update it
          if (messageId && msg._id === messageId) {
            return { ...msg, isSeen: true, seenAt };
          }
          // Skip blink messages — their seen status is managed individually
          // via the "Reveal" button + markMessageAsSeen API, not bulk updates.
          // Without this guard, opening a chat would start the blink countdown
          // on the sender side before the receiver actually reveals the message.
          if (msg.isBlink) return msg;
          if (msg.senderId === senderId && msg.receiverId === receiverId && !msg.isSeen) {
            return { ...msg, isSeen: true, seenAt };
          }
          return msg;
        });
        set({ messages: updatedMessages });
      }
    });

    socket.off("messageReactionUpdate");
    socket.on("messageReactionUpdate", ({ messageId, reactions }) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("messagesSeen");
    socket.off("messageReactionUpdate");
  },

}));