import { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, ShieldAlert } from "lucide-react";
import { useCallStore } from "../store/useCallStore";

function ActiveCallScreen() {
  const {
    callStatus,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    endCall,
    cancelCall,
  } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus]);

  // Attach remote stream to audio element for audio-only calls
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream && callType === "audio") {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus, callType]);

  // Outgoing ringback sound for the caller (sender)
  useEffect(() => {
    if (callStatus !== "calling") return;

    let ringbackInterval;
    let audioCtx;

    const playRingback = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioCtx = new AudioContext();

        const triggerRingback = () => {
          if (!audioCtx || audioCtx.state === "closed") return;

          if (audioCtx.state === "suspended") {
            audioCtx.resume();
          }

          // Outgoing ringback: pleasant US/European 440Hz + 480Hz beat tone
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(440, audioCtx.currentTime);

          osc2.type = "sine";
          osc2.frequency.setValueAtTime(480, audioCtx.currentTime);

          // Standard ringback pattern: ring for 1.2s, fade out smoothly
          gain.gain.setValueAtTime(0, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.1); // lower volume for comfortable call ringback
          gain.gain.setValueAtTime(0.04, audioCtx.currentTime + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(audioCtx.destination);

          osc1.start();
          osc2.start();
          osc1.stop(audioCtx.currentTime + 1.6);
          osc2.stop(audioCtx.currentTime + 1.6);
        };

        // Ring once immediately
        triggerRingback();
        // Repeat ring every 4 seconds (standard ringback pause)
        ringbackInterval = setInterval(triggerRingback, 4000);
      } catch (err) {
        console.warn("Ringback playback blocked or unsupported:", err);
      }
    };

    playRingback();

    return () => {
      if (ringbackInterval) {
        clearInterval(ringbackInterval);
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [callStatus]);

  if (callStatus === "idle" || callStatus === "ringing") return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[9998] animate-fade-in select-none">
      <div className="relative w-full max-w-4xl h-full md:h-[650px] md:max-h-[90vh] bg-purple-950/20 md:border md:border-purple-800/40 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center">
        
        {/* ================= OUTGOING CALLING SCREEN ================= */}
        {callStatus === "calling" && (
          <div className="flex flex-col items-center justify-center text-center p-6 w-full h-full relative">
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping scale-125" />
              <div className="absolute -inset-4 rounded-full border border-purple-500/30 animate-pulse" />
              <div className="w-28 h-28 rounded-full border-4 border-purple-900 shadow-2xl bg-purple-900 flex items-center justify-center overflow-hidden relative z-10">
                {remoteUser?.profilePic ? (
                  <img
                    src={remoteUser.profilePic}
                    alt={remoteUser.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-4xl">
                    {remoteUser?.fullName.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white tracking-wide">{remoteUser?.fullName}</h3>
            <p className="text-purple-300/60 text-sm mt-2 mb-16 animate-pulse">
              Calling ({callType === "video" ? "Video" : "Audio"})...
            </p>

            {/* Cancel Call Button */}
            <button
              onClick={cancelCall}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 hover:scale-105 active:scale-95 flex items-center justify-center text-white transition-all duration-200 shadow-lg shadow-rose-950/50 cursor-pointer"
            >
              <PhoneOff size={28} />
            </button>
          </div>
        )}

        {/* ================= CONNECTED ACTIVE CALL SCREEN ================= */}
        {callStatus === "connected" && (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            
            {/* 1. Video Call Streams */}
            {callType === "video" ? (
              <div className="w-full h-full relative flex items-center justify-center">
                {/* Remote Video (Main background view) */}
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-950/40 text-center">
                    <div className="w-24 h-24 rounded-full bg-purple-900/80 flex items-center justify-center overflow-hidden mb-4 border border-purple-700">
                      {remoteUser?.profilePic ? (
                        <img src={remoteUser.profilePic} alt={remoteUser.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-2xl font-bold">{remoteUser?.fullName.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <p className="text-purple-300/80 text-sm">Connecting video stream...</p>
                  </div>
                )}

                {/* Local Video Preview (Floating PIP card) */}
                <div className="absolute top-4 right-4 w-28 h-40 md:w-36 md:h-48 rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl bg-black/90 z-20 transition-all duration-300 relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${isCameraOff ? "hidden" : ""}`}
                  />
                  {isCameraOff && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-purple-950/90 text-purple-400 absolute inset-0">
                      <VideoOff size={20} />
                      <span className="text-[10px] mt-1 font-semibold">Camera Off</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              
              /* 2. Audio Call View */
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-purple-950/80 to-black p-6 relative">
                
                {/* Audio Connection Pulsing Wave */}
                <div className="relative flex items-center justify-center mb-8">
                  {/* Wave ripples */}
                  <div className="absolute w-44 h-44 rounded-full border border-purple-500/20 animate-ping" />
                  <div className="absolute w-36 h-36 rounded-full border border-purple-500/30 animate-pulse" />
                  <div className="absolute w-28 h-28 rounded-full bg-purple-500/10 animate-pulse" />
                  
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full border-4 border-purple-800 shadow-2xl bg-purple-900 flex items-center justify-center overflow-hidden relative z-10">
                    {remoteUser?.profilePic ? (
                      <img
                        src={remoteUser.profilePic}
                        alt={remoteUser.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-3xl">
                        {remoteUser?.fullName.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white tracking-wide">{remoteUser?.fullName}</h3>
                <p className="text-emerald-400 text-xs font-semibold mt-2 tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                  Connected
                </p>

                {/* Local preview stream in audio mode (hidden elements to bind streams) */}
                <div className="hidden">
                  <video ref={localVideoRef} autoPlay playsInline muted />
                  <audio ref={remoteAudioRef} autoPlay playsInline />
                </div>
              </div>
            )}

            {/* ================= CALL CONTROLS OVERLAY ================= */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-purple-950/70 backdrop-blur-2xl border border-purple-800/50 px-6 py-3 rounded-full shadow-2xl flex items-center space-x-6 z-30 ring-1 ring-white/5">
              {/* Mute/Unmute Mic */}
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isMuted
                    ? "bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white"
                    : "bg-purple-900/60 border border-purple-800/40 text-purple-300 hover:bg-purple-800 hover:text-white"
                }`}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Camera On/Off Toggle (Only for video calls) */}
              {callType === "video" && (
                <button
                  onClick={toggleCamera}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isCameraOff
                      ? "bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white"
                      : "bg-purple-900/60 border border-purple-800/40 text-purple-300 hover:bg-purple-800 hover:text-white"
                  }`}
                >
                  {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}

              {/* Hangup / End Call */}
              <button
                onClick={endCall}
                className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 hover:scale-105 flex items-center justify-center text-white transition-all duration-200 shadow-md shadow-rose-950/40 cursor-pointer"
              >
                <PhoneOff size={20} />
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default ActiveCallScreen;
