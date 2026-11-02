import { hash } from "bcryptjs";
import { db } from "../src/lib/db";

const [emailInput, nameInput] = process.argv.slice(2);
if (!emailInput || !nameInput) {
  console.error("Usage: npm run admin:create -- <email> <name>");
  process.exit(1);
}

async function readPassword() {
  if (process.env.ADMIN_INITIAL_PASSWORD) return process.env.ADMIN_INITIAL_PASSWORD;
  if (!process.stdin.isTTY) throw new Error("Set ADMIN_INITIAL_PASSWORD when running without an interactive terminal");
  return new Promise<string>((resolve, reject) => {
    const stdin = process.stdin;
    let password = "";
    process.stdout.write("Admin password (12+ characters): ");
    stdin.setRawMode(true);
    stdin.resume();
    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          stdin.setRawMode(false); stdin.pause(); stdin.off("data", onData);
          reject(new Error("Admin provisioning cancelled")); return;
        }
        if (character === "\r" || character === "\n") {
          stdin.setRawMode(false); stdin.pause(); stdin.off("data", onData);
          process.stdout.write("\n"); resolve(password); return;
        }
        if (character === "\u007f" || character === "\b") password = password.slice(0, -1);
        else password += character;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const password = await readPassword();
  if (password.length < 12) throw new Error("Password must be at least 12 characters");
  const email = emailInput.trim().toLowerCase();
  await db.account.upsert({
    where: { email },
    update: { name: nameInput.trim(), passwordHash: await hash(password, 12), role: "ADMIN" },
    create: { email, name: nameInput.trim(), passwordHash: await hash(password, 12), role: "ADMIN" },
  });
  console.info(`Admin account provisioned: ${email}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
