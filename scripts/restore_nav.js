import prisma from '../src/config/prisma.js';

async function main() {
  console.log('--- NAVIGATION RESTORATION START ---');

  const securityModule = await prisma.module.findFirst({
    where: { name: 'Security & Logs' }
  });

  if (securityModule) {
    console.log(`- TARGET FOUND: ${securityModule.name}`);

    const modulesPage = await prisma.page.upsert({
      where: { path: '/modules' },
      update: {
        name: 'Modules Registry',
        moduleId: securityModule.id,
        sortOrder: 2
      },
      create: {
        name: 'Modules Registry',
        path: '/modules',
        moduleId: securityModule.id,
        sortOrder: 2
      }
    });
    console.log(`- ARCHITECTURE RESTORED: ${modulesPage.name} at ${modulesPage.path}`);
  } else {
    console.error('CRITICAL: Security module missing. Creating new Architecture module.');
    const newMod = await prisma.module.create({
      data: {
        name: 'Architecture',
        icon: 'Layers',
        sortOrder: 5,
        pages: {
          create: { name: 'Modules Registry', path: '/modules', sortOrder: 0 }
        }
      }
    });
    console.log(`- NEW GROUP PROVISIONED: ${newMod.name}`);
  }

  // 3. Clean up empty "System Control" if it exists
  const emptyMod = await prisma.module.findFirst({ where: { name: 'System Control' }, include: { pages: true } });
  if (emptyMod && emptyMod.pages.length === 0) {
    await prisma.module.delete({ where: { id: emptyMod.id } });
    console.log('- TERMINATED: Empty "System Control" group removed.');
  }

  console.log('--- RESTORATION COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
