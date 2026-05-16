import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <div className="space-y-2">
      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="bg-purple-500/10 p-3 rounded-xl cursor-pointer hover:bg-purple-500/20 transition-all duration-300"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="size-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500">
                <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-purple-900 animate-pulse"></div>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium">{contact.fullName}</h4>
              <p className="text-purple-300 text-xs">Click to start chat</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ContactList;