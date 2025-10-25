import { PrismaClient, Country } from '@prisma/client';

const COUNTRIES = [
  { iso_3166_2: 'VN', iso_3166_3: 'VNM', name: 'Vietnam' },
  { iso_3166_2: 'US', iso_3166_3: 'USA', name: 'United States' },
  { iso_3166_2: 'JP', iso_3166_3: 'JPN', name: 'Japan' },
  { iso_3166_2: 'KR', iso_3166_3: 'KOR', name: 'South Korea' },
  { iso_3166_2: 'SG', iso_3166_3: 'SGP', name: 'Singapore' },
  { iso_3166_2: 'TH', iso_3166_3: 'THA', name: 'Thailand' },
  { iso_3166_2: 'MY', iso_3166_3: 'MYS', name: 'Malaysia' },
  { iso_3166_2: 'ID', iso_3166_3: 'IDN', name: 'Indonesia' },
  { iso_3166_2: 'PH', iso_3166_3: 'PHL', name: 'Philippines' },
  { iso_3166_2: 'CN', iso_3166_3: 'CHN', name: 'China' },
  { iso_3166_2: 'AU', iso_3166_3: 'AUS', name: 'Australia' },
  { iso_3166_2: 'GB', iso_3166_3: 'GBR', name: 'United Kingdom' },
  { iso_3166_2: 'DE', iso_3166_3: 'DEU', name: 'Germany' },
  { iso_3166_2: 'FR', iso_3166_3: 'FRA', name: 'France' },
  { iso_3166_2: 'CA', iso_3166_3: 'CAN', name: 'Canada' },
  { iso_3166_2: 'IN', iso_3166_3: 'IND', name: 'India' },
  { iso_3166_2: 'BR', iso_3166_3: 'BRA', name: 'Brazil' },
  { iso_3166_2: 'MX', iso_3166_3: 'MEX', name: 'Mexico' },
  { iso_3166_2: 'IT', iso_3166_3: 'ITA', name: 'Italy' },
  { iso_3166_2: 'ES', iso_3166_3: 'ESP', name: 'Spain' },
];

export async function seedCountries(prisma: PrismaClient): Promise<Country[]> {
  const countries: Country[] = [];

  for (const country of COUNTRIES) {
    const created = await prisma.country.upsert({
      where: { iso_3166_2: country.iso_3166_2 },
      update: {},
      create: country,
    });
    countries.push(created);
  }

  return countries;
}
