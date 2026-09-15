# TEETOMIC — Golfer Waitlist Recruiting (South Florida first)

**The pivot:** cold-emailing courses got no replies because we're asking them to
join an empty marketplace. So we build the *demand* side first. Goal: **40–50
South Florida golfers on the standby list.** Then we walk into pro shops with a
different pitch: *"I have 50 local golfers who want your empty tee times today —
costs you nothing, you set the price, you keep 100% of the green fee."* That's a
conversation a course actually says yes to.

**The link to post everywhere:** `https://teetomic.golf/waitlist`
Add `?src=` to track what's working:
- Reddit → `https://teetomic.golf/waitlist?src=reddit`
- Facebook → `https://teetomic.golf/waitlist?src=fb`
- Instagram → `https://teetomic.golf/waitlist?src=ig`
- Text to a friend → `https://teetomic.golf/waitlist?src=referral`

Signups land in Supabase; you can pull the full list any time from the admin
account (GET `/api/waitlist` with your admin email + password headers), and each
new signup emails your business inbox if `WAITLIST_NOTIFY_TO` is set.

---

## 1. Reddit

**Where** (South FL + golf): r/Miami, r/fortlauderdale, r/SouthFlorida, r/golf
(read rules — r/golf allows regional stuff on weekends / in the daily thread),
r/Kendall, r/Doral, r/browardcounty.

**How to not get banned:** Reddit hates ads. Lead with a genuine question, be a
real person, drop the link once, and reply to everyone. Post from your normal
account, not a fresh one. One subreddit per day, not a blast.

### Post A — the "does anyone else" hook (best for r/Miami, r/fortlauderdale)
> **Anyone else hate paying full rack rate for a last-minute round down here?**
>
> Half the time I'm free to play same-day, the tee sheet has gaps, but I'm still
> paying $80+ walk-up. Courses would rather fill that empty slot for $45 than
> leave it empty, but there's no easy way to connect the two.
>
> I'm building a free text-alert list for South FL golfers — when a nearby course
> drops a discounted last-minute tee time, you get pinged and grab it. No booking
> fees while we're getting started. Trying to gather enough local golfers that
> courses take it seriously.
>
> If you'd use this, the list is here: teetomic.golf/waitlist — happy to answer
> anything in the comments.

### Post B — short version (for r/golf regional/daily threads)
> South Florida golfers — building a free last-minute tee-time deal alert (get a
> text when a nearby course discounts an empty slot). Gathering the first 50
> local players so courses buy in. Link if you want in: teetomic.golf/waitlist

---

## 2. Facebook Groups

**Where:** search these and join — this is where SoFla golfers actually hang out:
- "South Florida Golfers"
- "Miami Golf" / "Miami Golfers"
- "Broward County Golf"
- "Golf Deals South Florida"
- "Fort Lauderdale Golf"
- Municipal course groups (Doral, Crandon, Miami Beach GC, Costa Del Sol players)
- Snowbird / retiree community groups near courses (huge daytime golf audience)

**How:** post as yourself, be warm, reply fast. Groups allow a bit more directness
than Reddit but still ask admins if it's a "no promo" group — many will say yes
to a free tool for members.

### Post
> 🏌️ **Free perk for South Florida golfers — last-minute tee-time deals by text**
>
> Quick one for the group: I'm putting together a standby list for golfers who,
> like me, will happily play same-day if the price is right. When a nearby course
> has empty tee times it wants to fill, you get a text with the discounted rate
> and grab it before it's gone. Free to join, no booking fees while we launch.
>
> I'm trying to sign up the first 40–50 local players so I can bring courses on
> board. If you're in Miami-Dade or Broward and want in:
> 👉 teetomic.golf/waitlist
>
> Drop your home course in the comments too — helps me know where to push first. ⛳

---

## 3. Instagram

**Handle idea:** @teetomic (or @teetomic.golf). Bio: "Last-minute tee-time deals,
South Florida ⛳ Free standby list 👇 teetomic.golf/waitlist"

**Content to post (link in bio, "link in bio" in caption):**

**Reel / carousel 1 — the problem**
> Caption: POV: it's a gorgeous Miami morning, you're free to play, and every
> course wants $85 walk-up for a slot that's about to sit empty anyway. 🙃
> There's a better way. Free standby list for SoFla golfers — get a text when a
> course drops a last-minute deal near you. Link in bio. #miamigolf #golfdeals
> #southfloridagolf #golf

**Story poll**
> "Would you play more golf if last-minute rounds were 30–40% off? YES / obviously
> yes" → swipe-up / link sticker to teetomic.golf/waitlist

**Hashtags:** #miamigolf #miamigolfer #southfloridagolf #browardgolf #golfmiami
#doralgolf #golfdeals #teetime #golflife

---

## 4. Text / referral (your warm network)

The fastest 10 signups are people you know. Text golf friends directly:
> Hey — building a thing for last-minute cheap tee times in South Florida. Free,
> just get a text when a course near you discounts an open slot. Mind adding your
> name so I can show courses there's demand? teetomic.golf/waitlist?src=referral 🙏

On the waitlist confirmation screen we already ask each new member to forward the
link to a golf buddy — every golfer you add makes the course pitch stronger.

---

## 5. The 2-week plan

| Day | Action |
|-----|--------|
| 1 | Text 10–15 golf friends the referral message. Set up the IG account + bio link. |
| 2 | Post A in r/Miami. Reply to every comment same day. |
| 3 | Post in 2–3 Facebook groups (ask admins first where needed). |
| 4 | Post A in r/fortlauderdale. IG problem reel + story poll. |
| 5 | Post B in the r/golf daily thread. Follow up with anyone who commented. |
| 6–7 | Weekend = peak golf browsing. Re-post in the most active FB group, DM engaged commenters. |
| 8–14 | Rotate remaining subreddits/groups (one/day), keep replying, track `?src=` to double down on the best channel. |

**Target check:** ~40–50 signups → pull the list → start Miami/Broward pro-shop
visits (in person or by phone) with the demand roster in hand. That's the moment
the course pitch stops being cold.

---

## What to say to a course once you have the list (the payoff)

> "I run a free standby list — I've got [N] local golfers in [Doral/Kendall/etc.]
> who want to play same-day when the price is right. You've got tee times that go
> empty every afternoon. List them on TEETOMIC at whatever price you'll accept —
> I text my golfers, they book, you keep 100% of the green fee. No cost, no
> exclusivity, no change to your tee sheet software. Want me to send you today's
> golfers so you can see who's nearby?"

That's a yes. Empty inventory + proven demand + zero risk.
