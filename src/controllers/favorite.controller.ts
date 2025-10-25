import { Request, Response } from 'express';
import { favoriteService } from '../services/favorite.service';
import { AddFavoriteBodySchema, RemoveFavoriteParamSchema } from '../schemas/favorite.schema';

export const addFavorite = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const body = AddFavoriteBodySchema.parse(req.body);
  const favorite = await favoriteService.addFavorite(userId, body.storeId);
  return res.status(201).json(favorite);
};

export const removeFavorite = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const params = RemoveFavoriteParamSchema.parse(req.params);
  await favoriteService.removeFavorite(userId, params.storeId);
  return res.status(204).send();
};

export const getFavorites = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const favorites = await favoriteService.getFavorites(userId);
  return res.status(200).json(favorites);
};
