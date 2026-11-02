import { compare } from "bcryptjs";
import { NextRequest } from "next/server";
import { createAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof body.email !== "string" || typeof body.password !== "string") return Response.json({ error: "Email and password are required" }, { status: 400 });
  try {
    const account = await db.account.findUnique({ where: { email: body.email.trim().toLowerCase() } });
    if (!account || account.role !== "ADMIN" || !(await compare(body.password, account.passwordHash))) return Response.json({ error: "Invalid email or password" }, { status: 401 });
    await createAdminSession(account.id);
    return Response.json({ id: account.id, email: account.email, name: account.name });
  } catch {
    return Response.json({ error: "Account storage is unavailable" }, { status: 503 });
  }
}
