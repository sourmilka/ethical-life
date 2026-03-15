import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Allow self-signed certificates for Supabase pooler
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Load env vars from .env file (tsx --env-file .env handles this)
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting to database...");
  await prisma.$connect();
  console.log("Connected!");

  // 1. Create admin (owner) tenant + user
  const adminPassword = await bcrypt.hash("Admin123!@#", 12);

  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: "ethical-life" },
  });

  if (existingTenant) {
    console.log("Tenant 'ethical-life' already exists, deleting to recreate...");
    await prisma.tenant.delete({ where: { id: existingTenant.id } });
  }

  const { tenant, adminUser } = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: "Ethical Life",
        slug: "ethical-life",
        status: "active",
        plan: "starter",
      },
    });

    const adminUser = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: "admin@ethicallife.com",
        passwordHash: adminPassword,
        fullName: "Admin User",
        role: "owner",
      },
    });

    // Create a standard user
    const standardPassword = await bcrypt.hash("User123!@#", 12);
    await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: "user@ethicallife.com",
        passwordHash: standardPassword,
        fullName: "Standard User",
        role: "editor",
      },
    });

    // Default site settings
    await tx.siteSettings.create({
      data: {
        tenantId: tenant.id,
        companyName: "Ethical Life",
        colorPrimary: "#2e7d32",
        colorSecondary: "#00695c",
        colorAccent: "#ff8f00",
      },
    });

    return { tenant, adminUser };
  });

  console.log("\n✅ Users created successfully!\n");
  console.log("Tenant:", tenant.name, `(${tenant.slug})`);
  console.log("\n--- Admin Account ---");
  console.log("Email:    admin@ethicallife.com");
  console.log("Password: Admin123!@#");
  console.log("Role:     owner (admin)");
  console.log("\n--- Standard Account ---");
  console.log("Email:    user@ethicallife.com");
  console.log("Password: User123!@#");
  console.log("Role:     editor");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
