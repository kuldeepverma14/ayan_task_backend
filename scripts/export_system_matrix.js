import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from 'fs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function exportData() {
  console.log("📡 Extracting Sovereignty Matrix...");
  
  const roles = await prisma.role.findMany({ include: { permissions: true } });
  const modules = await prisma.module.findMany({ include: { pages: true } });
  const users = await prisma.user.findMany({ include: { userPermissions: true } });

  const manifest = {
    roles,
    modules,
    users
  };

  fs.writeFileSync('system_manifest.json', JSON.stringify(manifest, null, 2));
  console.log("✅ Snapshot Complete: system_manifest.json created.");
}

exportData()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  });
