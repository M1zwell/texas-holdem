"use client";

import { useEffect, useState } from "react";
import {
  FAMILY_SESSION_EVENT,
  readFamilySession,
  type FamilySession,
} from "@/lib/jubit-sso";

export function useFamilySession(): FamilySession | null {
  const [session, setSession] = useState<FamilySession | null>(null);

  useEffect(() => {
    const sync = () => setSession(readFamilySession());
    sync();
    window.addEventListener(FAMILY_SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAMILY_SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return session;
}
