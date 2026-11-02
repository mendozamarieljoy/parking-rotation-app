"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) { setError(result.error ?? "Login failed"); return; }
    router.push("/admin/holidays");
  }
  return <main className="mx-auto my-12 max-w-md rounded-xl bg-white p-6 shadow"><h1 className="mb-5 text-2xl font-bold">Admin login</h1><form className="space-y-4" onSubmit={submit}><label className="block text-sm">Email<input className="mt-1 w-full rounded border p-2" type="email" name="email" autoComplete="username" required /></label><label className="block text-sm">Password<input className="mt-1 w-full rounded border p-2" type="password" name="password" autoComplete="current-password" required /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="rounded bg-slate-800 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button></form></main>;
}
