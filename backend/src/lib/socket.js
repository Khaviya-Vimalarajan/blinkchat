import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import Message from "../models/Message.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ENV.NODE_ENV !== "production") {
        return callback(null, true);
      }
      const allowedOrigins = [
        ENV.CLIENT_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
      ];
      if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("http://localhost:")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

// Map of online users: { userId: socketId }
const userSocketMap = {};

export function getReceiverSocketId(receiverId) {
  return userSocketMap[receiverId ? receiverId.toString() : ""];
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }

  // Broadcast online users to everyone
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("markAsSeen", async ({ messageId, senderId }) => {
    try {
      const now = new Date();
      await Message.updateOne(
        { _id: messageId, isSeen: false },
        { $set: { isSeen: true, seenAt: now } }
      );
      
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          senderId,
          receiverId: socket.handshake.query.userId,
          seenAt: now,
        });
      }
    } catch (error) {
      console.error("Error in markAsSeen socket handler:", error.message);
    }
  });

  // Call / Video Call signaling handlers
  socket.on("callUser", ({ userToCall, signalData, from, type }) => {
    const receiverSocketId = getReceiverSocketId(userToCall);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", {
        signal: signalData,
        from,
        type,
      });
    }
  });

  socket.on("answerCall", ({ to, signalData }) => {
    const callerSocketId = getReceiverSocketId(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callAccepted", {
        signal: signalData,
      });
    }
  });

  socket.on("declineCall", ({ to }) => {
    const targetSocketId = getReceiverSocketId(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("callDeclined");
    }
  });

  socket.on("endCall", ({ to }) => {
    const targetSocketId = getReceiverSocketId(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("callEnded");
    }
  });

  socket.on("iceCandidate", ({ to, candidate }) => {
    const targetSocketId = getReceiverSocketId(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("iceCandidate", { candidate });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    if (userId) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
