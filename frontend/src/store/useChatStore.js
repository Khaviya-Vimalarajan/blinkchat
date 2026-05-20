import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  blinkMode: "off", // "off", 5, 10
  isSoundEnabled: localStorage.getItem("isSoundEnabled") !== null 
    ? JSON.parse(localStorage.getItem("isSoundEnabled")) 
    : true,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setBlinkMode: (blinkMode) => set({ blinkMode }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
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
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, blinkMode } = get();
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
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      isBlink,
      blinkDuration,
      isSeen: false,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    // immediately update the ui by adding the message
    set({ messages: [...messages, optimisticMessage] });
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      set({ messages: messages.concat(res.data) });
    } catch (error) {
      // remove optimistic message on failure
      set({ messages: messages });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  deleteMessage: async (messageId) => {
    set({ messages: get().messages.filter((msg) => msg._id !== messageId) });
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
    } catch (error) {
      console.warn("Failed to delete blink message on server:", error.message);
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
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return;
      
      set({ messages: [...get().messages, newMessage] });

      if (!newMessage.isBlink) {
        socket.emit("markAsSeen", {
          messageId: newMessage._id,
          senderId: selectedUser._id,
        });
      }
    });

    socket.off("messageDeleted");
    socket.on("messageDeleted", (messageId) => {
      set({ messages: get().messages.filter((msg) => msg._id !== messageId) });
    });

    socket.off("messagesSeen");
    socket.on("messagesSeen", ({ senderId, receiverId, seenAt }) => {
      if (selectedUser._id === receiverId) {
        const updatedMessages = get().messages.map((msg) => {
          if (msg.senderId === senderId && msg.receiverId === receiverId && !msg.isSeen) {
            return { ...msg, isSeen: true, seenAt };
          }
          return msg;
        });
        set({ messages: updatedMessages });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("messagesSeen");
  },

}));