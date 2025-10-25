// favorite.repository.ts
import { prisma } from '../lib/prisma';

const createFavoriteRepo = () => {
  const base = prisma.favorite;

  return {
    ...base,

    findByUserAndStore: (userId: string, storeId: string) =>
      base.findUnique({ where: { userId_storeId: { userId, storeId } } }),

    findByUserId: (userId: string) =>
      base.findMany({ where: { userId }, include: { store: true } }),
  };
};

export const favoriteRepo = createFavoriteRepo();
