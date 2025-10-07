"use client";
import { useState } from "react";

interface VideoFormProps {
  onSubmit: (url: string) => Promise<void>;
  isLoading: boolean;
  error: string;
}

export default function VideoForm({
  onSubmit,
  isLoading,
  error,
}: VideoFormProps) {
  const [newUrl, setNewUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    await onSubmit(newUrl);
    setNewUrl("");
  };

  return (
    <>
      <form className="mb-4 mt-3 flex gap-2" onSubmit={handleSubmit}>
        <input
          className="flex-1 rounded border p-2 outline-none focus:ring"
          placeholder="YouTube URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          disabled={isLoading}
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Adding..." : "Add"}
        </button>
      </form>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
    </>
  );
}
