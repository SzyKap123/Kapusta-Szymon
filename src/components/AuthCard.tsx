import { Notice } from "./Notice";

export function AuthCard({
  title,
  error,
  info,
  children,
}: {
  title: string;
  error?: string;
  info?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      {error && <Notice kind="error">{error}</Notice>}
      {info && <Notice kind="success">{info}</Notice>}
      <div className="card space-y-4">{children}</div>
    </div>
  );
}
