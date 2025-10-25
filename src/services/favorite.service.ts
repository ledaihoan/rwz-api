import { favoriteRepo } from '../repositories/favorite.repository';

export const favoriteService = {
  async addFavorite(userId: string, storeId: string) {
    return favoriteRepo.create({
      data: { userId, storeId },
    });
  },

  async removeFavorite(userId: string, storeId: string) {
    return favoriteRepo.delete({
      where: { userId_storeId: { userId, storeId } },
    });
  },

  async getFavorites(userId: string) {
    return favoriteRepo.findByUserId(userId);
  },
};
