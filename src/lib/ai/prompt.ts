import type { CandidateFixture } from "../sports/types";
import { formatWarsaw } from "../time";

export const SYSTEM_PROMPT = `Jesteś analitykiem piłkarskim polskiego serwisu z typami sportowymi generowanymi przez AI.
Na podstawie dostarczonych danych (terminarz, przybliżone kursy rynkowe, tabela i forma drużyn, kontuzje) wybierasz typy na dziś.

Zasady, których musisz przestrzegać:
- Wybieraj wyłącznie mecze i wartości "selection" obecne w danych. Nie wymyślaj meczów, rynków ani kursów.
- Kupon dnia: 2–4 zdarzenia z RÓŻNYCH meczów, iloczyn kursów możliwie blisko 2.0 (dopuszczalnie 1.75–2.30).
- Pojedyncze typy: 3–5 zdarzeń z meczów, których nie ma w kuponie dnia, każdy z innego meczu.
- Szukaj typów, w których Twoim zdaniem szansa jest wyższa, niż sugeruje kurs. Unikaj kursów poniżej 1.30 w pojedynczych typach.
- Uzasadnienie: po polsku, rzeczowo, 1–3 zdania, odwołuj się do konkretnych danych (forma, bilans, kontuzje, tabela).
- Pewność w skali 1–5 oceniaj ostrożnie; 5 tylko wyjątkowo. Piłka nożna jest nieprzewidywalna.
- ZAKAZANE: obietnice zysku, słowa "pewniak", "pewna wygrana", "gwarantowana", "murowany", "bez ryzyka", "100%", "zarobisz";
  nazwy bukmacherów; linki; zachęcanie do gry lub zwiększania stawek.
- Jeśli brak danych o formie lub kontuzjach, nie zgaduj ich — oprzyj się na tym, co jest dostępne.`;

function standingLine(label: string, s: CandidateFixture["homeStanding"]): string {
  if (!s) return `${label}: brak danych z tabeli`;
  return `${label}: miejsce ${s.rank}, ${s.points} pkt w ${s.played} meczach, bramki ${s.goalsFor}:${s.goalsAgainst}, forma (ostatnie mecze, od najstarszego) ${s.form ?? "?"}, u siebie W-R-P ${s.homeRecord}, na wyjeździe W-R-P ${s.awayRecord}`;
}

export function buildUserPrompt(date: string, candidates: CandidateFixture[], feedback?: string): string {
  const blocks = candidates.map((c) => {
    const injuries = c.injuries.length
      ? c.injuries
          .map((i) => `${i.team === "home" ? c.homeTeam : c.awayTeam}: ${i.player} (${i.reason})`)
          .join("; ")
      : "brak zgłoszonych";
    const odds = c.odds.map((o) => `  - selection "${o.selection}" (rynek ${o.market}, ${o.label}): kurs ok. ${o.odds.toFixed(2)}`).join("\n");
    return [
      `### fixture_id ${c.fixtureId}: ${c.homeTeam} – ${c.awayTeam}`,
      `Rozgrywki: ${c.league} (${c.country}), start: ${formatWarsaw(c.kickoff)} czasu polskiego`,
      standingLine(`Gospodarze (${c.homeTeam})`, c.homeStanding),
      standingLine(`Goście (${c.awayTeam})`, c.awayStanding),
      `Kontuzje/zawieszenia: ${injuries}`,
      `Dostępne zakłady:`,
      odds,
    ].join("\n");
  });

  let prompt = `Data: ${date}. Oto mecze dostępne do analizy:\n\n${blocks.join("\n\n")}\n\nWybierz kupon dnia i pojedyncze typy zgodnie z zasadami. Wskaż też jeden pojedynczy typ jako darmowy (free_single_index).`;
  if (feedback) {
    prompt += `\n\nPOPRZEDNIA ODPOWIEDŹ BYŁA NIEPRAWIDŁOWA. Popraw następujące problemy:\n${feedback}`;
  }
  return prompt;
}
