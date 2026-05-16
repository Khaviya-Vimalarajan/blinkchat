import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="tabs tabs-boxed bg-transparent p-2 m-2">
      <button
        onClick={() => setActiveTab("chats")}
        className={`tab ${
          activeTab === "chats" 
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" 
            : "text-purple-400 hover:text-purple-300"
        }`}
      >
        Chats
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className={`tab ${
          activeTab === "contacts" 
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" 
            : "text-purple-400 hover:text-purple-300"
        }`}
      >
        Contacts
      </button>
    </div>
  );
}

export default ActiveTabSwitch;