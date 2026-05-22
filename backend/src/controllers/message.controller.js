import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    // Delete expired blink messages from the database before retrieving
    const now = new Date();
    await Message.deleteMany({
      isBlink: true,
      isSeen: true,
      $expr: {
        $lte: [
          { $add: ["$seenAt", { $multiply: ["$blinkDuration", 1000] }] },
          now,
        ],
      },
    });
    // Mark any unseen messages sent by the user to me as seen (exclude blink messages)
    const result = await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, isSeen: false, isBlink: false },
      { $set: { isSeen: true, seenAt: now } }
    );

    if (result.modifiedCount > 0) {
      const senderSocketId = getReceiverSocketId(userToChatId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          senderId: userToChatId,
          receiverId: myId,
          seenAt: now,
        });
      }
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedBy: { $ne: myId },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, isBlink, blinkDuration } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
     
    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    if (image) {
      imageUrl = image;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      isBlink: isBlink || false,
      blinkDuration: blinkDuration || 5,
    });

    await newMessage.save();

    // send message in real-time if user is online - socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only the sender can delete a message for everyone
    if (message.senderId.toString() !== userId.toString()) {
      // If it is a blink message and the request comes from the receiver, allow deletion
      if (message.isBlink && message.receiverId.toString() === userId.toString()) {
        // Allowed: receiver deleting an expired/active blink message
      } else {
        return res.status(403).json({ message: "Only the sender can delete this message for everyone" });
      }
    }

    await Message.findByIdAndDelete(messageId);

    // Send event in real-time to both sender and receiver so that it disappears instantly!
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", messageId);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // find all the messages where the logged-in user is either sender or receiver, and hasn't self-deleted the message
    const messages = await Message.find({
      $or: [
        { senderId: loggedInUserId, deletedBy: { $ne: loggedInUserId } },
        { receiverId: loggedInUserId, deletedBy: { $ne: loggedInUserId } },
      ],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

    const chatPartnersWithUnread = await Promise.all(
      chatPartners.map(async (partner) => {
        const unreadCount = await Message.countDocuments({
          senderId: partner._id,
          receiverId: loggedInUserId,
          isSeen: false,
          deletedBy: { $ne: loggedInUserId },
        });

        // Get last message in the chat that is not self-deleted
        const lastMsg = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: partner._id },
            { senderId: partner._id, receiverId: loggedInUserId },
          ],
          deletedBy: { $ne: loggedInUserId },
        }).sort({ createdAt: -1 });

        let lastMessageText = "";
        if (lastMsg) {
          if (lastMsg.isBlink && !lastMsg.isSeen && lastMsg.senderId.toString() !== loggedInUserId.toString()) {
            lastMessageText = "⚡ Disappearing message";
          } else {
            lastMessageText = lastMsg.text || "📷 Image";
          }
        }

        return {
          ...partner.toObject(),
          unreadCount,
          lastMessage: lastMessageText || "Click to start chatting",
        };
      })
    );

    // Sort partners by their last message activity if possible, or keep original order
    res.status(200).json(chatPartnersWithUnread);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only the receiver can mark the message as seen
    if (message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to mark this message as seen" });
    }

    if (!message.isSeen) {
      message.isSeen = true;
      message.seenAt = new Date();
      await message.save();

      // Emit socket event to the sender so their UI updates in real-time
      const senderSocketId = getReceiverSocketId(message.senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          senderId: message.senderId,
          receiverId: userId,
          seenAt: message.seenAt,
          messageId: message._id, // Add this!
        });
      }
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in markMessageAsSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessageForMyself = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Verify user is sender or receiver of the message
    if (
      message.senderId.toString() !== userId.toString() &&
      message.receiverId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized to delete this message" });
    }

    // Add user to deletedBy array if not already present
    if (!message.deletedBy.includes(userId)) {
      message.deletedBy.push(userId);
      await message.save();
    }

    // Optimization: If both sender and receiver have deleted it for themselves, remove it from the DB
    const participantsDeleted = [message.senderId.toString(), message.receiverId.toString()];
    const allDeleted = participantsDeleted.every((id) =>
      message.deletedBy.some((delId) => delId.toString() === id)
    );

    if (allDeleted) {
      await Message.findByIdAndDelete(messageId);
    }

    res.status(200).json({ message: "Message deleted for yourself successfully" });
  } catch (error) {
    console.error("Error in deleteMessageForMyself controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleReaction = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Verify user is sender or receiver
    if (
      message.senderId.toString() !== userId.toString() &&
      message.receiverId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized to react to this message" });
    }

    // Check if the user already reacted
    const existingReactionIndex = message.reactions.findIndex(
      (react) => react.userId.toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      const existingReaction = message.reactions[existingReactionIndex];
      if (existingReaction.emoji === emoji) {
        // If it's the exact same emoji, remove it (toggle behavior)
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Otherwise, update the reaction to the new emoji
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Emit socket event to both sender and receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    const reactionPayload = {
      messageId,
      reactions: message.reactions,
    };

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReactionUpdate", reactionPayload);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageReactionUpdate", reactionPayload);
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in toggleReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};