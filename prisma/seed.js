import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Initiating Golden Seed Synchronization...");

  // 1. DATA MANIFEST (Extracted from Live Snapshot)
  const roles = [
    { id: "9dfda145-4be8-4a74-a8ce-dfe9d63f1625", name: "SUPER_ADMIN", description: "System owner with total control" },
    { id: "93dec12a-42c9-45da-b678-b00b082d98ab", name: "ADMIN", description: "Staff with management access" }
  ];

  const modules = [
    {
      id: "78cfe1ed-1a6f-4a14-a1c2-92f6d80253b0",
      name: "Dashboard",
      icon: "Layout",
      sortOrder: 0,
      pages: [
        { id: "9f3cfde7-f712-4cb5-973c-42519832ed52", name: "Dashboard", path: "/", sortOrder: 0 }
      ]
    },
    {
      id: "fb7aa608-7b9e-4077-a2cb-6fa7c894ddcc",
      name: "User Management",
      icon: "Users",
      sortOrder: 1,
      pages: [
        { id: "78ae9eb2-a0af-4d61-b7d6-8381ced8a6ab", name: "Users List", path: "/users", sortOrder: 0 },
        { id: "945087d9-92f8-4b7f-b652-7a97ffa16595", name: "Roles & Permissions", path: "/roles", sortOrder: 1 }
      ]
    },
    {
      id: "cbe34cea-9716-41c5-a58e-baac2bca2a28",
      name: "Security & Logs",
      icon: "History",
      sortOrder: 2,
      pages: [
        { id: "c3eebd62-e64d-4318-9eb8-8ae7b1e82cd6", name: "Audit Logs", path: "/audit-logs", sortOrder: 0 },
        { id: "10f9baa4-7e08-44d5-9b64-dd6993094e2f", name: "System Settings", path: "/settings", sortOrder: 1 },
        { id: "55b0b5f4-8ac3-4505-ad6e-ee59592c5539", name: "Modules Registry", path: "/modules", sortOrder: 2 }
      ]
    }
  ];

  const rolePermissions = [
    // SUPER_ADMIN (All View, Create, Edit, Delete)
    ...["9f3cfde7-f712-4cb5-973c-42519832ed52", "78ae9eb2-a0af-4d61-b7d6-8381ced8a6ab", "945087d9-92f8-4b7f-b652-7a97ffa16595", "c3eebd62-e64d-4318-9eb8-8ae7b1e82cd6", "10f9baa4-7e08-44d5-9b64-dd6993094e2f", "55b0b5f4-8ac3-4505-ad6e-ee59592c5539"]
      .map(pageId => ({ roleId: "9dfda145-4be8-4a74-a8ce-dfe9d63f1625", pageId, canView: true, canCreate: true, canEdit: true, canDelete: true })),
    
    // ADMIN (Partial access)
    { roleId: "93dec12a-42c9-45da-b678-b00b082d98ab", pageId: "c3eebd62-e64d-4318-9eb8-8ae7b1e82cd6", canView: true, canCreate: false, canEdit: false, canDelete: false },
    { roleId: "93dec12a-42c9-45da-b678-b00b082d98ab", pageId: "78ae9eb2-a0af-4d61-b7d6-8381ced8a6ab", canView: true, canCreate: false, canEdit: false, canDelete: false },
    { roleId: "93dec12a-42c9-45da-b678-b00b082d98ab", pageId: "55b0b5f4-8ac3-4505-ad6e-ee59592c5539", canView: true, canCreate: false, canEdit: false, canDelete: false }
  ];

  const users = [
    { id: "a38d40bb-a7f2-44da-a6fa-85f245573d8b", firstName: "Super", lastName: "Admin", email: "admin@system.com", password: "$2b$10$31crCrYn03Qk8zXl2AqzYeNSQTbg9gCHVlLwMsh1I.ME1OdS5m14.", roleId: "9dfda145-4be8-4a74-a8ce-dfe9d63f1625", status: true },
    { id: "433630ea-e993-4af4-b15c-6a81b9b2768e", firstName: "Test", lastName: "Admin", email: "testadmin@system.com", password: "$2b$10$kFoWjIWOMI38IBpbBmagGe55SS/.qIYGlsepPHPOyXGzkTF/3.zq.", roleId: "93dec12a-42c9-45da-b678-b00b082d98ab", status: true },
    { id: "d5d0fff0-3c12-479a-aa10-18ef78b260bc", firstName: "Kuldeep", lastName: "Verma", email: "kd@gmail.com", password: "$2b$10$/GuT2HB3Cu2cnU7teHtfueAIt7ifM1q1Nf3TSGkw/X1Cgl8mUAeKi", roleId: "93dec12a-42c9-45da-b678-b00b082d98ab", status: true }
  ];

  const userOverrides = [
    { userId: "433630ea-e993-4af4-b15c-6a81b9b2768e", pageId: "945087d9-92f8-4b7f-b652-7a97ffa16595", canView: true, canCreate: false, canEdit: false, canDelete: false },
    { userId: "433630ea-e993-4af4-b15c-6a81b9b2768e", pageId: "78ae9eb2-a0af-4d61-b7d6-8381ced8a6ab", canView: true, canCreate: false, canEdit: false, canDelete: false },
    { userId: "433630ea-e993-4af4-b15c-6a81b9b2768e", pageId: "c3eebd62-e64d-4318-9eb8-8ae7b1e82cd6", canView: true, canCreate: false, canEdit: false, canDelete: false },
    { userId: "433630ea-e993-4af4-b15c-6a81b9b2768e", pageId: "10f9baa4-7e08-44d5-9b64-dd6993094e2f", canView: true, canCreate: false, canEdit: false, canDelete: false }
  ];

  // 2. SYNCHRONIZATION SEQUENCE
  
  // A. Roles
  for (const role of roles) {
    await prisma.role.upsert({ where: { id: role.id }, update: role, create: role });
  }

  // B. Modules & Pages
  for (const mod of modules) {
    const { pages, ...modData } = mod;
    await prisma.module.upsert({ where: { id: mod.id }, update: modData, create: modData });
    for (const page of pages) {
      await prisma.page.upsert({ where: { id: page.id }, update: page, create: page });
    }
  }

  // C. Role Permissions
  for (const rp of rolePermissions) {
    await prisma.permission.upsert({
      where: { roleId_pageId: { roleId: rp.roleId, pageId: rp.pageId } },
      update: rp,
      create: rp
    });
  }

  // D. Users
  for (const user of users) {
    await prisma.user.upsert({ where: { id: user.id }, update: user, create: user });
  }

  // E. User Overrides
  for (const override of userOverrides) {
    await prisma.userPermission.upsert({
      where: { userId_pageId: { userId: override.userId, pageId: override.pageId } },
      update: override,
      create: override
    });
  }

  console.log("✅ Sovereign System Fully Synchronized.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
