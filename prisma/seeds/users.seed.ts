import { PrismaClient, User, Country } from '@prisma/client';
import bcrypt from 'bcryptjs';

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  VN: { lat: 21.028511, lng: 105.804817 }, // Hanoi
  US: { lat: 40.7128, lng: -74.006 }, // New York
  JP: { lat: 35.6762, lng: 139.6503 }, // Tokyo
  KR: { lat: 37.5665, lng: 126.978 }, // Seoul
  SG: { lat: 1.3521, lng: 103.8198 }, // Singapore
  TH: { lat: 13.7563, lng: 100.5018 }, // Bangkok
  MY: { lat: 3.139, lng: 101.6869 }, // Kuala Lumpur
  ID: { lat: -6.2088, lng: 106.8456 }, // Jakarta
  PH: { lat: 14.5995, lng: 120.9842 }, // Manila
  CN: { lat: 39.9042, lng: 116.4074 }, // Beijing
  AU: { lat: -33.8688, lng: 151.2093 }, // Sydney
  GB: { lat: 51.5074, lng: -0.1278 }, // London
  DE: { lat: 52.52, lng: 13.405 }, // Berlin
  FR: { lat: 48.8566, lng: 2.3522 }, // Paris
  CA: { lat: 43.6532, lng: -79.3832 }, // Toronto
  IN: { lat: 28.6139, lng: 77.209 }, // New Delhi
  BR: { lat: -23.5505, lng: -46.6333 }, // São Paulo
  MX: { lat: 19.4326, lng: -99.1332 }, // Mexico City
  IT: { lat: 41.9028, lng: 12.4964 }, // Rome
  ES: { lat: 40.4168, lng: -3.7038 }, // Madrid
};

export async function seedUsers(prisma: PrismaClient, countries: Country[]): Promise<User[]> {
  const password = await bcrypt.hash('Password123!', 10);
  const users: User[] = [];

  for (const country of countries) {
    const coords = CITY_COORDINATES[country.iso_3166_2] || { lat: 0, lng: 0 };

    const user = await prisma.user.create({
      data: {
        email: `user-${country.iso_3166_2.toLowerCase()}@example.com`,
        firstName: 'User',
        lastName: country.iso_3166_2,
        password,
        countryId: country.id,
        latitude: coords.lat,
        longitude: coords.lng,
      },
    });

    users.push(user);
  }

  return users;
}
