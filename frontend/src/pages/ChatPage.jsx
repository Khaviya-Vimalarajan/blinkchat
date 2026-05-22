import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import { useEffect } from "react";

function ChatPage() {
  const { activeTab, selectedUser, subscribeToMessages, unsubscribeFromMessages, getAllContacts } = useChatStore();
  const { socket } = useAuthStore();

  useEffect(() => {
    getAllContacts();
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
    };
  }, [subscribeToMessages, unsubscribeFromMessages, getAllContacts, socket]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const handleRequestPermission = () => {
        if (Notification.permission === "default") {
          Notification.requestPermission().catch(console.error);
        }
        document.removeEventListener("click", handleRequestPermission);
      };

      if (Notification.permission === "default") {
        document.addEventListener("click", handleRequestPermission);
        return () => {
          document.removeEventListener("click", handleRequestPermission);
        };
      }
    }
  }, []);

  return (
    <div className="relative w-full max-w-6xl h-[800px]">
      <BorderAnimatedContainer>
        {/* LEFT SIDE - SIDEBAR */}
        <div className="w-80 bg-purple-900/30 backdrop-blur-sm flex flex-col border-r border-purple-500/30">
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT SIDE - CHAT AREA */}
        <div className="flex-1 flex flex-col bg-purple-950/20 backdrop-blur-sm">
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;