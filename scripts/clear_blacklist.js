import prisma from '../src/config/prisma.js';

async function clearBlacklist() {
  try {
    const deleted = await prisma.revokedToken.deleteMany({});
    console.log(`🛡️ Registry Cleared: ${deleted.count} revoked tokens removed.`);
  } catch (error) {
    console.error("❌ Registry Purge Failed:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

clearBlacklist();
