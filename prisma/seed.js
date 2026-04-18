import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const superAdminPassword = await bcrypt.hash('Admin@123#', 10);
  const testAdminPassword = await bcrypt.hash('Testadmin@123#', 10);

  // 1. Create Roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN', description: 'Total system authority bypass' }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Standard administrative access' }
  });

  // 2. Create Users
  await prisma.user.upsert({
    where: { email: 'admin@system.com' },
    update: { password: superAdminPassword, roleId: superAdminRole.id, status: true },
    create: {
      email: 'admin@system.com',
      firstName: 'System',
      lastName: 'Administrator',
      password: superAdminPassword,
      roleId: superAdminRole.id,
      status: true
    }
  });

  await prisma.user.upsert({
    where: { email: 'testadmin@system.com' },
    update: { password: testAdminPassword, roleId: adminRole.id, status: true },
    create: {
      email: 'testadmin@system.com',
      firstName: 'Test',
      lastName: 'Admin',
      password: testAdminPassword,
      roleId: adminRole.id,
      status: true
    }
  });

  // 3. Define Full Architecture Hierarchy
  const hierarchy = [
    {
      module: { name: 'Dashboard', icon: 'Layout', sortOrder: 0 },
      pages: [
        { name: 'Overview', path: '/', sortOrder: 0 }
      ]
    },
    {
      module: { name: 'Identity Registry', icon: 'Shield', sortOrder: 1 },
      pages: [
        { name: 'List Administrators', path: '/users', sortOrder: 0 },
        { name: 'Security Matrix', path: '/roles', sortOrder: 1 }
      ]
    },
    {
      module: { name: 'System Core', icon: 'Settings', sortOrder: 2 },
      pages: [
        { name: 'Architecture Console', path: '/settings', sortOrder: 0 },
        { name: 'Audit Trails', path: '/audit-logs', sortOrder: 1 }
      ]
    }
  ];

  // 4. Seed Architecture and Default Permissions for Admin Role
  for (const item of hierarchy) {
    const mod = await prisma.module.upsert({
      where: { name: item.module.name },
      update: { icon: item.module.icon, sortOrder: item.module.sortOrder },
      create: item.module
    });

    for (const page of item.pages) {
      const p = await prisma.page.upsert({
        where: { path: page.path },
        update: { name: page.name, moduleId: mod.id, sortOrder: page.sortOrder },
        create: { ...page, moduleId: mod.id }
      });

      // Give standard ADMIN role view access only by default
      await prisma.permission.upsert({
        where: { roleId_pageId: { roleId: adminRole.id, pageId: p.id } },
        update: {},
        create: {
          roleId: adminRole.id,
          pageId: p.id,
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false
        }
      });
    }
  }

  console.log('\n--- 🏛️ SOVEREIGN ARCHITECTURE INITIALIZED ---');
  console.log('👤 Super Admin: admin@system.com | Admin@123#');
  console.log('👤 Standard Admin: testadmin@system.com | Testadmin@123#');
  console.log('--------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
