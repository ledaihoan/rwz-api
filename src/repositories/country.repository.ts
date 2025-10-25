// country.repository.ts
import { prisma } from '../lib/prisma';

let countriesCache: any[] | null = null;

const createCountryRepo = () => {
  const base = prisma.country;

  return {
    ...base,

    getAll: async () => {
      if (countriesCache) {
        return countriesCache;
      }

      countriesCache = await prisma.country.findMany({
        orderBy: { name: 'asc' },
      });

      return countriesCache;
    },
  };
};

export const countryRepo = createCountryRepo();
