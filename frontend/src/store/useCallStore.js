import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ]
};

let iceCandidatesQueue = [];
let callingTimeout = null;

function clearCallingTimeout() {
  if (callingTimeout) {
    clearTimeout(callingTimeout);
    callingTimeout = null;
  }
}

export const useCallStore = create((set, get) => ({
  callStatus: "idle", // 'idle' | 'calling' | 'ringing' | 'connected'
  callType: "video", // 'video' | 'audio'
  remoteUser: null, // remote user info { _id, fullName, profilePic }
  callerSignal: null,
  localStream: null,
  remoteStream: null,
  pc: null,
  isMuted: false,
  isCameraOff: false,

  // Socket instance reference helper
  getSocket: () => useAuthStore.getState().socket,

  initiateCall: async (targetUser, type = "video") => {
    const socket = get().getSocket();
    if (!socket) {
      toast.error("Socket not connected");
      return;
    }

    set({
      callStatus: "calling",
      callType: type,
      remoteUser: targetUser,
      isMuted: false,
      isCameraOff: false,
    });

    try {
      let stream;
      try {
        if (type === "video") {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        }
      } catch (mediaError) {
        if (type === "video") {
          console.warn("Failed to get video stream, trying audio only:", mediaError);
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          set({ callType: "audio" });
          toast("Camera not found or blocked. Starting audio-only call.", { icon: "⚠️" });
        } else {
          throw mediaError;
        }
      }

      set({ localStream: stream });

      // Create Peer Connection
      const pc = new RTCPeerConnection(configuration);
      set({ pc });

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        console.log("Receiver remote track:", event.streams[0]);
        set({ remoteStream: event.streams[0] });
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("iceCandidate", {
            to: targetUser._id,
            candidate: event.candidate,
          });
        }
      };

      // Create and set local description (SDP Offer)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const authUser = useAuthStore.getState().authUser;
      
      // Emit the offer to receiver
      socket.emit("callUser", {
        userToCall: targetUser._id,
        signalData: offer,
        from: {
          _id: authUser._id,
          fullName: authUser.fullName,
          profilePic: authUser.profilePic,
        },
        type,
      });

      // Start a 30-second calling timeout (approx 6 rings) to cancel the call if there is no answer
      clearCallingTimeout();
      callingTimeout = setTimeout(() => {
        if (get().callStatus === "calling") {
          toast("No Answer", { icon: "📞" });
          get().cancelCall();
        }
      }, 30000);

    } catch (error) {
      console.error("Error initiating call:", error);
      toast.error("Could not access camera or microphone");
      get().cleanup();
    }
  },

  acceptCall: async () => {
    const socket = get().getSocket();
    const { remoteUser, callerSignal, callType } = get();
    if (!socket || !remoteUser) return;

    set({ callStatus: "connected" });

    try {
      let stream;
      try {
        if (callType === "video") {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        }
      } catch (mediaError) {
        if (callType === "video") {
          console.warn("Failed to get video stream on accept, trying audio only:", mediaError);
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          set({ callType: "audio" });
          toast("Camera not found or blocked. Connecting audio-only.", { icon: "⚠️" });
        } else {
          throw mediaError;
        }
      }

      set({ localStream: stream });

      const pc = new RTCPeerConnection(configuration);
      set({ pc });

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        console.log("Caller remote track:", event.streams[0]);
        set({ remoteStream: event.streams[0] });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("iceCandidate", {
            to: remoteUser._id,
            candidate: event.candidate,
          });
        }
      };

      // Set Remote Description (the offer)
      await pc.setRemoteDescription(new RTCSessionDescription(callerSignal));

      // Process queued candidates
      if (iceCandidatesQueue.length > 0) {
        for (const candidate of iceCandidatesQueue) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Error adding queued ICE candidate:", e);
          }
        }
        iceCandidatesQueue = [];
      }

      // Create SDP answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Emit SDP answer
      socket.emit("answerCall", {
        to: remoteUser._id,
        signalData: answer,
      });

    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Failed to establish call connection");
      get().declineCall();
    }
  },

  declineCall: () => {
    const socket = get().getSocket();
    const { remoteUser } = get();
    if (socket && remoteUser) {
      socket.emit("declineCall", { to: remoteUser._id });
    }
    get().cleanup();
  },

  cancelCall: () => {
    const socket = get().getSocket();
    const { remoteUser } = get();
    if (socket && remoteUser) {
      socket.emit("declineCall", { to: remoteUser._id });
    }
    get().cleanup();
  },

  endCall: () => {
    const socket = get().getSocket();
    const { remoteUser } = get();
    if (socket && remoteUser) {
      socket.emit("endCall", { to: remoteUser._id });
    }
    get().cleanup();
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // Toggle enabled state
        set({ isMuted: !isMuted });
      }
    }
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isCameraOff; // Toggle enabled state
        set({ isCameraOff: !isCameraOff });
      }
    }
  },

  cleanup: () => {
    const { localStream, remoteStream, pc } = get();
    
    clearCallingTimeout();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    if (pc) {
      pc.close();
    }

    iceCandidatesQueue = [];

    set({
      callStatus: "idle",
      callType: "video",
      remoteUser: null,
      callerSignal: null,
      localStream: null,
      remoteStream: null,
      pc: null,
      isMuted: false,
      isCameraOff: false,
    });
  },

  subscribeToCalls: (socket) => {
    if (!socket) return;

    socket.off("incomingCall");
    socket.on("incomingCall", ({ signal, from, type }) => {
      const { callStatus } = get();
      // If user is already in a call or ringing, auto-decline with busy tone behavior
      if (callStatus !== "idle") {
        socket.emit("declineCall", { to: from._id });
        return;
      }

      set({
        callStatus: "ringing",
        remoteUser: from,
        callerSignal: signal,
        callType: type,
      });

      // Play ringing sound
      // (Optional: add a ringing sound here if needed)
    });

    socket.off("callAccepted");
    socket.on("callAccepted", async ({ signal }) => {
      const { pc } = get();
      if (!pc) return;

      clearCallingTimeout();

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        set({ callStatus: "connected" });

        // Process queued ICE candidates
        if (iceCandidatesQueue.length > 0) {
          for (const candidate of iceCandidatesQueue) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error("Error adding queued ICE candidate:", e);
            }
          }
          iceCandidatesQueue = [];
        }
      } catch (error) {
        console.error("Error setting remote description on callAccepted:", error);
        toast.error("Failed to connect call");
        get().cleanup();
      }
    });

    socket.off("callDeclined");
    socket.on("callDeclined", () => {
      clearCallingTimeout();
      toast.error("Call declined");
      get().cleanup();
    });

    socket.off("callEnded");
    socket.on("callEnded", () => {
      clearCallingTimeout();
      toast("Call ended", { icon: "📞" });
      get().cleanup();
    });

    socket.off("iceCandidate");
    socket.on("iceCandidate", async ({ candidate }) => {
      const { pc } = get();
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      } else {
        iceCandidatesQueue.push(candidate);
      }
    });
  },

  unsubscribeFromCalls: (socket) => {
    if (!socket) return;
    socket.off("incomingCall");
    socket.off("callAccepted");
    socket.off("callDeclined");
    socket.off("callEnded");
    socket.off("iceCandidate");
  },
}));
