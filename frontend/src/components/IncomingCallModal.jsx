import { useEffect } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useCallStore } from "../store/useCallStore";

function IncomingCallModal() {
  const { remoteUser, callType, callStatus, acceptCall, declineCall } = useCallStore();

  useEffect(() => {
    if (callStatus !== "ringing" || !remoteUser) return;

    let ringtoneInterval;
    let audioCtx;

    const playRingtone = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioCtx = new AudioContext();

        const triggerRing = () => {
          if (!audioCtx || audioCtx.state === "closed") return;

          // Resume context if suspended (browser autoplay policy helper)
          if (audioCtx.state === "suspended") {
            audioCtx.resume();
          }

          // Create a premium, harmonic rising chord chime (C5 + E5 + G5 major triad)
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const osc3 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5 note

          osc2.type = "sine";
          osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5 note (slight offset for arpeggio chime effect)

          osc3.type = "sine";
          osc3.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5 note

          // Smooth arpeggiated chime fade-in and ring duration
          gain.gain.setValueAtTime(0, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime + 1.5);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.2);

          osc1.connect(gain);
          osc2.connect(gain);
          osc3.connect(gain);
          gain.connect(audioCtx.destination);

          osc1.start();
          osc2.start();
          osc3.start();
          osc1.stop(audioCtx.currentTime + 2.4);
          osc2.stop(audioCtx.currentTime + 2.4);
          osc3.stop(audioCtx.currentTime + 2.4);
        };

        // Play first ring immediately
        triggerRing();
        // Repeat ring every 3.5 seconds
        ringtoneInterval = setInterval(triggerRing, 3500);
      } catch (err) {
        console.warn("Ringtone playback blocked or unsupported:", err);
      }
    };

    playRingtone();

    return () => {
      if (ringtoneInterval) {
        clearInterval(ringtoneInterval);
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [callStatus, remoteUser]);

  if (callStatus !== "ringing" || !remoteUser) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] animate-fade-in">
      <div className="bg-purple-950/90 border border-purple-800/80 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center justify-center text-center backdrop-blur-xl ring-1 ring-purple-500/20 transform transition-all duration-300 scale-95 hover:scale-100">
        
        {/* Animated Avatar Ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping scale-110" />
          <div className="absolute -inset-3 rounded-full border border-purple-500/40 animate-pulse" />
          <div className="w-24 h-24 rounded-full border-4 border-purple-900/80 shadow-2xl bg-purple-900 flex items-center justify-center overflow-hidden relative z-10">
            {remoteUser.profilePic ? (
              <img
                src={remoteUser.profilePic}
                alt={remoteUser.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-3xl">
                {remoteUser.fullName.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Text Details */}
        <h3 className="text-xl font-bold text-white tracking-wide">{remoteUser.fullName}</h3>
        <p className="text-purple-300/80 text-sm mt-1 mb-8 flex items-center gap-1.5 justify-center">
          {callType === "video" ? (
            <>
              <Video size={16} className="text-pink-400 animate-pulse" />
              Incoming Video Call...
            </>
          ) : (
            <>
              <Phone size={16} className="text-emerald-400 animate-pulse" />
              Incoming Audio Call...
            </>
          )}
        </p>

        {/* Actions Button Panel */}
        <div className="flex items-center gap-8">
          {/* Decline Button */}
          <button
            onClick={declineCall}
            className="flex flex-col items-center gap-2 group focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-600 hover:border-rose-600 transition-all duration-300 shadow-lg shadow-rose-950/50 hover:scale-110 cursor-pointer">
              <PhoneOff size={24} />
            </div>
            <span className="text-xs text-rose-400/80 group-hover:text-rose-300 font-medium tracking-wide">
              Decline
            </span>
          </button>

          {/* Accept Button */}
          <button
            onClick={acceptCall}
            className="flex flex-col items-center gap-2 group focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-600 transition-all duration-300 shadow-lg shadow-emerald-950/50 hover:scale-110 animate-bounce cursor-pointer">
              {callType === "video" ? <Video size={24} /> : <Phone size={24} />}
            </div>
            <span className="text-xs text-emerald-400/80 group-hover:text-emerald-300 font-medium tracking-wide">
              Accept
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallModal;
