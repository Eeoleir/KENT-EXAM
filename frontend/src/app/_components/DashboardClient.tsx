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

  useEffect(() => {
    // Keep me in sync if cookie/session changes client-side
    api
      .get("/auth/me")
      .then((r) => setMe(r.data))
      .catch(() => setMe(null));
  }, []);

  // After Stripe redirect with ?status=success, poll status briefly until active to handle webhook lag
  useEffect(() => {
    const url = new URL(window.location.href);
    const status = url.searchParams.get("status");
    if (status !== "success") return;
    let cancelled = false;
    let tries = 0;
    const maxTries = 10; // ~10s
    const poll = async () => {
      tries += 1;
      try {
        const meRes = await api.get("/auth/me");
        if (!cancelled) setMe(meRes.data);
      } catch {
        if (!cancelled) setMe(null);
      }
      try {
        const st = await api.get("/billing/status");
        const isOn = !!st.data?.active;
        if (!cancelled) setActive(isOn);
        if (isOn || tries >= maxTries) {
          url.searchParams.delete("status");
          window.history.replaceState({}, "", url.toString());
          return; // stop polling
        }
      } catch {
        if (!cancelled) setActive(false);
      }
      if (!cancelled) setTimeout(poll, 1000);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!me) {
      setActive(null);
      setVideos([]);
      return;
    }
    api
      .get("/billing/status")
      .then((r) => setActive(!!r.data?.active))
      .catch(() => setActive(false));
    api
      .get("/videos")
      .then((r) => setVideos(r.data || []))
      .catch(() => setVideos([]));
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
      {me ? (
        <>
          <p>
            Signed in as <strong>{me.email}</strong> (role: {me.role})
          </p>
          {active === false && (
            <div className="mt-3 rounded-lg border bg-white p-4 shadow-sm">
              <p className="mb-2 text-gray-700">Your account is not active.</p>
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={onSubscribe}
              >
                Subscribe
              </button>
            </div>
          )}
          {active === true && (
            <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
              <p className="mb-3 text-green-700">You are subscribed.</p>
              <Link className="text-blue-700 underline" href="/#videos">
                Video Library
              </Link>
              <form
                className="mb-4 mt-3 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");
                  try {
                    await api.post("/videos", { url: newUrl });
                    setNewUrl("");
                    const r = await api.get("/videos");
                    setVideos(r.data || []);
                  } catch (err) {
                    const e = err as {
                      response?: { data?: { message?: string } };
                    };
                    setError(
                      e?.response?.data?.message || "Failed to add video"
                    );
                  }
                }}
              >
                <input
                  className="flex-1 rounded border p-2 outline-none focus:ring"
                  placeholder="YouTube URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
                <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  Add
                </button>
              </form>
              {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
              <div id="videos" className="grid gap-4">
                {videos.map((v) => (
                  <VideoEmbed key={v.id} url={v.url} />
                ))}
              </div>
            </div>
          )}
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
