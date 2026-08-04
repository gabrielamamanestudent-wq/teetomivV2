"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ConceptDemo } from "./ConceptDemo";

/** Renders the concept demo when the session requests it, and routes on finish:
 *  golfer → into the app (browse); course → to the pro-shop signup. */
export function ConceptDemoHost() {
  const { showConcept, endConcept, enterDemo } = useSession();
  const router = useRouter();

  if (!showConcept) return null;

  const mode = showConcept;
  return (
    <ConceptDemo
      mode={mode}
      onDone={() => {
        endConcept();
        if (mode === "course") {
          router.push("/operator/signup");
        } else {
          enterDemo();
          router.push("/browse");
        }
      }}
    />
  );
}
