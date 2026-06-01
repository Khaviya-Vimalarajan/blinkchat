import { useState, useEffect, useRef } from "react";
import { Search, Smile, Sparkles, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

// Curated list of popular emojis with search tags
const EMOJI_CATEGORIES = [
  {
    name: "Smileys & Emotion",
    icon: "😊",
    emojis: [
      { char: "😂", tags: "joy laugh cry face happy" },
      { char: "🤣", tags: "rofl laugh cry face happy rolling" },
      { char: "😊", tags: "smile happy face cheeks grin" },
      { char: "😍", tags: "love heart eyes face romantic cute" },
      { char: "🥰", tags: "love hearts face smiling warm cute" },
      { char: "😘", tags: "kiss wink blow face romantic love" },
      { char: "😜", tags: "wink tongue face crazy silly playful" },
      { char: "🤔", tags: "think face hand chin query question" },
      { char: "😎", tags: "cool sunglasses face chill style slick" },
      { char: "🙄", tags: "roll eyes face bored annoy sigh" },
      { char: "😢", tags: "cry sad tear face weep upset" },
      { char: "😭", tags: "loud cry sob face tear upset weep" },
      { char: "😡", tags: "angry mad pout face rage red" },
      { char: "😱", tags: "scream fear scared face shock gasp" },
      { char: "🤯", tags: "mind blown explode face shock amaze" },
      { char: "😴", tags: "sleep zzz face tired snore rest" },
    ],
  },
  {
    name: "Gestures & People",
    icon: "👍",
    emojis: [
      { char: "👋", tags: "wave hello hi goodbye hand" },
      { char: "👍", tags: "thumbs up yes ok agree good like" },
      { char: "👎", tags: "thumbs down no disagree bad dislike" },
      { char: "👊", tags: "fist punch bump hand hit" },
      { char: "✊", tags: "fist power raised hand strength" },
      { char: "✌️", tags: "peace victory v sign hand twin" },
      { char: "👌", tags: "ok hand correct perfect approve" },
      { char: "✋", tags: "stop hand high five palm" },
      { char: "👐", tags: "open hands hug share welcome" },
      { char: "💪", tags: "bicep flex muscle strong power arm" },
      { char: "🙏", tags: "pray hands please thank bow hope" },
      { char: "👏", tags: "clap hands applaud praise job" },
      { char: "🙌", tags: "hands celebration hooray praise win" },
      { char: "🙋", tags: "raise hand person ask question volunteer" },
      { char: "🤦", tags: "facepalm face hand shame mistake sigh" },
    ],
  },
  {
    name: "Hearts & Symbols",
    icon: "💖",
    emojis: [
      { char: "❤️", tags: "red heart love romantic passion" },
      { char: "🧡", tags: "orange heart love" },
      { char: "💛", tags: "yellow heart love friendship" },
      { char: "💚", tags: "green heart love nature" },
      { char: "💙", tags: "blue heart love trust" },
      { char: "💜", tags: "purple heart love royal magic" },
      { char: "🖤", tags: "black heart love dark gothic" },
      { char: "🤍", tags: "white heart love pure clean" },
      { char: "💔", tags: "broken heart love sad upset pain" },
      { char: "❣️", tags: "exclamation heart love sign red" },
      { char: "💕", tags: "two hearts love romantic sweet" },
      { char: "💞", tags: "revolving hearts love connection" },
      { char: "💓", tags: "beating heart love pulse healthy" },
      { char: "💖", tags: "sparkle heart love neon shiny" },
      { char: "💘", tags: "arrow heart cupid love target" },
    ],
  },
  {
    name: "Nature & Fire",
    icon: "🔥",
    emojis: [
      { char: "🔥", tags: "fire hot flame warm burn dynamic" },
      { char: "✨", tags: "sparkles shiny glow magic neon clean" },
      { char: "⭐", tags: "star gold yellow shine rate" },
      { char: "🌟", tags: "glowing star yellow shine sparkle" },
      { char: "🌈", tags: "rainbow sky colorful pride magic" },
      { char: "⚡", tags: "lightning bolt thunder electric energy flash" },
      { char: "💥", tags: "collision explode blast spark hit boom" },
      { char: "💧", tags: "droplet water tear rain clean wet" },
      { char: "🌊", tags: "wave ocean sea water splash dynamic" },
      { char: "🍀", tags: "clover leaf lucky green irish nature" },
      { char: "🌸", tags: "cherry blossom flower pink spring nature" },
      { char: "🌹", tags: "rose red flower romantic love nature" },
      { char: "🍂", tags: "fallen leaf brown autumn nature wind" },
      { char: "🍄", tags: "mushroom red fungus mario nature" },
      { char: "🐾", tags: "paw prints animal dog cat track" },
      { char: "🍕", tags: "pizza slice food cheese pepperoni" },
    ],
  },
  {
    name: "Objects & Fun",
    icon: "🎮",
    emojis: [
      { char: "🎉", tags: "party popper celebration congrats birthday" },
      { char: "🎁", tags: "present gift box surprise birthday ribbon" },
      { char: "🎈", tags: "balloon red float party celebration" },
      { char: "🎂", tags: "cake birthday candle dessert sweet" },
      { char: "🏆", tags: "trophy gold prize winner cup champion" },
      { char: "🎮", tags: "gamepad controller gaming play playstation xbox" },
      { char: "💻", tags: "laptop computer tech office work developer" },
      { char: "📱", tags: "mobile phone smartphone tech screen call" },
      { char: "📚", tags: "books reading library school study learn" },
      { char: "🖊️", tags: "pen writing office note signing write" },
      { char: "🔑", tags: "key gold lock open secret security" },
      { char: "💡", tags: "bulb light idea smart energy brainstorm" },
      { char: "💰", tags: "money bag cash gold rich wealth dollar" },
      { char: "🚀", tags: "rocket space launch ship dynamic speed" },
      { char: "🛸", tags: "ufo flying saucer alien space mystery" },
      { char: "🌐", tags: "globe network web internet global connection" },
    ],
  },
];

// Curated high-fidelity WhatsApp-style cartoon stickers
const STICKERS = [
  {
    id: "avocuddle",
    name: "Avocuddle",
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 15 C32 15 22 40 22 62 C22 80 34 90 50 90 C66 90 78 80 78 62 C78 40 68 15 50 15 Z" fill="#15803d" />
        <path d="M50 22 C36 22 28 42 28 62 C28 76 38 84 50 84 C62 84 72 76 72 62 C72 42 64 22 50 22 Z" fill="#86efac" />
        <circle cx="42" cy="45" r="3.5" fill="#000000" />
        <circle cx="58" cy="45" r="3.5" fill="#000000" />
        <circle cx="38" cy="49" r="3" fill="#f472b6" opacity="0.8" />
        <circle cx="62" cy="49" r="3" fill="#f472b6" opacity="0.8" />
        <path d="M47 52 Q50 55 53 52" stroke="#000000" stroke-width="2" stroke-linecap="round" fill="none" />
        <circle cx="50" cy="65" r="11" fill="#78350f" />
        <circle cx="50" cy="65" r="9" fill="#92400e" />
        <circle cx="47" cy="63" r="1.5" fill="#ffffff" />
        <circle cx="53" cy="63" r="1.5" fill="#ffffff" />
        <path d="M49 67 Q50 69 51 67" stroke="#ffffff" stroke-width="1" stroke-linecap="round" fill="none" />
      </svg>
    `,
  },
  {
    id: "cute_mug",
    name: "Coffee Time",
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 22 Q43 15 40 8" stroke="#93c5fd" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M50 20 Q53 13 50 6" stroke="#93c5fd" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M60 22 Q63 15 60 8" stroke="#93c5fd" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M65 42 C78 42 78 68 65 68" stroke="#60a5fa" stroke-width="8" stroke-linecap="round" fill="none" />
        <rect x="25" y="30" width="46" height="48" rx="8" fill="#3b82f6" />
        <rect x="28" y="33" width="40" height="42" rx="6" fill="#60a5fa" />
        <circle cx="40" cy="50" r="3.5" fill="#000000" />
        <path d="M55 50 Q58 46 61 50" stroke="#000000" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <circle cx="35" cy="55" r="3" fill="#f472b6" opacity="0.8" />
        <circle cx="63" cy="55" r="3" fill="#f472b6" opacity="0.8" />
        <path d="M45 58 Q50 64 53 58" stroke="#000000" stroke-width="2.5" stroke-linecap="round" fill="none" />
      </svg>
    `,
  },
  {
    id: "cute_neko",
    name: "Cute Neko",
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M28 42 C28 26 72 26 72 42 C72 50 65 58 50 58 C35 58 28 50 28 42 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
        <polygon points="30,32 32,15 48,28" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
        <polygon points="34,28 36,18 45,26" fill="#f472b6" />
        <polygon points="70,32 68,15 52,28" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
        <polygon points="66,28 64,18 55,26" fill="#f472b6" />
        <circle cx="42" cy="40" r="3.5" fill="#0f172a" />
        <circle cx="58" cy="40" r="3.5" fill="#0f172a" />
        <ellipse cx="50" cy="44" rx="2" ry="1.5" fill="#f43f5e" />
        <line x1="22" y1="44" x2="32" y2="46" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" />
        <line x1="22" y1="49" x2="31" y2="49" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" />
        <line x1="78" y1="44" x2="68" y2="46" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" />
        <line x1="78" y1="49" x2="69" y2="49" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" />
        <path d="M20 54 L80 54 L75 90 L25 90 Z" fill="#d97706" />
        <path d="M20 54 L10 40 L48 48 L48 54 Z" fill="#b45309" />
        <path d="M80 54 L90 40 L52 48 L52 54 Z" fill="#b45309" />
        <path d="M50 15 C48 10 42 10 42 15 C42 20 50 25 50 25 C50 25 58 20 58 15 C58 10 52 10 50 15 Z" fill="#ef4444" />
      </svg>
    `,
  },
  {
    id: "happy_frog",
    name: "Happy Frog",
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="60" rx="36" ry="26" fill="#10b981" />
        <ellipse cx="50" cy="62" rx="25" ry="18" fill="#a7f3d0" />
        <circle cx="32" cy="38" r="12" fill="#10b981" />
        <circle cx="32" cy="38" r="9" fill="#ffffff" />
        <circle cx="32" cy="38" r="4.5" fill="#000000" />
        <circle cx="68" cy="38" r="12" fill="#10b981" />
        <circle cx="68" cy="38" r="9" fill="#ffffff" />
        <circle cx="68" cy="38" r="4.5" fill="#000000" />
        <circle cx="24" cy="56" r="3.5" fill="#f472b6" opacity="0.8" />
        <circle cx="76" cy="56" r="3.5" fill="#f472b6" opacity="0.8" />
        <path d="M38 56 Q50 68 62 56" stroke="#047857" stroke-width="4.5" stroke-linecap="round" fill="none" />
      </svg>
    `,
  },
  {
    id: "party_pizza",
    name: "Party Pizza",
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 92 L15 25 C25 20 75 20 85 25 Z" fill="#b45309" />
        <path d="M50 86 L20 28 C28 25 72 25 80 28 Z" fill="#f59e0b" />
        <path d="M50 82 L24 33 C30 30 70 30 76 33 Z" fill="#facc15" />
        <circle cx="48" cy="45" r="5" fill="#dc2626" />
        <circle cx="38" cy="60" r="4" fill="#dc2626" />
        <circle cx="58" cy="55" r="4.5" fill="#dc2626" />
        <circle cx="50" cy="72" r="3" fill="#dc2626" />
        <path d="M32 40 L68 40" stroke="#000000" stroke-width="4.5" stroke-linecap="round" />
        <polygon points="30,40 46,40 43,49 33,49" fill="#1e293b" />
        <polygon points="54,40 70,40 67,49 57,49" fill="#1e293b" />
        <path d="M46 58 Q50 62 54 58" stroke="#78350f" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `,
  },
  {
    id: "friendly_ghost",
    name: "Friendly Ghost",
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 15 C30 15 24 35 24 55 C24 72 32 85 40 82 C45 80 50 85 55 82 C60 85 68 85 76 82 C80 80 76 72 76 55 C76 35 70 15 50 15 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
        <circle cx="42" cy="44" r="4" fill="#0f172a" />
        <circle cx="58" cy="44" r="4" fill="#0f172a" />
        <circle cx="40" cy="42" r="1.2" fill="#ffffff" />
        <circle cx="56" cy="42" r="1.2" fill="#ffffff" />
        <circle cx="36" cy="49" r="3" fill="#f472b6" opacity="0.8" />
        <circle cx="64" cy="49" r="3" fill="#f472b6" opacity="0.8" />
        <path d="M48 50 Q50 47 52 50 Q50 53 48 50" fill="#f43f5e" />
        <path d="M24 52 C15 50 15 45 22 47" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M76 52 C85 50 85 45 78 47" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `,
  },
  {
    id: "happy_donut",
    name: "Sweet Donut",
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="38" fill="#f59e0b" stroke="#d97706" stroke-width="1.5" />
        <path d="M50 16 C30 16 16 30 16 50 C16 70 30 84 50 84 C70 84 84 70 84 50 C84 30 70 16 50 16 Z M50 38 C43 38 38 43 38 50 C38 57 43 62 50 62 C57 62 62 57 62 50 C62 43 57 38 50 38 Z" fill="#ec4899" fill-rule="evenodd" />
        <path d="M50 12 C28 12 12 28 12 50 C12 72 28 88 50 88 C72 88 88 72 88 50 C88 28 72 12 50 12 Z M50 38 C43 38 38 43 38 50 C38 57 43 62 50 62 C57 62 62 57 62 50 C62 43 57 38 50 38 Z" fill="#f59e0b" fill-rule="evenodd" opacity="0.1" />
        <line x1="30" y1="30" x2="36" y2="34" stroke="#facc15" stroke-width="3" stroke-linecap="round" />
        <line x1="68" y1="32" x2="74" y2="28" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" />
        <line x1="28" y1="62" x2="34" y2="60" stroke="#34d399" stroke-width="3" stroke-linecap="round" />
        <line x1="65" y1="68" x2="71" y2="72" stroke="#facc15" stroke-width="3" stroke-linecap="round" />
        <line x1="50" y1="24" x2="50" y2="30" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
        <circle cx="36" cy="46" r="3" fill="#ffffff" />
        <path d="M60 46 Q64 42 68 46" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M46 54 Q50 58 54 54" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>
    `,
  },
  {
    id: "cheeky_poop",
    name: "Cheeky Poop",
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 15 C50 15 54 26 48 30 C38 35 22 42 22 55 C22 66 30 70 20 75 C15 78 18 88 30 88 L70 88 C82 88 85 78 80 75 C70 70 78 66 78 55 C78 42 62 35 52 30 C46 26 50 15 50 15 Z" fill="#78350f" />
        <path d="M50 18 C50 18 53 28 48 32 C39 37 25 44 25 55 C25 64 32 68 22 73 C18 75 20 84 30 84 L70 84 C80 84 82 75 78 73 C68 68 75 64 75 55 C75 44 61 37 52 32 C47 28 50 18 50 18 Z" fill="#92400e" />
        <circle cx="38" cy="58" r="7" fill="#ffffff" />
        <circle cx="38" cy="58" r="3" fill="#000000" />
        <circle cx="36" cy="56" r="1" fill="#ffffff" />
        <circle cx="62" cy="58" r="7" fill="#ffffff" />
        <circle cx="62" cy="58" r="3" fill="#000000" />
        <circle cx="60" cy="56" r="1" fill="#ffffff" />
        <path d="M42 68 Q50 78 58 68 Z" fill="#000000" />
        <path d="M46 72 Q50 78 54 72" fill="#f43f5e" />
      </svg>
    `,
  },
  {
    id: "burger_boy",
    name: "Burger Boy",
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 50 C20 22 80 22 80 50 Z" fill="#d97706" />
        <circle cx="35" cy="35" r="1.5" fill="#fef08a" />
        <circle cx="50" cy="30" r="1.5" fill="#fef08a" />
        <circle cx="65" cy="35" r="1.5" fill="#fef08a" />
        <path d="M16 50 Q25 45 32 50 Q40 45 50 50 Q60 45 68 50 Q75 45 84 50 Z" fill="#22c55e" />
        <polygon points="18,52 82,52 50,68" fill="#facc15" />
        <rect x="18" y="55" width="64" height="10" rx="5" fill="#78350f" />
        <rect x="20" y="65" width="60" height="10" rx="5" fill="#d97706" />
        <circle cx="38" cy="43" r="3" fill="#ffffff" />
        <circle cx="62" cy="43" r="3" fill="#ffffff" />
        <path d="M47 45 Q50 48 53 45" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none" />
      </svg>
    `,
  },
  {
    id: "happy_balloon",
    name: "Happy Balloon",
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 78 Q45 88 55 98" stroke="#cbd5e1" stroke-width="2.5" fill="none" stroke-linecap="round" />
        <ellipse cx="50" cy="45" rx="30" ry="33" fill="#ef4444" />
        <polygon points="50,75 44,82 56,82" fill="#ef4444" />
        <ellipse cx="36" cy="30" rx="5" ry="8" fill="#ffffff" opacity="0.6" transform="rotate(-15, 36, 30)" />
        <circle cx="40" cy="46" r="3.5" fill="#000000" />
        <circle cx="60" cy="46" r="3.5" fill="#000000" />
        <circle cx="33" cy="52" r="3" fill="#f472b6" opacity="0.8" />
        <circle cx="67" cy="52" r="3" fill="#f472b6" opacity="0.8" />
        <path d="M45 54 Q50 62 55 54" stroke="#000000" stroke-width="2.5" stroke-linecap="round" fill="none" />
      </svg>
    `,
  },
];

// Helper to convert SVG markup to standard Base64 Data URL safely
const convertSvgToDataUrl = (svgContent) => {
  try {
    const trimmed = svgContent.trim();
    const base64 = window.btoa(unescape(encodeURIComponent(trimmed)));
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    console.error("Failed to compile SVG to base64:", error);
    return null;
  }
};

const EmojiStickerPicker = ({ onSelectEmoji, onSelectSticker, onClose }) => {
  const [activeTab, setActiveTab] = useState("emojis"); // "emojis" or "stickers"
  const [stickerSubTab, setStickerSubTab] = useState("all"); // "all" or "starred"
  const [searchQuery, setSearchQuery] = useState("");
  const pickerRef = useRef(null);

  const { favoriteStickers, removeFavoriteSticker } = useChatStore();

  // Auto-close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Escape key closure
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-16 left-4 right-4 sm:left-auto sm:right-16 w-auto max-w-[340px] sm:w-[340px] h-[360px] bg-purple-950/90 backdrop-blur-xl border border-purple-800/60 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-bottom-3 duration-250 ease-out"
    >
      {/* Tab Selector & Title */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-900/40 border-b border-purple-900/60 shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("emojis")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeTab === "emojis"
                ? "bg-purple-600 text-purple-100 shadow-[0_0_10px_rgba(147,51,234,0.3)]"
                : "text-purple-400 hover:text-purple-200"
            }`}
          >
            <Smile size={14} />
            <span>Emojis</span>
          </button>
          <button
            onClick={() => setActiveTab("stickers")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeTab === "stickers"
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-purple-100 shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                : "text-purple-400 hover:text-purple-200"
            }`}
          >
            <Sparkles size={14} />
            <span>Stickers</span>
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-purple-400 hover:text-purple-100 hover:bg-purple-900/50 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 flex flex-col overflow-hidden bg-purple-950/20">
        {activeTab === "emojis" ? (
          // EMOJI PANEL
          <>
            {/* Emoji Search Box */}
            <div className="p-3 border-b border-purple-900/40 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="text"
                  placeholder="Search emoji..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-purple-900/50 border border-purple-800/60 rounded-xl py-1.5 pl-8 pr-4 text-xs text-purple-100 placeholder:text-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Emoji Grid Container */}
            <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar space-y-4">
              {EMOJI_CATEGORIES.map((category) => {
                // Filter emojis in this category by search query
                const filteredEmojis = category.emojis.filter((emoji) =>
                  emoji.tags.includes(searchQuery.toLowerCase())
                );

                if (filteredEmojis.length === 0) return null;

                return (
                  <div key={category.name} className="space-y-1.5">
                    <h4 className="text-[10px] uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5 select-none">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </h4>
                    <div className="grid grid-cols-8 gap-1.5">
                      {filteredEmojis.map((emoji) => (
                        <button
                          key={emoji.char}
                          onClick={() => onSelectEmoji(emoji.char)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-purple-900/50 active:scale-90 transition-all hover:scale-110"
                          title={emoji.tags}
                        >
                          {emoji.char}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* No Results Fallback */}
              {EMOJI_CATEGORIES.every(
                (cat) =>
                  cat.emojis.filter((e) => e.tags.includes(searchQuery.toLowerCase())).length === 0
              ) && (
                <div className="text-center text-purple-400 text-xs py-8 select-none">
                  No matching emojis found
                </div>
              )}
            </div>
          </>
        ) : (
          // STICKERS PANEL
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Stickers Sub-Tab Selector */}
            <div className="flex px-4 py-2 border-b border-purple-900/40 shrink-0 bg-purple-950/40 gap-3 justify-center">
              <button
                type="button"
                onClick={() => setStickerSubTab("all")}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md transition-all ${
                  stickerSubTab === "all"
                    ? "bg-purple-800 text-purple-100"
                    : "text-purple-400 hover:text-purple-200"
                }`}
              >
                All Stickers
              </button>
              <button
                type="button"
                onClick={() => setStickerSubTab("starred")}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  stickerSubTab === "starred"
                    ? "bg-purple-800 text-purple-100"
                    : "text-purple-400 hover:text-purple-200"
                }`}
              >
                <span>Starred</span>
                <span className="text-[10px]">⭐</span>
                {favoriteStickers.length > 0 && (
                  <span className="bg-pink-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {favoriteStickers.length}
                  </span>
                )}
              </button>
            </div>

            {/* Sticker Grid Panel */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {stickerSubTab === "all" ? (
                <div className="grid grid-cols-3 gap-3">
                  {STICKERS.map((sticker) => {
                    const dataUrl = convertSvgToDataUrl(sticker.svg);
                    return (
                      <button
                        key={sticker.id}
                        type="button"
                        onClick={() => onSelectSticker(dataUrl)}
                        className="aspect-square bg-purple-900/20 border border-purple-800/40 rounded-xl p-2 flex flex-col items-center justify-center group hover:bg-purple-900/40 hover:border-pink-500/50 active:scale-95 transition-all duration-200"
                        title={`Send ${sticker.name} sticker`}
                      >
                        <div
                          className="w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(147,51,234,0.15)] group-hover:drop-shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                          dangerouslySetInnerHTML={{ __html: sticker.svg }}
                        />
                        <span className="text-[9px] font-semibold text-purple-400 group-hover:text-purple-200 mt-2 truncate max-w-full select-none">
                          {sticker.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                // STARRED STICKERS PANEL
                <div>
                  {favoriteStickers.length === 0 ? (
                    <div className="text-center text-purple-400 text-xs py-12 px-4 select-none leading-relaxed">
                      <p className="font-semibold text-purple-300">No favorite stickers yet!</p>
                      <p className="text-[10px] text-purple-500 mt-1.5">Tap on any sticker sent or received in the chat to add it here!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {favoriteStickers.map((stickerUrl, idx) => (
                        <div
                          key={idx}
                          className="aspect-square bg-purple-900/20 border border-purple-800/40 rounded-xl p-2 flex flex-col items-center justify-center group relative hover:bg-purple-900/40 hover:border-pink-500/50 transition-all duration-200"
                        >
                          {/* Send Click Area */}
                          <button
                            type="button"
                            onClick={() => onSelectSticker(stickerUrl)}
                            className="w-full h-full flex flex-col items-center justify-center active:scale-95 transition-transform duration-100"
                            title="Send sticker"
                          >
                            <img
                              src={stickerUrl}
                              alt="Favorite Sticker"
                              className="w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(147,51,234,0.15)] group-hover:drop-shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                            />
                          </button>

                          {/* Quick Remove Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFavoriteSticker(stickerUrl);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-950/80 border border-red-800/40 hover:bg-red-800 text-red-300 hover:text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                            title="Remove from favorites"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiStickerPicker;
