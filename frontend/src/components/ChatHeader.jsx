import { XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div className="flex justify-between items-center bg-purple-950/60 backdrop-blur-xl border-b border-purple-900/80 py-4 px-6 shrink-0 shadow-sm z-10">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-purple-900 shadow-md bg-purple-900">
            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} className="object-cover w-full h-full" />
          </div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-purple-950 rounded-full shadow-sm"></span>
        </div>

        <div>
          <h3 className="text-purple-100 font-semibold tracking-wide text-sm">{selectedUser.fullName}</h3>
          <p className="text-emerald-500 text-xs font-medium mt-0.5">
            Online
          </p>
        </div>
      </div>

      <button 
        onClick={() => setSelectedUser(null)}
        className="p-2 rounded-full hover:bg-purple-900/80 text-purple-400 hover:text-purple-100 transition-all duration-200"
      >
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
export default ChatHeader;