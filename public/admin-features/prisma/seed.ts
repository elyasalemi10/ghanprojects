// prisma/seed.ts
// Seeds an owner account so you can log in for the first time
// Run with: npm run db:seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL || "owner@pdcon.com.au";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || "ChangeMeNow!2026";
  const ownerName = process.env.SEED_OWNER_NAME || "Owner";

  const exists = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (exists) {
    console.log(`Owner ${ownerEmail} already exists. Skipping.`);
    return;
  }

  const hashed = await bcrypt.hash(ownerPassword, 12);

  await prisma.user.create({
    data: {
      email: ownerEmail,
      name: ownerName,
      password: hashed,
      role: "OWNER",
    },
  });

  console.log("==============================================");
  console.log("OWNER ACCOUNT CREATED");
  console.log(`Email:    ${ownerEmail}`);
  console.log(`Password: ${ownerPassword}`);
  console.log("==============================================");
  console.log("CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
