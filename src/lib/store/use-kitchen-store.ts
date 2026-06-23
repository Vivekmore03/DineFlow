import { create } from "zustand";

interface KitchenState {
  audioEnabled: boolean;
  sseConnected: "connected" | "disconnected" | "connecting";
  setAudioEnabled: (enabled: boolean) => void;
  setSseConnected: (status: "connected" | "disconnected" | "connecting") => void;
}

export const useKitchenStore = create<KitchenState>((set) => {
  // Gracefully check localStorage on client side
  const getInitialAudio = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kitchen_audio_enabled") !== "false";
    }
    return true;
  };

  return {
    audioEnabled: getInitialAudio(),
    sseConnected: "connecting",
    setAudioEnabled: (enabled) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("kitchen_audio_enabled", String(enabled));
      }
      set({ audioEnabled: enabled });
    },
    setSseConnected: (status) => set({ sseConnected: status }),
  };
});
