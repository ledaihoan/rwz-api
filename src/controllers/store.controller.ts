// store.controller.ts
import { Request, Response } from 'express';
import { storeService } from '../services/store.service';
import { SearchStoresQuerySchema } from '../schemas/store.schema';

export const searchStores = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const dto = SearchStoresQuerySchema.parse(req.body);
  const results = await storeService.searchStores(userId, dto);
  return res.status(200).json({ data: results });
};
