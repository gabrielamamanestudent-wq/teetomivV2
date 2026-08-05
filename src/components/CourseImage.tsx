"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Course photo that always shows something. If the remote image fails to load
 * (404 / blocked / offline), it falls back to a branded gradient with the
 * course's logo label — no empty cards.
 */
export function CourseImage({
  src,
  alt,
  label,
  sizes,
  priority,
  className,
}: {
  src?: string;
  alt: string;
  label?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-br from-forest-600 to-forest-800",
          className,
        )}
        aria-label={alt}
      >
        <span className="font-display text-2xl font-bold tracking-tight text-lime/80">
          {label || "⛳"}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
