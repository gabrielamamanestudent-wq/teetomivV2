"use client";

// Lightweight demo session. For the live pitch we default the active golfer to
// the first demo account so the booking/alerts/bookings flows work instantly,
// with a switcher for the other seeded accounts.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface DemoGolfer {
  id: string;
  name: string;
  email: string;
}

export const DEMO_GOLFERS: DemoGolfer[] = [
  { id: "g1", name: "Alexandre Roy", email: "alex@demo.golf" },
  { id: "g2", name: "Marie-Claude Tremblay", email: "marie@demo.golf" },
  { id: "g3", name: "Sam Patel", email: "sam@demo.golf" },
];

interface SessionValue {
  golfer: DemoGolfer;
  setGolfer: (g: DemoGolfer) => void;
}

const SessionContext = createContext<SessionValue | null>(null);
const KEY = "teetomic.golfer";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [golfer, setGolferState] = useState<DemoGolfer>(DEMO_GOLFERS[0]);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored) {
      const found = DEMO_GOLFERS.find((g) => g.id === stored);
      if (found) setGolferState(found);
    }
  }, []);

  const setGolfer = (g: DemoGolfer) => {
    setGolferState(g);
    window.localStorage.setItem(KEY, g.id);
  };

  return (
    <SessionContext.Provider value={{ golfer, setGolfer }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
