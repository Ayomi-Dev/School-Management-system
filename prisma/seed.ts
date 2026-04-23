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
  const existing = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, role: true, superAdminProfile: { select: { id: true } } },
  });

  if (existing) {
    console.log(`Super Admin already exists: ${email} — skipping...`);
    return;
  }

  const passwordHash = await hashPassword(password);

  const superAdmin = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role:               "SUPER_ADMIN",
        status:             "ACTIVE",
        isEmailVerified:    true,
        mustChangePassword: false,
        isActive:           true,
        // schoolId intentionally omitted — super admin is not school-scoped
      },
    });
 
    await tx.superAdminProfile.create({ data: { userId: user.id } });
 
    return user;
  });

  console.log(`
  ✓ Bootstrap super admin created
    Name:      ${superAdmin.firstName} ${superAdmin.lastName}
    Email:     ${superAdmin.email}
    User code: ${superAdmin.userCode}
    ID:        ${superAdmin.id}
  `);
}

main()
.catch((e) => { 
  console.error(e); 
  process.exit(1); 
})
.finally(() => prisma.$disconnect());