// store.repository.ts
import { prisma } from '../lib/prisma';

const createStoreRepo = () => {
  const base = prisma.store;

  return {
    ...base,

    searchNearby: async (params: {
      countryIds?: number[];
      lat: number;
      lng: number;
      radiusKm: number;
      name?: string;
      serviceTypes?: string[];
      limit?: number;
      offset?: number;
    }) => {
      const { countryIds, lat, lng, radiusKm, name, serviceTypes, limit = 50, offset = 0 } = params;

      const radiusDeg = radiusKm / 111.32;
      const radiusMeters = radiusKm * 1000;

      const countryCondition =
        countryIds && countryIds.length > 0
          ? `countryId IN (${countryIds.map(() => '?').join(', ')})`
          : 'countryId > 0';

      let query = `
        SELECT id, name, serviceType, latitude, longitude, address,
               ST_Distance_Sphere(location, ST_GeomFromText(?, 4326)) / 1000 as distance
        FROM Store
        WHERE ${countryCondition}
          AND ST_Distance_Sphere(location, ST_GeomFromText(?, 4326)) <= ?
      `;

      const point = `POINT(${lat} ${lng})`;
      const queryParams: any[] = [point];

      if (countryIds && countryIds.length > 0) {
        queryParams.push(...countryIds);
      }

      queryParams.push(point, radiusMeters);

      if (name) {
        query += ` AND MATCH(englishName) AGAINST(? IN BOOLEAN MODE)`;
        queryParams.push(name);
      }

      if (serviceTypes && serviceTypes.length > 0) {
        query += ` AND serviceType IN (${serviceTypes.map(() => '?').join(', ')})`;
        queryParams.push(...serviceTypes);
      }

      query += ` ORDER BY distance ASC, name ASC LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);

      return prisma.$queryRawUnsafe<
        Array<{
          id: string;
          name: string;
          serviceType: string;
          latitude: number;
          longitude: number;
          address: string | null;
          distance: number;
        }>
      >(query, ...queryParams);
    },
  };
};

export const storeRepo = createStoreRepo();
