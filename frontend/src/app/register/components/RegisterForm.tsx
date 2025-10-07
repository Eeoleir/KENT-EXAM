"use client";
import { RegisterFormData } from "../types";

interface RegisterFormProps {
  formData: RegisterFormData;
  onInputChange: (field: keyof RegisterFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  isLoading: boolean;
}

export default function RegisterForm({
  formData,
  onInputChange,
  onSubmit,
  error,
  isLoading,
}: RegisterFormProps) {
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
        {isLoading ? "Creating account..." : "Create account"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
