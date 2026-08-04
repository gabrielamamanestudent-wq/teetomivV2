// ============================================================================
// TEETOMIC bilingual dictionary (English / Québec French)
// Every user-facing string lives here — components never hardcode copy.
// ============================================================================

import type { Locale } from "../data/types";

export const dict = {
  // --- global / nav ---------------------------------------------------------
  "brand.tagline": {
    en: "Montreal's standby list for golf",
    fr: "La liste d'attente golf de Montréal",
  },
  "nav.browse": { en: "Browse deals", fr: "Voir les offres" },
  "nav.alerts": { en: "Standby alerts", fr: "Alertes standby" },
  "nav.bookings": { en: "My bookings", fr: "Mes réservations" },
  "nav.operator": { en: "Pro shop", fr: "Boutique" },
  "nav.rewards": { en: "Rewards", fr: "Récompenses" },
  "nav.admin": { en: "Admin", fr: "Admin" },
  "nav.demo": { en: "Demo", fr: "Démo" },
  "common.back": { en: "Back", fr: "Retour" },
  "common.loading": { en: "Loading…", fr: "Chargement…" },
  "common.free": { en: "Free", fr: "Gratuit" },
  "common.was": { en: "was", fr: "avant" },
  "common.perPlayer": { en: "/player", fr: "/joueur" },
  "common.spotsLeft": { en: "spots left", fr: "places restantes" },
  "common.spotLeft": { en: "spot left", fr: "place restante" },
  "common.viewDeal": { en: "View deal", fr: "Voir l'offre" },
  "common.holes": { en: "holes", fr: "trous" },
  "common.cart": { en: "Cart", fr: "Voiturette" },
  "common.walking": { en: "Walking", fr: "À pied" },
  "common.retry": { en: "Try again", fr: "Réessayer" },
  "common.errorTitle": { en: "Something went wrong", fr: "Une erreur s'est produite" },

  // --- landing --------------------------------------------------------------
  "landing.heroKicker": {
    en: "Last-minute tee times",
    fr: "Départs de dernière minute",
  },
  "landing.heroTitle": {
    en: "Up to 60% off. Montreal's standby list for golf.",
    fr: "Jusqu'à 60 % de rabais. La liste d'attente golf de Montréal.",
  },
  "landing.heroSub": {
    en: "When a foursome cancels at 6pm for a 7am slot, that tee time shouldn't die. Set an alert, grab the deal, pay a $10 booking fee — it comes back as TeeCredit when you check in, and earns points toward Gold. Your green fee is paid at the course.",
    fr: "Quand un quatuor annule à 18 h pour un départ à 7 h, ce départ ne devrait pas disparaître. Créez une alerte, saisissez l'offre, versez des frais de réservation de 10 $ — remis en crédit TeeCredit à l'enregistrement, avec des points vers le statut Or. Le droit de jeu se paie au club.",
  },
  "landing.ctaBrowse": { en: "Browse tonight's deals", fr: "Voir les offres de ce soir" },
  "landing.ctaAlert": { en: "Set a standby alert", fr: "Créer une alerte standby" },
  "landing.tickerLabel": { en: "Just released", fr: "Vient d'être publié" },
  "landing.howTitle": { en: "How TEETOMIC works", fr: "Comment fonctionne TEETOMIC" },
  "landing.how1Title": { en: "Set your standby", fr: "Créez votre standby" },
  "landing.how1Body": {
    en: "Pick your days, time window, region and max price. We watch every course for you.",
    fr: "Choisissez vos jours, plage horaire, région et prix max. On surveille chaque club pour vous.",
  },
  "landing.how2Title": { en: "Get the ping", fr: "Recevez le ping" },
  "landing.how2Body": {
    en: "The moment a course releases a matching slot, you get an instant alert and email.",
    fr: "Dès qu'un club libère un départ correspondant, vous recevez une alerte instantanée et un courriel.",
  },
  "landing.how3Title": { en: "Reserve in seconds", fr: "Réservez en secondes" },
  "landing.how3Body": {
    en: "A $10 booking fee locks your spot — it comes back as TeeCredit when you check in. Pay the green fee at the pro shop.",
    fr: "Des frais de 10 $ verrouillent votre place — remis en TeeCredit à l'enregistrement. Payez le droit de jeu à la boutique.",
  },
  "landing.socialProof": {
    en: "Golfers recovered 3,400+ tee times that would have gone empty",
    fr: "Les golfeurs ont récupéré plus de 3 400 départs qui seraient restés vides",
  },
  "landing.coursesTitle": { en: "Courses on TEETOMIC", fr: "Clubs sur TEETOMIC" },
  "landing.depositReassure": {
    en: "$10 to reserve — back as TeeCredit when you play. Never prepay your green fee.",
    fr: "10 $ pour réserver — remis en TeeCredit quand vous jouez. Ne payez jamais le droit de jeu d'avance.",
  },

  // --- browse ---------------------------------------------------------------
  "browse.title": { en: "Live tee time deals", fr: "Offres de départ en direct" },
  "browse.list": { en: "List", fr: "Liste" },
  "browse.map": { en: "Map", fr: "Carte" },
  "browse.filters": { en: "Filters", fr: "Filtres" },
  "browse.date": { en: "Date", fr: "Date" },
  "browse.timeWindow": { en: "Time window", fr: "Plage horaire" },
  "browse.maxPrice": { en: "Max price", fr: "Prix max" },
  "browse.region": { en: "Region", fr: "Région" },
  "browse.holes": { en: "Holes", fr: "Trous" },
  "browse.any": { en: "Any", fr: "Toutes" },
  "browse.empty": {
    en: "No live deals match your filters yet — set a standby alert and we'll ping you.",
    fr: "Aucune offre ne correspond à vos filtres — créez une alerte standby et on vous pingera.",
  },
  "browse.mapFallback": {
    en: "Map view needs a Mapbox token. Showing the list instead.",
    fr: "La carte nécessite un jeton Mapbox. Affichage de la liste.",
  },
  "browse.resultsCount": { en: "live deals", fr: "offres en direct" },

  // --- bands ---------------------------------------------------------------
  "band.dawn": { en: "Dawn patrol", fr: "Aube" },
  "band.morning": { en: "Morning", fr: "Matin" },
  "band.midday": { en: "Midday", fr: "Midi" },
  "band.twilight": { en: "Twilight", fr: "Crépuscule" },

  // --- regions -------------------------------------------------------------
  "region.west-island": { en: "West Island", fr: "West Island" },
  "region.south-shore": { en: "South Shore", fr: "Rive-Sud" },
  "region.laval": { en: "Laval", fr: "Laval" },
  "region.north-shore": { en: "North Shore", fr: "Rive-Nord" },

  // --- deal / booking -------------------------------------------------------
  "deal.expiresIn": { en: "Expires in", fr: "Expire dans" },
  "deal.reserve": { en: "Reserve this deal", fr: "Réserver cette offre" },
  "deal.players": { en: "Number of players", fr: "Nombre de joueurs" },
  "deal.dueAtCourse": { en: "Due at the pro shop", fr: "Dû à la boutique" },
  "deal.depositLine": {
    en: "Reserve with a $10 booking fee",
    fr: "Réservez avec des frais de 10 $",
  },
  "deal.depositExplain": {
    en: "The $10 fee holds your spot and comes back as $10 TeeCredit when you check in — plus points toward Gold. Your green fee is paid directly at the course.",
    fr: "Les frais de 10 $ retiennent votre place et reviennent en crédit TeeCredit de 10 $ à l'enregistrement — avec des points vers le statut Or. Le droit de jeu se paie directement au club.",
  },
  "deal.notFound": { en: "This deal is no longer available.", fr: "Cette offre n'est plus disponible." },

  "book.title": { en: "Confirm your reservation", fr: "Confirmez votre réservation" },
  "book.summary": { en: "Reservation summary", fr: "Résumé de la réservation" },
  "book.greenFee": { en: "Green fee (pay at course)", fr: "Droit de jeu (payé au club)" },
  "book.deposit": { en: "Booking fee (now)", fr: "Frais de réservation (maintenant)" },
  "book.totalNow": { en: "Charged now", fr: "Débité maintenant" },
  "book.freeCancelUntil": { en: "Free cancellation until", fr: "Annulation gratuite jusqu'à" },
  "book.cardLabel": { en: "Card details (Stripe test mode)", fr: "Carte (Stripe mode test)" },
  "book.testCardHint": { en: "Use test card 4242 4242 4242 4242", fr: "Carte test 4242 4242 4242 4242" },
  "book.pay": { en: "Pay $10 fee & reserve", fr: "Payer les frais de 10 $ et réserver" },
  "book.payWaived": { en: "Reserve — fee waived (Gold)", fr: "Réserver — frais offerts (Or)" },
  "book.applyCredit": { en: "Apply my TeeCredit", fr: "Utiliser mon TeeCredit" },
  "book.creditApplied": { en: "TeeCredit applied", fr: "TeeCredit appliqué" },
  "book.earnLine": {
    en: "You'll earn {pts} points and get $10 TeeCredit back at check-in.",
    fr: "Vous gagnerez {pts} points et récupérerez 10 $ en TeeCredit à l'enregistrement.",
  },
  "book.processing": { en: "Reserving your slot…", fr: "Réservation en cours…" },
  "book.name": { en: "Your name", fr: "Votre nom" },
  "book.email": { en: "Email", fr: "Courriel" },
  "book.mockNote": {
    en: "No Stripe key set — deposit is simulated (always succeeds).",
    fr: "Aucune clé Stripe — le dépôt est simulé (réussit toujours).",
  },

  "confirm.title": { en: "You're on the tee sheet!", fr: "Vous êtes sur la feuille de départ !" },
  "confirm.reference": { en: "Booking reference", fr: "Référence de réservation" },
  "confirm.showQr": {
    en: "Show this QR code at the pro shop to check in.",
    fr: "Présentez ce code QR à la boutique pour vous enregistrer.",
  },
  "confirm.dueLine": {
    en: "Pay {price}/player at the pro shop — your $10 fee comes back as TeeCredit at check-in.",
    fr: "Payez {price}/joueur à la boutique — vos frais de 10 $ reviennent en TeeCredit à l'enregistrement.",
  },
  "confirm.earned": {
    en: "You'll earn {pts} points toward your next tier.",
    fr: "Vous gagnerez {pts} points vers votre prochain niveau.",
  },
  "confirm.cancelLine": { en: "Free cancellation until {time}", fr: "Annulation gratuite jusqu'à {time}" },
  "confirm.emailSent": { en: "Confirmation sent to {email}", fr: "Confirmation envoyée à {email}" },
  "confirm.viewBookings": { en: "View my bookings", fr: "Voir mes réservations" },

  // --- alerts ---------------------------------------------------------------
  "alerts.title": { en: "Standby alerts", fr: "Alertes standby" },
  "alerts.subtitle": {
    en: "We'll ping you the instant a matching tee time is released.",
    fr: "On vous pingera dès qu'un départ correspondant est libéré.",
  },
  "alerts.create": { en: "Create an alert", fr: "Créer une alerte" },
  "alerts.label": { en: "Name this alert", fr: "Nommez cette alerte" },
  "alerts.labelPlaceholder": { en: "e.g. Saturday dawn patrol", fr: "ex. Aube du samedi" },
  "alerts.regions": { en: "Regions", fr: "Régions" },
  "alerts.bands": { en: "Time windows", fr: "Plages horaires" },
  "alerts.days": { en: "Days", fr: "Jours" },
  "alerts.maxPrice": { en: "Max price per player", fr: "Prix max par joueur" },
  "alerts.save": { en: "Save alert", fr: "Enregistrer l'alerte" },
  "alerts.active": { en: "Active", fr: "Active" },
  "alerts.paused": { en: "Paused", fr: "En pause" },
  "alerts.empty": {
    en: "No alerts yet. Create one and never miss a deal.",
    fr: "Aucune alerte. Créez-en une et ne manquez aucune offre.",
  },
  "alerts.notifications": { en: "Recent pings", fr: "Pings récents" },
  "alerts.noNotifications": { en: "No pings yet.", fr: "Aucun ping pour le moment." },
  "alerts.anyDay": { en: "Any day", fr: "Tous les jours" },
  "alerts.matchingNow": { en: "matching now", fr: "correspond maintenant" },

  // --- my bookings ----------------------------------------------------------
  "bookings.title": { en: "My bookings", fr: "Mes réservations" },
  "bookings.upcoming": { en: "Upcoming", fr: "À venir" },
  "bookings.past": { en: "Past", fr: "Passées" },
  "bookings.empty": { en: "No bookings yet.", fr: "Aucune réservation." },
  "bookings.cancel": { en: "Cancel booking", fr: "Annuler la réservation" },
  "bookings.rebook": { en: "Re-book", fr: "Réserver à nouveau" },
  "bookings.deposit": { en: "Deposit", fr: "Dépôt" },
  "bookings.freeUntil": { en: "Free cancel until {time}", fr: "Annulation gratuite jusqu'à {time}" },
  "bookings.lateCancel": {
    en: "Past the free window — deposit forfeited unless the slot re-fills.",
    fr: "Fenêtre gratuite dépassée — dépôt perdu sauf si la place se remplit.",
  },
  "bookings.cancelConfirm": { en: "Cancel this booking?", fr: "Annuler cette réservation ?" },

  // --- deposit statuses -----------------------------------------------------
  "status.confirmed": { en: "Confirmed", fr: "Confirmée" },
  "status.checked-in": { en: "Checked in", fr: "Enregistré" },
  "status.cancelled": { en: "Cancelled", fr: "Annulée" },
  "status.no-show": { en: "No-show", fr: "Absence" },
  "deposit.authorized": { en: "$10 fee charged", fr: "Frais de 10 $ débités" },
  "deposit.refunded": { en: "Fee returned to card", fr: "Frais remis à la carte" },
  "deposit.credited": { en: "Back as $10 TeeCredit", fr: "Remis en TeeCredit de 10 $" },
  "deposit.forfeited": { en: "Fee kept — no-show", fr: "Frais conservés — absence" },
  "deposit.refunded-on-refill": { en: "Returned — slot re-filled", fr: "Remis — place reprise" },

  // --- operator -------------------------------------------------------------
  "op.title": { en: "Pro shop dashboard", fr: "Tableau de bord boutique" },
  "op.teesheet": { en: "Tee sheet", fr: "Feuille de départ" },
  "op.release": { en: "Release a slot", fr: "Libérer un départ" },
  "op.checkin": { en: "Check-in queue", fr: "File d'enregistrement" },
  "op.stats": { en: "Payouts & stats", fr: "Revenus et stats" },
  "op.gaps": { en: "Tomorrow's open slots", fr: "Départs libres de demain" },
  "op.pushLive": { en: "Push to TEETOMIC", fr: "Publier sur TEETOMIC" },
  "op.floorPrice": { en: "Floor price", fr: "Prix plancher" },
  "op.suggested": { en: "Suggested price", fr: "Prix suggéré" },
  "op.pushing": { en: "Publishing…", fr: "Publication…" },
  "op.pushed": { en: "Live! {n} alert-holders notified.", fr: "En ligne ! {n} détenteurs d'alertes notifiés." },
  "op.decayPreview": { en: "Price decay preview", fr: "Aperçu de la décote" },
  "op.legendBooked": { en: "Booked via TEETOMIC", fr: "Réservé via TEETOMIC" },
  "op.legendReleased": { en: "Released", fr: "Libéré" },
  "op.legendUnlisted": { en: "Unlisted", fr: "Non listé" },
  "op.checkedIn": { en: "Checked in ✓", fr: "Enregistré ✓" },
  "op.checkInBtn": { en: "Check in", fr: "Enregistrer" },
  "op.scanQr": { en: "Scan QR", fr: "Scanner QR" },
  "op.refundTriggered": { en: "Deposit refund triggered", fr: "Remboursement du dépôt déclenché" },
  "op.grossBookings": { en: "Gross bookings", fr: "Réservations brutes" },
  "op.teetomicFee": { en: "TEETOMIC fee", fr: "Frais TEETOMIC" },
  "op.recovered": { en: "Dead inventory recovered", fr: "Inventaire mort récupéré" },
  "op.recoveredSub": {
    en: "of tee times that would have gone empty this month",
    fr: "de départs qui seraient restés vides ce mois-ci",
  },
  "op.noShowRate": { en: "No-show rate", fr: "Taux d'absence" },
  "op.noShowSub": { en: "down since joining TEETOMIC", fr: "en baisse depuis TEETOMIC" },
  "op.forfeitShare": { en: "Your forfeited-deposit share", fr: "Votre part des dépôts perdus" },
  "op.releaseHint": {
    en: "Tap a gap, accept the suggested price or set your floor, then push. Matching alert-holders are pinged instantly.",
    fr: "Touchez un créneau, acceptez le prix suggéré ou fixez votre plancher, puis publiez. Les détenteurs d'alertes sont pingés instantanément.",
  },
  "op.noCheckins": { en: "No check-ins scheduled today.", fr: "Aucun enregistrement prévu aujourd'hui." },
  "op.pushAt": { en: "Set live price", fr: "Prix de mise en ligne" },
  "op.hours": { en: "Hours", fr: "Heures" },
  "op.hoursHint": {
    en: "Set the days and time windows you can't fill. Slots in these hours can never be listed on TEETOMIC.",
    fr: "Indiquez les jours et plages horaires que vous ne pouvez pas remplir. Ces départs ne seront jamais publiés sur TEETOMIC.",
  },
  "op.closedDays": { en: "Days you never list", fr: "Jours non listés" },
  "op.blackoutWindows": { en: "Blackout windows", fr: "Plages bloquées" },
  "op.addWindow": { en: "Add window", fr: "Ajouter une plage" },
  "op.noBlackout": { en: "No blackout windows — all hours can be listed.", fr: "Aucune plage bloquée — toutes les heures peuvent être listées." },
  "op.windowLabel": { en: "Label (optional)", fr: "Étiquette (facultatif)" },
  "op.blackoutExplain": { en: "These hours are blocked daily:", fr: "Ces heures sont bloquées chaque jour :" },
  "op.saveHours": { en: "Save hours", fr: "Enregistrer les heures" },
  "op.hoursSaved": { en: "Hours saved", fr: "Heures enregistrées" },
  "op.blackout": { en: "Blackout", fr: "Bloqué" },

  // --- course master account signup ----------------------------------------
  "op.signupTitle": { en: "Create your pro shop account", fr: "Créez votre compte boutique" },
  "op.signupSub": {
    en: "List your empty tee times, keep 100% of the green fee. Set the hours you can't fill.",
    fr: "Publiez vos départs vides, gardez 100 % du droit de jeu. Choisissez les heures que vous ne pouvez pas remplir.",
  },
  "op.courseName": { en: "Course name", fr: "Nom du club" },
  "op.city": { en: "City", fr: "Ville" },
  "op.region": { en: "Region", fr: "Région" },
  "op.contactName": { en: "Your name", fr: "Votre nom" },
  "op.signupEmail": { en: "Email", fr: "Courriel" },
  "op.signupPin": { en: "Choose a 4-digit PIN", fr: "Choisissez un NIP à 4 chiffres" },
  "op.createCourse": { en: "Create pro shop account", fr: "Créer le compte boutique" },
  "op.forCourses": { en: "I run a course", fr: "Je gère un club" },
  "op.forCoursesDesc": { en: "Pro shop master account — list slots, set your hours", fr: "Compte maître boutique — publiez des départs, réglez vos heures" },
  "op.created": { en: "Account created — welcome to your dashboard!", fr: "Compte créé — bienvenue sur votre tableau de bord !" },

  // --- admin ----------------------------------------------------------------
  "admin.title": { en: "TEETOMIC — internal metrics", fr: "TEETOMIC — métriques internes" },
  "admin.gmv": { en: "GMV (green fees moved)", fr: "GMV (droits de jeu générés)" },
  "admin.bookings": { en: "Bookings", fr: "Réservations" },
  "admin.alerts": { en: "Active alerts", fr: "Alertes actives" },
  "admin.courses": { en: "Courses onboarded", fr: "Clubs intégrés" },
  "admin.funnel": { en: "Conversion funnel", fr: "Entonnoir de conversion" },
  "admin.funnelViews": { en: "Deal views", fr: "Vues d'offres" },
  "admin.funnelStarts": { en: "Booking starts", fr: "Débuts de réservation" },
  "admin.funnelCompleted": { en: "Completed", fr: "Complétées" },
  "admin.reset": { en: "Reset demo data", fr: "Réinitialiser la démo" },
  "admin.resetting": { en: "Reseeding…", fr: "Réinitialisation…" },
  "admin.resetDone": { en: "Demo data reseeded.", fr: "Données de démo réinitialisées." },
  "admin.deposits": { en: "Deposit states", fr: "États des dépôts" },

  // --- demo -----------------------------------------------------------------
  "demo.title": { en: "Demo cheat-sheet", fr: "Aide-mémoire démo" },
  "demo.subtitle": {
    en: "Credentials and the 90-second walkthrough for your live pitch.",
    fr: "Identifiants et parcours de 90 secondes pour votre pitch en direct.",
  },
  "demo.accounts": { en: "Demo accounts", fr: "Comptes démo" },
  "demo.script": { en: "90-second demo script", fr: "Script de démo de 90 s" },

  // --- rewards / loyalty ----------------------------------------------------
  "rewards.title": { en: "Rewards", fr: "Récompenses" },
  "rewards.subtitle": {
    en: "Every check-in earns points and returns your $10 as TeeCredit. Climb to Gold and Gold Plus.",
    fr: "Chaque enregistrement rapporte des points et vous remet 10 $ en TeeCredit. Montez vers Or et Or Plus.",
  },
  "rewards.points": { en: "Points", fr: "Points" },
  "rewards.credit": { en: "TeeCredit balance", fr: "Solde TeeCredit" },
  "rewards.tier": { en: "Your tier", fr: "Votre niveau" },
  "rewards.toNext": { en: "{n} pts to {tier}", fr: "{n} pts vers {tier}" },
  "rewards.topTier": { en: "Top tier reached 🏆", fr: "Niveau maximal atteint 🏆" },
  "rewards.perks": { en: "Your perks", fr: "Vos avantages" },
  "rewards.perkPriority": { en: "{min}-min priority on new slots", fr: "Priorité de {min} min sur les nouveaux départs" },
  "rewards.perkFee": { en: "Booking fee waived", fr: "Frais de réservation offerts" },
  "rewards.perkMatch": { en: "Skill-based matchmaking", fr: "Jumelage selon le calibre" },
  "rewards.ledger": { en: "Points activity", fr: "Activité des points" },
  "rewards.noLedger": { en: "No points yet — book and check in to start earning.", fr: "Aucun point — réservez et enregistrez-vous pour commencer." },
  "rewards.plusTitle": { en: "TEETOMIC+", fr: "TEETOMIC+" },
  "rewards.plusPitch": {
    en: "Skip the wait to Gold Plus. Priority booking, skill matchmaking, and waived fees — $9.99/mo.",
    fr: "Passez directement à Or Plus. Réservation prioritaire, jumelage et frais offerts — 9,99 $/mois.",
  },
  "rewards.subscribe": { en: "Get TEETOMIC+", fr: "Obtenir TEETOMIC+" },
  "rewards.subscribed": { en: "TEETOMIC+ active", fr: "TEETOMIC+ actif" },
  "rewards.unsubscribe": { en: "Cancel TEETOMIC+", fr: "Annuler TEETOMIC+" },
  "rewards.matchTitle": { en: "Golfers near your level", fr: "Golfeurs de votre calibre" },
  "rewards.matchSub": { en: "Gold Plus — matched by handicap", fr: "Or Plus — jumelé par handicap" },
  "rewards.handicap": { en: "Your handicap", fr: "Votre handicap" },
  "rewards.handicapSave": { en: "Save", fr: "Enregistrer" },
  "rewards.hcp": { en: "hcp", fr: "hcp" },
  "rewards.earnedVia": { en: "earned", fr: "gagné" },
  "rewards.viaPlus": { en: "via TEETOMIC+", fr: "via TEETOMIC+" },
  "tier.standby": { en: "Standby", fr: "Standby" },
  "tier.gold": { en: "Gold", fr: "Or" },
  "tier.gold-plus": { en: "Gold Plus", fr: "Or Plus" },

  // --- welcome gate ---------------------------------------------------------
  "welcome.title": { en: "Welcome to TEETOMIC", fr: "Bienvenue sur TEETOMIC" },
  "welcome.sub": {
    en: "Montreal's standby list for golf. Create an account for exclusive perks, or explore the demo.",
    fr: "La liste d'attente golf de Montréal. Créez un compte pour des avantages exclusifs, ou explorez la démo.",
  },
  "welcome.createBtn": { en: "Create an account", fr: "Créer un compte" },
  "welcome.createDesc": { en: "Earn points, unlock Gold perks, set your PIN", fr: "Gagnez des points, débloquez les avantages Or, choisissez votre NIP" },
  "welcome.demoBtn": { en: "Explore the demo", fr: "Explorer la démo" },
  "welcome.demoDesc": { en: "Full-access tour — see everything, maxed out", fr: "Visite complète — tout débloqué au maximum" },
  "welcome.formTitle": { en: "Create your account", fr: "Créez votre compte" },
  "welcome.name": { en: "Your name", fr: "Votre nom" },
  "welcome.email": { en: "Email", fr: "Courriel" },
  "welcome.pin": { en: "Choose a 4-digit PIN", fr: "Choisissez un NIP à 4 chiffres" },
  "welcome.pinHint": { en: "You'll enter this to unlock your exclusive perks.", fr: "Vous le saisirez pour débloquer vos avantages exclusifs." },
  "welcome.create": { en: "Create account", fr: "Créer le compte" },
  "welcome.back": { en: "Back", fr: "Retour" },
  "welcome.demoBadge": { en: "Demo — full access", fr: "Démo — accès complet" },

  // --- PIN lock -------------------------------------------------------------
  "pin.lockTitle": { en: "Exclusive perks", fr: "Avantages exclusifs" },
  "pin.lockSub": { en: "Enter your 4-digit PIN to unlock your rewards.", fr: "Saisissez votre NIP à 4 chiffres pour débloquer vos récompenses." },
  "pin.wrong": { en: "Wrong PIN — try again.", fr: "NIP incorrect — réessayez." },
  "pin.unlock": { en: "Unlock", fr: "Débloquer" },

  // --- walkthrough / tour ---------------------------------------------------
  "tour.tap": { en: "Tap to continue", fr: "Touchez pour continuer" },
  "tour.skip": { en: "Skip", fr: "Passer" },
  "tour.start": { en: "Start exploring", fr: "Commencer" },
  "tour.next": { en: "Next", fr: "Suivant" },
  "tour.take": { en: "Take the tour", fr: "Faire la visite" },
} as const;

export type DictKey = keyof typeof dict;

export function translate(
  key: DictKey,
  locale: Locale,
  vars?: Record<string, string>,
): string {
  const entry = dict[key];
  let text = entry ? entry[locale] : (key as string);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }
  return text;
}
