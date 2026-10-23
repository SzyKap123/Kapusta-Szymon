import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/db";
import { ledgerToCsv, nextDay, warsawDayStartIso } from "@/lib/revenue";

// Eksport ewidencji sprzedaży do CSV. Parametry: od=YYYY-MM-DD, do=YYYY-MM-DD (opcjonalne).
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return new NextResponse("Brak dostępu", { status: 403 });
  const valid = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const from = valid(request.nextUrl.searchParams.get("od"));
  const to = valid(request.nextUrl.searchParams.get("do"));
  const entries = await getRepo().listLedger(from ? warsawDayStartIso(from) : undefined, to ? warsawDayStartIso(nextDay(to)) : undefined);
  const name = `ewidencja-sprzedazy${from ? `-${from}` : ""}${to ? `-do-${to}` : ""}.csv`;
  return new NextResponse(ledgerToCsv(entries), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" },
  });
}
