import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-display text-xl font-bold tracking-tight",
        onDark ? "text-cream" : "text-forest",
        className,
      )}
      aria-label="TEETOMIC home"
    >
      TEE<span className="text-lime-dark">TOMIC</span>
    </Link>
  );
}
