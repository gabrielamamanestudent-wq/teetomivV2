"use client";

// Session model. The app has two front doors:
//   • member  — a real (locally-stored) account with a 4-digit PIN that gates
//               the exclusive perks area.
//   • demo    — a maxed-out explorer identity (Gold Plus, full perks) for people
//               who just want to learn the app, paired with a guided walkthrough.
// `golfer` ({id,name,email}) is always present so the rest of the app is agnostic
// to which door was used.

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

export interface Member {
  golferId: string;
  name: string;
  email: string;
  pin: string;
}

type Mode = "member" | "demo";

interface SessionValue {
  mode: Mode;
  golfer: DemoGolfer; // {id,name,email} for whichever identity is active
  member: Member | null;
  perksUnlocked: boolean;
  showWelcome: boolean;
  showWalkthrough: boolean;
  createAccount: (name: string, email: string, pin: string) => void;
  enterDemo: (opts?: { tour?: boolean }) => void;
  unlockPerks: (pin: string) => boolean;
  startWalkthrough: () => void;
  finishWalkthrough: () => void;
  openWelcome: () => void;
  setGolfer: (g: DemoGolfer) => void; // demo-only identity switch
}

const SessionContext = createContext<SessionValue | null>(null);

const K = {
  mode: "teetomic.mode",
  member: "teetomic.member",
  golfer: "teetomic.golfer",
  welcomeSeen: "teetomic.welcomeSeen",
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("demo");
  const [member, setMember] = useState<Member | null>(null);
  const [demoGolfer, setDemoGolfer] = useState<DemoGolfer>(DEMO_GOLFERS[0]);
  const [perksUnlocked, setPerksUnlocked] = useState(true); // demo starts unlocked
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    try {
      const storedMember = window.localStorage.getItem(K.member);
      const storedMode = window.localStorage.getItem(K.mode) as Mode | null;
      const storedGolfer = window.localStorage.getItem(K.golfer);
      if (storedGolfer) {
        const g = DEMO_GOLFERS.find((x) => x.id === storedGolfer);
        if (g) setDemoGolfer(g);
      }
      if (storedMode === "member" && storedMember) {
        setMember(JSON.parse(storedMember));
        setMode("member");
        setPerksUnlocked(false); // member must enter PIN each session
      } else if (!window.localStorage.getItem(K.welcomeSeen)) {
        setShowWelcome(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const createAccount = (name: string, email: string, pin: string) => {
    const m: Member = { golferId: `m${Date.now()}`, name, email, pin };
    setMember(m);
    setMode("member");
    setPerksUnlocked(false);
    setShowWelcome(false);
    window.localStorage.setItem(K.member, JSON.stringify(m));
    window.localStorage.setItem(K.mode, "member");
    window.localStorage.setItem(K.welcomeSeen, "1");
  };

  const enterDemo = (opts?: { tour?: boolean }) => {
    setMode("demo");
    setPerksUnlocked(true);
    setShowWelcome(false);
    window.localStorage.setItem(K.mode, "demo");
    window.localStorage.setItem(K.welcomeSeen, "1");
    if (opts?.tour) setShowWalkthrough(true);
  };

  const unlockPerks = (pin: string): boolean => {
    if (member && pin === member.pin) {
      setPerksUnlocked(true);
      return true;
    }
    return false;
  };

  const setGolfer = (g: DemoGolfer) => {
    setDemoGolfer(g);
    window.localStorage.setItem(K.golfer, g.id);
  };

  const golfer: DemoGolfer = member
    ? { id: member.golferId, name: member.name, email: member.email }
    : demoGolfer;

  const value: SessionValue = {
    mode,
    golfer,
    member,
    perksUnlocked,
    showWelcome,
    showWalkthrough,
    createAccount,
    enterDemo,
    unlockPerks,
    startWalkthrough: () => setShowWalkthrough(true),
    finishWalkthrough: () => setShowWalkthrough(false),
    openWelcome: () => setShowWelcome(true),
    setGolfer,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
