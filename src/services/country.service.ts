import { countryRepo } from '../repositories/country.repository';

export const countryService = {
  getAll: async () => {
    return countryRepo.getAll();
  },
};
