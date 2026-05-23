import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

// Pre-load a reusable Audio instance for notification sounds.
const notificationSound = new Audio("/sounds/notification.mp3");
notificationSound.preload = "auto";
let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
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
  groups: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,
  blinkMode: localStorage.getItem("blinkMode") !== null
    ? JSON.parse(localStorage.getItem("blinkMode"))
    : "off",
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

  getMyGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data.groups });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups", groupData);
      toast.success("Group created successfully!");
      await get().getMyGroups();
      set({ selectedUser: { ...res.data, isGroup: true } });
      set({ activeTab: "groups" });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  getMessagesByUserId: async (id) => {
    set({ isMessagesLoading: true });
    try {
      const selected = get().selectedUser;
      const isGroup = selected && selected.isGroup;
      const url = isGroup ? `/groups/${id}/messages` : `/messages/${id}`;
      const res = await axiosInstance.get(url);
      set({ messages: res.data });
      
      // Clear unreadCount badge locally after fetching messages
      if (isGroup) {
        set({
          groups: get().groups.map((g) =>
            g._id === id ? { ...g, unreadCount: 0 } : g
          ),
        });
      } else {
        set({
          chats: get().chats.map((c) =>
            c._id === id ? { ...c, unreadCount: 0 } : c
          ),
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData, receiverId = null) => {
    const targetUser = receiverId 
      ? (get().allContacts.find((c) => c._id === receiverId) || 
         get().chats.find((c) => c._id === receiverId) ||
         get().groups.find((g) => g._id === receiverId))
      : get().selectedUser;
      
    if (!targetUser) return;
    const { messages, blinkMode } = get();
    const { authUser } = useAuthStore.getState();
    const tempId = `temp-${Date.now()}`;
    
    const isGroup = !!targetUser.isGroup;
    const isBlink = isGroup ? false : (blinkMode !== "off");
    const blinkDuration = isGroup ? 5 : (blinkMode === "off" ? 5 : parseInt(blinkMode, 10));
    
    const payload = {
      ...messageData,
      isBlink,
      blinkDuration,
    };

    const optimisticMessage = {
      _id: tempId,
      senderId: {
        _id: authUser._id,
        fullName: authUser.fullName,
        profilePic: authUser.profilePic,
      },
      receiverId: isGroup ? null : targetUser._id,
      groupId: isGroup ? targetUser._id : null,
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
      const url = isGroup ? `/groups/${targetUser._id}/send` : `/messages/send/${targetUser._id}`;
      const res = await axiosInstance.post(url, payload);
      if (isCurrentChat) {
        set({ messages: get().messages.map(m => m._id === tempId ? res.data : m) });
      }
      if (isGroup) {
        await get().getMyGroups();
      } else {
        await get().getMyChatPartners();
      }
    } catch (error) {
      if (isCurrentChat) {
        set({ messages: get().messages.filter(m => m._id !== tempId) });
      }
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  deleteMessage: async (messageId) => {
    set({ messages: get().messages.filter((msg) => msg._id !== messageId) });
    if (typeof messageId === 'string' && messageId.startsWith('temp-')) {
      return;
    }
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      await get().getMyChatPartners();
      await get().getMyGroups();
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn('Message already deleted on server, ignored.');
      } else {
        console.warn('Failed to delete message for everyone on server:', error.message);
      }
    }
  },

  deleteMessageForMyself: async (messageId) => {
    set({ messages: get().messages.filter((msg) => msg._id !== messageId) });
    try {
      await axiosInstance.delete(`/messages/${messageId}/myself`);
      await get().getMyChatPartners();
      await get().getMyGroups();
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
      const isGroupMsg = !!newMessage.groupId;
      const isGroupChat = selectedUser && selectedUser.isGroup;
      const loggedInUserId = useAuthStore.getState().authUser?._id;
      
      // Don't show notification for own messages
      const isOwnMessage = newMessage.senderId?._id === loggedInUserId || 
                          newMessage.senderId === loggedInUserId;
      
      // Check if current chat is the one receiving the message
      const isCurrentChat = isGroupMsg
        ? (isGroupChat && selectedUser?._id === newMessage.groupId)
        : (!isGroupMsg && !isGroupChat && selectedUser && 
           (newMessage.senderId?._id || newMessage.senderId) === selectedUser._id);
      
      const isTabFocused = document.hasFocus();
      const isTabActive = !document.hidden && isTabFocused;
      const { isSoundEnabled } = get();

      // Play notification sound if enabled and not own message
      if (isSoundEnabled && !isOwnMessage) {
        playNotificationSound();
      }

      // Prepare notification content
      const notificationBody = newMessage.isBlink
        ? "⚡ Sent a disappearing message"
        : (newMessage.text || "📷 Image");

      let senderName = "New message";
      if (isGroupMsg) {
        const senderFullName = newMessage.senderId?.fullName || "Someone";
        const group = get().groups.find((g) => g._id === newMessage.groupId);
        const groupName = group ? group.name : "Group";
        senderName = `${groupName} - ${senderFullName}`;
      } else {
        const senderIdStr = newMessage.senderId?._id || newMessage.senderId;
        const senderContact = get().allContacts.find((c) => c._id === senderIdStr) || 
                              get().chats.find((c) => c._id === senderIdStr);
        senderName = senderContact ? senderContact.fullName : "Someone";
      }

      // Show notifications only if not currently viewing the chat and not own message
      if (!isCurrentChat && !isOwnMessage) {
        // Show toast notification
        toast(`${senderName}: ${notificationBody}`, {
          icon: isGroupMsg ? "👥" : "💬",
          duration: 3500,
        });

        // Update document title for visual alert
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

        // Desktop notification for background tab/window
        if ((document.hidden || !isTabFocused) && Notification.permission === "granted") {
          new Notification(senderName, {
            body: notificationBody,
            icon: isGroupMsg ? "/group-avatar.png" : (newMessage.senderId?.profilePic || "/avatar.png"),
            tag: isGroupMsg ? `group-${newMessage.groupId}` : `user-${newMessage.senderId}`,
          });
        }
      }

      // Update messages if we're in the current chat
      if (isCurrentChat) {
        set({ messages: [...get().messages, newMessage] });
      }

      // Always refresh the appropriate sidebar list to update unread counts
      if (isGroupMsg) {
        get().getMyGroups();
      } else {
        get().getMyChatPartners();
      }
    });

    socket.off("messageDeleted");
    socket.on("messageDeleted", (messageId) => {
      set({ messages: get().messages.filter((msg) => msg._id !== messageId) });
      get().getMyChatPartners();
      get().getMyGroups();
    });

    socket.off("messagesSeen");
    socket.on("messagesSeen", ({ senderId, receiverId, seenAt, messageId }) => {
      const selectedUser = get().selectedUser;
      if (selectedUser && selectedUser._id === receiverId) {
        const updatedMessages = get().messages.map((msg) => {
          if (messageId && msg._id === messageId) {
            return { ...msg, isSeen: true, seenAt };
          }
          if (msg.isBlink) return msg;
          if (msg.senderId === senderId && msg.receiverId === receiverId && !msg.isSeen) {
            return { ...msg, isSeen: true, seenAt };
          }
          return msg;
        });
        set({ messages: updatedMessages });
      }
    });
    
     socket.off("groupUpdated");
     socket.on("groupUpdated", ({ groupId, updatedGroup }) => {

        set({
         groups: get().groups.map(group =>
          group._id === groupId ? { ...updatedGroup, isGroup: true } : group
       )
    });
  
  
    const selectedUser = get().selectedUser;
    if (selectedUser && selectedUser.isGroup && selectedUser._id === groupId) {
    set({ selectedUser: { ...updatedGroup, isGroup: true } });
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