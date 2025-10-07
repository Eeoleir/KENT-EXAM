"use client";
import { useMemo, memo } from "react";

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/shorts/"))
        return u.pathname.split("/")[2] || null;
      return u.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

interface VideoEmbedProps {
  url: string;
}

const VideoEmbed = memo(({ url }: VideoEmbedProps) => {
  const id = useMemo(() => extractYouTubeId(url), [url]);

  if (!id) return null;

  return (
    <div className="aspect-video w-full overflow-hidden rounded border">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
        title="YouTube video player"
        frameBorder={0}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
});

VideoEmbed.displayName = "VideoEmbed";

export default VideoEmbed;
