export type User = {
  id: number;
  email: string;
  role: "USER" | "ADMIN";
};

export type Video = {
  id: number;
  url: string;
};

export type SubscriptionStatus = boolean | null;

export type AuthState = {
  me: User | null;
  isLoading: boolean;
};

export type SubscriptionState = {
  active: SubscriptionStatus;
  videos: Video[];
  isLoadingSubscription: boolean;
};

export type VideoFormState = {
  isAddingVideo: boolean;
  error: string;
};
