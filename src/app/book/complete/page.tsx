"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui";

/**
 * Landing page after Stripe Checkout. Verifies the session server-side, creates
 * the booking, then forwards to the QR confirmation. Only reached when real
 * Stripe is configured; the mock/demo flow never lands here.
 */
export default function BookCompletePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <BookComplete />
    </Suspense>
  );
}

function BookComplete() {
  const { t } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const sessionId = search.get("session_id");
  const [error, setError] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!sessionId) {
      setError(true);
      return;
    }
    api
      .finalizeBooking(sessionId)
      .then(({ booking }) => router.replace(`/booking/${booking.reference}`))
      .catch(() => setError(true));
  }, [sessionId, router]);

  if (error) {
    return (
      <div className="pt-8">
        <EmptyState
          icon="⚠️"
          title={t("common.errorTitle")}
          action={
            <Link href="/browse" className="btn-primary mt-2 text-sm">
              {t("nav.browse")}
            </Link>
          }
        />
      </div>
    );
  }

  return <Spinner label={t("book.processing")} />;
}

function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-forest/20 border-t-forest" />
      {label && <p className="font-display text-lg font-bold text-forest">{label}</p>}
    </div>
  );
}
