// Filtr treści: zakaz obietnic zysku i nazw bukmacherów (wymogi prawne).

const BANNED_PHRASES: RegExp[] = [
  /pewnia[kc]/i,
  /pewn[aey] (wygran|zysk|typ)/i,
  /gwarant/i,
  /murowan/i,
  /bez ryzyka/i,
  /100\s?%/i,
  /zarobisz/i,
  /pewny zarobek/i,
  /łatwe pieniądze/i,
  /szybki zysk/i,
  /nie może przegrać/i,
  /na pewno (wygra|wejdzie|padnie)/i,
  /lock\b/i,
];

// Nazwy bukmacherów (polskich i zagranicznych) — nie mogą pojawić się w treści.
const BOOKMAKERS = [
  "sts", "fortuna", "betclic", "superbet", "totolotek", "etoto", "betfan", "forbet",
  "lv bet", "lvbet", "fuksiarz", "betcris", "totalbet", "pzbuk", "noblebet", "comeon",
  "bet365", "unibet", "bwin", "pinnacle", "william hill", "betway", "1xbet", "betfair",
  "marathonbet", "betsson", "10bet", "888sport", "betano", "betvictor", "tipico",
  "interwetten", "bet-at-home", "betsafe", "nordicbet", "dafabet", "sbobet", "mostbet",
  "parimatch", "melbet", "22bet", "betwinner", "admiralbet", "lebull", "go+bet", "gobet",
];

const BOOKMAKER_RE = new RegExp(
  `(^|[^\\p{L}\\d])(${BOOKMAKERS.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=$|[^\\p{L}\\d])`,
  "iu",
);

export interface ComplianceIssue {
  kind: "banned_phrase" | "bookmaker" | "link";
  match: string;
}

export function checkText(text: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  for (const re of BANNED_PHRASES) {
    const m = text.match(re);
    if (m) issues.push({ kind: "banned_phrase", match: m[0] });
  }
  const bm = text.match(BOOKMAKER_RE);
  if (bm) issues.push({ kind: "bookmaker", match: bm[2] });
  const link = text.match(/https?:\/\/|www\./i);
  if (link) issues.push({ kind: "link", match: link[0] });
  return issues;
}

export function isCompliant(text: string): boolean {
  return checkText(text).length === 0;
}
