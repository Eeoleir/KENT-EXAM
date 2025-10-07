import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@gmail.com";
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN" as any,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      role: "ADMIN" as any,
      isActive: true,
    },
  });

  // Seeded admin user
}

main()
  .catch((_err) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
