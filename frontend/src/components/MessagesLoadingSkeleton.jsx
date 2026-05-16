function MessagesLoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-4">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className={`chat ${index % 2 === 0 ? "chat-start" : "chat-end"} animate-pulse`}
        >
          <div className="chat-image avatar hidden sm:block">
            <div className="w-9 h-9 rounded-full bg-purple-900 border border-purple-800/50"></div>
          </div>
          <div className={`chat-bubble ${index % 2 === 0 ? "bg-purple-900/80 rounded-2xl rounded-tl-sm border border-purple-800/30" : "bg-purple-700/50 rounded-2xl rounded-tr-sm"} text-transparent w-32 h-12 shadow-sm`}></div>
        </div>
      ))}
    </div>
  );
}
export default MessagesLoadingSkeleton;