// `npm run seed` — prints a summary of the demo seed so you can verify it
// without booting the app. The mock layer builds this seed lazily on first
// request, so there is no external database to write to in demo mode.

import { buildSeed } from "./seed";

const seed = buildSeed(new Date());

const released = seed.slots.filter((s) => s.status === "released").length;
const soonest = seed.slots
  .filter((s) => s.status === "released")
  .sort((a, b) => new Date(a.teeTimeISO).getTime() - new Date(b.teeTimeISO).getTime())[0];

/* eslint-disable no-console */
console.log("\n🏌️  TEETOMIC demo seed\n");
console.log(`  Courses ......... ${seed.courses.length}`);
console.log(`  Slots ........... ${seed.slots.length} (${released} released live)`);
console.log(`  Demo accounts ... ${seed.users.length}`);
console.log(`  Alerts .......... ${seed.alerts.length}`);
console.log(`  Bookings ........ ${seed.bookings.length} (every deposit state represented)`);
if (soonest) {
  console.log(
    `  Soonest deal .... ${soonest.teeTimeISO} @ $${soonest.currentPrice} (was $${soonest.rackRate})`,
  );
}
console.log("\n  Accounts:");
for (const u of seed.users) {
  console.log(`    ${u.role.padEnd(9)} ${u.email} / ${u.password}`);
}
console.log(
  "\n  The mock data layer seeds automatically on first request — `npm run dev` and go.\n",
);
