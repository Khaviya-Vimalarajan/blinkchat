import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Camera, Users, Info } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

function EditGroupModal({ group, onClose }) {
  const { getMyGroups, setSelectedUser, selectedUser } = useChatStore();
  const [name, setName] = useState(group.name || "");
  const [description, setDescription] = useState(group.description || "");
  const [avatar, setAvatar] = useState(group.avatar || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await axiosInstance.put(`/groups/${group._id}`, {
        name: name.trim(),
        description: description.trim(),
        avatar: avatar,
      });

      await getMyGroups();
      
      if (selectedUser && selectedUser._id === group._id && selectedUser.isGroup) {
        setSelectedUser({ ...res.data, isGroup: true });
      }
      
      toast.success("Group updated successfully!");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-purple-950/95 border border-purple-500/30 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-purple-900/60 sticky top-0 bg-purple-950/95">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-purple-100">Edit Group</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-purple-400 hover:text-purple-100 hover:bg-purple-900/50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="flex justify-center">
            <div className="relative group cursor-pointer">
              <label htmlFor="group-avatar-upload" className="cursor-pointer block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-800 to-pink-600 flex items-center justify-center border-2 border-purple-500/50 shadow-inner overflow-hidden relative">
                  {avatar ? (
                    <img src={avatar} alt="Group Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Camera className="w-8 h-8 text-purple-200 opacity-80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </label>
              <input
                id="group-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <div className="bg-purple-900/20 rounded-xl p-4 space-y-3 border border-purple-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-purple-400" />
              <label className="text-xs font-semibold text-purple-300">Group Information</label>
            </div>
            
            <div>
              <input
                type="text"
                placeholder="Group name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-purple-900/40 border border-purple-700/60 rounded-xl py-2.5 px-3 text-sm text-purple-100 placeholder-purple-400/40 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              />
            </div>
            
            <div>
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-purple-900/40 border border-purple-700/60 rounded-xl py-2.5 px-3 text-sm text-purple-100 placeholder-purple-400/40 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/60 text-purple-200 font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating || !name.trim()}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:opacity-50 text-white font-semibold text-sm tracking-wide transition-all shadow-md"
            >
              {isUpdating ? "Updating..." : "Update Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditGroupModal;