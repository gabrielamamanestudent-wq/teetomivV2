"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { api } from "@/lib/api-client";
import type { Course, Slot } from "@/lib/data/types";
import { DealCard } from "@/components/DealCard";
import { DealCardSkeleton, EmptyState, ErrorState, Badge } from "@/components/ui";
import { BrowseMap } from "@/components/BrowseMap";
import Link from "next/link";
import { cn } from "@/lib/cn";

const BANDS = ["dawn", "morning", "midday", "twilight"] as const;
const REGIONS = ["west-island", "south-shore", "laval", "north-shore"] as const;

export default function BrowsePage() {
  const { t } = useI18n();
  const [deals, setDeals] = useState<Slot[] | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");

  const [bands, setBands] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(140);
  const [holes, setHoles] = useState<number | undefined>(undefined);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (bands.length) p.set("bands", bands.join(","));
    if (regions.length) p.set("regions", regions.join(","));
    if (maxPrice < 140) p.set("maxPrice", String(maxPrice));
    if (holes) p.set("holes", String(holes));
    return p.toString();
  }, [bands, regions, maxPrice, holes]);

  useEffect(() => {
    setDeals(null);
    setError(false);
    api
      .deals(qs)
      .then(({ deals, courses }) => {
        setDeals(deals);
        setCourses(courses);
      })
      .catch(() => setError(true));
  }, [qs]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);

  const courseById = (id: string) => courses.find((c) => c.id === id)!;

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">{t("browse.title")}</h1>
          {deals && (
            <p className="text-sm text-forest/60">
              {deals.length} {t("browse.resultsCount")}
            </p>
          )}
        </div>
        <div className="inline-flex rounded-full border border-forest/15 bg-white p-0.5 text-sm font-semibold">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-full px-4 py-1.5 transition-colors",
                view === v ? "bg-forest text-cream" : "text-forest/60",
              )}
            >
              {t(`browse.${v}` as never)}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card space-y-4 p-4">
        <div>
          <p className="field-label">{t("browse.timeWindow")}</p>
          <div className="flex flex-wrap gap-2">
            {BANDS.map((b) => (
              <FilterChip
                key={b}
                active={bands.includes(b)}
                onClick={() => toggle(bands, setBands, b)}
              >
                {t(`band.${b}` as never)}
              </FilterChip>
            ))}
          </div>
        </div>
        <div>
          <p className="field-label">{t("browse.region")}</p>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <FilterChip
                key={r}
                active={regions.includes(r)}
                onClick={() => toggle(regions, setRegions, r)}
              >
                {t(`region.${r}` as never)}
              </FilterChip>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="field-label">
              {t("browse.maxPrice")}: <span className="text-forest">${maxPrice}</span>
            </p>
            <input
              type="range"
              min={30}
              max={140}
              step={5}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-forest"
              aria-label={t("browse.maxPrice")}
            />
          </div>
          <div>
            <p className="field-label">{t("browse.holes")}</p>
            <div className="flex gap-2">
              {[undefined, 9, 18].map((h, i) => (
                <FilterChip key={i} active={holes === h} onClick={() => setHoles(h)}>
                  {h ? `${h}` : t("browse.any")}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {error ? (
        <ErrorState onRetry={() => setMaxPrice((m) => m)} />
      ) : view === "map" ? (
        <BrowseMap slots={deals ?? []} courses={courses} loading={!deals} />
      ) : !deals ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <DealCardSkeleton key={i} />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <EmptyState
          icon="🔕"
          title={t("browse.empty")}
          action={
            <Link href="/alerts" className="btn-primary mt-2 text-sm">
              {t("landing.ctaAlert")}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((slot) => (
            <DealCard key={slot.id} slot={slot} course={courseById(slot.courseId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "bg-forest text-cream"
          : "border border-forest/15 bg-white text-forest/70 hover:bg-forest/5",
      )}
    >
      {children}
    </button>
  );
}
