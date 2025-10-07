"use client";
import { useEffect, useState, useRef } from "react";
import { api } from "../../../lib/api";
import { User, Video } from "../types";

export function useVideos(me: User | null) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const hasLoadedData = useRef(false);

  useEffect(() => {
    if (!me) {
      setVideos([]);
      hasLoadedData.current = false;
      return;
    }

    // Only load data once per user session
    if (hasLoadedData.current) {
      return;
    }

    setIsLoadingVideos(true);
    api
      .get("/videos")
      .then((r: { data?: Video[] }) => setVideos(r.data || []))
      .catch(() => setVideos([]))
      .finally(() => {
        setIsLoadingVideos(false);
        hasLoadedData.current = true;
      });
  }, [me]);

  const addVideo = async (url: string) => {
    const response = await api.post("/videos", { url });
    setVideos((prevVideos) => [...prevVideos, response.data]);
  };

  return {
    videos,
    isLoadingVideos,
    addVideo,
  };
}
