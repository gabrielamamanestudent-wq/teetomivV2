"use client";

// Session / onboarding model.
//
// There are no switchable demo accounts. The flow is:
//   welcome → concept demo (the little golfer) → arrow-guided tour →
//   create account → TEETOMIC+ offer → member.
// A course instead enters the universal access code to see the pro-shop pitch.
//
// `golfer` ({id,name,email}) is always present — a lightweight guest identity
// before an account is created, then the member once they sign up — so the rest
// of the app stays agnostic.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface Golfer {
  id: string;
  name: string;
  email: string;
}

const GUEST: Golfer = { id: "guest", name: "Guest", email: "" };

export interface Member {
  golferId: string;
  name: string;
  email: string;
  pin: string;
}

export type ConceptMode = "golfer" | "course";

/** Universal access code a business enters (from their invite) for the pitch. */
export const COURSE_DEMO_PIN = process.env.NEXT_PUBLIC_COURSE_DEMO_PIN || "5432";

interface SessionValue {
  golfer: Golfer;
  member: Member | null;
  perksUnlocked: boolean;
  // onboarding surfaces
  showWelcome: boolean;
  showConcept: ConceptMode | null;
  showTour: boolean;
  showCreate: boolean;
  showPlusOffer: boolean;
  // actions
  playConcept: (mode: ConceptMode) => void;
  endConcept: () => void;
  startTour: () => void;
  endTour: () => void;
  openCreate: () => void;
  closeCreate: () => void;
  createAccount: (name: string, email: string, pin: string) => void;
  login: (email: string, pin: string) => void;
  logout: () => void;
  dismissPlusOffer: () => void;
  unlockPerks: (pin: string) => boolean;
  openWelcome: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

const K = {
  member: "teetomic.member",
  welcomeSeen: "teetomic.welcomeSeen",
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [perksUnlocked, setPerksUnlocked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showConcept, setShowConcept] = useState<ConceptMode | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showPlusOffer, setShowPlusOffer] = useState(false);

  useEffect(() => {
    try {
      const storedMember = window.localStorage.getItem(K.member);
      if (storedMember) {
        setMember(JSON.parse(storedMember));
      } else if (!window.localStorage.getItem(K.welcomeSeen)) {
        setShowWelcome(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const seen = () => window.localStorage.setItem(K.welcomeSeen, "1");

  const createAccount = (name: string, email: string, pin: string) => {
    const m: Member = { golferId: `m${Date.now()}`, name, email, pin };
    setMember(m);
    setPerksUnlocked(true); // they just set it — no need to re-enter immediately
    setShowCreate(false);
    setShowWelcome(false);
    seen();
    window.localStorage.setItem(K.member, JSON.stringify(m));
    setShowPlusOffer(true); // offer TEETOMIC+ right after signup
  };

  // Demo login: with no real user database we simply restore/create the member
  // session for the given credentials. (Real auth is the Supabase backend.)
  const login = (email: string, pin: string) => {
    const name = email.split("@")[0].replace(/[._]/g, " ") || "Golfer";
    const m: Member = { golferId: `m${Date.now()}`, name, email, pin };
    setMember(m);
    setPerksUnlocked(true);
    setShowCreate(false);
    setShowWelcome(false);
    seen();
    window.localStorage.setItem(K.member, JSON.stringify(m));
  };

  const logout = () => {
    setMember(null);
    setPerksUnlocked(false);
    window.localStorage.removeItem(K.member);
    setShowWelcome(true);
  };

  const unlockPerks = (pin: string): boolean => {
    if (member && pin === member.pin) {
      setPerksUnlocked(true);
      return true;
    }
    return false;
  };

  const golfer: Golfer = member
    ? { id: member.golferId, name: member.name, email: member.email }
    : GUEST;

  const value: SessionValue = {
    golfer,
    member,
    perksUnlocked: member ? perksUnlocked : true, // guests aren't gated
    showWelcome,
    showConcept,
    showTour,
    showCreate,
    showPlusOffer,
    playConcept: (m) => {
      setShowConcept(m);
      setShowWelcome(false);
    },
    endConcept: () => setShowConcept(null),
    startTour: () => {
      setShowTour(true);
      seen();
    },
    endTour: () => setShowTour(false),
    openCreate: () => {
      setShowTour(false);
      setShowWelcome(false);
      setShowCreate(true);
    },
    closeCreate: () => setShowCreate(false),
    createAccount,
    login,
    logout,
    dismissPlusOffer: () => setShowPlusOffer(false),
    unlockPerks,
    openWelcome: () => setShowWelcome(true),
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
