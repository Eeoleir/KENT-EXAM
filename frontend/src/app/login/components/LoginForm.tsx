"use client";
import { LoginFormData } from "../types";

interface LoginFormProps {
  formData: LoginFormData;
  onInputChange: (field: keyof LoginFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  isLoading: boolean;
}

export default function LoginForm({
  formData,
  onInputChange,
  onSubmit,
  error,
  isLoading,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <input
        className="rounded border p-2 outline-none focus:ring"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => onInputChange("email", e.target.value)}
        disabled={isLoading}
      />
      <input
        className="rounded border p-2 outline-none focus:ring"
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => onInputChange("password", e.target.value)}
        disabled={isLoading}
      />
      <button
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
