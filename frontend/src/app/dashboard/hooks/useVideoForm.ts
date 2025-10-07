"use client";
import { useState } from "react";

export function useVideoForm(addVideo: (url: string) => Promise<void>) {
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [error, setError] = useState("");

  const handleAddVideo = async (url: string) => {
    setError("");
    setIsAddingVideo(true);
    try {
      await addVideo(url);
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
      };
      setError(e?.response?.data?.message || "Failed to add video");
    } finally {
      setIsAddingVideo(false);
    }
  };

  return {
    isAddingVideo,
    error,
    handleAddVideo,
  };
}
