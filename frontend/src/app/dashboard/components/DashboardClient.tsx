"use client";
import { api } from "../../../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useSubscription } from "../hooks/useSubscription";
import { useVideos } from "../hooks/useVideos";
import { useVideoForm } from "../hooks/useVideoForm";
import { User } from "../types";
import SkeletonCard from "./SkeletonCard";
import UserInfo from "./UserInfo";
import ActionButtons from "./ActionButtons";
import NotSignedIn from "./NotSignedIn";
import SubscriptionStatus from "./SubscriptionStatus";
import VideoForm from "./VideoForm";
import VideoList from "./VideoList";

interface DashboardClientProps {
  initialMe: User | null;
}

export default function DashboardClient({ initialMe }: DashboardClientProps) {
  const { me, isLoading, logout } = useAuth(initialMe);
  const { active, isLoadingSubscription } = useSubscription(me);
  const { videos, addVideo } = useVideos(me);
  const { isAddingVideo, error, handleAddVideo } = useVideoForm(addVideo);

  const onSubscribe = async () => {
    try {
      const res = await api.post("/billing/create-checkout-session");
      const url = res.data?.url;
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Failed to start checkout:", err);
    }
  };

  const onLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout API call failed:", err);
    } finally {
      // Clear token from localStorage
      localStorage.removeItem("token");
      // Reset auth state
      logout();
      // Reload the page to ensure clean state
      location.reload();
    }
  };

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
          <UserInfo user={me} />

          <SubscriptionStatus
            isActive={active}
            isLoading={isLoadingSubscription}
            onSubscribe={onSubscribe}
          />

          {active === true && (
            <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
              <VideoForm
                onSubmit={handleAddVideo}
                isLoading={isAddingVideo}
                error={error}
              />
              <VideoList videos={videos} />
            </div>
          )}

          <ActionButtons user={me} onLogout={onLogout} />
        </>
      ) : (
        <NotSignedIn />
      )}
    </div>
  );
}
