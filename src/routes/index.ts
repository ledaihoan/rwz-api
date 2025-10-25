import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import storeRoutes from './store.routes';
import publicRoutes from './public.routes';
import countriesRoutes from './country.routes';

const router = Router();

router.use('/api/v1/countries', countriesRoutes);
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/users', userRoutes);
router.use('/api/v1/stores', storeRoutes);
router.use('/api/public', publicRoutes);

export default router;
