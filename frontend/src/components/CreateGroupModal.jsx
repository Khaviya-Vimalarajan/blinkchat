import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Search, Camera, Check, Users, Info, Image } from "lucide-react";
import toast from "react-hot-toast";

function CreateGroupModal({ onClose }) {
  const contactsContainerRef = useRef(null);
  const modalRef = useRef(null);
  const { allContacts, createGroup } = useChatStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

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

  const handleToggleMember = (contactId) => {
    if (selectedMembers.includes(contactId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== contactId));
    } else {
      setSelectedMembers([...selectedMembers, contactId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim(),
        avatar,
        members: selectedMembers,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContacts = allContacts.filter((contact) =>
    contact.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = modalRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = modalRef.current.scrollHeight;
    }
  }, [selectedMembers]);
  
  useEffect(() => {
    if (contactsContainerRef.current) {
      contactsContainerRef.current.scrollTop = contactsContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (contactsContainerRef.current) {
      contactsContainerRef.current.scrollTop = contactsContainerRef.current.scrollHeight;
    }
  }, [selectedMembers]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div ref={modalRef} className="bg-purple-950/95 border border-purple-500/30 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-purple-900/60">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-purple-100">Create New Group</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-purple-400 hover:text-purple-100 hover:bg-purple-900/50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Avatar Upload - Centered Card */}
          <div className="flex justify-center">
            <div className="relative group cursor-pointer">
              <label htmlFor="group-avatar-upload" className="cursor-pointer block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-800 to-pink-600 flex items-center justify-center border-2 border-purple-500/50 shadow-inner overflow-hidden relative">
                  {avatar ? (
                    <img src={avatar} alt="Group Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Image className="w-8 h-8 text-purple-200 opacity-80" />
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

          {/* Group Information Card */}
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
                rows={2}
                className="w-full bg-purple-900/40 border border-purple-700/60 rounded-xl py-2.5 px-3 text-sm text-purple-100 placeholder-purple-400/40 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Members Selection Card */}
          <div className="bg-purple-900/20 rounded-xl border border-purple-700/30 overflow-hidden">
            <div className="p-4 border-b border-purple-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <label className="text-xs font-semibold text-purple-300">
                    Add Members
                  </label>
                </div>
                <span className="text-xs text-purple-400 bg-purple-900/40 px-2 py-1 rounded-full">
                  {selectedMembers.length} selected
                </span>
              </div>
            </div>

            <div className="p-3">
              {/* Search Input */}
              <div className="relative mb-3">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-purple-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onFocus={() => setShowContacts(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-purple-900/40 border border-purple-700/60 rounded-xl py-2 pl-8 pr-3 text-xs text-purple-100 placeholder-purple-400/40 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              {/* Contacts List */}
              {showContacts && (
                <div ref={contactsContainerRef} className="max-h-64 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {filteredContacts.length === 0 ? (
                    <p className="text-center text-purple-400/60 text-xs py-6">No contacts found</p>
                  ) : (
                    filteredContacts.map((contact) => {
                      const isChecked = selectedMembers.includes(contact._id);
                      return (
                        <div
                          key={contact._id}
                          onClick={() => handleToggleMember(contact._id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all duration-200 ${
                            isChecked
                              ? "bg-purple-500/20 border-purple-500"
                              : "bg-purple-900/20 border-transparent hover:bg-purple-900/45"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={contact.profilePic || "/avatar.png"}
                              alt={contact.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-purple-800"
                            />
                            <span className="text-sm font-medium text-purple-100">{contact.fullName}</span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                              isChecked
                                ? "bg-gradient-to-r from-purple-600 to-pink-500 border-transparent text-white"
                                : "border-purple-500/50"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-5 border-t border-purple-900/60 flex justify-end gap-3 bg-purple-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/60 text-purple-200 font-semibold text-sm transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:from-purple-900 disabled:to-pink-950 disabled:opacity-50 text-white font-semibold text-sm tracking-wide transition-all shadow-md active:scale-95 disabled:scale-100"
          >
            {isSubmitting ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupModal;