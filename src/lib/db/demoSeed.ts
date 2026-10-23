import { couponContentHash } from "../hash";
import { productOdds, roundOdds, settleCoupon, evaluateSelection } from "../settlement";
import { warsawDate } from "../time";
import type { CouponInput, PickInput } from "../types";
import type { MemoryRepository } from "./memoryRepo";

// Przykładowe dane WYŁĄCZNIE do trybu demonstracyjnego (DEMO_MODE=1).

const TEAMS = [
  ["Ekstraklasa", "Lech Poznań", "Legia Warszawa"],
  ["Ekstraklasa", "Raków Częstochowa", "Jagiellonia Białystok"],
  ["Premier League", "Arsenal", "Chelsea"],
  ["Premier League", "Liverpool", "Newcastle"],
  ["La Liga", "Real Madrid", "Sevilla"],
  ["Serie A", "Inter", "Roma"],
  ["Bundesliga", "Bayern Monachium", "Freiburg"],
  ["Ligue 1", "PSG", "Lyon"],
] as const;

const OPTIONS: Pick<PickInput, "market" | "selection" | "odds" | "reasoning">[] = [
  { market: "1X2", selection: "home", odds: 1.75, reasoning: "Gospodarze wygrali 4 z 5 ostatnich meczów u siebie, goście mają problemy w defensywie." },
  { market: "OU", selection: "over_2.5", odds: 1.85, reasoning: "W ostatnich meczach obu drużyn padało średnio ponad 3 gole, obie grają ofensywnie." },
  { market: "BTTS", selection: "yes", odds: 1.7, reasoning: "Obie drużyny strzelały w 4 z 5 ostatnich spotkań i tracą bramki regularnie." },
  { market: "DC", selection: "1X", odds: 1.35, reasoning: "Gospodarze są niepokonani u siebie od 6 kolejek, goście bez dwóch podstawowych obrońców." },
  { market: "OU", selection: "under_2.5", odds: 1.95, reasoning: "Mecz dwóch drużyn z najlepszą obroną w lidze, ostatnie bezpośrednie starcia były bramkowo ubogie." },
];

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export function seedDemo(repo: MemoryRepository) {
  const r = rand(42);
  const now = Date.now();

  for (let day = 20; day >= 0; day--) {
    const date = warsawDate(new Date(now - day * 86_400_000));
    const kickoffBase = new Date(`${date}T18:00:00Z`).getTime();
    const pickFor = (i: number): PickInput => {
      const [league, home, away] = TEAMS[(i + day) % TEAMS.length];
      const opt = OPTIONS[Math.floor(r() * OPTIONS.length)];
      return {
        fixtureId: 1000 + day * 10 + i,
        league,
        homeTeam: home,
        awayTeam: away,
        kickoff: new Date(kickoffBase + i * 45 * 60_000).toISOString(),
        market: opt.market,
        selection: opt.selection,
        odds: opt.odds,
        confidence: 2 + Math.floor(r() * 3),
        reasoning: opt.reasoning,
      };
    };

    const coupons: CouponInput[] = [
      {
        date,
        kind: "coupon_of_day",
        isFree: false,
        priceCents: 900,
        title: "",
        summary: "Połączenie meczów, w których forma gospodarzy wyraźnie przeważa.",
        picks: [pickFor(0), pickFor(1)].map((p, i) => (i === 1 ? { ...p, market: "DC", selection: "1X", odds: 1.15 } : p)),
      },
      ...[2, 3, 4, 5].map(
        (i, k): CouponInput => {
          const p = pickFor(i);
          return { date, kind: "single", isFree: k === 0, priceCents: 900, title: `${p.homeTeam} – ${p.awayTeam}`, summary: "", picks: [p] };
        },
      ),
    ];
    coupons[0].title = `Kupon dnia — kurs ok. ${roundOdds(productOdds(coupons[0].picks)).toFixed(2)}`;

    const publishedAt = new Date(`${date}T07:00:00Z`).toISOString();
    const created = coupons.map((input) => ({ input, contentHash: couponContentHash(input, publishedAt), publishedAt }));
    void repo.publishCoupons(created).then(() => undefined);

    if (day > 0) {
      for (const c of repo.coupons.filter((x) => x.date === date)) {
        for (const p of c.picks) {
          const h = Math.floor(r() * 4);
          const a = Math.floor(r() * 3);
          Object.assign(p, { status: evaluateSelection(p.market, p.selection, h, a), scoreHome: h, scoreAway: a, settledAt: publishedAt });
        }
        const res = settleCoupon(c.picks)!;
        Object.assign(c, { status: res.status, settledOdds: res.settledOdds, settledAt: publishedAt });
      }
    }
    repo.runs.push({ id: `run-${day}`, runDate: date, status: "success", message: "Opublikowano 5 kuponów (dane demo).", startedAt: publishedAt, finishedAt: publishedAt });
  }

  repo.profiles.push(
    { id: "demo-admin", email: "admin@demo.pl", adultConfirmedAt: new Date().toISOString(), termsAcceptedAt: new Date().toISOString(), stripeCustomerId: null, createdAt: new Date().toISOString() },
    { id: "demo-user", email: "kibic@demo.pl", adultConfirmedAt: new Date().toISOString(), termsAcceptedAt: new Date().toISOString(), stripeCustomerId: null, createdAt: new Date().toISOString() },
  );
  repo.subscriptions.push({ userId: "demo-user", stripeSubscriptionId: "sub_demo", status: "active", currentPeriodEnd: new Date(now + 20 * 86_400_000).toISOString(), cancelAtPeriodEnd: false });
  for (let i = 0; i < 12; i++) {
    repo.ledger.push({
      id: `l${i}`,
      externalId: `pi_demo_${i}`,
      userId: "demo-user",
      kind: i % 3 === 0 ? "subscription" : "coupon",
      amountCents: i % 3 === 0 ? 3900 : 900,
      description: i % 3 === 0 ? "Subskrypcja miesięczna" : "Kupon dnia",
      occurredAt: new Date(now - i * 3 * 86_400_000).toISOString(),
    });
  }
}
