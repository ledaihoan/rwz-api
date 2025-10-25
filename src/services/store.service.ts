// store.service.ts
import { storeRepo } from '../repositories/store.repository';
import { userRepo } from '../repositories/user.repository';

const createStoreService = () => {
  return {
    searchStores: async (
      userId: string,
      dto: {
        countryIds?: number[];
        name?: string;
        serviceTypes?: string[];
        lat?: number;
        lng?: number;
        radiusKm?: number;
        limit?: number;
        offset?: number;
      },
    ) => {
      const user = await userRepo.findById(userId);

      const lat = dto.lat ?? Number(user.latitude);
      const lng = dto.lng ?? Number(user.longitude);
      const radiusKm = dto.radiusKm ?? 10;

      return storeRepo.searchNearby({
        countryIds: dto.countryIds,
        lat,
        lng,
        radiusKm,
        name: dto.name,
        serviceTypes: dto.serviceTypes,
        limit: dto.limit,
        offset: dto.offset,
      });
    },
  };
};

export const storeService = createStoreService();
