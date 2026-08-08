import prisma from './src/config/db.js';

async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { email: "test@test.com" } });
    console.log("User:", user);
  } catch (e) {
    console.error("DB Error Message:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
