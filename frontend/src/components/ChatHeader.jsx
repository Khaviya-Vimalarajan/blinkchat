import { XIcon, Zap } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";
import toast from "react-hot-toast";

function ChatHeader() {
  const { selectedUser, setSelectedUser, blinkMode, setBlinkMode } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  const handleToggleBlinkMode = () => {
    const hasSeen = localStorage.getItem("hasSeenBlinkIntro");
    if (blinkMode === "off") {
      setBlinkMode(5);
      if (!hasSeen) {
        toast("Blink Mode: Messages disappear 5s after view!", { icon: "⚡" });
        localStorage.setItem("hasSeenBlinkIntro", "true");
      } else {
        toast("Blink Mode: 5s", { icon: "⚡" });
      }
    } else if (blinkMode === 5) {
      setBlinkMode(10);
      if (!hasSeen) {
        toast("Blink Mode: Messages disappear 10s after view!", { icon: "⚡" });
        localStorage.setItem("hasSeenBlinkIntro", "true");
      } else {
        toast("Blink Mode: 10s", { icon: "⚡" });
      }
    } else {
      setBlinkMode("off");
      toast("Blink Mode disabled", { icon: "📴" });
    }
  };

  return (
    <div className="flex justify-between items-center bg-purple-950/60 backdrop-blur-xl border-b border-purple-900/80 py-4 px-6 shrink-0 shadow-sm z-10">
      <div className="flex items-center space-x-4">
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-purple-900 shadow-md bg-purple-900">
            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} className="object-cover w-full h-full" />
          </div>
        </div>

        <div>
          <h3 className="text-purple-100 font-semibold tracking-wide text-sm">{selectedUser.fullName}</h3>
          <p className={`${isOnline ? "text-emerald-500" : "text-purple-400 opacity-60"} text-xs font-medium mt-0.5`}>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Blink Mode Toggle in Header */}
        <button
          onClick={handleToggleBlinkMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300 ${
            blinkMode !== "off"
              ? "bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.25)] animate-pulse"
              : "bg-purple-900/40 text-purple-400 border-purple-800/40 hover:bg-purple-800/50 hover:text-purple-300"
          }`}
        >
          <Zap size={14} className={blinkMode !== "off" ? "fill-pink-400 animate-bounce" : ""} />
          <span>Blink Mode: {blinkMode === "off" ? "OFF" : `${blinkMode}s`}</span>
        </button>

        <button 
          onClick={() => setSelectedUser(null)}
          className="p-2 rounded-full hover:bg-purple-900/80 text-purple-400 hover:text-purple-100 transition-all duration-200"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
export default ChatHeader;