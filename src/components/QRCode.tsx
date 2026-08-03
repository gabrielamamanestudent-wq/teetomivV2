"use client";

import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

/** Renders a QR code encoding the booking reference for pro-shop check-in. */
export function QRCode({ value, size = 180 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    QRCodeLib.toDataURL(value, {
      margin: 1,
      width: size * 2,
      color: { dark: "#0B3D2E", light: "#FFFFFF" },
    })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [value, size]);

  if (!src)
    return (
      <div
        className="skeleton rounded-2xl"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`QR code for ${value}`}
      width={size}
      height={size}
      className="rounded-2xl border-4 border-white shadow-card"
    />
  );
}
