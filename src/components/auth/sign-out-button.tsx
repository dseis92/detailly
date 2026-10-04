"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="portal-secondary-action"
      onClick={async () => {
        await fetch("/api/auth/sign-out", { method: "POST" });
        router.push("/sign-in");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
