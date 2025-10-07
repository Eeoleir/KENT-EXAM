"use client";
import Link from "next/link";
import { useRegister } from "../hooks/useRegister";
import RegisterForm from "./RegisterForm";

export default function RegisterClient() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleSubmit,
  } = useRegister();

  const handleInputChange = (field: "email" | "password", value: string) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
  };

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-center text-2xl font-semibold">
        Create account
      </h1>
      <RegisterForm
        formData={{ email, password }}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        error={error}
        isLoading={isLoading}
      />
      <p className="mt-3 text-sm">
        Already have an account?{" "}
        <Link className="text-blue-700 underline" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
