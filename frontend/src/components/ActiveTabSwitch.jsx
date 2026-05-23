import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="tabs tabs-boxed bg-transparent p-2 m-2 gap-1 flex justify-between">
      <button
        onClick={() => setActiveTab("chats")}
        className={`tab flex-1 ${
          activeTab === "chats" 
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" 
            : "text-purple-400 hover:text-purple-300"
        }`}
      >
        Chats
      </button>

      <button
        onClick={() => setActiveTab("groups")}
        className={`tab flex-1 ${
          activeTab === "groups" 
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" 
            : "text-purple-400 hover:text-purple-300"
        }`}
      >
        Groups
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className={`tab flex-1 ${
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