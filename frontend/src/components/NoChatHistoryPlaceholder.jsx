import { MessageCircleIcon, Sparkles } from "lucide-react";

const NoChatHistoryPlaceholder = ({ name }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in duration-500">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full animate-pulse"></div>
        <div className="relative w-20 h-20 bg-gradient-to-br from-purple-900 to-purple-950 border border-purple-800/50 shadow-xl rounded-full flex items-center justify-center">
          <MessageCircleIcon className="size-10 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]" />
          <div className="absolute -top-1 -right-1">
            <Sparkles className="size-6 text-pink-400 animate-bounce" />
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-100 to-purple-300 bg-clip-text text-transparent mb-3 tracking-wide">
        Start your conversation with <span className="text-pink-500">{name}</span>
      </h3>
      
      <div className="flex flex-col space-y-4 max-w-sm mb-8">
        <p className="text-purple-300/80 text-sm leading-relaxed">
          This is the beginning of your conversation. Send a message or choose a quick starter below!
        </p>
        <div className="h-px w-full max-w-[200px] bg-gradient-to-r from-transparent via-purple-700 to-transparent mx-auto"></div>
      </div>
      
      <div className="flex flex-wrap gap-3 justify-center max-w-md">
        <button className="px-5 py-2.5 text-sm font-medium text-purple-100 bg-purple-900/80 border border-purple-800 hover:border-pink-500/50 hover:bg-purple-900 rounded-full transition-all duration-300 shadow-sm hover:shadow-pink-900/20 hover:-translate-y-0.5">
          <span className="mr-2">👋</span> Say Hello
        </button>
        <button className="px-5 py-2.5 text-sm font-medium text-purple-100 bg-purple-900/80 border border-purple-800 hover:border-pink-500/50 hover:bg-purple-900 rounded-full transition-all duration-300 shadow-sm hover:shadow-pink-900/20 hover:-translate-y-0.5">
          <span className="mr-2">🤝</span> How are you?
        </button>
        <button className="px-5 py-2.5 text-sm font-medium text-purple-100 bg-purple-900/80 border border-purple-800 hover:border-pink-500/50 hover:bg-purple-900 rounded-full transition-all duration-300 shadow-sm hover:shadow-pink-900/20 hover:-translate-y-0.5">
          <span className="mr-2">📅</span> Meet up soon?
        </button>
      </div>
    </div>
  );
};

export default NoChatHistoryPlaceholder;