"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";
import { AccountMenu } from "./AccountMenu";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";
import type { DictKey } from "@/lib/i18n/dictionary";

// The golfer nav — average folk. The Business Corner (/operator) is NOT here;
// it's reached only through the business-code flow.
const NAV: { href: string; key: DictKey; icon: string; tour: string }[] = [
  { href: "/browse", key: "nav.browse", icon: "⛳", tour: "browse" },
  { href: "/alerts", key: "nav.alerts", icon: "🔔", tour: "alerts" },
  { href: "/rewards", key: "nav.rewards", icon: "🏅", tour: "rewards" },
  { href: "/my-bookings", key: "nav.bookings", icon: "🎟️", tour: "bookings" },
];

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-forest/10 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Logo />
          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-forest text-cream"
                    : "text-forest/70 hover:bg-forest/5",
                )}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/10 bg-cream/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-6xl items-stretch justify-around">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={item.tour}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold",
                  active ? "text-forest" : "text-forest/50",
                )}
              >
                <span className={cn("text-lg leading-none", active && "scale-110")}>
                  {item.icon}
                </span>
                {t(item.key)}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
