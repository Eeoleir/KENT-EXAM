"use client";
import { useMemo } from "react";
import VideoEmbed from "./VideoEmbed";
import { Video } from "../types";

interface VideoListProps {
  videos: Video[];
}

export default function VideoList({ videos }: VideoListProps) {
  const memoizedVideos = useMemo(
    () => videos.map((v) => <VideoEmbed key={v.id} url={v.url} />),
    [videos]
  );

  return (
    <div id="videos" className="grid gap-4">
      {memoizedVideos}
    </div>
  );
}
