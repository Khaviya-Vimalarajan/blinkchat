import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import CreateGroupModal from "./CreateGroupModal";
import EditGroupModal from "./EditGroupModal"; 
import { Users, Plus, Edit2 } from "lucide-react";

function GroupsList() {
  const { getMyGroups, groups, isGroupsLoading, setSelectedUser, selectedUser } = useChatStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    getMyGroups();
  }, [getMyGroups]);

  const handleEditGroup = (e, group) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  };

  if (isGroupsLoading && groups.length === 0) return <UsersLoadingSkeleton />;

  return (
    <div className="space-y-4">
      {/* Create Group Button */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 text-purple-200 hover:text-white hover:from-purple-600/50 hover:to-pink-600/50 transition-all duration-300 shadow-md font-semibold text-xs tracking-wider active:scale-[0.98]"
      >
        <Plus size={16} />
        <span>CREATE NEW GROUP</span>
      </button>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-center py-8 text-purple-400/60 flex flex-col items-center gap-2">
          <Users size={32} className="opacity-40 animate-pulse" />
          <p className="text-xs">No groups yet. Create one above!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            const isSelected = selectedUser && selectedUser.isGroup && selectedUser._id === group._id;
            return (
              <div
                key={group._id}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-300 group relative ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-600/20 to-pink-600/10 border border-purple-500/30"
                    : group.unreadCount > 0
                    ? "bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30"
                    : "bg-purple-500/10 hover:bg-purple-500/20 border border-transparent"
                }`}
                onClick={() => setSelectedUser({ ...group, isGroup: true })}
              >
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full overflow-hidden bg-gradient-to-tr from-purple-700 to-pink-500 flex items-center justify-center border border-purple-500/40 shrink-0">
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm tracking-wider">
                        {group.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`font-medium truncate text-sm ${group.unreadCount > 0 ? 'text-white font-semibold' : 'text-white'}`}>
                        {group.name}
                      </h4>
                      <span className="text-xs text-purple-400 shrink-0">
                        {group.members?.length || 0} members
                      </span>
                    </div>
                    
                    <p className={`text-xs truncate mt-0.5 ${group.unreadCount > 0 ? 'text-purple-200 font-medium' : 'text-purple-300'}`}>
                      {group.lastMessage || "No messages yet"}
                    </p>
                  </div>
                  
                  {/* Edit Button */}
                  <button
                    onClick={(e) => handleEditGroup(e, group)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-purple-500/30 transition-all duration-200 shrink-0"
                    title="Edit Group"
                  >
                    <Edit2 className="w-4 h-4 text-purple-300" />
                  </button>
                  
                  {/* Unread Badge */}
                  {group.unreadCount > 0 && (
                    <div className="shrink-0">
                      <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center shadow-md">
                        {group.unreadCount > 99 ? '99+' : group.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && <CreateGroupModal onClose={() => setIsCreateModalOpen(false)} />}
      {isEditModalOpen && selectedGroup && (
        <EditGroupModal 
          group={selectedGroup} 
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedGroup(null);
          }} 
        />
      )}
    </div>
  );
}

export default GroupsList;