import Message from "../models/Message.js";
import User from "../models/User.js";

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

<<<<<<< Updated upstream
    // Mark any unseen messages sent by the user to me as seen
    await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, isSeen: false },
=======
    // Mark any unseen messages sent by the user to me as seen (exclude blink messages)
    const result = await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, isSeen: false, isBlink: false },
>>>>>>> Stashed changes
      { $set: { isSeen: true, seenAt: now } }
    );

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
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

    // todo: send message in real-time if user is online - socket.io

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

    // Check if the user is either the sender or receiver
    if (
      message.senderId.toString() !== userId.toString() &&
      message.receiverId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // find all the messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
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

    res.status(200).json(chatPartners);
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
        });
      }
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in markMessageAsSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};