import prisma from '../src/config/prisma.js';

async function main() {
  console.log('--- SYSTEM ARCHITECTURE RECURSIVE PURGE START ---');

  // Find the IDs of the pages we want to kill
  const pagesToKill = await prisma.page.findMany({
    where: {
      OR: [
        { path: '/sales-report' },
        { name: 'sales report' },
        { name: 'Sales Report' },
        { moduleId: { in: (await prisma.module.findMany({ where: { name: 'LayoutDashboard' }, select: { id: true } })).map(m => m.id) } }
      ]
    },
    select: { id: true }
  });

  const pageIds = pagesToKill.map(p => p.id);
  console.log(`- TARGETING: ${pageIds.length} pages for total removal.`);

  if (pageIds.length > 0) {
    // 1. Terminate associated Permission Matrix entries
    const delPerms = await prisma.permission.deleteMany({ where: { pageId: { in: pageIds } } });
    console.log(`- TERMINATED: ${delPerms.count} role permissions.`);

    // 2. Terminate associated User Override entries
    const delUserPerms = await prisma.userPermission.deleteMany({ where: { pageId: { in: pageIds } } });
    console.log(`- TERMINATED: ${delUserPerms.count} user overrides.`);

    // 3. Terminate the Pages themselves
    const delPages = await prisma.page.deleteMany({ where: { id: { in: pageIds } } });
    console.log(`- TERMINATED: ${delPages.count} page records.`);
  }

  // 4. Terminate the Parent Module
  const delModules = await prisma.module.deleteMany({ where: { name: 'LayoutDashboard' } });
  console.log(`- TERMINATED: ${delModules.count} redundant parent modules.`);

  console.log('--- PURGE COMPLETE ---');
}

main()
  .catch((e) => {
    console.error('CRITICAL FAILURE DURING PURGE:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
