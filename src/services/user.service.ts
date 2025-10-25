import { userRepo } from '../repositories/user.repository';

export const userService = {
  async getProfile(userId: string) {
    return userRepo.findById(userId);
  },

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string }) {
    return userRepo.update({
      where: { id: userId },
      data,
    });
  },

  async updateLocation(
    userId: string,
    data: { address?: string; latitude: number; longitude: number },
  ) {
    return userRepo.update({
      where: { id: userId },
      data: {
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  },
};
