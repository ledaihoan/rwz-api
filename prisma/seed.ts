import { PrismaClient } from '@prisma/client';
// @ts-ignore
import { seedCountries } from './seeds/countries.seed';
// @ts-ignore
import { seedUsers } from './seeds/users.seed';
// @ts-ignore
import { seedStores } from './seeds/stores.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed countries first
  console.log('📍 Seeding countries...');
  const countries = await seedCountries(prisma);
  console.log(`✅ Created ${countries.length} countries`);

  // Seed users
  console.log('👤 Seeding users...');
  const users = await seedUsers(prisma, countries);
  console.log(`✅ Created ${users.length} users`);

  // Seed stores
  console.log('🏪 Seeding stores...');
  const stores = await seedStores(prisma, countries);
  console.log(`✅ Created ${stores.length} stores`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
