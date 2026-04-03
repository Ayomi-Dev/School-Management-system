import { hashPassword } from "@/src/lib/auth/hash";
import { prisma } from "@/src/lib/prisma/client";




async function main() {
  const email    = process.env.SEED_ADMIN_EMAIL    ?? "superAdmin@system.edu.ng";
  const password = process.env.SEED_ADMIN_PASSWORD ?? (() => {
    throw new Error("SEED_ADMIN_PASSWORD must be set in your .env before seeding");
  })();
  const firstName = process.env.SEED_ADMIN_FIRST_NAME ?? "Super";
  const lastName  = process.env.SEED_ADMIN_LAST_NAME  ?? "Admin";

  // Idempotent — safe to run multiple times
  const existing = await prisma.user.findFirst(
    { where: 
        { role: "SUPER_ADMIN" }
    });

  if (existing) {
    console.log(`Super Admin already exists: ${email} — skipping...`);
    return;
  }

  const passwordHash = await hashPassword(password);

  const super_Admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role:               "SUPER_ADMIN",
      status:             "ACTIVE",
      isEmailVerified:      true,
      mustChangePassword: false,
    },
  });

  console.log(`
  ✓ Bootstrap super admin created
    Name:      ${super_Admin.firstName} ${super_Admin.lastName}
    Email:     ${super_Admin.email}
    User code: ${super_Admin.userCode}
    ID:        ${super_Admin.id}
  `);
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(() => prisma.$disconnect());