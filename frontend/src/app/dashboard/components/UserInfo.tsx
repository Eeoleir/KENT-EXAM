"use client";
import { User } from "../types";

interface UserInfoProps {
  user: User;
}

export default function UserInfo({ user }: UserInfoProps) {
  return (
    <p>
      Signed in as <strong>{user.email}</strong> (role: {user.role})
    </p>
  );
}
