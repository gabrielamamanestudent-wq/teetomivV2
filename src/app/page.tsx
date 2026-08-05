"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { api } from "@/lib/api-client";
import type { Course, Slot } from "@/lib/data/types";
import { formatLocalTime, formatCAD } from "@/lib/time";
import { CourseImage } from "@/components/CourseImage";
import { Skeleton } from "@/components/ui";

export default function LandingPage() {
  const { t, locale } = useI18n();
  const [deals, setDeals] = useState<Slot[] | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api.recentDeals(10).then(({ deals, courses }) => {
      setDeals(deals);
      setCourses(courses);
    });
  }, []);

  const courseById = (id: string) => courses.find((c) => c.id === id);

  return (
    <div className="space-y-16 pt-2">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-forest px-6 py-12 text-cream shadow-card-lg sm:px-10 sm:py-16">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-lime/20 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-2xl">
          <span className="chip bg-lime text-forest">{t("landing.heroKicker")}</span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
            {t("landing.heroTitle")}
          </h1>
          <p className="mt-4 max-w-xl text-cream/80">{t("landing.heroSub")}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/browse" className="btn-lime text-base">
              {t("landing.ctaBrowse")}
            </Link>
            <Link href="/alerts" className="btn-ghost border-cream/20 bg-cream/10 text-cream hover:bg-cream/20">
              {t("landing.ctaAlert")}
            </Link>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-lime">
            <span aria-hidden>✓</span> {t("landing.depositReassure")}
          </p>
        </div>
      </section>

      {/* Live ticker */}
      <section aria-label={t("landing.tickerLabel")}>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-lime-dark/60" />
            <span className="h-2 w-2 rounded-full bg-lime-dark" />
          </span>
          <h2 className="text-sm font-bold uppercase tracking-wide text-forest/60">
            {t("landing.tickerLabel")}
          </h2>
        </div>
        {!deals ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-64 shrink-0" />
            ))}
          </div>
        ) : deals.length === 0 ? null : (
          <div className="no-scrollbar group relative -mx-4 overflow-hidden px-4">
            {/* edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-cream to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-cream to-transparent" />
            <div className="flex w-max gap-3 animate-marquee group-hover:[animation-play-state:paused]">
              {[...deals, ...deals].map((slot, idx) => {
                const course = courseById(slot.courseId);
                if (!course) return null;
                const off = Math.round(((slot.rackRate - slot.currentPrice) / slot.rackRate) * 100);
                return (
                  <Link
                    key={`${slot.id}-${idx}`}
                    href={`/deal/${slot.id}`}
                    className="flex w-60 shrink-0 items-center gap-3 rounded-2xl border border-forest/10 bg-white p-3 shadow-card"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                      <CourseImage src={course.photoUrl} alt={course.name} label={course.logoLabel} sizes="44px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-forest">{course.name}</p>
                      <p className="truncate text-xs text-forest/60">
                        {formatLocalTime(slot.teeTimeISO, locale)} ·{" "}
                        <span className="font-bold text-forest">{formatCAD(slot.currentPrice)}</span>{" "}
                        <span className="text-forest/40 line-through">{formatCAD(slot.rackRate)}</span>
                      </p>
                    </div>
                    {off > 0 && (
                      <span className="ml-auto shrink-0 rounded-full bg-lime px-2 py-0.5 text-xs font-bold text-forest">
                        −{off}%
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* How it works */}
      <section>
        <h2 className="font-display text-2xl font-bold text-forest">{t("landing.howTitle")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { n: "1", icon: "🔔", title: "landing.how1Title", body: "landing.how1Body" },
            { n: "2", icon: "⚡", title: "landing.how2Title", body: "landing.how2Body" },
            { n: "3", icon: "🎟️", title: "landing.how3Title", body: "landing.how3Body" },
          ].map((s) => (
            <div key={s.n} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime text-lg">
                  {s.icon}
                </span>
                <span className="font-display text-3xl font-bold text-forest/15">{s.n}</span>
              </div>
              <h3 className="mt-3 font-display font-bold text-forest">
                {t(s.title as never)}
              </h3>
              <p className="mt-1 text-sm text-forest/60">{t(s.body as never)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="rounded-3xl bg-lime-soft px-6 py-10 text-center">
        <p className="mx-auto max-w-2xl font-display text-xl font-bold text-forest sm:text-2xl">
          “{t("landing.socialProof")}”
        </p>
        <div className="mt-4 flex items-center justify-center gap-1 text-lime-dark">
          {"★★★★★".split("").map((s, i) => (
            <span key={i}>{s}</span>
          ))}
          <span className="ml-2 text-sm font-semibold text-forest/60">4.8 · 1,200+ golfers</span>
        </div>
      </section>

      {/* Course logos */}
      <section>
        <h2 className="font-display text-2xl font-bold text-forest">{t("landing.coursesTitle")}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {courses.length === 0 &&
            Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          {courses.map((c) => (
            <div
              key={c.id}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-forest/10 bg-white p-4 text-center"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest font-display text-sm font-bold text-lime">
                {c.logoLabel}
              </span>
              <span className="text-xs font-semibold text-forest/70">{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-3xl bg-forest px-6 py-10 text-center text-cream">
        <h2 className="font-display text-2xl font-bold">{t("landing.ctaBrowse")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-cream/70">{t("landing.depositReassure")}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/browse" className="btn-lime">
            {t("landing.ctaBrowse")}
          </Link>
          <Link href="/alerts" className="btn-ghost border-cream/20 bg-cream/10 text-cream hover:bg-cream/20">
            {t("landing.ctaAlert")}
          </Link>
        </div>
      </section>
    </div>
  );
}
