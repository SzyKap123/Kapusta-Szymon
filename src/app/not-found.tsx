import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md space-y-3 text-center">
      <h1 className="text-xl font-bold">Nie znaleziono strony</h1>
      <p className="text-muted">Strona nie istnieje lub została przeniesiona.</p>
      <Link href="/" className="btn-primary">Wróć do typów</Link>
    </div>
  );
}
