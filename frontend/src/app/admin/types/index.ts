export type AdminUser = {
  id: number;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
};

export type AdminData = {
  users: AdminUser[];
} | null;

export type AdminState = {
  data: AdminData;
  error: string | null;
  loading: boolean;
};
