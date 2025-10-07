"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";

type Me = { id: number; email: string; role: "USER" | "ADMIN" } | null;

export default function DashboardClient({ initialMe }: { initialMe: Me }) {
  const [me, setMe] = useState<Me>(initialMe);
  const [error, setError] = useState("");
  const [active, setActive] = useState<boolean | null>(null);
  const [videos, setVideos] = useState<Array<{ id: number; url: string }>>([]);
  const [newUrl, setNewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(!initialMe);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  useEffect(() => {
    // Keep me in sync if cookie/session changes client-side
    if (!initialMe) {
      setIsLoading(true);
    }
    api
      .get("/auth/me")
      .then((r) => setMe(r.data))
      .catch(() => setMe(null))
      .finally(() => setIsLoading(false));
  }, [initialMe]);

  // Clean up URL after successful Stripe redirect
  useEffect(() => {
    const url = new URL(window.location.href);
    const status = url.searchParams.get("status");
    if (status === "success") {
      url.searchParams.delete("status");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    if (!me) {
      setActive(null);
      setVideos([]);
      return;
    }

    setIsLoadingVideos(true);
    Promise.all([
      api
        .get("/billing/status")
        .then((r) => setActive(!!r.data?.active))
        .catch(() => setActive(false)),
      api
        .get("/videos")
        .then((r) => setVideos(r.data || []))
        .catch(() => setVideos([])),
    ]).finally(() => setIsLoadingVideos(false));
  }, [me]);

  const onSubscribe = async () => {
    setError("");
    try {
      const res = await api.post("/billing/create-checkout-session");
      const url = res.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        setError("No checkout URL returned");
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to start checkout");
    }
  };

  const onAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoadingVideos(true);
    try {
      const response = await api.post("/videos", { url: newUrl });
      // Add the new video to the existing list instead of refetching
      setVideos((prevVideos) => [...prevVideos, response.data]);
      setNewUrl("");
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
      };
      setError(e?.response?.data?.message || "Failed to add video");
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Skeleton Components
  const SkeletonCard = () => (
    <div className="animate-pulse rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
      <div className="h-3 w-1/2 rounded bg-gray-200"></div>
    </div>
  );

  const SkeletonVideo = () => (
    <div className="animate-pulse aspect-video w-full overflow-hidden rounded border bg-gray-200"></div>
  );

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
    </div>
  );

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

  function VideoEmbed({ url }: { url: string }) {
    const id = useMemo(() => extractYouTubeId(url), [url]);
    if (!id) return null;
    return (
      <div className="aspect-video w-full overflow-hidden rounded border">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${id}`}
          title="YouTube video player"
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-12 max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : me ? (
        <>
          <p>
            Signed in as <strong>{me.email}</strong> (role: {me.role})
          </p>

          {isLoadingVideos ? (
            <div className="mt-3 rounded-lg border bg-white p-4 shadow-sm">
              <div className="animate-pulse">
                <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
                <div className="h-8 w-24 rounded bg-gray-200"></div>
              </div>
            </div>
          ) : active === false ? (
            <div className="mt-3 rounded-lg border bg-white p-4 shadow-sm">
              <p className="mb-2 text-gray-700">Your account is not active.</p>
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={onSubscribe}
              >
                Subscribe
              </button>
            </div>
          ) : active === true ? (
            <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
              <p className="mb-3 text-green-700">You are subscribed.</p>
              <Link className="text-blue-700 underline" href="/#videos">
                Video Library
              </Link>
              <form className="mb-4 mt-3 flex gap-2" onSubmit={onAddVideo}>
                <input
                  className="flex-1 rounded border p-2 outline-none focus:ring"
                  placeholder="YouTube URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
                <button
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoadingVideos}
                >
                  {isLoadingVideos ? "Adding..." : "Add"}
                </button>
              </form>
              {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
              <div id="videos" className="grid gap-4">
                {videos.map((v) => (
                  <VideoEmbed key={v.id} url={v.url} />
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex gap-3">
            {me?.role === "ADMIN" && (
              <Link
                className="rounded border bg-white px-3 py-1 shadow-sm hover:underline"
                href="/admin"
              >
                Admin
              </Link>
            )}
            <button
              className="rounded border bg-white px-3 py-1 shadow-sm hover:bg-gray-50"
              onClick={async () => {
                try {
                  await api.post("/auth/logout");
                } finally {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("token");
                  }
                }
                location.reload();
              }}
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <div className="mx-auto max-w-sm rounded-lg border bg-white p-6 text-center shadow-sm">
          <p className="mb-3">You are not signed in.</p>
          <div className="flex justify-center gap-3">
            <Link
              className="rounded border bg-white px-3 py-1 shadow-sm hover:underline"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="rounded border bg-white px-3 py-1 shadow-sm hover:underline"
              href="/register"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
