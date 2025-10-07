"use client";
import Link from "next/link";
import { useLogin } from "../hooks/useLogin";
import LoginForm from "./LoginForm";

export default function LoginClient() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleSubmit,
  } = useLogin();

  const handleInputChange = (field: "email" | "password", value: string) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
  };

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-center text-2xl font-semibold">Sign in</h1>
      <LoginForm
        formData={{ email, password }}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        error={error}
        isLoading={isLoading}
      />
      <p className="mt-3 text-sm">
        Don&apos;t have an account?{" "}
        <Link className="text-blue-700 underline" href="/register">
          Register
        </Link>
      </p>
    </div>
  );
}
