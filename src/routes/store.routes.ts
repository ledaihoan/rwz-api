// store.routes.ts
import { Router } from 'express';
import { searchStores } from '../controllers/store.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/search', requireAuth, searchStores);

export default router;
