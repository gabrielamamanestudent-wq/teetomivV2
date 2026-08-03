"use client";

import Link from "next/link";
import type { Course, Slot } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/context";
import { formatLocalTime, formatCAD } from "@/lib/time";
import { Skeleton } from "./ui";

// Greater Montreal bounding box for normalizing pins onto the static map.
const BOUNDS = { minLat: 45.40, maxLat: 45.75, minLng: -74.15, maxLng: -73.40 };

/**
 * Map view. When no Mapbox token is configured we render a stylized static
 * map with positioned course pins (graceful fallback) plus a scrollable list —
 * never a blank screen.
 */
export function BrowseMap({
  slots,
  courses,
  loading,
}: {
  slots: Slot[];
  courses: Course[];
  loading: boolean;
}) {
  const { t, locale } = useI18n();
  const hasToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const courseById = (id: string) => courses.find((c) => c.id === id);

  // One pin per course that currently has a live deal.
  const pinnedCourseIds = Array.from(new Set(slots.map((s) => s.courseId)));

  const pos = (lat: number, lng: number) => ({
    left: `${((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100}%`,
    top: `${(1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100}%`,
  });

  return (
    <div className="space-y-3">
      {!hasToken && (
        <p className="rounded-2xl bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
          {t("browse.mapFallback")}
        </p>
      )}

      <div className="relative h-72 overflow-hidden rounded-2xl border border-forest/10 bg-[#dfe9df]">
        {/* Stylized map backdrop */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(11,61,46,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(11,61,46,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <div className="absolute left-4 top-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-forest">
          Greater Montreal
        </div>
        {loading
          ? null
          : pinnedCourseIds.map((cid) => {
              const course = courseById(cid);
              if (!course) return null;
              const cheapest = slots
                .filter((s) => s.courseId === cid)
                .sort((a, b) => a.currentPrice - b.currentPrice)[0];
              return (
                <Link
                  key={cid}
                  href={`/deal/${cheapest.id}`}
                  className="absolute -translate-x-1/2 -translate-y-full"
                  style={pos(course.lat, course.lng)}
                >
                  <span className="flex flex-col items-center">
                    <span className="rounded-full bg-forest px-2 py-0.5 text-[11px] font-bold text-lime shadow-card">
                      {formatCAD(cheapest.currentPrice)}
                    </span>
                    <span className="h-2 w-2 rotate-45 bg-forest" />
                  </span>
                </Link>
              );
            })}
      </div>

      {/* Companion list */}
      <div className="space-y-2">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        {slots.map((slot) => {
          const course = courseById(slot.courseId);
          if (!course) return null;
          return (
            <Link
              key={slot.id}
              href={`/deal/${slot.id}`}
              className="card flex items-center justify-between p-3"
            >
              <div>
                <p className="font-semibold text-forest">{course.name}</p>
                <p className="text-xs text-forest/60">
                  {t(`region.${course.region}` as never)} ·{" "}
                  {formatLocalTime(slot.teeTimeISO, locale)}
                </p>
              </div>
              <div className="text-right">
                <span className="font-display text-lg font-bold text-forest">
                  {formatCAD(slot.currentPrice)}
                </span>
                <span className="ml-1 text-xs text-forest/40 line-through">
                  {formatCAD(slot.rackRate)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
