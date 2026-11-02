import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE_NAME = "parking_admin_session";
const SESSION_DAYS = 7;

function hashToken(token: string) {
  const pepper = process.env.SESSION_TOKEN_PEPPER;
  if (!pepper || pepper.length < 32) throw new Error("SESSION_TOKEN_PEPPER must contain at least 32 characters");
  return createHash("sha256").update(`${pepper}:${token}`).digest("hex");
}

export async function createAdminSession(accountId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { tokenHash: hashToken(token), accountId, expiresAt } });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdminAccount() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { account: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.account.role === "ADMIN" ? session.account : null;
}

export async function requireAdmin() {
  return getAdminAccount();
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(COOKIE_NAME);
}
