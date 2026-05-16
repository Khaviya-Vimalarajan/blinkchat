import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, isSoundEnabled } = useChatStore();
  const { playRandomKeyStrokeSound } = useKeyboardSound();

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
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
        <div className="flex-1 flex items-center gap-2 bg-purple-900/50 rounded-full px-4 py-2.5 border border-purple-800/50 focus-within:border-pink-500/50 focus-within:ring-1 focus-within:ring-pink-500/50 transition-all shadow-inner">
          <input
            type="text"
            className="w-full bg-transparent text-purple-100 text-sm focus:outline-none placeholder:text-purple-400/70"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              isSoundEnabled && playRandomKeyStrokeSound();
            }}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className={`p-1.5 rounded-full hover:bg-purple-800/80 transition-colors ${
              imagePreview ? "text-pink-400" : "text-purple-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="p-3.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full text-white hover:from-purple-500 hover:to-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-pink-900/20"
        >
          <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;