import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description, avatar, members } = req.body;
    const creatorId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Ensure members is an array and contains the creator
    let groupMembers = Array.isArray(members) ? [...members] : [];
    if (!groupMembers.includes(creatorId.toString())) {
      groupMembers.push(creatorId.toString());
    }

    const newGroup = new Group({
      name: name.trim(),
      description: description ? description.trim() : "",
      avatar: avatar || "",
      creator: creatorId,
      members: groupMembers,
      admins: [creatorId],
    });

    const savedGroup = await newGroup.save();
    const populatedGroup = await Group.findById(savedGroup._id)
      .populate("members", "-password")
      .populate("admins", "-password");

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error in createGroup controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getMyGroups = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const loggedInUserId = req.user._id;

    // Find all groups where the user is a member with pagination
    const groups = await Group.find({ members: loggedInUserId })
      .populate("members", "-password")
      .populate("admins", "-password")
      .skip(skip)
      .limit(Number(limit));

    // Get total count for client-side pagination
    const totalCount = await Group.countDocuments({ members: loggedInUserId });

    // Enhance groups with last message activity and unreadCount
    const enhancedGroups = await Promise.all(
      groups.map(async (group) => {
        // Get last message (excluding deleted ones)
        const lastMsg = await Message.findOne({
          groupId: group._id,
          deletedBy: { $ne: loggedInUserId },
        })
          .sort({ createdAt: -1 })
          .populate("senderId", "fullName");

        let lastMessageText = "";
        if (lastMsg) {
          const senderName = lastMsg.senderId?._id?.toString() === loggedInUserId.toString()
            ? "You"
            : (lastMsg.senderId?.fullName || "Someone");
          lastMessageText = `${senderName}: ${lastMsg.text || "📷 Image"}`;
        }

        // Count unread messages for this group (messages not seen and not sent by current user)
        const unreadCount = await Message.countDocuments({
          groupId: group._id,
          isSeen: false,           // Not seen yet
          isBlink: false,          // Not blink messages
          senderId: { $ne: loggedInUserId }, // Not sent by current user
          deletedBy: { $ne: loggedInUserId }, // Not deleted by current user
        });

        return {
          ...group.toObject(),
          isGroup: true,
          lastMessage: lastMessageText || "No messages yet",
          unreadCount,
        };
      })
    );

    // Sort groups by latest message time
    enhancedGroups.sort((a, b) => {
      const getLatestTime = (group) => {
        if (group.lastMessage && group.lastMessage !== "No messages yet") {
          return group.updatedAt || new Date(0);
        }
        return group.createdAt || new Date(0);
      };
      return getLatestTime(b) - getLatestTime(a);
    });

    res.status(200).json({ groups: enhancedGroups, totalCount, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error("Error in getMyGroups controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const loggedInUserId = req.user._id;

    // Verify group existence and membership
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    const isMember = group.members.some((mId) => mId.toString() === loggedInUserId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Unauthorized to view this group's messages" });
    }

    // Delete blink messages after the first member reads them
    await Message.deleteMany({
      groupId,
      isBlink: true,
      isSeen: false,
      deletedBy: { $ne: loggedInUserId },
    });

    // ✅ ADD THIS: Mark all non-blink messages as seen for this user in this group
    await Message.updateMany(
      {
        groupId,
        isSeen: false,
        isBlink: false,
        senderId: { $ne: loggedInUserId },
      },
      {
        $set: { isSeen: true }
      }
    );

    // Fetch remaining messages
    const messages = await Message.find({
      groupId,
      deletedBy: { $ne: loggedInUserId },
    })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a group member's profile (fullName, profilePic)
export const updateGroupMemberProfile = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { fullName, profilePic } = req.body;
    const user = await User.findById(memberId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (fullName !== undefined) user.fullName = fullName;
    if (profilePic !== undefined) user.profilePic = profilePic;
    await user.save();
    // Return updated user (without password)
    const updated = await User.findById(memberId).select("-password");
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating group member profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, avatar } = req.body;
    const userId = req.user._id;

    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member (any member can update)
    const isMember = group.members.some(memberId => 
      memberId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Only group members can update the group" });
    }

    // Update fields
    if (name && name.trim()) {
      group.name = name.trim();
    }
    if (description !== undefined) {
      group.description = description?.trim() || "";
    }
    if (avatar !== undefined) {
      group.avatar = avatar;
    }

    await group.save();

    // Populate the updated group
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "-password")
      .populate("admins", "-password");

    // Emit socket event to all group members
    const io = req.app.get("io");
    if (io) {
      group.members.forEach(memberId => {
        io.to(memberId.toString()).emit("groupUpdated", {
          groupId: group._id,
          updatedGroup
        });
      });
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in updateGroup controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required" });
    }

    // Check group membership
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((mId) => mId.toString() === senderId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Unauthorized to send messages to this group" });
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image,
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "fullName profilePic"
    );

    // Broadcast message to all other group members
    group.members.forEach((memberId) => {
      if (memberId.toString() !== senderId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("newMessage", populatedMessage);
        }
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};
