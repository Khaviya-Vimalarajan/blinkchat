import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { Image, Send, X, Zap } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, isSoundEnabled, blinkMode, setBlinkMode } = useChatStore();
  const { playRandomKeyStrokeSound } = useKeyboardSound();

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!navigator.onLine) {
      toast.error("No network connection! Failed to send message.", { icon: "📶" });
      return;
    }
    if (!text.trim() && !imagePreview) return;
    
    if (isSoundEnabled) playRandomKeyStrokeSound();

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full bg-purple-950/50 backdrop-blur-md border-t border-purple-900/50">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-xl border border-purple-800/50 shadow-sm"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-purple-800 flex items-center justify-center hover:bg-purple-700 transition-colors shadow-md"
              type="button"
            >
              <X className="size-3.5 text-purple-200" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-3xl mx-auto">
        <div className={`flex-1 flex items-center gap-2 bg-purple-900/50 rounded-full px-4 py-2.5 border transition-all duration-300 shadow-inner ${
          !isOnline 
            ? "border-red-950/40 bg-purple-950/20" 
            : blinkMode !== "off"
            ? "border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.35)] ring-1 ring-pink-500/30"
            : "border-purple-800/50 focus-within:border-pink-500/50 focus-within:ring-1 focus-within:ring-pink-500/50"
        }`}>
          <input
            type="text"
            className="w-full bg-transparent text-purple-100 text-sm focus:outline-none placeholder:text-purple-400/50 disabled:opacity-40 disabled:cursor-not-allowed"
            placeholder={!isOnline ? "You are offline. Waiting for connection..." : blinkMode !== "off" ? `Send a disappearing message (${blinkMode}s)...` : "Type a message..."}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              isSoundEnabled && playRandomKeyStrokeSound();
            }}
            disabled={!isOnline}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={!isOnline}
          />
          
          {/* Blink Mode Toggle */}
          <button
            type="button"
            className={`p-1.5 rounded-full transition-all relative disabled:opacity-30 disabled:cursor-not-allowed ${
              blinkMode !== "off"
                ? "text-pink-400 bg-pink-500/10 hover:bg-pink-500/20"
                : "text-purple-400 hover:bg-purple-800/80"
            }`}
            onClick={handleToggleBlinkMode}
            disabled={!isOnline}
            title={!isOnline ? "Unavailable offline" : blinkMode === "off" ? "Enable Blink Mode" : `Blink Mode: ${blinkMode}s`}
          >
            <Zap size={18} className={blinkMode !== "off" ? "animate-pulse scale-110" : ""} />
            {blinkMode !== "off" && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                {blinkMode}s
              </span>
            )}
          </button>

          <button
            type="button"
            className={`p-1.5 rounded-full hover:bg-purple-800/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              imagePreview ? "text-pink-400" : "text-purple-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
            disabled={!isOnline}
            title={!isOnline ? "Unavailable offline" : "Upload Image"}
          >
            <Image size={18} />
          </button>
        </div>
        <button
          type="submit"
          disabled={(!text.trim() && !imagePreview) || !isOnline}
          className="p-3.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full text-white hover:from-purple-500 hover:to-pink-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-pink-900/20"
          title={!isOnline ? "You are offline" : "Send Message"}
        >
          <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;