import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

// Default to Claude Opus 5 (best quality); override with HELP_MODEL if you want
// a cheaper model such as claude-haiku-4-5 for a high-traffic help desk.
const HELP_MODEL = process.env.HELP_MODEL || "claude-opus-5";

const SYSTEM = `You are the TEETOMIC help assistant. TEETOMIC is Montreal's last-minute tee-time "standby list" for golf.
Key facts:
- Golfers reserve a released tee time with a $10 booking fee. It comes back as $10 TeeCredit plus points when they check in at the course. The green fee is paid directly at the pro shop, never through TEETOMIC.
- Free cancellation until the deadline shown on the booking. Cancel late or no-show and the $10 isn't returned — unless the slot is re-filled before tee time, then it's refunded automatically.
- Points: 300 = Gold (booking fees waived, priority on new slots), 600 = Gold Plus (skill-based matchmaking). TEETOMIC+ is $9.99/mo and gives Gold Plus instantly.
- Standby alerts: pick days, time window, region, max price; you get pinged the moment a matching slot is released.
- Courses/businesses join via the Business Corner, list their own empty slots at their own price, keep 100% of the green fee, and set the hours they can't fill. New empty slots must be listed at least 1h30 before tee time. Business accounts are approved by email before they go live.
Style: be warm, concise (under 80 words), and specific. Only answer questions about TEETOMIC and golf tee times. If you don't know or it's off-topic, say so briefly and suggest emailing support@teetomic.golf.`;

// ---- Offline fallback knowledge base (used when no ANTHROPIC_API_KEY) --------
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
    en: "Courses join via the Business Corner: enter your business code, create an account, and once approved you release empty slots at your own price (keeping 100% of the green fee) and set the hours you can't fill.",
    fr: "Les clubs rejoignent via l'Espace affaires : entrez votre code, créez un compte, et une fois approuvé, publiez vos départs à votre prix (en gardant 100 % du droit de jeu) et réglez vos heures.",
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

// The client's chat thread uses {role:"user"|"bot"}; Claude expects
// {role:"user"|"assistant"}. Keep only the trailing turns to bound token use.
interface Turn {
  role: "user" | "bot";
  text: string;
}

function toClaudeMessages(history: Turn[], message: string): Anthropic.MessageParam[] {
  const msgs: Anthropic.MessageParam[] = [];
  for (const turn of history.slice(-8)) {
    const text = (turn?.text || "").trim();
    if (!text) continue;
    msgs.push({ role: turn.role === "user" ? "user" : "assistant", content: text });
  }
  msgs.push({ role: "user", content: message });
  // The Messages API requires the first message to be from the user.
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  return msgs;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message: string = body?.message ?? "";
  const locale: "en" | "fr" = body?.locale === "fr" ? "fr" : "en";
  const history: Turn[] = Array.isArray(body?.history) ? body.history : [];
  if (!message.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    try {
      const client = new Anthropic({ apiKey: key });
      const res = await client.messages.create({
        model: HELP_MODEL,
        max_tokens: 400,
        system: SYSTEM + `\n\nAlways reply in ${locale === "fr" ? "French" : "English"}.`,
        messages: toClaudeMessages(history, message.trim()),
      });

      // Safety guard: the model can decline to engage with disallowed content.
      if (res.stop_reason === "refusal") {
        return NextResponse.json({ reply: matchKB(message, locale), ai: false });
      }

      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();

      if (text) return NextResponse.json({ reply: text, ai: true });
    } catch (err) {
      // Any API/network error → fall through to the offline KB so the help
      // center always answers something useful.
      console.error("help/claude", err);
    }
  }

  return NextResponse.json({ reply: matchKB(message, locale), ai: false });
}
