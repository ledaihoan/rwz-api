import { PrismaClient, Store, Country } from '@prisma/client';
import { readFileSync } from 'fs';
import { parse } from 'papaparse';
import { join } from 'path';

interface StoreCSVRow {
  name: string;
  name_en: string;
  service_type: string;
  lat: string;
  lng: string;
  country_code: string;
}

export async function seedStores(prisma: PrismaClient, countries: Country[]): Promise<Store[]> {
  const stores: Store[] = [];

  for (const country of countries) {
    const filename = `${country.iso_3166_2.toLowerCase()}-stores.csv`;
    const filepath = join(process.cwd(), 'prisma/seeds/csv', filename);

    try {
      const csv = readFileSync(filepath, 'utf-8');
      const { data } = parse<StoreCSVRow>(csv, { header: true, skipEmptyLines: true });

      for (const row of data) {
        const store = await prisma.store.create({
          data: {
            name: row.name,
            englishName: row.name_en,
            serviceType: row.service_type,
            countryId: country.id,
            latitude: parseFloat(row.lat),
            longitude: parseFloat(row.lng),
          },
        });

        stores.push(store);
      }

      console.log(`  ✅ Created ${data.length} stores in ${country.name}`);
    } catch (err: any) {
      console.log(err.message);
      console.log(`  ⚠️ Skipping ${country.name} - file not found`);
    }
  }

  return stores;
}
