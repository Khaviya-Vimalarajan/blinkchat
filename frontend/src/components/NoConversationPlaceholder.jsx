import { MessageCircleIcon, Sparkles } from "lucide-react";

const NoConversationPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in duration-500 bg-purple-950/20">
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-pink-500/10 blur-2xl rounded-full group-hover:bg-pink-500/20 transition-all duration-700"></div>
        <div className="relative w-24 h-24 bg-gradient-to-br from-purple-900 to-purple-950 border border-purple-800/50 shadow-2xl rounded-[2rem] rotate-3 group-hover:rotate-6 transition-transform duration-500 flex items-center justify-center">
          <MessageCircleIcon className="size-12 text-pink-500 drop-shadow-[0_0_12px_rgba(236,72,153,0.3)]" />
          <div className="absolute -top-2 -right-2">
            <Sparkles className="size-7 text-pink-400/80 animate-pulse" />
          </div>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-100 to-purple-300 bg-clip-text text-transparent mb-3 tracking-tight">
        Welcome to BlinkChat
      </h3>
      <p className="text-slate-400 max-w-md leading-relaxed text-sm">
        Select a conversation from the sidebar to start chatting, or invite your friends to join the blink!
      </p>
    </div>
  );
};

export default NoConversationPlaceholder;