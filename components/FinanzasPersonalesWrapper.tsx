"use client";

import { useSession } from "next-auth/react";
import FinanzasPersonales from "./FinanzasPersonales";

export default function FinanzasPersonalesWrapper() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "unauthenticated") {
    return <p>Access Denied</p>;
  }

  return <FinanzasPersonales />;
}
