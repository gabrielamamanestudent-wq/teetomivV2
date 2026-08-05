import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM = `You are the TEETOMIC help assistant. TEETOMIC is Montreal's last-minute tee-time "standby list" for golf.
Key facts:
- Golfers reserve a released tee time with a $10 booking fee. It comes back as $10 TeeCredit plus points when they check in at the course. The green fee is paid directly at the pro shop, never through TEETOMIC.
- Free cancellation until the deadline shown on the booking. Cancel late or no-show and the $10 isn't returned — unless the slot is re-filled before tee time, then it's refunded automatically.
- Points: 300 = Gold (booking fees waived, priority on new slots), 600 = Gold Plus (skill-based matchmaking). TEETOMIC+ is $9.99/mo and gives Gold Plus instantly.
- Standby alerts: pick days, time window, region, max price; you get pinged the moment a matching slot is released.
- Courses/businesses join via the Business Corner, list their own empty slots, keep 100% of the green fee, and set the hours they can't fill.
Answer in the user's language (English or French). Be warm, concise (under 80 words), and specific. If you don't know, say so and suggest emailing support.`;

interface KB {
  keys: string[];
  en: string;
  fr: string;
}

const KB: KB[] = [
  {
    keys: ["deposit", "fee", "$10", "10", "pay", "cost", "charge", "dépôt", "frais", "coûte", "payer"],
    en: "The $10 booking fee holds your spot and comes back as $10 TeeCredit plus points when you check in at the course. Your green fee is paid at the pro shop — never through TEETOMIC.",
    fr: "Les frais de 10 $ retiennent votre place et reviennent en crédit TeeCredit de 10 $ plus des points à l'enregistrement au club. Le droit de jeu se paie à la boutique — jamais via TEETOMIC.",
  },
  {
    keys: ["cancel", "refund", "no-show", "cancellation", "annul", "rembours", "absence"],
    en: "Free cancellation until the deadline on your booking. Cancel late or no-show and the $10 isn't returned — unless the slot is re-filled before tee time, then it's refunded automatically.",
    fr: "Annulation gratuite jusqu'au délai indiqué. Annulation tardive ou absence : les 10 $ ne sont pas remis — sauf si la place est reprise avant le départ, alors c'est remboursé automatiquement.",
  },
  {
    keys: ["point", "gold", "tier", "reward", "teecredit", "credit", "plus", "or", "récompense", "niveau"],
    en: "Every check-in earns points: 300 for Gold (waived fees + priority) and 600 for Gold Plus (skill matchmaking). TEETOMIC+ ($9.99/mo) gets you Gold Plus instantly.",
    fr: "Chaque enregistrement rapporte des points : 300 pour Or (frais offerts + priorité) et 600 pour Or Plus (jumelage). TEETOMIC+ (9,99 $/mois) donne Or Plus tout de suite.",
  },
  {
    keys: ["alert", "standby", "ping", "notify", "alerte", "notification"],
    en: "Set your days, time window, region and max price. The instant a matching tee time is released, we ping you so you can grab it before anyone else.",
    fr: "Choisissez jours, plage horaire, région et prix max. Dès qu'un départ correspond, on vous ping pour le saisir avant tout le monde.",
  },
  {
    keys: ["business", "course", "operator", "shop", "list", "release", "affaires", "club", "boutique"],
    en: "Courses join via the Business Corner: enter your business code, create an account, and once approved you release empty slots (keeping 100% of the green fee) and set the hours you can't fill.",
    fr: "Les clubs rejoignent via l'Espace affaires : entrez votre code, créez un compte, et une fois approuvé, publiez vos départs (en gardant 100 % du droit de jeu) et réglez vos heures.",
  },
  {
    keys: ["book", "reserve", "how", "work", "réserv", "comment", "marche"],
    en: "Browse live deals or set a standby alert, pick a slot and number of players, pay the $10 fee, and you're on the tee sheet with a QR code. Show it at the pro shop to check in.",
    fr: "Parcourez les offres ou créez une alerte, choisissez un départ et le nombre de joueurs, payez les 10 $, et vous êtes sur la feuille de départ avec un code QR à présenter à la boutique.",
  },
];

function matchKB(message: string, locale: "en" | "fr"): string {
  const low = message.toLowerCase();
  const hit = KB.find((k) => k.keys.some((key) => low.includes(key)));
  if (hit) return locale === "fr" ? hit.fr : hit.en;
  return locale === "fr"
    ? "Bonne question ! Je peux vous aider avec les frais de 10 $, les annulations, les points/Or, les alertes standby, ou l'inscription d'un club. Que voulez-vous savoir ?"
    : "Good question! I can help with the $10 fee, cancellations, points/Gold, standby alerts, or listing a course. What would you like to know?";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message: string = body?.message ?? "";
  const locale: "en" | "fr" = body?.locale === "fr" ? "fr" : "en";
  if (!message.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.HELP_MODEL || "claude-haiku-4-5-20251001",
          max_tokens: 320,
          system: SYSTEM + `\n\nReply in ${locale === "fr" ? "French" : "English"}.`,
          messages: [{ role: "user", content: message }],
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = (data.content || [])
          .map((c: { text?: string }) => c.text || "")
          .join("")
          .trim();
        if (text) return NextResponse.json({ reply: text, ai: true });
      }
    } catch {
      /* fall through to KB */
    }
  }

  return NextResponse.json({ reply: matchKB(message, locale), ai: false });
}
