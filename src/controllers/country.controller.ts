// country.controller.ts
import { Request, Response } from 'express';
import { countryService } from '../services/country.service';

export const getAll = async (req: Request, res: Response) => {
  const countries = await countryService.getAll();
  res.json({ data: countries });
};
