import { getAdminAccount } from "@/lib/auth";

export async function GET() {
  try {
    const account = await getAdminAccount();
    return account
      ? Response.json({ id: account.id, email: account.email, name: account.name })
      : Response.json({ error: "Admin login required" }, { status: 401 });
  } catch {
    return Response.json({ error: "Account storage is unavailable" }, { status: 503 });
  }
}
