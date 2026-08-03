"use client";

import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { priceDecayPreview } from "@/lib/pricing";
import type { Slot } from "@/lib/data/types";
import { localDayOfWeek, localHour, hoursUntil } from "@/lib/time";

/** Operator-facing preview of how the slot's price decays toward the tee time. */
export function PriceDecayChart({ slot, floorPrice }: { slot: Slot; floorPrice: number }) {
  const teeHour = localHour(slot.teeTimeISO);
  const data = priceDecayPreview({
    rackRate: slot.rackRate,
    floorPrice,
    dayOfWeek: localDayOfWeek(slot.teeTimeISO),
    band: slot.band,
    teeHour,
    weather: slot.weather,
    fillRate: slot.fillRate,
  }).map((p) => ({ label: p.hoursOut === 0 ? "Tee" : `${p.hoursOut}h`, ...p }));

  const nowHours = Math.max(0, Math.round(hoursUntil(slot.teeTimeISO)));

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B3D2E" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0B3D2E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#0B3D2E99" }}
            axisLine={false}
            tickLine={false}
            reversed
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#0B3D2E99" }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            formatter={(v: number) => [`$${v}`, "Price"]}
            labelFormatter={(l) => `${l} before tee`}
            contentStyle={{ borderRadius: 12, border: "1px solid #0B3D2E22", fontSize: 12 }}
          />
          <ReferenceLine
            y={floorPrice}
            stroke="#C6F432"
            strokeDasharray="4 4"
            label={{ value: "Floor", fontSize: 10, fill: "#0B3D2E", position: "insideBottomLeft" }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#0B3D2E"
            strokeWidth={2.5}
            fill="url(#priceFill)"
            dot={{ r: 2.5, fill: "#0B3D2E" }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[11px] font-semibold text-forest/50">
        Currently ~{nowHours}h out
      </p>
    </div>
  );
}
