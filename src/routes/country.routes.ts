import { Router } from 'express';
import { getAll } from '../controllers/country.controller';

const router = Router();

router.get('', getAll);

export default router;
