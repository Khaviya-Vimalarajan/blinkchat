import { useState, useRef, useCallback } from "react";
import {
  LogOutIcon,
  VolumeOffIcon,
  Volume2Icon,
  CameraIcon,
  LoaderIcon,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile, isUpdatingProfile } =
    useAuthStore();

  const { isSoundEnabled, toggleSound } = useChatStore();

  const [previewImage, setPreviewImage] = useState(null);

  const fileInputRef = useRef(null);

  // COMPRESS IMAGE
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();

        img.src = event.target.result;

        img.onload = () => {
          const canvas = document.createElement("canvas");

          const MAX_WIDTH = 500;

          const scaleSize = MAX_WIDTH / img.width;

          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedBase64 = canvas.toDataURL(
            "image/jpeg",
            0.7
          );

          resolve(compressedBase64);
        };
      };
    });
  };

  // IMAGE UPLOAD
  const handleImageUpload = useCallback(
    async (e) => {
      try {
        const file = e.target.files[0];

        if (!file) return;

        // FILE SIZE VALIDATION
        if (file.size > 5 * 1024 * 1024) {
          toast.error(
            "File size too large. Please select an image under 5MB"
          );
          return;
        }

        // FILE TYPE VALIDATION
        if (!file.type.startsWith("image/")) {
          toast.error("Please select an image file");
          return;
        }

        // SHOW PREVIEW
        const reader = new FileReader();

        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };

        reader.readAsDataURL(file);

        // COMPRESS IMAGE
        const compressedImage = await compressImage(file);

        // SEND TO BACKEND
        await updateProfile({
          profilePic: compressedImage,
        });
      } catch (error) {
        console.log("Image upload error:", error);

        toast.error("Failed to upload image");
      }
    },
    [updateProfile]
  );

  // OPEN FILE INPUT
  const handleButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div className="p-4 border-b border-purple-500/30 bg-purple-900/20">
      <div className="flex items-center justify-between">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-3">
          {/* AVATAR */}
          <div className="avatar online">
            <div className="size-12 rounded-full overflow-hidden relative group">
              <button
                className="w-full h-full"
                onClick={handleButtonClick}
                disabled={isUpdatingProfile}
                type="button"
              >
                <img
                  src={
                    previewImage ||
                    authUser?.profilePic ||
                    "/avatar.png"
                  }
                  alt="User image"
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  {isUpdatingProfile ? (
                    <LoaderIcon className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <CameraIcon className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* USER INFO */}
          <div>
            <h3 className="text-white font-medium text-sm max-w-[150px] truncate">
              {authUser?.fullName}
            </h3>

            <p className="text-purple-300 text-xs">Online</p>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex gap-2 items-center">
          {/* SOUND BUTTON */}
          <button
            className="p-2 rounded-lg text-purple-400 hover:text-pink-400 hover:bg-purple-500/20 transition-all duration-200"
            onClick={() => {
              mouseClickSound.currentTime = 0;

              mouseClickSound.play().catch(() => {});

              toggleSound();
            }}
            type="button"
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-4" />
            ) : (
              <VolumeOffIcon className="size-4" />
            )}
          </button>

          {/* LOGOUT BUTTON */}
          <button
            className="p-2 rounded-lg text-purple-400 hover:text-pink-400 hover:bg-purple-500/20 transition-all duration-200"
            onClick={logout}
            type="button"
          >
            <LogOutIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;