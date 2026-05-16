function UsersLoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="bg-purple-500/10 p-3 rounded-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-purple-600/50 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-purple-600/30 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UsersLoadingSkeleton;